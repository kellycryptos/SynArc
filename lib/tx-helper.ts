import { createWalletClient, createPublicClient, http, custom, fallback } from 'viem'
import { ARC_CHAIN, ARC_RPC_URLS, ARC_GAS } from './arc-config'

// Enforce target chain ID before executing transaction with dynamic checks to prevent Privy crashes
export const enforceChain = async (activeWallet: any, targetChainId: number = 5042002): Promise<any> => {
  if (!activeWallet) throw new Error("No active wallet provided for chain enforcement");

  const targetHex = `0x${targetChainId.toString(16)}`;
  
  // 1. Fetch current chain ID according to Privy state
  const walletChainIdStr = activeWallet.chainId || "";
  const walletChainId = parseInt(walletChainIdStr.replace("eip155:", "") || "0");
  
  console.log(`[enforceChain] Target chain ID: ${targetChainId}. Wallet Privy state is currently on: ${walletChainId}`);

  // Fast path: if Privy already claims to be on the correct chain, return the provider immediately
  // This bypasses extra RPC roundtrips and settling timeouts entirely!
  if (walletChainId === targetChainId) {
    const provider = await (
      activeWallet.getEip1193Provider?.() || 
      activeWallet.getEthereumProvider?.() || 
      (activeWallet as any).getProvider?.()
    );
    if (provider) {
      console.log(`[enforceChain] Fast-path active: already on chain ${targetChainId}. Returning provider.`);
      return provider;
    }
  }

  // 2. Perform switch if mismatch detected
  if (walletChainId !== targetChainId) {
    try {
      if (typeof activeWallet.switchChain === 'function') {
        console.log(`[enforceChain] Invoking Privy switchChain to ${targetChainId}...`);
        await activeWallet.switchChain(targetChainId);
        // Wait 600ms for Privy internal state & provider instances to fully synchronize
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    } catch (switchError: any) {
      console.warn('[enforceChain] Privy switchChain failed, attempting direct provider RPC switch:', switchError);
    }
  }

  // 3. Obtain EIP1193 provider to query directly and force chain switch on hardware/injected wallets
  const provider = await (
    activeWallet.getEip1193Provider?.() || 
    activeWallet.getEthereumProvider?.() || 
    (activeWallet as any).getProvider?.()
  );
  
  if (provider) {
    // Query direct chainId from provider RPC (bypasses any cached states in Privy/Wagmi)
    let providerChainIdHex = await provider.request({ method: 'eth_chainId' }).catch(() => null);
    let providerChainId = providerChainIdHex ? parseInt(providerChainIdHex, 16) : 0;
    
    if (providerChainId && providerChainId !== targetChainId) {
      console.log(`[enforceChain] Provider chain mismatch. Expected ${targetChainId}, got ${providerChainId}. Forcing switch via provider request...`);
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetHex }]
        });
        await new Promise(resolve => setTimeout(resolve, 600));
        providerChainIdHex = await provider.request({ method: 'eth_chainId' }).catch(() => null);
        providerChainId = providerChainIdHex ? parseInt(providerChainIdHex, 16) : 0;
      } catch (reqError: any) {
        console.error('[enforceChain] Provider request chain switch failed:', reqError);
        
        // If unrecognized chain, try to wallet_addEthereumChain
        const isUnrecognized = 
          reqError?.code === 4902 || 
          reqError?.message?.includes("4902") || 
          reqError?.message?.toLowerCase().includes("unrecognized");
          
        if (isUnrecognized) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: targetHex,
                chainName: "Arc Testnet",
                rpcUrls: ARC_RPC_URLS,
                nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
                blockExplorerUrls: ['https://testnet.arcscan.app']
              }]
            });
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: targetHex }]
            });
            await new Promise(resolve => setTimeout(resolve, 600));
            providerChainIdHex = await provider.request({ method: 'eth_chainId' }).catch(() => null);
            providerChainId = providerChainIdHex ? parseInt(providerChainIdHex, 16) : 0;
          } catch (addError) {
            console.error('[enforceChain] Failed to add Arc Testnet to provider:', addError);
          }
        }
      }
    }

    if (providerChainId && providerChainId !== targetChainId) {
      throw new Error(`Wallet chain enforcement failed: expected chain ID ${targetChainId}, but your wallet is active on chain ID ${providerChainId}. Please switch the network manually in your wallet.`);
    }
    
    return provider;
  }
  
  throw new Error("Failed to obtain provider from active wallet for chain enforcement.");
};

// Get signer from ANY wallet type (Privy, MetaMask, Rabby, OKX)
export const getSigner = async (wallets?: any[], targetChain?: any) => {
  let provider
  const chainToUse = targetChain || ARC_CHAIN

  // Try Privy wallet first and perform chain switching if necessary
  if (wallets && wallets.length > 0) {
    try {
      provider = await enforceChain(wallets[0], chainToUse.id);
    } catch (err) {
      console.error('Error fetching Privy provider or switching chain:', err)
      throw err;
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
        } catch (switchError: any) {
          console.error('Direct window.ethereum chain switch failed:', switchError)
          
          const isUnrecognized = 
            switchError?.code === 4902 || 
            switchError?.message?.includes("4902") || 
            switchError?.message?.toLowerCase().includes("unrecognized");
            
          if (isUnrecognized) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${chainToUse.id.toString(16)}`,
                  chainName: chainToUse.name,
                  rpcUrls: ARC_RPC_URLS,
                  nativeCurrency: chainToUse.nativeCurrency || { name: 'USDC', symbol: 'USDC', decimals: 6 },
                  blockExplorerUrls: [chainToUse.blockExplorers?.default?.url || 'https://testnet.arcscan.app']
                }]
              });
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainToUse.id.toString(16)}` }]
              });
            } catch (addError) {
              console.error('Direct window.ethereum add chain failed:', addError);
            }
          }
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
