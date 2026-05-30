import { createWalletClient, createPublicClient, http, custom, fallback } from 'viem'
import { ARC_CHAIN, ARC_RPC_URLS, ARC_GAS } from './arc-config'

// Get signer from ANY wallet type (Privy, MetaMask, Rabby, OKX)
export const getSigner = async (wallets?: any[], targetChain?: any) => {
  let provider
  const chainToUse = targetChain || ARC_CHAIN

  // Try Privy wallet first and perform chain switching if necessary
  if (wallets && wallets.length > 0) {
    try {
      provider = await wallets[0].getEip1193Provider()
      
      const currentChainIdStr = wallets[0].chainId || ""
      const currentChainId = parseInt(currentChainIdStr.replace("eip155:", "") || "0")
      
      if (currentChainId && currentChainId !== chainToUse.id) {
        try {
          await wallets[0].switchChain(chainToUse.id)
        } catch (switchError) {
          console.warn('Privy switchChain failed, trying window.ethereum fallback:', switchError)
          if (typeof window !== 'undefined' && window.ethereum) {
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainToUse.id.toString(16)}` }]
              })
            } catch (ethError) {
              console.error('window.ethereum switchChain failed:', ethError)
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching Privy provider or switching chain:', err)
    }
  }

  // Fall back to injected wallet (MetaMask, Rabby, OKX)
  if (!provider && typeof window !== 'undefined' && window.ethereum) {
    provider = window.ethereum
    // Request account access
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      const hexChainId = await window.ethereum.request({ method: 'eth_chainId' })
      const currentChainId = parseInt(hexChainId as string, 16)
      if (currentChainId !== chainToUse.id) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${chainToUse.id.toString(16)}` }]
          })
        } catch (switchError) {
          console.error('Direct window.ethereum chain switch failed:', switchError)
        }
      }
    } catch (reqError) {
      console.error('Account access request failed:', reqError)
    }
  }

  if (!provider) throw new Error('No wallet connected')

  // Construct a temporary client to query the active user address
  const tempClient = createWalletClient({
    chain: chainToUse,
    transport: custom(provider)
  })

  const [address] = await tempClient.getAddresses()
  if (!address) throw new Error('No account address found on provider')

  // Re-create the walletClient with explicitly bound account to prevent missing account context errors
  const walletClient = createWalletClient({
    chain: chainToUse,
    transport: custom(provider),
    account: address
  })

  // Get RPC URLs from target chain or fallback to ARC_RPC_URLS if chain is ARC_CHAIN
  const rpcUrls = chainToUse.id === ARC_CHAIN.id 
    ? ARC_RPC_URLS 
    : (chainToUse.rpcUrls?.default?.http || [])

  const publicClient = createPublicClient({
    chain: chainToUse,
    transport: fallback(rpcUrls.map((url: string) => http(url)))
  })

  return { walletClient, publicClient, address }
}

// Universal write function with automatic retry
export const writeWithRetry = async (
  wallets: any[],
  contractCall: (walletClient: any) => Promise<string>,
  maxRetries = 3,
  targetChain?: any
): Promise<string> => {
  let lastError: any

  for (let i = 0; i < maxRetries; i++) {
    try {
      const { walletClient } = await getSigner(wallets, targetChain)
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
