import { createPublicClient, http, fallback } from 'viem'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from "@/hooks/auth/useAuth"
import { useArcNetwork } from "@/hooks/auth/useArcNetwork"
import { ARC_CHAIN, ARC_RPC_URLS, ARC_MAINNET_RPC_URLS, getActiveNetwork, CONTRACTS } from '@/lib/arc-config'

// Dynamic getter — resolves the correct RPC list at call time, not import time
const getActiveRpcUrls = () => getActiveNetwork() === 'mainnet' ? ARC_MAINNET_RPC_URLS : ARC_RPC_URLS;

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

export const useEURCBalance = (walletAddress?: string | undefined) => {
  const { walletAddress: authAddress } = useAuth()
  const { activeNetwork } = useArcNetwork()
  const activeAddress = walletAddress || authAddress

  const [balance, setBalance] = useState<string>('0.00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = useCallback(async () => {
    if (!activeAddress) {
      setBalance('0.00')
      setLoading(false)
      setError(null)
      return
    }

    const key = `${activeAddress.toLowerCase()}_${activeNetwork}`
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
        setBalance(res)
        setLoading(false)
        return
      } catch (err) {
        // Fall through to try a new fetch if the previous one failed
      }
    }

    setLoading(true)
    setError(null)
    
    const fetchPromise = (async () => {
      const client = createPublicClient({
        chain: ARC_CHAIN,
        transport: fallback(getActiveRpcUrls().map(url => http(url))),
      })

      const raw = await client.readContract({
        address: getEurcAddress(),
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [activeAddress as `0x${string}`],
      })

      const formatted = (Number(raw) / 1_000_000).toFixed(2)
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
      setError('Error fetching balance')
      setLoading(false)
    } finally {
      delete pendingFetches[key]
    }
  }, [activeAddress, activeNetwork])

  useEffect(() => {
    fetchBalance()
    
    const handleNetworkChange = () => {
      fetchBalance()
    }

    if (typeof window !== "undefined") {
      window.addEventListener("synarc_network_changed", handleNetworkChange)
    }

    // Refresh every 60 seconds (reduced from 30s) and only if visible
    const interval = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        fetchBalance()
      }
    }, 60_000)

    return () => {
      clearInterval(interval)
      if (typeof window !== "undefined") {
        window.removeEventListener("synarc_network_changed", handleNetworkChange)
      }
    }
  }, [fetchBalance])

  return {
    balance,
    loading,
    error,
    // Add backward-compatible properties for the rest of the application
    isLoading: loading && balance === '0.00',
    isFetching: loading,
    isError: !!error,
    refetch: fetchBalance,
  }
}

