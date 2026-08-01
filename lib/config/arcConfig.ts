/**
 * Arc Governance Configuration
 * 
 * Central configuration for Arc Testnet & Mainnet interaction.
 * This file documents the Arc-native multi-network infrastructure setup.
 */

import { ARC_RPC_URL } from "@/lib/arc/config";

export const ARC_CONFIG = {
  // Active Network indicator ('testnet' | 'mainnet')
  network: process.env.NEXT_PUBLIC_ARC_NETWORK || 'testnet',

  // Arc Testnet Chain Information
  chain: {
    id: 5042002,
    name: 'Arc Testnet',
    currency: 'USDC',
    decimals: 18,
    blockExplorer: 'https://testnet.arcscan.app',
  },

  // Arc Mainnet Chain Information Placeholder (Expected ~5042 — update when official Public Mainnet opens)
  mainnetChain: {
    id: 5042,
    name: 'Arc Mainnet',
    currency: 'USDC',
    decimals: 18,
    blockExplorer: 'https://arcscan.app',
  },
  
  // RPC Configuration
  rpc: {
    // Personalized RPC endpoint (from ARC CLI: arc-canteen rpc-url)
    // Set NEXT_PUBLIC_ARC_RPC_URL in .env.local
    primary: process.env.NEXT_PUBLIC_ARC_RPC_URL,
    // Fallback — uses the same centralized URL, no public fallback
    fallback: ARC_RPC_URL,
    // Mainnet RPC endpoint
    mainnet: process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL || 'https://rpc.arc.network',
    // Health check timeout (ms)
    healthCheckTimeout: 5000,
    // Health check interval (ms)
    healthCheckInterval: 30000,
  },
  
  // Authentication Configuration
  auth: {
    // Privy App ID for authentication
    privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    // Supported login methods
    loginMethods: ['email', 'google', 'twitter', 'discord', 'wallet'],
    // Embedded wallet auto-creation
    embeddedWallet: true,
  },
  
  // Governance Configuration
  governance: {
    // Default voting duration (seconds)
    votingDuration: 259200, // 3 days
    // Minimum quorum threshold (percentage)
    quorumThreshold: 20,
    // Minimum proposal threshold (USDC)
    proposalThreshold: 1000,
    // Execution delay (seconds)
    executionDelay: 86400, // 1 day
  },
  
  // Arc Ecosystem Context
  ecosystem: {
    // Arc Network as stablecoin-native blockchain
    architecture: 'stablecoin-native',
    // Programmable governance through smart contracts
    governance: 'programmable-smart-contracts',
    // Agentic economy coordination
    economy: 'agentic-coordination',
    // Cross-chain interoperability
    interop: 'cross-chain-capable',
  },
} as const;

// Export types for TypeScript
export type ArcConfig = typeof ARC_CONFIG;

