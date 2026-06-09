import { useState, useCallback, useEffect } from 'react'
import { initCircleWallet } from '@/lib/circle/client'

let isFirstLoad = true

export const useCircleWallet = () => {
  const [circleAddress, setCircleAddress] = useState<string | null>(null)
  const [circleConnected, setCircleConnected] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Hydrate state from localStorage on client load and listen for sync events
  useEffect(() => {
    // Clear Circle Wallet connection state on initial page load (hard refresh) to disable automatic session restore
    if (isFirstLoad) {
      isFirstLoad = false
      if (typeof window !== 'undefined') {
        localStorage.removeItem('synarc_circle_address')
        localStorage.removeItem('synarc_circle_email')
        localStorage.removeItem('synarc_circle_connected')
        localStorage.removeItem('synarc_circle_user_token')
      }
    }

    const syncState = () => {
      if (typeof window !== 'undefined') {
        const savedAddress = localStorage.getItem('synarc_circle_address')
        const savedEmail = localStorage.getItem('synarc_circle_email')
        const savedConnected = localStorage.getItem('synarc_circle_connected') === 'true'
        if (savedConnected && savedAddress) {
          setCircleAddress(savedAddress)
          setUserEmail(savedEmail)
          setCircleConnected(true)
        } else {
          setCircleAddress(null)
          setUserEmail(null)
          setCircleConnected(false)
        }
      }
    }

    // Call syncState on mount to read current state
    syncState()

    if (typeof window !== 'undefined') {
      window.addEventListener('synarc_circle_auth_change', syncState)
      window.addEventListener('storage', syncState)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('synarc_circle_auth_change', syncState)
        window.removeEventListener('storage', syncState)
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
    setLoadingStep('Registering secure user session...')

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
      setLoadingStep('Initializing Circle Web SDK...')
      console.log('[Circle Hook] Initializing Web SDK client...')
      const client = await initCircleWallet(userToken, encryptionKey)

      // Step 3 — Initialize wallet
      setLoadingStep('Deploying secure wallet structure...')
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

      // Step 4 — Execute challenge if present (shows Circle PIN/Verification UI)
      if (challengeId) {
        if (!alreadyInitialized) {
          setLoadingStep('Awaiting security PIN setup...')
        } else {
          setLoadingStep('Awaiting security verification...')
        }
        console.log('[Circle Hook] Executing security challenge...')
        await new Promise((resolve, reject) => {
          client.execute(challengeId, (error: any, result: any) => {
            if (error) {
              console.error('[Circle Hook] Challenge execution failed:', error)
              reject(new Error(error.message || 'Verification challenge failed'))
            } else {
              console.log('[Circle Hook] Challenge complete:', result)
              resolve(result)
            }
          })
        })
      }

      // Step 5 — Get wallet address
      setLoadingStep('Retrieving wallet address on ARC...')
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
        localStorage.setItem('synarc_circle_user_token', userToken)
        window.dispatchEvent(new Event('synarc_circle_auth_change'))
      }
      
    } catch (err: any) {
      console.error('[Circle Hook] Connection failed:', err)
      setError(err?.message || 'Failed to connect Circle Wallet')
      throw err // Bubble up to UI
    } finally {
      setLoading(false)
      setLoadingStep(null)
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
      localStorage.removeItem('synarc_circle_user_token')
      window.dispatchEvent(new Event('synarc_circle_auth_change'))
    }
  }, [])

  return {
    circleAddress,
    circleConnected,
    userEmail,
    loading,
    loadingStep,
    error,
    connectCircleWallet,
    disconnectCircleWallet
  }
}
