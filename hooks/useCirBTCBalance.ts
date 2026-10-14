import { createPublicClient, http, fallback, isAddress, getAddress, formatUnits } from 'viem'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from "@/hooks/auth/useAuth"
import { useArcNetwork } from "@/hooks/auth/useArcNetwork"
import { getMainnetRpcUrls, getTestnetRpcUrls, getMainnetProxyUrl, getTestnetProxyUrl } from '@/lib/arc-config'

// Verified Circle Wrapped Bitcoin (cirBTC) addresses on Arc
export const MAINNET_CIRBTC_ADDRESS = '0x171A4217b86A807A64eB94757Db6849fb4bDbAA0';
export const TESTNET_CIRBTC_ADDRESS = '0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF';

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

export function invalidateCirBTCBalance() {
  if (typeof window !== 'undefined') {
    for (const key in cachedBalance) {
      delete cachedBalance[key];
    }
    window.dispatchEvent(new CustomEvent('synarc_cirbtc_changed'));
    window.dispatchEvent(new CustomEvent('synarc_usdc_changed'));
  }
}

/**
 * Format raw 8-decimal cirBTC units cleanly.
 * Guarantees that non-zero amounts are never rounded down to "0.000000".
 */
export function formatCirBTCBalance(raw: bigint): string {
  if (raw === 0n) return '0.000000';
  const units = formatUnits(raw, 8);
  const num = Number(units);
  if (num === 0) return '0.000000';
  if (num < 0.000001) {
    return units;
  }
  return num.toFixed(6);
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
    // Silently continue to fallback strategy
  }
  return null;
}

export const useCirBTCBalance = (walletAddress?: string | undefined) => {
  const { walletAddress: authAddress, isCircle } = useAuth();
  const { isArcTestnet, contracts, arcChain } = useArcNetwork();

  // If activeAddress is not yet in React state, peek window.ethereum for immediate response
  let activeAddress = walletAddress || authAddress;
  if (!activeAddress && typeof window !== 'undefined' && (window as any).ethereum?.selectedAddress) {
    activeAddress = (window as any).ethereum.selectedAddress;
  }

  const [balance, setBalance] = useState<string>('0.000000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const primaryCirBTCAddress = ((contracts as any)?.cirBTC || (isArcTestnet ? TESTNET_CIRBTC_ADDRESS : MAINNET_CIRBTC_ADDRESS)) as `0x${string}`;

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
      setBalance('0.000000');
      setLoading(false);
      setError(null);
      return;
    }

    const chainId = arcChain?.id || (isArcTestnet ? 5042002 : 5042);
    const key = `${safeAddress.toLowerCase()}_${chainId}`;
    const now = Date.now();

    // 1. Check cache (only non-zero cached balances within 5s deduplicate)
    const cacheEntry = cachedBalance[key];
    if (cacheEntry && cacheEntry.balance !== '0.000000' && now - cacheEntry.timestamp < 5000) {
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
        if (res && res !== '0.000000') {
          setBalance(res);
          setLoading(false);
          return;
        }
      } catch (err) {
        // Fall through
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
                  b.token?.symbol?.toUpperCase() === 'CIRBTC' ||
                  b.token?.symbol?.toUpperCase() === 'BTC' ||
                  b.token?.address?.toLowerCase() === primaryCirBTCAddress.toLowerCase() ||
                  b.token?.address?.toLowerCase() === MAINNET_CIRBTC_ADDRESS.toLowerCase()
                );
                if (tokenItem) {
                  const num = parseFloat(tokenItem.amount) || 0;
                  const formatted = num === 0 ? '0.000000' : num.toFixed(6);
                  if (formatted !== '0.000000') {
                    cachedBalance[key] = { balance: formatted, timestamp: Date.now() };
                  }
                  return formatted;
                }
              }
            }
          } catch (circleErr) {
            console.warn('[useCirBTCBalance] Circle API balance check fallback to onchain RPC:', circleErr);
          }
        }
      }

      // Strategy 2: Fast-Path via window.ethereum (instant, 0 CORS, bypasses Cloudflare)
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        let rawInjected = await queryBalanceViaInjected(primaryCirBTCAddress, safeAddress);

        // Cross-contract resilience: If primary returned 0n or null, also check Mainnet cirBTC
        if ((!rawInjected || rawInjected === 0n) && primaryCirBTCAddress.toLowerCase() !== MAINNET_CIRBTC_ADDRESS.toLowerCase()) {
          const mainnetInjected = await queryBalanceViaInjected(MAINNET_CIRBTC_ADDRESS, safeAddress);
          if (mainnetInjected && mainnetInjected > 0n) {
            rawInjected = mainnetInjected;
          }
        }

        if (rawInjected !== null && rawInjected > 0n) {
          const formatted = formatCirBTCBalance(rawInjected);
          cachedBalance[key] = { balance: formatted, timestamp: Date.now() };
          return formatted;
        }
      }

      // Strategy 3: Resilient public client RPC (cirBTC has 8 decimals)
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
          address: primaryCirBTCAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [safeAddress],
        });
      } catch (primaryErr) {
        console.warn('[useCirBTCBalance] Primary contract read error:', primaryErr);
      }

      // Cross-contract fallback: If primary read is 0 and primary isn't mainnet, check mainnet address
      if (rawBalance === 0n && primaryCirBTCAddress.toLowerCase() !== MAINNET_CIRBTC_ADDRESS.toLowerCase()) {
        try {
          const mainnetBal = await client.readContract({
            address: MAINNET_CIRBTC_ADDRESS as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [safeAddress],
          });
          if (mainnetBal > 0n) {
            rawBalance = mainnetBal;
          }
        } catch (mainnetErr) {
          // Ignore
        }
      }

      const formatted = formatCirBTCBalance(rawBalance);
      if (formatted !== '0.000000') {
        cachedBalance[key] = { balance: formatted, timestamp: Date.now() };
      }
      return formatted;
    })();

    pendingFetches[key] = fetchPromise;

    try {
      const formatted = await fetchPromise;
      setBalance(formatted);
      setLoading(false);
    } catch (err) {
      console.warn('cirBTC balance fetch failed:', err);
      if (!cachedBalance[key]?.balance) {
        setError('Error fetching balance');
      }
      setLoading(false);
    } finally {
      delete pendingFetches[key];
    }
  }, [activeAddress, isArcTestnet, arcChain, primaryCirBTCAddress, isCircle]);

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

    const handleCirBTCChange = () => {
      fetchBalance();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("synarc_network_changed", handleNetworkChange);
      window.addEventListener("synarc_cirbtc_changed", handleCirBTCChange);
      window.addEventListener("synarc_usdc_changed", handleCirBTCChange);
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
        window.removeEventListener("synarc_cirbtc_changed", handleCirBTCChange);
        window.removeEventListener("synarc_usdc_changed", handleCirBTCChange);
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
    cirBTCAddress: primaryCirBTCAddress,
  };
};
