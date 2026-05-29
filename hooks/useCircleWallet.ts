import { useState, useCallback, useEffect } from 'react'
import { initCircleWallet } from '@/lib/circle/client'

export const useCircleWallet = () => {
  const [circleAddress, setCircleAddress] = useState<string | null>(null)
  const [circleConnected, setCircleConnected] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hydrate state from localStorage on client load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAddress = localStorage.getItem('synarc_circle_address')
      const savedEmail = localStorage.getItem('synarc_circle_email')
      const savedConnected = localStorage.getItem('synarc_circle_connected') === 'true'
      if (savedConnected && savedAddress) {
        setCircleAddress(savedAddress)
        setUserEmail(savedEmail)
        setCircleConnected(true)
      }
    }
  }, [])

  const connectCircleWallet = useCallback(async (email: string) => {
    if (!email) {
      setError('Email is required to connect Circle wallet.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Step 1 — Create/get Circle user
      console.log('[Circle Hook] Initializing user session...')
      const userRes = await fetch('/api/circle/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: email })
      })
      const userData = await userRes.json()
      if (!userRes.ok || userData.error) {
        throw new Error(userData.error || 'Failed to create user session')
      }
      const { userToken, encryptionKey } = userData

      // Step 2 — Initialize Circle SDK
      console.log('[Circle Hook] Initializing Web SDK client...')
      const client = await initCircleWallet(userToken, encryptionKey)

      // Step 3 — Initialize wallet
      console.log('[Circle Hook] Initializing wallet structure...')
      const walletRes = await fetch('/api/circle/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userToken })
      })
      const walletData = await walletRes.json()
      if (!walletRes.ok || walletData.error) {
        throw new Error(walletData.error || 'Failed to initialize wallet')
      }
      const { challengeId, alreadyInitialized } = walletData

      // Step 4 — Execute challenge if not already initialized (shows Circle PIN UI)
      if (challengeId && !alreadyInitialized) {
        console.log('[Circle Hook] Executing security challenge PIN setup...')
        await new Promise((resolve, reject) => {
          client.execute(challengeId, (error, result) => {
            if (error) {
              console.error('[Circle Hook] Challenge execution failed:', error)
              reject(new Error(error.message || 'PIN setup challenge failed'))
            } else {
              console.log('[Circle Hook] Challenge complete:', result)
              resolve(result)
            }
          })
        })
      }

      // Step 5 — Get wallet address
      console.log('[Circle Hook] Retrieving wallet address on ARC-TESTNET...')
      const addressRes = await fetch('/api/circle/wallet/address', {
        headers: { 'X-User-Token': userToken }
      })
      const addressData = await addressRes.json()
      if (!addressRes.ok || addressData.error) {
        throw new Error(addressData.error || 'Failed to fetch wallet address')
      }
      const { address } = addressData

      // Save to state and persist
      setCircleAddress(address)
      setUserEmail(email)
      setCircleConnected(true)

      if (typeof window !== 'undefined') {
        localStorage.setItem('synarc_circle_address', address)
        localStorage.setItem('synarc_circle_email', email)
        localStorage.setItem('synarc_circle_connected', 'true')
      }
      
    } catch (err: any) {
      console.error('[Circle Hook] Connection failed:', err)
      setError(err?.message || 'Failed to connect Circle Wallet')
      throw err // Bubble up to UI
    } finally {
      setLoading(false)
    }
  }, [])

  const disconnectCircleWallet = useCallback(() => {
    setCircleAddress(null)
    setUserEmail(null)
    setCircleConnected(false)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('synarc_circle_address')
      localStorage.removeItem('synarc_circle_email')
      localStorage.removeItem('synarc_circle_connected')
    }
  }, [])

  return {
    circleAddress,
    circleConnected,
    userEmail,
    loading,
    error,
    connectCircleWallet,
    disconnectCircleWallet
  }
}
