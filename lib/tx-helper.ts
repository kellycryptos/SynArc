import { createWalletClient, createPublicClient, http, custom, fallback } from 'viem'
import { ARC_CHAIN, ARC_RPC_URLS, ARC_GAS } from './arc-config'
import { BrowserProvider, Contract, ZeroAddress } from 'ethers'


// Enforce target chain ID before executing transaction with dynamic checks to prevent Privy crashes
export function selectActiveWallet(wallets?: any[], activeAddress?: string | null): any {
  if (!wallets || wallets.length === 0) return null;
  
  if (activeAddress) {
    const target = activeAddress.toLowerCase();
    const found = wallets.find(w => w.address.toLowerCase() === target);
    if (found) return found;
  }
  
  const privyWallet = wallets.find(w => w.walletClientType === 'privy');
  if (privyWallet) return privyWallet;
  
  return wallets[0];
}

export const enforceChain = async (activeWallet: any, targetChainId: number = 5042002): Promise<any> => {
  if (!activeWallet) throw new Error("No active wallet provided for chain enforcement");

  const targetHex = `0x${targetChainId.toString(16)}`;
  
  // 1. Fetch current chain ID according to Privy state
  const walletChainIdStr = activeWallet.chainId || "";
  const walletChainId = parseInt(walletChainIdStr.replace("eip155:", "") || "0");
  
  console.log(`[enforceChain] Target chain ID: ${targetChainId}. Wallet Privy state is currently on: ${walletChainId}`);

  const isArc = (id: number) => id === 5042002 || id === 1303;
  const chainsCompatible = (id1: number, id2: number) => {
    if (id1 === id2) return true;
    if (isArc(id1) && isArc(id2)) return true;
    return false;
  };

  // Fast path: if Privy already claims to be on the correct or compatible chain, return the provider immediately
  if (chainsCompatible(walletChainId, targetChainId)) {
    const provider = await (
      activeWallet.getEthereumProvider?.() || 
      activeWallet.getEip1193Provider?.() || 
      (activeWallet as any).getProvider?.()
    );
    if (provider) {
      console.log(`[enforceChain] Fast-path active: already on compatible chain (${walletChainId} vs ${targetChainId}). Returning provider.`);
      return provider;
    }
  }

  // 2. Perform switch or add-then-switch based on wallet type
  if (activeWallet.walletClientType === 'privy') {
    const provider = await (
      activeWallet.getEthereumProvider?.() || 
      activeWallet.getEip1193Provider?.() || 
      (activeWallet as any).getProvider?.()
    );
    if (provider) {
      console.log(`[enforceChain] Privy embedded wallet detected. Running add-then-switch flow.`);
      // Add Ethereum chain first
      try {
        const rpcUrls = targetChainId === 5042002 
          ? ARC_RPC_URLS 
          : ['https://rpc.testnet.arc.network'];
        const chainName = targetChainId === 5042002 ? "Arc Testnet" : "Arc Testnet (1303)";
        
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: targetHex,
            chainName: chainName,
            rpcUrls: rpcUrls,
            nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
            blockExplorerUrls: ["https://testnet.arcscan.app"],
          }]
        });
        console.log(`[enforceChain] wallet_addEthereumChain completed for Privy embedded wallet.`);
      } catch (addError) {
        console.warn(`[enforceChain] wallet_addEthereumChain failed:`, addError);
      }
      
      // Now switch chain
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetHex }]
        });
        console.log(`[enforceChain] wallet_switchEthereumChain completed for Privy embedded wallet.`);
        await new Promise(resolve => setTimeout(resolve, 800));
        return provider;
      } catch (switchError) {
        console.warn(`[enforceChain] wallet_switchEthereumChain failed, trying activeWallet.switchChain fallback:`, switchError);
      }
    }
  }

  // 3. Fallback switch if not privy or direct request failed
  try {
    if (typeof activeWallet.switchChain === 'function') {
      console.log(`[enforceChain] switchChain to ${targetChainId}...`);
      await activeWallet.switchChain(targetChainId);
      console.log(`[enforceChain] switchChain call sent successfully.`);
      // Delay to let Privy state propagate
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  } catch (err: any) {
    console.warn('[enforceChain] switchChain call raised error, continuing with fallback checks:', err);
  }

  // 4. Confirm network shift was successful
  const provider = await (
    activeWallet.getEthereumProvider?.() || 
    activeWallet.getEip1193Provider?.() || 
    (activeWallet as any).getProvider?.()
  );

  if (provider) {
    let providerChainIdHex = await provider.request({ method: 'eth_chainId' }).catch(() => null);
    let providerChainId = providerChainIdHex ? parseInt(providerChainIdHex, 16) : 0;
    console.log(`[enforceChain] Provider reports active chain ID: ${providerChainId}`);
    
    // Trigger wallet_addEthereumChain if RPC reports missing chain support
    if (!chainsCompatible(providerChainId, targetChainId)) {
      if (typeof window !== 'undefined' && provider.request) {
        console.log(`[enforceChain] Requesting wallet_addEthereumChain for chain ${targetChainId}...`);
        
        // Define standard RPC networks parameter
        const isArcTest = isArc(targetChainId);
        if (isArcTest) {
          try {
            const rpcUrls = targetChainId === 5042002 
              ? ARC_RPC_URLS 
              : ['https://rpc.testnet.arc.network'];
            const chainName = targetChainId === 5042002 ? "Arc Testnet" : "Arc Testnet (1303)";

            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: targetHex,
                chainName: chainName,
                rpcUrls: rpcUrls,
                nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
                blockExplorerUrls: ["https://testnet.arcscan.app/"],
              }]
            });
            await new Promise(resolve => setTimeout(resolve, 600));
            providerChainIdHex = await provider.request({ method: 'eth_chainId' }).catch(() => null);
            providerChainId = providerChainIdHex ? parseInt(providerChainIdHex, 16) : 0;
          } catch (addError) {
            console.error('[enforceChain] Failed to add compatible Arc Testnet chain to provider:', addError);
          }
        }
      }
    }

    if (providerChainId && !chainsCompatible(providerChainId, targetChainId)) {
      throw new Error(`Wallet chain enforcement failed: expected chain ID ${targetChainId}, but your wallet is active on chain ID ${providerChainId}. Please switch the network manually in your wallet.`);
    }
    
    return provider;
  }
  
  throw new Error("Failed to obtain provider from active wallet for chain enforcement.");
};

