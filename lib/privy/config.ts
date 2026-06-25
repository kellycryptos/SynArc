import { PrivyClientConfig } from '@privy-io/react-auth';
import { arcTestnet } from '@/lib/arc-config';
import { sepolia, baseSepolia, avalancheFuji } from 'viem/chains';

// Define a stable version of Arc Testnet for Privy's embedded wallet.
// Privy's backend pings the first RPC in the chain's list to verify network health.
// Using the official, public, open RPC endpoint avoids "Arc network temporarily unavailable"
// errors caused by rate-limiting or IP restrictions on the custom Canteen RPC.
const privyArcTestnet = {
  ...arcTestnet,
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network', 'https://arc-testnet.g.alchemy.com/v2/okKqIdABiZt8WuR2aDvev'],
    },
    public: {
      http: ['https://rpc.testnet.arc.network', 'https://arc-testnet.g.alchemy.com/v2/okKqIdABiZt8WuR2aDvev'],
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
  supportedChains: [privyArcTestnet, sepolia, baseSepolia, avalancheFuji],
  defaultChain: privyArcTestnet,
};


