import { createPublicClient, http, fallback, isAddress, getAddress, formatUnits } from 'viem'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from "@/hooks/auth/useAuth"
import { useArcNetwork } from "@/hooks/auth/useArcNetwork"
import { CONTRACTS, getMainnetRpcUrls, getTestnetRpcUrls } from '@/lib/arc-config'

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
] as const

// Cache and promise deduplication variables
const cachedBalance: { [address: string]: { balance: string; timestamp: number } | undefined } = {}
const pendingFetches: { [address: string]: Promise<string> | undefined } = {}

export function invalidateCirBTCBalance() {
  if (typeof window !== 'undefined') {
    for (const key in cachedBalance) {
      delete cachedBalance[key]
    }
    window.dispatchEvent(new CustomEvent('synarc_cirbtc_changed'))
    window.dispatchEvent(new CustomEvent('synarc_usdc_changed'))
  }
}

export const useCirBTCBalance = (walletAddress?: string | undefined) => {
  const { walletAddress: authAddress, isCircle } = useAuth()
  const { isArcTestnet, contracts, arcChain } = useArcNetwork()
  const activeAddress = walletAddress || authAddress

  const [balance, setBalance] = useState<string>('0.000000')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cirBTCAddress = ((contracts as any)?.cirBTC || (isArcTestnet ? TESTNET_CIRBTC_ADDRESS : MAINNET_CIRBTC_ADDRESS)) as `0x${string}`;

  const fetchBalance = useCallback(async () => {
    let safeAddress: `0x${string}` | null = null
    try {
      if (activeAddress && isAddress(activeAddress.toLowerCase())) {
        safeAddress = getAddress(activeAddress.toLowerCase())
      }
    } catch {
      safeAddress = null
    }

    if (!safeAddress) {
      setBalance('0.000000')
      setLoading(false)
      setError(null)
      return
    }

    const chainId = arcChain?.id || (isArcTestnet ? 5042002 : 5042);
    const key = `${safeAddress.toLowerCase()}_${chainId}`;
    const now = Date.now()

    // 1. Check cache (5 seconds cache to deduplicate simultaneous calls on load)
    const cacheEntry = cachedBalance[key]
    if (cacheEntry && now - cacheEntry.timestamp < 5000) {
      setBalance(cacheEntry.balance)
      setLoading(false)
      setError(null)
      return
    }

    // 2. Check if there is already a pending promise for this address
    if (pendingFetches[key]) {
      setLoading(true)
      try {
        const res = await pendingFetches[key]
        if (res) setBalance(res)
        setLoading(false)
        return
      } catch (err) {
        // Fall through to try a new fetch if the previous one failed
      }
    }

    setLoading(true)
    setError(null)
    
    const fetchPromise = (async () => {
      // 1. If Circle wallet is active, query Circle balances API
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
                  b.token?.address?.toLowerCase() === cirBTCAddress.toLowerCase()
                );
                if (tokenItem) {
                  const num = parseFloat(tokenItem.amount) || 0;
                  const formatted = num.toFixed(6);
                  cachedBalance[key] = { balance: formatted, timestamp: Date.now() };
                  return formatted;
                }
              }
            }
          } catch (circleErr) {
            console.warn('[useCirBTCBalance] Circle API balance check fallback to onchain RPC:', circleErr);
          }
        }
      }

      // 2. On-chain read via public client (cirBTC has 8 decimals)
      const rpcUrls = isArcTestnet ? getTestnetRpcUrls() : getMainnetRpcUrls()
      const client = createPublicClient({
        chain: arcChain,
        transport: fallback(rpcUrls.filter(Boolean).map(url => http(url, { timeout: 8000 }))),
      })

      const raw = await client.readContract({
        address: cirBTCAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [safeAddress],
      })

      const formatted = Number(formatUnits(raw, 8)).toFixed(6)
      cachedBalance[key] = { balance: formatted, timestamp: Date.now() }
      return formatted
    })()

    pendingFetches[key] = fetchPromise

    try {
      const formatted = await fetchPromise
      setBalance(formatted)
      setLoading(false)
    } catch (err) {
      console.warn('cirBTC balance fetch failed:', err)
      if (!cachedBalance[key]?.balance) {
        setError('Error fetching balance')
      }
      setLoading(false)
    } finally {
      delete pendingFetches[key]
    }
  }, [activeAddress, isArcTestnet, arcChain, cirBTCAddress, isCircle])

  const refetch = useCallback(async () => {
    if (!activeAddress) return
    let safeAddress: `0x${string}` | null = null
    try {
      if (activeAddress && isAddress(activeAddress.toLowerCase())) {
        safeAddress = getAddress(activeAddress.toLowerCase())
      }
    } catch {}
    const addr = safeAddress ? safeAddress.toLowerCase() : activeAddress.toLowerCase()
    const chainId = arcChain?.id || (isArcTestnet ? 5042002 : 5042);
    const key = `${addr}_${chainId}`
    delete cachedBalance[key]
    await fetchBalance()
  }, [activeAddress, isArcTestnet, arcChain, fetchBalance])

  useEffect(() => {
    fetchBalance()
    
    const handleNetworkChange = () => {
      for (const k in cachedBalance) {
        delete cachedBalance[k]
      }
      fetchBalance()
    }

    const handleCirBTCChange = () => {
      fetchBalance()
    }

    if (typeof window !== "undefined") {
      window.addEventListener("synarc_network_changed", handleNetworkChange)
      window.addEventListener("synarc_cirbtc_changed", handleCirBTCChange)
      window.addEventListener("synarc_usdc_changed", handleCirBTCChange)
    }

    // Refresh every 60 seconds and only if visible
    const interval = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        fetchBalance()
      }
    }, 60_000)

    return () => {
      clearInterval(interval)
      if (typeof window !== "undefined") {
        window.removeEventListener("synarc_network_changed", handleNetworkChange)
        window.removeEventListener("synarc_cirbtc_changed", handleCirBTCChange)
        window.removeEventListener("synarc_usdc_changed", handleCirBTCChange)
      }
    }
  }, [fetchBalance])

  return {
    balance,
    loading,
    error,
    isLoading: loading,
    isFetching: loading,
    isError: !!error,
    refetch,
    cirBTCAddress,
  }
}
