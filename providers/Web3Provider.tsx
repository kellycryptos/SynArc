"use client";

import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { arcTestnet } from '@/lib/chains/arc';

const queryClient = new QueryClient();

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default_project_id';

const metadata = {
  name: 'SynArc',
  description: 'Confidential Governance Infrastructure for the Agentic Economy',
  url: 'https://synarc-dao.vercel.app/', 
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [arcTestnet] as const;
const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
  enableOnramp: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#8b5cf6',
    '--w3m-color-mix-strength': 20,
    '--w3m-accent': '#7c3aed',
  }
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
