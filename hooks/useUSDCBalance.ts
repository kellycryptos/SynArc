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

    setLoading(true)
    setError(null)
    
    try {
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

      // USDC has 6 decimals
      const formatted = (Number(raw) / 1_000_000).toFixed(2)
      setBalance(formatted)
      setLoading(false)
      return
    } catch (err) {
      console.warn('USDC balance fetch failed:', err)
    }

    // All RPCs failed
    setError('Error fetching balance')
    setLoading(false)
  }, [activeAddress])

  useEffect(() => {
    fetchBalance()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchBalance, 30_000)
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
