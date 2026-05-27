import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { fallback } from 'viem';
import { arcTestnet } from '@/lib/chains/arc';

export const config = createConfig({
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: fallback([
      http('https://rpc.testnet.arc.network'), // Public infrastructure node used by mobile wallets
      http('https://arc-testnet.drpc.org'),    // High-performance backup cluster
    ], { rank: true, retryCount: 3, retryDelay: 500 }),
  },
  ssr: true, // Hydration-safe for Next.js App Router
});

