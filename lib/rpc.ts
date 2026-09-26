import { ARC_TESTNET_RPC_URLS, ARC_MAINNET_RPC_URLS, ACTIVE_NETWORK, arcTestnet, arcMainnet } from '@/lib/arc-config';

// Active-network RPC list — Canteen is slot 0 (primary), Arc official is last fallback
const RPC_URLS = ACTIVE_NETWORK === 'mainnet' ? ARC_MAINNET_RPC_URLS : ARC_TESTNET_RPC_URLS;
// Canteen node — always the first entry in the priority array
const CANTEEN_RPC = RPC_URLS[0] || 'https://rpc.testnet.arc.network';

export const getWorkingRPC = async (): Promise<string> => {
  for (const url of RPC_URLS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        }),
        signal: AbortSignal.timeout(3000) // 3 second timeout
      })
      const data = await res.json()
      if (data.result) return url // This RPC is working
    } catch {
      continue // Try next
    }
  }
  return CANTEEN_RPC // Last resort — should always be Canteen
}

export const arcTestnetChain = arcTestnet;
export const arcMainnetChain = arcMainnet;
