"use client";

import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi/config';
import { privyConfig } from '@/lib/privy/config';
import { ReactNode, useState, useEffect } from 'react';
import { initializeResilientRpc } from '@/lib/rpc/config';
import { arcTestnet } from '@/lib/chains/arc';

/**
 * PrivyProviderWrapper Component
 * 
 * Sets up the complete Web3 provider stack:
 * - Privy: Authentication and embedded wallets
 * - WAGMI: Blockchain interaction and contract calls
 * - React Query: Data fetching and caching
 * 
 * Configuration:
 * - NEXT_PUBLIC_PRIVY_APP_ID: Required for Privy initialization
 * - NEXT_PUBLIC_ARC_RPC_URL: Optional personalized Arc RPC endpoint
 * 
 * Providers are initialized once and memoized to prevent re-initialization on re-renders,
 * ensuring stable Web3 connection state and optimal performance.
 */
export function PrivyProviderWrapper({ children }: { children: ReactNode }) {
  // Prevent QueryClient from re-initializing on each render
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

  // Fetch the Privy App ID from environment, with a standard development fallback for robustness
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clt57262n00ldmp0fhz113qep"; 

  if (!appId) {
    console.warn('NEXT_PUBLIC_PRIVY_APP_ID is not configured. Privy authentication may not work.');
  }

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
