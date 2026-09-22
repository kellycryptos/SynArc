import { PrivyClientConfig } from '@privy-io/react-auth';
import { arcTestnet, arcMainnet, ACTIVE_NETWORK, ARC_TESTNET_RPC_URLS, ARC_MAINNET_RPC_URLS } from '@/lib/arc-config';
import { sepolia, baseSepolia, avalancheFuji } from 'viem/chains';

// Define Arc Testnet configuration for Privy
const privyArcTestnet = {
  ...arcTestnet,
  rpcUrls: {
    default: {
      http: ARC_TESTNET_RPC_URLS,
    },
    public: {
      http: ARC_TESTNET_RPC_URLS,
    },
  },
};

// Define Arc Mainnet configuration for Privy
const privyArcMainnet = {
  ...arcMainnet,
  rpcUrls: {
    default: {
      http: ARC_MAINNET_RPC_URLS,
    },
    public: {
      http: ARC_MAINNET_RPC_URLS,
    },
  },
};

export const privyConfig: PrivyClientConfig = {
  loginMethods: ['email', 'google', 'wallet'],
  appearance: {
    theme: 'dark',
    accentColor: '#7C3AED',
    showWalletLoginFirst: false,
  },
  embeddedWallets: {
    // Only create an embedded wallet for users who don't already have an external wallet linked.
    createOnLogin: 'users-without-wallets',
    showWalletUIs: false,
    noPromptOnSignature: false,
  } as any,
  supportedChains: [privyArcTestnet, privyArcMainnet, sepolia, baseSepolia, avalancheFuji],
  defaultChain: ACTIVE_NETWORK === 'mainnet' ? privyArcMainnet : privyArcTestnet,
};



