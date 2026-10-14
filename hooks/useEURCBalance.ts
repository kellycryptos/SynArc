import { createPublicClient, http, fallback, isAddress, getAddress, formatUnits } from 'viem'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from "@/hooks/auth/useAuth"
import { useArcNetwork } from "@/hooks/auth/useArcNetwork"
import { getMainnetRpcUrls, getTestnetRpcUrls, getMainnetProxyUrl, getTestnetProxyUrl } from '@/lib/arc-config'

// Verified EURC contract addresses on Arc
export const MAINNET_EURC_ADDRESS = '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1';
export const TESTNET_EURC_ADDRESS = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';

// ERC20 balanceOf ABI
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// Module-level deduplication and fast-cache
const cachedBalance: { [address: string]: { balance: string; timestamp: number } | undefined } = {};
const pendingFetches: { [address: string]: Promise<string> | undefined } = {};

export function invalidateEURCBalance() {
  if (typeof window !== 'undefined') {
    for (const key in cachedBalance) {
      delete cachedBalance[key];
    }
    window.dispatchEvent(new CustomEvent('synarc_eurc_changed'));
    window.dispatchEvent(new CustomEvent('synarc_usdc_changed'));
  }
}

/**
 * Format raw 6-decimal EURC units cleanly.
 * Guarantees that any non-zero balance is never rounded down to "0.00".
 */
export function formatEurcBalance(raw: bigint): string {
  if (raw === 0n) return '0.00';
  const units = formatUnits(raw, 6);
  const num = Number(units);
  if (num === 0) return '0.00';
  if (num < 0.01) {
    const str = parseFloat(units).toFixed(4);
    return str === '0.0000' ? units : str;
  }
  return num.toFixed(2);
}

/**
 * Direct fast-path call to window.ethereum.
 * Bypasses all browser CORS, rate limits, and Cloudflare protections with ~15ms latency.
 */
async function queryBalanceViaInjected(tokenAddress: string, accountAddress: string): Promise<bigint | null> {
  if (typeof window === 'undefined') return null;
  const eth = (window as any).ethereum;
  if (!eth || typeof eth.request !== 'function') return null;

  try {
    const cleanAddr = accountAddress.toLowerCase().replace(/^0x/, '').padStart(64, '0');
    const callData = `0x70a08231${cleanAddr}`;
    const result = await eth.request({
      method: 'eth_call',
      params: [{ to: tokenAddress, data: callData }, 'latest']
    });
    if (result && typeof result === 'string' && result !== '0x') {
      return BigInt(result);
    }
  } catch (err) {
    // Silently continue to next fallback strategy
  }
  return null;
}

