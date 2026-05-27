import { createConfig } from '@privy-io/wagmi';
import { http, fallback } from 'wagmi';
import { arcTestnet } from '@/lib/chains/arc';
import { RPC_URLS, ARC_TESTNET_RPC } from '@/lib/rpc/config';

/**
 * WAGMI Configuration for Arc Testnet
 *
 * Uses viem's fallback() transport so that if the primary Canteen RPC
 * (NEXT_PUBLIC_ARC_RPC_URL) fails, wagmi automatically retries the next
 * URL in the chain — no user-visible error.
 *
 * Priority order:
 *   1. Canteen personalized RPC (NEXT_PUBLIC_ARC_RPC_URL)  ← fastest, preferred
 *   2. https://rpc.testnet.arc.network                      ← official public
 *   3. https://arc-testnet.drpc.org                         ← dRPC mirror
 *   4. https://5042002.rpc.thirdweb.com                     ← thirdweb mirror
 */
const rpcTransports = RPC_URLS.length > 0
  ? RPC_URLS.map(url => http(url, { retryCount: 1, retryDelay: 150 }))
  : [http(ARC_TESTNET_RPC, { retryCount: 2, retryDelay: 150 })];

export const config = createConfig({
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: fallback(rpcTransports, { rank: false }),
  },
  ssr: true, // Hydration-safe for Next.js App Router
});

