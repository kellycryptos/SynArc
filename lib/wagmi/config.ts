import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { arcTestnet } from '@/lib/chains/arc';

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.testnet.arc.network";

export const config = createConfig({
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(rpcUrl),
  },
  ssr: true, // Hydration-safe for Next.js App Router
});
