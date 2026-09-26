"use client";

import { ReactNode, useState, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { ConnectKitProvider } from 'connectkit';
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
        <ConnectKitProvider
          theme="auto"
          mode="dark"
          customTheme={{
            "--ck-font-family": "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            "--ck-border-radius": "14px",
            "--ck-background": "#0B111C",
            "--ck-body-background": "#0B111C",
            "--ck-body-background-secondary": "#05080F",
            "--ck-body-background-tertiary": "#0F1620",
            "--ck-body-color": "#F5F7FA",
            "--ck-body-color-muted": "#9CA6B8",
            "--ck-body-color-muted-hover": "#FFFFFF",
            "--ck-primary-button-background": "linear-gradient(90deg, #2F6FFF, #22D3EE)",
            "--ck-primary-button-color": "#04101C",
            "--ck-primary-button-hover-background": "linear-gradient(90deg, #3B79FF, #38BDF8)",
            "--ck-secondary-button-background": "#0F1620",
            "--ck-secondary-button-hover-background": "#1B2536",
            "--ck-secondary-button-color": "#F5F7FA",
            "--ck-secondary-button-border": "1px solid #1B2536",
            "--ck-modal-box-shadow": "0 0 50px rgba(47, 111, 255, 0.2), 0 20px 25px -5px rgba(0, 0, 0, 0.8)",
            "--ck-body-divider": "#151C29",
            "--ck-focus-color": "#22D3EE",
            "--ck-accent-color": "#22D3EE",
            "--ck-accent-text-color": "#04101C",
            "--ck-tooltip-background": "#0F1620",
            "--ck-tooltip-color": "#F5F7FA",
            "--ck-qr-border-color": "#1B2536",
            "--ck-qr-background": "#FFFFFF",
            "--ck-overlay-background": "rgba(5, 8, 15, 0.85)",
            "--ck-overlay-backdrop-filter": "blur(8px)",
          }}
          options={{
            embedGoogleFonts: false,
            walletConnectName: 'WalletConnect',
            disclaimer: (
              <span className="text-[11px] text-[#6B7385] leading-relaxed">
                Wallet required for Arc governance. By connecting, you agree to our{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#22D3EE] hover:underline">Terms</a>.
              </span>
            ),
          }}
        >
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: '#2F6FFF',
              accentColorForeground: 'white',
              borderRadius: 'medium',
              fontStack: 'system',
              overlayBlur: 'small',
            })}
            initialChain={ARC_CHAIN}
          >
            {children}
          </RainbowKitProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