// Get signer from ANY wallet type (Privy, MetaMask, Rabby, OKX)
export const getSigner = async (wallets?: any[], targetChain?: any, activeAddress?: string) => {
  let provider
  const chainToUse = targetChain || ARC_CHAIN

  // Try Privy wallet first and perform chain switching if necessary
  let knownAddress: `0x${string}` | undefined;
  if (wallets && wallets.length > 0) {
    const activeWallet = selectActiveWallet(wallets, activeAddress);
    if (activeWallet) {
      try {
        provider = await enforceChain(activeWallet, chainToUse.id);
        knownAddress = activeWallet.address as `0x${string}`;
      } catch (err) {
        console.error('Error fetching Privy provider or switching chain:', err)
        throw err;
      }
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

  // Resolve active address: use known address if Privy wallet is connected, otherwise query provider
  let address = knownAddress;
  if (!address) {
    const tempClient = createWalletClient({
      chain: chainToUse,
      transport: custom(provider)
    })
    const [resolved] = await tempClient.getAddresses()
    address = resolved;
  }

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
    transport: fallback(
      rpcUrls.map((url: string) =>
        http(url, {
          timeout: 10000,
          retryCount: 3,
          retryDelay: 1000,
        })
      ),
      {
        retryCount: 3,
        retryDelay: 1000,
      }
    ),
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
      const lowerMsg = msg.toLowerCase()
      if (
        lowerMsg.includes('user rejected') || 
        lowerMsg.includes('user denied') || 
        lowerMsg.includes('user_rejected') ||
        lowerMsg.includes('user cancelled') ||
        lowerMsg.includes('user_cancelled') ||
        lowerMsg.includes('cancelled')
      ) {
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

/**
 * Unified helper to get an authenticated walletClient and publicClient
 * supporting Privy embedded wallets, Circle wallets, and external injected wallets.
 */
export const getAuthenticatedClient = async (
  wallets?: any[],
  targetChainId: number = 5042002,
  activeAddress?: string
) => {
  console.log(`[getAuthenticatedClient] Initializing client for chain ${targetChainId}`);
  
  let provider: any;
  let address: `0x${string}` | undefined;

  // 1. If we have a Privy wallet array, use the active wallet
  if (wallets && wallets.length > 0) {
    const activeWallet = selectActiveWallet(wallets, activeAddress);
    console.log(`[getAuthenticatedClient] Connected Privy wallet address: ${activeWallet.address}`);
    
    // Switch chain reliably
    try {
      if (typeof activeWallet.switchChain === 'function') {
        console.log(`[getAuthenticatedClient] Requesting switchChain to ${targetChainId}...`);
        await activeWallet.switchChain(targetChainId);
        console.log(`[getAuthenticatedClient] switchChain call sent.`);
        // Brief sleep to let provider chain switch propagate
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    } catch (err: any) {
      console.error(`[getAuthenticatedClient] switchChain failed:`, err);
    }

    // Retrieve provider
    provider = await (
      (activeWallet.getEthereumProvider ? activeWallet.getEthereumProvider() : null) ||
      (activeWallet.getProvider ? activeWallet.getProvider() : null) ||
      (activeWallet.getEip1193Provider ? activeWallet.getEip1193Provider() : null)
    );
    address = activeWallet.address as `0x${string}`;
  } 
  // 2. Fallback to injected window.ethereum
  else if (typeof window !== 'undefined' && window.ethereum) {
    console.log(`[getAuthenticatedClient] Fallback to window.ethereum`);
    provider = window.ethereum;
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const hexChainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(hexChainId as string, 16);
      if (currentChainId !== targetChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${targetChainId.toString(16)}` }]
          });
        } catch (switchError: any) {
          console.error('[getAuthenticatedClient] window.ethereum switchChain failed:', switchError);
        }
      }
    } catch (reqError) {
      console.error('[getAuthenticatedClient] Account request failed:', reqError);
    }
  }

  if (!provider) {
    console.error("[getAuthenticatedClient] No provider found");
    throw new Error('No wallet connected. Please connect your wallet first.');
  }

  // Resolve address if not already known
  if (!address) {
    const tempClient = createWalletClient({
      chain: ARC_CHAIN,
      transport: custom(provider)
    });
    const [resolved] = await tempClient.getAddresses();
    address = resolved;
  }

  if (!address) {
    console.error("[getAuthenticatedClient] No address found");
    throw new Error('No wallet account address found.');
  }

  console.log(`[getAuthenticatedClient] Final resolved wallet address: ${address}`);

  // Create public client with resilient fallback transport
  const rpcUrls = [
    process.env.NEXT_PUBLIC_ARC_RPC_URL,
    'https://rpc.testnet.arc.network',
    'https://arc-testnet.g.alchemy.com/v2/okKqIdABiZt8WuR2aDvev',
    ...ARC_RPC_URLS
  ].filter(Boolean) as string[];

  const uniqueRpcUrls = Array.from(new Set(rpcUrls));

  const publicClient = createPublicClient({
    chain: ARC_CHAIN,
    transport: fallback(
      uniqueRpcUrls.map((url) =>
        http(url, {
          timeout: 4000,   // Fast failover for slow RPCs
          retryCount: 2,   // Shorter retries per node to switch quickly
          retryDelay: 800,
        })
      ),
      {
        rank: true // dynamically rank RPCs by latency!
      }
    ),
  });

  const walletClient = createWalletClient({
    chain: ARC_CHAIN,
    transport: custom(provider),
    account: address,
  });

  return {
    walletClient,
    publicClient,
    address,
    provider
  };
};

/**
 * Dynamic fee configuration with aggressive floors for fast inclusion
 * on mobile/embedded wallets on the Arc Testnet.
 */
export const getAggressiveGasParams = async (publicClient: any) => {
  const minMaxFeePerGas = 20000000000n;         // Floor: 20 Gwei/units
  const minMaxPriorityFeePerGas = 15000000000n; // Floor: 15 Gwei/units

  try {
    const fees = await publicClient.estimateFeesPerGas();
    if (fees.maxFeePerGas && fees.maxPriorityFeePerGas) {
      // Apply 1.5x multiplier to the estimated gas fees for faster inclusion
      const estMax = (fees.maxFeePerGas * 150n) / 100n;
      const estPriority = (fees.maxPriorityFeePerGas * 150n) / 100n;

      return {
        maxFeePerGas: estMax > minMaxFeePerGas ? estMax : minMaxFeePerGas,
        maxPriorityFeePerGas: estPriority > minMaxPriorityFeePerGas ? estPriority : minMaxPriorityFeePerGas,
      };
    }
  } catch (err) {
    console.warn('[getAggressiveGasParams] estimateFeesPerGas failed, using aggressive floors:', err);
  }

  try {
    const gasPrice = await publicClient.getGasPrice();
    const estGasPrice = (gasPrice * 150n) / 100n;
    return {
      gasPrice: estGasPrice > minMaxFeePerGas ? estGasPrice : minMaxFeePerGas,
    };
  } catch (err) {
    console.warn('[getAggressiveGasParams] getGasPrice failed, using defaults.');
    return {
      gasPrice: minMaxFeePerGas,
    };
  }
};

/**
 * Resilient transaction receipt waiter with custom timeouts and polling
 * optimized for the Arc Testnet block times.
 */
export const waitForTransaction = async (
  publicClient: any,
  hash: `0x${string}`
) => {
  console.log(`[waitForTransaction] Waiting for transaction receipt of hash: ${hash}`);
  
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    timeout: 60_000,
    pollingInterval: 500, // Reduced polling interval to 500ms
    retryCount: 60,       // Increased retry count
  });
  
  console.log(`[waitForTransaction] Transaction receipt received:`, receipt);
  if (receipt.status !== 'success') {
    throw new Error('Transaction execution failed on-chain.');
  }

  // Introduce a brief settlement delay (1.5 seconds) to allow RPC state synchronization
  // across nodes before proceeding with subsequent transactions or reads.
  console.log(`[waitForTransaction] Transaction succeeded. Applying 1.5s RPC settlement delay...`);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  console.log(`[waitForTransaction] Settlement delay completed.`);
  
  return receipt;
};

/**
 * Auto-delegates voting power to self if the user has sARC tokens but has never delegated.
 */
export const checkAndDelegate = async (wallets: any[], activeAddress?: string) => {
  if (!wallets || wallets.length === 0) return;

  const activeWallet = selectActiveWallet(wallets, activeAddress);
  if (!activeWallet) return;

  try {
    const provider = await enforceChain(activeWallet, 5042002);
    const browserProvider = new BrowserProvider(provider, {
      chainId: 5042002,
      name: "Arc Testnet"
    });
    const signer = await browserProvider.getSigner(activeWallet.address);
    const address = activeWallet.address;

    const TOKEN_ABI = [
      'function delegate(address delegatee) external',
      'function delegates(address account) external view returns (address)',
      'function balanceOf(address account) external view returns (uint256)',
    ];

    const tokenContract = new Contract(
      process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e',
      TOKEN_ABI,
      signer
    );

    // Check if already delegated
    const currentDelegate = await tokenContract.delegates(address);
    const balance = await tokenContract.balanceOf(address);

    if (balance > 0n && currentDelegate === ZeroAddress) {
      console.log('Auto-delegating voting power to self...');
      
      // Get gas parameters for fast inclusion on Arc Testnet
      const minMaxFeePerGas = 20000000000n; // 20 Gwei/units
      
      const tx = await tokenContract.delegate(address, {
        gasLimit: 150000n,
        gasPrice: minMaxFeePerGas,
      });
      await tx.wait();
      console.log('Delegation complete');
    }
  } catch (err) {
    console.error('Error during auto-delegation check:', err);
  }
};


