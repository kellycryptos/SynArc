"use client";

import { ReactNode, useState } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { arcTestnet } from '@/lib/arc-config';
import { wagmiConfig } from '@/lib/wagmi';

export { arcTestnet };

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  }));

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clt57262n00ldmp0fhz113qep"; 

  return (
    <PrivyProvider
      appId={appId}
      config={{
        defaultChain: arcTestnet,
        supportedChains: [arcTestnet],
        appearance: {
          theme: 'dark',
          accentColor: '#7C3AED',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          showWalletUIs: false,
          ethereum: {
            createOnLogin: 'users-without-wallets',
            showWalletUIs: false,
            waitForUserConfirmation: 'never',
          },
          waitForUserConfirmation: 'never',
        } as any
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
