import { PrivyClientConfig } from '@privy-io/react-auth';
import { arcTestnet } from '@/providers/Web3Provider';

export const privyConfig: PrivyClientConfig = {
  loginMethods: ['email', 'google', 'twitter', 'discord', 'wallet'],
  appearance: {
    theme: 'dark',
    accentColor: '#7C3AED', // Brand primary color (#7C3AED violet)
    showWalletLoginFirst: false, // Ensures a social-first onboarding UX
  },
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'all-users', // Automatically initializes embedded wallets on user login
    },
    showWalletUIs: false, // Prevents annoying signing popups for smooth on-chain DAO participation
  },
  supportedChains: [arcTestnet],
  defaultChain: arcTestnet,
};
