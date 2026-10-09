import { createPublicClient, http, fallback, isAddress, getAddress, formatUnits } from 'viem'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from "@/hooks/auth/useAuth"
import { ARC_CHAIN, ARC_RPC_URLS, ACTIVE_NETWORK, ARC_MAINNET_RPC_URLS, ARC_TESTNET_RPC_URLS, getMainnetRpcUrls, getTestnetRpcUrls } from '@/lib/arc-config'

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
const cachedBalance: { 
  [address: string]: { 
    balance: string; 
    nativeBalance: string; 
    erc20Balance: string; 
    timestamp: number 
  } | undefined 
} = {}
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
  const [nativeBalance, setNativeBalance] = useState<string>('0.00')
  const [erc20Balance, setErc20Balance] = useState<string>('0.00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** Internal: fetch, respecting the 5-second deduplication cache. */
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
      setNativeBalance('0.00')
      setErc20Balance('0.00')
      setLoading(false)
      setError(null)
      return
    }

    const key = `${safeAddress.toLowerCase()}_${arcChain?.id || (isArcTestnet ? 5042002 : 5042)}`
    const now = Date.now()

    // 1. Check cache (5 seconds cache to deduplicate simultaneous calls on load)
    const cacheEntry = cachedBalance[key]
    if (cacheEntry && now - cacheEntry.timestamp < 5000) {
      setBalance(cacheEntry.balance)
      setNativeBalance(cacheEntry.nativeBalance || '0.00')
      setErc20Balance(cacheEntry.erc20Balance || '0.00')
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
                  setErc20Balance(formatted)
                  cachedBalance[key] = { 
                    balance: formatted, 
                    nativeBalance: formatted, 
                    erc20Balance: formatted, 
                    timestamp: Date.now() 
                  }
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
      const rpcUrls = isArcTestnet ? getTestnetRpcUrls() : getMainnetRpcUrls()
      const client = createPublicClient({
        chain: arcChain,
        transport: fallback(rpcUrls.filter(Boolean).map((url: string) => http(url, { timeout: 8000 }))),
      })

      const [contractResult, balanceResult] = await Promise.allSettled([
        client.readContract({
          address: USDC_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [safeAddress],
        }),
        client.getBalance({ address: safeAddress }),
      ])

      const raw = contractResult.status === 'fulfilled' ? contractResult.value : 0n
      const nativeRaw = balanceResult.status === 'fulfilled' ? balanceResult.value : 0n

      if (contractResult.status === 'rejected' && balanceResult.status === 'rejected') {
        console.warn('[useUSDCBalance] Both RPC calls failed:', contractResult.reason, balanceResult.reason)
        if (cacheEntry?.balance) {
          return cacheEntry.balance
        }
        throw new Error('RPC balance read failed')
      }

      // ERC20 USDC uses 6 decimals; Arc native gas USDC uses 18 decimals (wei)
      const erc20Num = Number(formatUnits(raw, 6))
      const nativeNum = Number(formatUnits(nativeRaw, 18))
      const totalNum = erc20Num + nativeNum

      const erc20Formatted = erc20Num.toFixed(2)
      const nativeFormatted = nativeNum.toFixed(2)
      const formatted = totalNum.toFixed(2)

      setNativeBalance(nativeFormatted)
      setErc20Balance(erc20Formatted)

      cachedBalance[key] = { 
        balance: formatted, 
        nativeBalance: nativeFormatted, 
        erc20Balance: erc20Formatted, 
        timestamp: Date.now() 
      }
      return formatted
    })()

    pendingFetches[key] = fetchPromise

    try {
      const formatted = await fetchPromise
      setBalance(formatted)
      setLoading(false)
    } catch (err) {
      console.warn('USDC balance fetch failed:', err)
      if (!cachedBalance[key]?.balance) {
        setError('Error fetching balance')
      }
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
    let safeAddress: `0x${string}` | null = null
    try {
      if (activeAddress && isAddress(activeAddress.toLowerCase())) {
        safeAddress = getAddress(activeAddress.toLowerCase())
      }
    } catch {}
    const addr = safeAddress ? safeAddress.toLowerCase() : activeAddress.toLowerCase()
    const key = `${addr}_${arcChain?.id || (isArcTestnet ? 5042002 : 5042)}`
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
    const handleUsdcChanged = () => {
      fetchBalance()
    }

    const handleNetworkChanged = () => {
      for (const k in cachedBalance) {
        delete cachedBalance[k]
      }
      fetchBalance()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('synarc_usdc_changed', handleUsdcChanged)
      window.addEventListener('synarc_network_changed', handleNetworkChanged)
    }

    return () => {
      clearInterval(interval)
      if (typeof window !== 'undefined') {
        window.removeEventListener('synarc_usdc_changed', handleUsdcChanged)
        window.removeEventListener('synarc_network_changed', handleNetworkChanged)
      }
    }
    
  }, [fetchBalance])

  return {
    balance,
    nativeBalance,
    erc20Balance,
    loading,
    error,
    // Backward-compatible fields:
    isLoading: loading,
    isFetching: loading,
    isError: !!error,
    refetch,
  }
}

