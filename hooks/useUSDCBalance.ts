import { createPublicClient, http, fallback } from 'viem'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from "@/hooks/auth/useAuth"
import { arcTestnet, ARC_RPC_URLS } from '@/lib/arc-config'

// Arc Testnet USDC contract address
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000'

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

export const useUSDCBalance = (walletAddress?: string | undefined) => {
  const { walletAddress: authAddress } = useAuth()
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

    const key = activeAddress.toLowerCase()
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
        chain: arcTestnet,
        transport: fallback(ARC_RPC_URLS.map(url => http(url))),
      })

      const raw = await client.readContract({
        address: USDC_ADDRESS as `0x${string}`,
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
      console.warn('USDC balance fetch failed:', err)
      setError('Error fetching balance')
      setLoading(false)
    } finally {
      delete pendingFetches[key]
    }
  }, [activeAddress])

  useEffect(() => {
    fetchBalance()
    
    // Refresh every 60 seconds (reduced from 30s) and only if visible
    const interval = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        fetchBalance()
      }
    }, 60_000)
    return () => clearInterval(interval)
    
  }, [fetchBalance])

  return {
    balance,
    loading,
    error,
    // Backward-compatible fields:
    isLoading: loading && balance === '0.00',
    isFetching: loading,
    isError: !!error,
    refetch: fetchBalance,
  }
}

