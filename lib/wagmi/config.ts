import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { fallback } from 'viem';
import { arcTestnet } from '@/lib/chains/arc';

const transports = [
  http('https://rpc.testnet.arc.network'),                       // Core public operational node
  http('https://arc-testnet.drpc.org'),                          // Highly responsive drpc backup node
];

if (process.env.NEXT_PUBLIC_ALCHEMY_ARC_URL) {
  transports.push(http(process.env.NEXT_PUBLIC_ALCHEMY_ARC_URL)); // Alchemy backup slot
}

export const config = createConfig({
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: fallback(transports, { rank: true }),
  },
  ssr: true, // Hydration-safe for Next.js App Router
});

