import { createPublicClient, http, fallback } from 'viem'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from "@/hooks/auth/useAuth"
import { ARC_CHAIN, ARC_RPC_URLS, ACTIVE_NETWORK, ARC_MAINNET_RPC_URLS, ARC_TESTNET_RPC_URLS } from '@/lib/arc-config'

import { useArcNetwork } from "@/hooks/auth/useArcNetwork"

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

/**
 * Dispatch this event anywhere in the app after a transaction that changes a
 * wallet's USDC balance (earn deposit/withdraw, etc.). All active instances
 * of useUSDCBalance will clear their cache and re-fetch immediately.
 */
export function invalidateUSDCBalance() {
  if (typeof window !== 'undefined') {
    // Clear the entire module-level cache so the next fetch is live
    for (const key in cachedBalance) {
      delete cachedBalance[key]
    }
    window.dispatchEvent(new CustomEvent('synarc_usdc_changed'))
  }
}

export const useUSDCBalance = (walletAddress?: string | undefined) => {
  const { walletAddress: authAddress, isCircle } = useAuth()
  const activeAddress = walletAddress || authAddress
  const { arcChain, isArcTestnet } = useArcNetwork()

  const [balance, setBalance] = useState<string>('0.00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nativeBalance, setNativeBalance] = useState<string>('0.00')

  /** Internal: fetch, respecting the 5-second deduplication cache. */
  const fetchBalance = useCallback(async () => {
    if (!activeAddress) {
      setBalance('0.00')
      setNativeBalance('0.00')
      setLoading(false)
      setError(null)
      return
    }

    const key = `${activeAddress.toLowerCase()}_${arcChain?.id || (isArcTestnet ? 5042002 : 5042)}`
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
      // If user is connected via Circle Wallet, fetch from Circle user-controlled wallet balances API first
      if (isCircle && typeof window !== 'undefined') {
        const userToken = localStorage.getItem('synarc_circle_user_token')
        if (userToken) {
          try {
            const res = await fetch('/api/circle/wallet/balances', {
              headers: { 'x-user-token': userToken }
            })
            if (res.ok) {
              const data = await res.json()
              if (data.success && data.balances) {
                const usdcToken = data.balances.find((b: any) => 
                  b.token?.symbol?.toUpperCase() === 'USDC' || 
                  b.token?.address?.toLowerCase() === USDC_ADDRESS.toLowerCase()
                )
                if (usdcToken) {
                  const amountNum = parseFloat(usdcToken.amount) || 0
                  const formatted = amountNum.toFixed(2)
                  setNativeBalance(formatted)
                  cachedBalance[key] = { balance: formatted, timestamp: Date.now() }
                  return formatted
                }
              }
            }
          } catch (circleErr) {
            console.warn('[useUSDCBalance] Circle API balance fetch fallback to onchain RPC:', circleErr)
          }
        }
      }

      // Public on-chain read using active network RPC URLs
      const rpcUrls = isArcTestnet ? ARC_TESTNET_RPC_URLS : ARC_MAINNET_RPC_URLS
      const client = createPublicClient({
        chain: arcChain,
        transport: fallback(rpcUrls.filter(Boolean).map((url: string) => http(url, { timeout: 4000 }))),
      })

      const [raw, nativeRaw] = await Promise.all([
        client.readContract({
          address: USDC_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [activeAddress as `0x${string}`],
        }).catch(() => 0n),
        client.getBalance({ address: activeAddress as `0x${string}` }).catch(() => 0n),
      ])

      const erc20Formatted = (Number(raw) / 1_000_000).toFixed(2)
      // Native Arc USDC has 18 decimals in wei
      const nativeFormatted = (Number(nativeRaw) / 1e18).toFixed(2)
      setNativeBalance(nativeFormatted)

      // Use erc20 balanceOf if available, else native balance if non-zero
      const formatted = raw > 0n ? erc20Formatted : (nativeRaw > 0n ? nativeFormatted : erc20Formatted)
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
  }, [activeAddress, isCircle, arcChain, isArcTestnet])

  /**
   * Public refetch — always bypasses the 5-second cache.
   * Use this after a transaction that changes the balance.
   */
  const refetch = useCallback(async () => {
    if (!activeAddress) return
    const key = `${activeAddress.toLowerCase()}_${arcChain?.id || (isArcTestnet ? 5042002 : 5042)}`
    delete cachedBalance[key]
    await fetchBalance()
  }, [activeAddress, arcChain, isArcTestnet, fetchBalance])

  useEffect(() => {
    fetchBalance()
    
    // Refresh every 60 seconds and only if tab is visible
    const interval = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        fetchBalance()
      }
    }, 60_000)

    // Respond to synarc_usdc_changed events fired after earn deposits/withdraws etc.
    // The module-level cache is already cleared by invalidateUSDCBalance() before the
    // event is dispatched, so fetchBalance() will go live.
    const handleUsdcChanged = () => {
      fetchBalance()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('synarc_usdc_changed', handleUsdcChanged)
    }

    return () => {
      clearInterval(interval)
      if (typeof window !== 'undefined') {
        window.removeEventListener('synarc_usdc_changed', handleUsdcChanged)
      }
    }
    
  }, [fetchBalance])

  return {
    balance,
    nativeBalance,
    loading,
    error,
    // Backward-compatible fields:
    isLoading: loading && balance === '0.00',
    isFetching: loading,
    isError: !!error,
    refetch,
  }
}

