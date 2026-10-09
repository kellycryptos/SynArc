import { 
  ARC_MAINNET_RPC_URLS, 
  ARC_TESTNET_RPC_URLS, 
  ARC_TESTNET_FALLBACK_RPC,
  getMainnetProxyUrl,
  getTestnetProxyUrl
} from './arc-config';

export interface AddEthereumChainParameter {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[];
}

/**
 * Canonical chain specifications for adding networks to wallet providers (MetaMask, Rabby, Coinbase, Privy, etc.)
 * Note: Arc native token is USDC with 18 decimals!
 */
export const CHAIN_METADATA: Record<number, AddEthereumChainParameter> = {
  // Arc Mainnet
  5042: {
    chainId: '0x13b2',
    chainName: 'Arc',
    nativeCurrency: {
      name: 'USDC',
      symbol: 'USDC',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.mainnet.arc.io', getMainnetProxyUrl()],
    blockExplorerUrls: ['https://explorer.arc.io'],
  },
  // Arc Testnet
  5042002: {
    chainId: '0x4cef52',
    chainName: 'Arc Testnet',
    nativeCurrency: {
      name: 'USDC',
      symbol: 'USDC',
      decimals: 18,
    },
    rpcUrls: [ARC_TESTNET_FALLBACK_RPC, getTestnetProxyUrl(), 'https://rpc.testnet.arc.io'],
    blockExplorerUrls: ['https://testnet.arcscan.app'],
  },
  // Ethereum Mainnet
  1: {
    chainId: '0x1',
    chainName: 'Ethereum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://cloudflare-eth.com', 'https://ethereum-rpc.publicnode.com'],
    blockExplorerUrls: ['https://etherscan.io'],
  },
  // Ethereum Sepolia
  11155111: {
    chainId: '0xaa36a7',
    chainName: 'Ethereum Sepolia',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.ankr.com/eth_sepolia', 'https://ethereum-sepolia-rpc.publicnode.com'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  // Base Mainnet
  8453: {
    chainId: '0x2105',
    chainName: 'Base',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.base.org', 'https://base-rpc.publicnode.com'],
    blockExplorerUrls: ['https://basescan.org'],
  },
  // Base Sepolia
  84532: {
    chainId: '0x14a34',
    chainName: 'Base Sepolia',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://sepolia.base.org', 'https://base-sepolia-rpc.publicnode.com'],
    blockExplorerUrls: ['https://sepolia.basescan.org'],
  },
  // Avalanche C-Chain Mainnet
  43114: {
    chainId: '0xa86a',
    chainName: 'Avalanche C-Chain',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc', 'https://avalanche-c-chain-rpc.publicnode.com'],
    blockExplorerUrls: ['https://snowtrace.io'],
  },
  // Avalanche Fuji
  43113: {
    chainId: '0xa869',
    chainName: 'Avalanche Fuji',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://testnet.snowtrace.io'],
  },
};

export function getAddChainParameters(chainId: number | string): AddEthereumChainParameter | null {
  const id = typeof chainId === 'string' 
    ? (chainId.startsWith('0x') ? parseInt(chainId, 16) : parseInt(chainId, 10))
    : chainId;
  return CHAIN_METADATA[id] || null;
}

/**
 * Wraps any EIP-1193 provider with seamless automatic chain adding.
 * If the wallet returns code 4902 / unrecognized chain when wallet_switchEthereumChain is called,
 * the wrapper automatically calls wallet_addEthereumChain with canonical parameters,
 * and then re-attempts the switch.
 */
export function wrapEip1193ProviderWithAutoAdd(rawProvider: any): any {
  if (!rawProvider || typeof rawProvider.request !== 'function') {
    return rawProvider;
  }

  // Avoid double-wrapping
  if ((rawProvider as any).__isSynArcAutoAddWrapped) {
    return rawProvider;
  }

  const wrapper = new Proxy(rawProvider, {
    get(target, prop, receiver) {
      if (prop === '__isSynArcAutoAddWrapped') {
        return true;
      }
      if (prop === 'request') {
        return async (args: { method: string; params?: any[] }) => {
          const { method, params } = args || {};

          if (method === 'wallet_switchEthereumChain') {
            const requestedHex = params?.[0]?.chainId;
            if (!requestedHex) {
              return await target.request(args);
            }

            const chainIdNum = parseInt(requestedHex, 16);

            try {
              return await target.request(args);
            } catch (switchErr: any) {
              const errMsg = (switchErr?.message || '').toLowerCase();
              const isUnrecognized = 
                switchErr?.code === 4902 || 
                switchErr?.code === -32603 ||
                errMsg.includes('4902') || 
                errMsg.includes('unrecognized') ||
                errMsg.includes('unknown chain') ||
                errMsg.includes('not found') ||
                errMsg.includes('could not find chain');

              if (isUnrecognized && chainIdNum) {
                const addParams = getAddChainParameters(chainIdNum);
                if (addParams) {
                  try {
                    console.log(`[AutoAddProvider] Auto-adding network ${addParams.chainName} (${addParams.chainId})...`);
                    await target.request({
                      method: 'wallet_addEthereumChain',
                      params: [addParams],
                    });
                    // Small delay to allow wallet internal state to settle
                    await new Promise(r => setTimeout(r, 400));
                    // Retry switch after adding
                    return await target.request(args);
                  } catch (addErr: any) {
                    console.warn(`[AutoAddProvider] Failed to auto-add network ${addParams.chainName}:`, addErr);
                    throw switchErr;
                  }
                }
              }
              throw switchErr;
            }
          }

          return await target.request(args);
        };
      }

      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        return val.bind(target);
      }
      return val;
    }
  });

  return wrapper;
}

/**
 * Ensures wallet provider is switched to the target chain, automatically adding it if missing.
 */
export async function ensureWalletOnChain(provider: any, targetChainId: number): Promise<void> {
  if (!provider || typeof provider.request !== 'function') return;

  const chainIdHex = `0x${targetChainId.toString(16)}`;

  try {
    const currentHex = await provider.request({ method: 'eth_chainId' });
    if (currentHex && currentHex.toLowerCase() === chainIdHex.toLowerCase()) {
      return; // Already on target chain
    }
  } catch {}

  const wrapped = wrapEip1193ProviderWithAutoAdd(provider);
  await wrapped.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: chainIdHex }],
  });
}
