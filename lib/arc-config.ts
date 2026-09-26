import { defineChain } from 'viem'
import { sepolia, baseSepolia, avalancheFuji, mainnet, base, avalanche } from 'viem/chains'

// Arc Testnet list (chain 5042002)
// Priority: Canteen → Alchemy → Arc official
export const ARC_TESTNET_RPC_URLS = [
  process.env.NEXT_PUBLIC_CANTEEN_TESTNET_RPC || process.env.NEXT_PUBLIC_ARC_RPC_URL,
  process.env.NEXT_PUBLIC_ALCHEMY_TESTNET_RPC, // https://arc-testnet.g.alchemy.com/v2/KEY
  'https://rpc.testnet.arc.network',
  'https://rpc.testnet.arc.io',
].filter(Boolean) as string[]

// Backwards-compatible alias for existing imports
export const ARC_RPC_URLS = ARC_TESTNET_RPC_URLS

// Arc Mainnet list (chain 5042)
// Priority: Canteen → Alchemy → Arc official
export const ARC_MAINNET_RPC_URLS = [
  process.env.NEXT_PUBLIC_CANTEEN_MAINNET_RPC,
  process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_RPC, // https://arc-mainnet.g.alchemy.com/v2/KEY
  'https://rpc.mainnet.arc.network',
  'https://rpc.mainnet.arc.io',
].filter(Boolean) as string[]

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ARC_TESTNET_RPC_URLS },
    public: { http: ARC_TESTNET_RPC_URLS }
  },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
})

// Arc Mainnet (Chain ID 5042)
export const arcMainnet = defineChain({
  id: 5042,
  name: 'Arc',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ARC_MAINNET_RPC_URLS },
    public: { http: ARC_MAINNET_RPC_URLS }
  },
  blockExplorers: { default: { name: 'Arc Explorer', url: 'https://explorer.arc.io' } },
})

export const ACTIVE_NETWORK = (process.env.NEXT_PUBLIC_ARC_NETWORK || 'testnet') as 'testnet' | 'mainnet'
export const ARC_CHAIN = ACTIVE_NETWORK === 'mainnet' ? arcMainnet : arcTestnet;

export const ARC_GAS = {
  propose: 600000n,
  vote: 300000n,
  deposit: 300000n,
  approve: 250000n,
  faucet: 150000n,
  gasPrice: 10000000n, // Standard 10 Mwei floor
} as const

export const CONTRACTS_TESTNET = {
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
  get tokenMessenger() { return (process.env.NEXT_PUBLIC_TOKEN_MESSENGER_ADDRESS || '0xd0C3da4E20F0D24dB1cE8f1fF36814Ea8F60309e') as `0x${string}` },
  get crowdfund() { return (process.env.NEXT_PUBLIC_CROWDFUND_ADDRESS || '0xd5374DFC4B01F60115A52Df027704062506b3030') as `0x${string}` },
}

// Arc Mainnet Placeholders — update with deployed contract addresses when Mainnet goes live
export const CONTRACTS_MAINNET = {
  get governor() { return (process.env.NEXT_PUBLIC_MAINNET_GOVERNOR_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}` },
  get treasuryGovernance() { return (process.env.NEXT_PUBLIC_MAINNET_TREASURY_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}` },
  get treasuryAgent() { return (process.env.NEXT_PUBLIC_MAINNET_TREASURY_AGENT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}` },
  get treasury() { return this.treasuryGovernance },
  get token() { return (process.env.NEXT_PUBLIC_MAINNET_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}` },
  get eurc() { return (process.env.NEXT_PUBLIC_MAINNET_EURC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}` },
  get tokenMessenger() { return (process.env.NEXT_PUBLIC_MAINNET_TOKEN_MESSENGER_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}` },
  get crowdfund() { return (process.env.NEXT_PUBLIC_MAINNET_CROWDFUND_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}` },
}

export const CONTRACTS = ACTIVE_NETWORK === 'mainnet' ? CONTRACTS_MAINNET : CONTRACTS_TESTNET

export const CCTP_DOMAINS = {
  testnet: {
    arc: 26,
    sepolia: 0,
    baseSepolia: 6,
    avalancheFuji: 1,
  },
  mainnet: {
    arc: 26,
    ethereum: 0,
    base: 6,
    avalanche: 1,
  }
} as const

export const EVM_BRIDGE_CHAINS: Record<number, any> = {
  1: mainnet,
  8453: base,
  43114: avalanche,
  11155111: sepolia,
  84532: baseSepolia,
  43113: avalancheFuji,
  5042002: arcTestnet,
  5042: arcMainnet
} as const

