"use client";

import { ReactNode, useState, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { arcTestnet, arcMainnet, ARC_CHAIN } from '@/lib/arc-config';
import { wagmiConfig } from '@/lib/wagmi';
import { initializeResilientRpc } from '@/lib/rpc/config';

export { arcTestnet, arcMainnet, ARC_CHAIN };

export function Web3Provider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initializeResilientRpc(ARC_CHAIN);
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

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#2F6FFF',
            accentColorForeground: 'white',
            borderRadius: 'large',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          modalSize="compact"
          initialChain={ARC_CHAIN}
          appInfo={{
            appName: 'Syn DAO',
            learnMoreUrl: 'https://docs.arc.network',
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