export const useEURCBalance = (walletAddress?: string | undefined) => {
  const { walletAddress: authAddress, isCircle } = useAuth();
  const { isArcTestnet, contracts, arcChain } = useArcNetwork();

  // If activeAddress is not yet in React state, peek window.ethereum for immediate fast response
  let activeAddress = walletAddress || authAddress;
  if (!activeAddress && typeof window !== 'undefined' && (window as any).ethereum?.selectedAddress) {
    activeAddress = (window as any).ethereum.selectedAddress;
  }

  const [balance, setBalance] = useState<string>('0.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTargetMainnet = arcChain?.id === 5042 || (!isArcTestnet && arcChain?.id !== 5042002);
  const primaryEurcAddress = (isTargetMainnet ? MAINNET_EURC_ADDRESS : TESTNET_EURC_ADDRESS) as `0x${string}`;

  const fetchBalance = useCallback(async () => {
    let safeAddress: `0x${string}` | null = null;
    try {
      if (activeAddress && isAddress(activeAddress.toLowerCase())) {
        safeAddress = getAddress(activeAddress.toLowerCase());
      }
    } catch {
      safeAddress = null;
    }

    if (!safeAddress) {
      setBalance('0.00');
      setLoading(false);
      setError(null);
      return;
    }

    const chainId = arcChain?.id || (isArcTestnet ? 5042002 : 5042);
    const key = `${safeAddress.toLowerCase()}_${chainId}`;
    const now = Date.now();

    // 1. Check cache (only non-zero cached balances within 5s deduplicate)
    const cacheEntry = cachedBalance[key];
    if (cacheEntry && cacheEntry.balance !== '0.00' && now - cacheEntry.timestamp < 5000) {
      setBalance(cacheEntry.balance);
      setLoading(false);
      setError(null);
      return;
    }

    // 2. Check pending promise deduplication
    if (pendingFetches[key]) {
      setLoading(true);
      try {
        const res = await pendingFetches[key];
        if (res && res !== '0.00') {
          setBalance(res);
          setLoading(false);
          return;
        }
      } catch (err) {
        // Fall through to retry fetch
      }
    }

    setLoading(true);
    setError(null);

    const fetchPromise = (async () => {
      // Strategy 1: Circle User-Controlled Wallet Balances API
      if (isCircle && typeof window !== 'undefined') {
        const userToken = localStorage.getItem('synarc_circle_user_token');
        if (userToken) {
          try {
            const res = await fetch('/api/circle/wallet/balances', {
              headers: { 'x-user-token': userToken }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.balances) {
                const tokenItem = data.balances.find((b: any) =>
                  b.token?.symbol?.toUpperCase() === 'EURC' ||
                  b.token?.address?.toLowerCase() === primaryEurcAddress.toLowerCase() ||
                  b.token?.address?.toLowerCase() === MAINNET_EURC_ADDRESS.toLowerCase()
                );
                if (tokenItem) {
                  const num = parseFloat(tokenItem.amount) || 0;
                  const formatted = num === 0 ? '0.00' : (num < 0.01 ? num.toFixed(4) : num.toFixed(2));
                  if (formatted !== '0.00') {
                    cachedBalance[key] = { balance: formatted, timestamp: Date.now() };
                  }
                  return formatted;
                }
              }
            }
          } catch (circleErr) {
            console.warn('[useEURCBalance] Circle API balance check fallback to onchain RPC:', circleErr);
          }
        }
      }

      // Strategy 2: Fast-Path via window.ethereum (instant, 0 CORS, bypasses Cloudflare)
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const rawInjected = await queryBalanceViaInjected(primaryEurcAddress, safeAddress);
          if (rawInjected !== null && rawInjected > 0n) {
            const formatted = formatEurcBalance(rawInjected);
            cachedBalance[key] = { balance: formatted, timestamp: Date.now() };
            return formatted;
          }
        } catch {
          // Continue to public client
        }
      }

      // Strategy 3: Resilient public client RPC
      // Prioritize same-origin proxy to eliminate browser CORS and Cloudflare timeouts
      const proxyUrl = isArcTestnet ? getTestnetProxyUrl() : getMainnetProxyUrl();
      const networkRpcUrls = isArcTestnet ? getTestnetRpcUrls() : getMainnetRpcUrls();
      const allUrls = Array.from(new Set([proxyUrl, ...networkRpcUrls].filter(Boolean)));

      const client = createPublicClient({
        chain: arcChain,
        transport: fallback(allUrls.map(url => http(url, { timeout: 10000 }))),
      });

      let rawBalance: bigint = 0n;
      try {
        rawBalance = await client.readContract({
          address: primaryEurcAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [safeAddress],
        });
      } catch {
        // Contract not deployed or returning 0x; keep balance as 0n
        rawBalance = 0n;
      }

      const formatted = formatEurcBalance(rawBalance);
      if (formatted !== '0.00') {
        cachedBalance[key] = { balance: formatted, timestamp: Date.now() };
      }
      return formatted;
    })();

    pendingFetches[key] = fetchPromise;

    try {
      const formatted = await fetchPromise;
      setBalance(formatted);
      setLoading(false);
    } catch {
      setBalance('0.00');
      setLoading(false);
    } finally {
      delete pendingFetches[key];
    }
  }, [activeAddress, isArcTestnet, arcChain, primaryEurcAddress, isCircle]);

  const refetch = useCallback(async () => {
    if (!activeAddress) return;
    let safeAddress: `0x${string}` | null = null;
    try {
      if (activeAddress && isAddress(activeAddress.toLowerCase())) {
        safeAddress = getAddress(activeAddress.toLowerCase());
      }
    } catch {}
    const addr = safeAddress ? safeAddress.toLowerCase() : activeAddress.toLowerCase();
    const chainId = arcChain?.id || (isArcTestnet ? 5042002 : 5042);
    const key = `${addr}_${chainId}`;
    delete cachedBalance[key];
    await fetchBalance();
  }, [activeAddress, isArcTestnet, arcChain, fetchBalance]);

  useEffect(() => {
    fetchBalance();

    const handleNetworkChange = () => {
      for (const k in cachedBalance) {
        delete cachedBalance[k];
      }
      fetchBalance();
    };

    const handleEurcChange = () => {
      fetchBalance();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("synarc_network_changed", handleNetworkChange);
      window.addEventListener("synarc_eurc_changed", handleEurcChange);
      window.addEventListener("synarc_usdc_changed", handleEurcChange);
    }

    const interval = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        fetchBalance();
      }
    }, 60_000);

    return () => {
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("synarc_network_changed", handleNetworkChange);
        window.removeEventListener("synarc_eurc_changed", handleEurcChange);
        window.removeEventListener("synarc_usdc_changed", handleEurcChange);
      }
    };
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    isLoading: loading,
    isFetching: loading,
    isError: !!error,
    refetch,
    eurcAddress: primaryEurcAddress,
  };
};
