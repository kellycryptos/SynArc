"use client";

import { ReactNode, useState, useEffect } from 'react';
import { PrivyProvider, PrivyClientConfig } from '@privy-io/react-auth';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { arcTestnet, arcTransport } from '@/lib/arc/config';
import { initializeResilientRpc } from '@/lib/rpc/config';

export { arcTestnet };

export const config = createConfig({
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: arcTransport,
  },
  ssr: true, // Hydration-safe for Next.js App Router
});

const privyConfig: PrivyClientConfig = {
  // Explicitly lock to Google, Email, and Wallet — bypasses any Privy Dashboard cache
  loginMethods: ['google', 'email', 'wallet'],
  appearance: {
    theme: 'dark',
    accentColor: '#7C3AED', // Brand primary color (#7C3AED violet)
    showWalletLoginFirst: false, // Ensures a social-first onboarding UX
  },
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'users-without-wallets', // Only creates embedded wallet if user has none
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
        staleTime: 30000,      // Keep data fresh for 30 seconds before re-fetching
        gcTime: 300000,       // Cache data in background memory for 5 minutes
        refetchOnWindowFocus: false, // Prevent lag bursts when swapping between browser windows
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
