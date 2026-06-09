"use client";

import { ReactNode, useState, useEffect } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { arcTestnet } from '@/lib/arc-config';
import { wagmiConfig } from '@/lib/wagmi';
import { initializeResilientRpc } from '@/lib/rpc/config';
import { privyConfig } from '@/lib/privy/config';

export { arcTestnet };

export function Web3Provider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initializeResilientRpc(arcTestnet);
  }, []);

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // 60s staleTime: data is considered fresh for 60s, no redundant re-fetches
        staleTime: 60_000,
        // 10 min cache so navigating back doesn't re-fetch
        gcTime: 600_000,
        refetchOnWindowFocus: false,
        // Retry twice with 1-second delay before surfacing errors
        retry: 2,
        retryDelay: 1000,
      },
    },
  }));

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clt57262n00ldmp0fhz113qep"; 

  return (
    <PrivyProvider
      appId={appId}
      config={{
        // Spread shared privyConfig first — includes loginMethods, stable defaultChain/supportedChains
        ...privyConfig,
        // Merge appearance so showWalletLoginFirst: false is preserved from privyConfig
        appearance: {
          ...privyConfig.appearance,
          theme: 'dark',
          accentColor: '#7C3AED',
          showWalletLoginFirst: false,
        },
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

