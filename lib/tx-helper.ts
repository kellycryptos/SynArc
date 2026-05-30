import { createWalletClient, createPublicClient, http, custom, fallback } from 'viem'
import { ARC_CHAIN, ARC_RPC_URLS, ARC_GAS } from './arc-config'

// Get signer from ANY wallet type (Privy, MetaMask, Rabby, OKX)
export const getSigner = async (wallets?: any[]) => {
  let provider

  // Try Privy wallet first
  if (wallets && wallets.length > 0) {
    try {
      provider = await wallets[0].getEip1193Provider()
    } catch {
      // Privy failed, try window.ethereum
    }
  }

  // Fall back to injected wallet (MetaMask, Rabby, OKX)
  if (!provider && typeof window !== 'undefined' && window.ethereum) {
    provider = window.ethereum
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' })
  }

  if (!provider) throw new Error('No wallet connected')

  const walletClient = createWalletClient({
    chain: ARC_CHAIN,
    transport: custom(provider)
  })

  const publicClient = createPublicClient({
    chain: ARC_CHAIN,
    transport: fallback(ARC_RPC_URLS.map(url => http(url)))
  })

  const [address] = await walletClient.getAddresses()

  return { walletClient, publicClient, address }
}

// Universal write function with automatic retry
export const writeWithRetry = async (
  wallets: any[],
  contractCall: (walletClient: any) => Promise<string>,
  maxRetries = 3
): Promise<string> => {
  let lastError: any

  for (let i = 0; i < maxRetries; i++) {
    try {
      const { walletClient } = await getSigner(wallets)
      return await contractCall(walletClient)
    } catch (error: any) {
      lastError = error
      const msg = error?.message || ''
      
      // Only retry on RPC errors, not user rejections
      if (msg.includes('User rejected') || msg.includes('user rejected')) {
        throw error
      }
      
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)))
        continue
      }
    }
  }
  throw lastError
}
