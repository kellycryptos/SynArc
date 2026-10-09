import { createPublicClient, http, fallback, isAddress, getAddress, formatUnits } from 'viem'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from "@/hooks/auth/useAuth"
import { useArcNetwork } from "@/hooks/auth/useArcNetwork"
import { ARC_CHAIN, ARC_RPC_URLS, ARC_MAINNET_RPC_URLS, getActiveNetwork, CONTRACTS, getMainnetRpcUrls, getTestnetRpcUrls } from '@/lib/arc-config'

// Dynamic active-network EURC contract address
const getEurcAddress = () => (CONTRACTS.eurc || '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1') as `0x${string}`;

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

export function invalidateEURCBalance() {
  if (typeof window !== 'undefined') {
    for (const key in cachedBalance) {
      delete cachedBalance[key]
    }
    window.dispatchEvent(new CustomEvent('synarc_usdc_changed'))
  }
}

export const useEURCBalance = (walletAddress?: string | undefined) => {
  const { walletAddress: authAddress } = useAuth()
  const { activeNetwork, isArcTestnet } = useArcNetwork()
  const activeAddress = walletAddress || authAddress

  const [balance, setBalance] = useState<string>('0.00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setBalance('0.00')
      setLoading(false)
      setError(null)
      return
    }

    const key = `${safeAddress.toLowerCase()}_${activeNetwork}`
    const now = Date.now()

    // 1. Check cache (5 seconds cache to deduplicate simultaneous calls on load)
    const cacheEntry = cachedBalance[key]
    if (cacheEntry && now - cacheEntry.timestamp < 5000) {
      setBalance(cacheEntry.balance)
      setLoading(false)
      setError(null)
      return
    }

    // 2. Check if there is already a pending promise for this address on this network
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
      const rpcUrls = isArcTestnet ? getTestnetRpcUrls() : getMainnetRpcUrls()
      const client = createPublicClient({
        chain: ARC_CHAIN,
        transport: fallback(rpcUrls.filter(Boolean).map(url => http(url, { timeout: 8000 }))),
      })

      const raw = await client.readContract({
        address: getEurcAddress(),
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [safeAddress],
      })

      const formatted = Number(formatUnits(raw, 6)).toFixed(2)
      cachedBalance[key] = { balance: formatted, timestamp: Date.now() }
      return formatted
    })()

    pendingFetches[key] = fetchPromise

    try {
      const formatted = await fetchPromise
      setBalance(formatted)
      setLoading(false)
    } catch (err) {
      console.warn('EURC balance fetch failed:', err)
      if (!cachedBalance[key]?.balance) {
        setError('Error fetching balance')
      }
      setLoading(false)
    } finally {
      delete pendingFetches[key]
    }
  }, [activeAddress, activeNetwork, isArcTestnet])

  const refetch = useCallback(async () => {
    if (!activeAddress) return
    let safeAddress: `0x${string}` | null = null
    try {
      if (activeAddress && isAddress(activeAddress.toLowerCase())) {
        safeAddress = getAddress(activeAddress.toLowerCase())
      }
    } catch {}
    const addr = safeAddress ? safeAddress.toLowerCase() : activeAddress.toLowerCase()
    const key = `${addr}_${activeNetwork}`
    delete cachedBalance[key]
    await fetchBalance()
  }, [activeAddress, activeNetwork, fetchBalance])

  useEffect(() => {
    fetchBalance()
    
    const handleNetworkChange = () => {
      for (const k in cachedBalance) {
        delete cachedBalance[k]
      }
      fetchBalance()
    }

    const handleUsdcChange = () => {
      fetchBalance()
    }

    if (typeof window !== "undefined") {
      window.addEventListener("synarc_network_changed", handleNetworkChange)
      window.addEventListener("synarc_usdc_changed", handleUsdcChange)
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
        window.removeEventListener("synarc_usdc_changed", handleUsdcChange)
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
  }
}

