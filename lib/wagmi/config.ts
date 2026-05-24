import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { arcTestnet } from '@/lib/chains/arc';
import { getArcRpcUrl, getArcRpcFallback } from '@/lib/rpc/config';

/**
 * WAGMI Configuration for Arc Testnet
 * 
 * This config sets up WAGMI with:
 * - Arc Testnet as the primary chain
 * - Personalized Arc RPC endpoint (from ARC CLI) with public fallback
 * - SSR-safe hydration for Next.js App Router
 * 
 * The primary RPC is determined by NEXT_PUBLIC_ARC_RPC_URL environment variable.
 * If not set, the public Arc testnet RPC is used as fallback.
 */
export const config = createConfig({
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(getArcRpcUrl(), {
      // Fallback to public RPC if primary fails
      retryCount: 3,
      retryDelay: 100,
    }),
  },
  ssr: true, // Hydration-safe for Next.js App Router
});
