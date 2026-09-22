import { ARC_TESTNET_RPC_URLS, arcTestnet } from '@/lib/arc-config';

const RPC_URLS = ARC_TESTNET_RPC_URLS;
const CANTEEN_RPC = RPC_URLS[0] || 'https://rpc.testnet.arc.io';

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
  return CANTEEN_RPC // Last resort
}

export const arcTestnetChain = arcTestnet;
