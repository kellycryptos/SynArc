import { defineChain } from 'viem'

const RPC_URLS = [
  'https://arc-testnet.g.alchemy.com/v2/okKqIdABiZt8WuR2aDvev', // Alchemy — primary
  process.env.NEXT_PUBLIC_ARC_RPC_URL,                          // Optional env override
  'https://rpc.testnet.arc.network',                             // Public fallback 1
  'https://arc-testnet.drpc.org',                                // Public fallback 2
].filter(Boolean) as string[]

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
  return 'https://rpc.testnet.arc.network' // Last resort
}

export const arcTestnetChain = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: RPC_URLS },
    public: { http: RPC_URLS },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' }
  }
})
