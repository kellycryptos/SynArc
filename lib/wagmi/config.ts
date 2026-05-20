import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { arcTestnet } from '@/lib/chains/arc';

export const config = createConfig({
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http('https://rpc.testnet.arc.network'),
  },
  ssr: true, // Hydration-safe for Next.js App Router
});
