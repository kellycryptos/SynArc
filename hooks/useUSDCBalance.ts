import { createPublicClient, http } from 'viem'
import { useEffect, useState, useCallback } from 'react'
import { useWallets } from "@privy-io/react-auth"

// Arc Testnet USDC contract from deployments/arcTestnet.json
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000'


const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network'] },
    public: { http: [process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network'] },
  },
}

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
  const { wallets } = useWallets()
  const activeAddress = walletAddress || (wallets && wallets.length > 0 ? wallets[0]?.address : undefined)

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
    
    // Try primary RPC first then fallbacks
    const rpcUrls = [
      process.env.NEXT_PUBLIC_ARC_RPC_URL,
      'https://rpc.testnet.arc.network',
      'https://arc-testnet.drpc.org',
    ].filter(Boolean) as string[]

    for (const rpcUrl of rpcUrls) {
      try {
        const client = createPublicClient({
          chain: arcTestnet,
          transport: http(rpcUrl),
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
        return // Success — stop trying fallbacks
        
      } catch (err) {
        console.warn(`RPC failed: ${rpcUrl}`, err)
        continue // Try next RPC
      }
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
