"use client";

import { ReactNode } from 'react';
import { PrivyProviderWrapper } from '@/components/providers/PrivyProviderWrapper';

/**
 * Web3Provider Component
 * 
 * Wraps the entire application with Web3 infrastructure:
 * - Privy authentication and embedded wallets
 * - WAGMI blockchain interaction
 * - React Query for data fetching
 * 
 * Architecture:
 * 1. Web3Provider (this component)
 *    └─ PrivyProviderWrapper (Privy + WAGMI setup)
 *       └─ Children (your app)
 * 
 * Environment Setup:
 * - NEXT_PUBLIC_PRIVY_APP_ID: Privy app ID for authentication
 * - NEXT_PUBLIC_ARC_RPC_URL: Personalized Arc RPC endpoint (optional, fallback to public RPC)
 * 
 * The RPC configuration automatically:
 * - Prioritizes personalized Arc RPC from ARC CLI (arc-canteen rpc-url)
 * - Falls back to public Arc Testnet RPC if unavailable
 * - Monitors connection health and gracefully degrades
 */
export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <PrivyProviderWrapper>
      {children}
    </PrivyProviderWrapper>
  );
}
