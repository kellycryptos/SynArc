import { defineChain } from 'viem'
import { sepolia, baseSepolia, avalancheFuji } from 'viem/chains'

// Primary: Custom Canteen RPC (June 2026 Recommended Setup)
// Fallbacks: official public, Alchemy, QuickNode, and dRPC endpoints
export const ARC_RPC_URLS = [
  process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network', // primary (public fallback)
  'https://rpc.testnet.arc.network',
  'https://arc-testnet.g.alchemy.com/v2/okKqIdABiZt8WuR2aDvev',
  'https://arc-testnet.drpc.org',
].filter(Boolean) as string[]


export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: ARC_RPC_URLS },
    public: { http: ARC_RPC_URLS }
  },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
})

export const ARC_CHAIN = arcTestnet;

export const ARC_GAS = {
  propose: 500000n,
  vote: 300000n,
  deposit: 200000n,
  approve: 100000n,
  faucet: 100000n,
  gasPrice: 10000000n,
} as const

export const CONTRACTS = {
  get governor() { return (process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS || '0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e') as `0x${string}` },

  // ── Two-Treasury Architecture ─────────────────────────────────────────────
  // Primary / Governance Treasury — timelocked, community-visible, source of truth
  // for balances, dashboard, and all user-facing displays.
  get treasuryGovernance() { return (process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '0xFE0F6bF45D363d34CD5fC1781594a7471736dC18') as `0x${string}` },

  // Agent Operating Treasury — used exclusively by the autonomous treasury agent
  // for instant CCTP rebalances. NOT shown directly to end users.
  get treasuryAgent() { return (process.env.NEXT_PUBLIC_TREASURY_AGENT_ADDRESS || '0xE6bAC65d7f060B805B8dd6f1c4DBfa6571905f28') as `0x${string}` },

  // Legacy alias — kept for gradual migration; resolves to governance treasury.
  get treasury() { return this.treasuryGovernance },

  get token() { return (process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e') as `0x${string}` },
  get eurc() { return (process.env.NEXT_PUBLIC_EURC_CONTRACT_ADDRESS || '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a') as `0x${string}` },
}

export const EVM_BRIDGE_CHAINS: Record<number, any> = {
  11155111: sepolia,
  84532: baseSepolia,
  43113: avalancheFuji,
  5042002: ARC_CHAIN
} as const
