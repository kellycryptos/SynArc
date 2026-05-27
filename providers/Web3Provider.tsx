"use client";

import { ReactNode, useState, useEffect } from 'react';
import { PrivyProvider, PrivyClientConfig } from '@privy-io/react-auth';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'wagmi';
import { fallback, defineChain } from 'viem';
import { initializeResilientRpc } from '@/lib/rpc/config';

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { 
    name: 'USD Coin', 
    symbol: 'USDC', 
    decimals: 6 // Forces PC extensions to interpret gas pricing at 6 decimals!
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network', 'https://arc-testnet.drpc.org'] },
    public: { http: ['https://rpc.testnet.arc.network', 'https://arc-testnet.drpc.org'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
});

export const config = createConfig({
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: fallback([
      http('https://rpc.testnet.arc.network'), // Public execution nodes used natively by mobile
      http('https://arc-testnet.drpc.org'),
    ], { rank: true, retryCount: 3, retryDelay: 500 }),
  },
  ssr: true, // Hydration-safe for Next.js App Router
});

const privyConfig: PrivyClientConfig = {
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

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  }));

  useEffect(() => {
    initializeResilientRpc(arcTestnet);
  }, []);

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clt57262n00ldmp0fhz113qep"; 

  return (
    <PrivyProvider 
      appId={appId} 
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
