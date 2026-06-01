import { defineChain } from 'viem'
import { sepolia, baseSepolia, avalancheFuji } from 'viem/chains'

// Primary: Custom Canteen RPC (June 2026 Recommended Setup)
// Fallbacks: official public, Alchemy, QuickNode, and dRPC endpoints
export const ARC_RPC_URLS = [
  process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc-node.thecanteenapp.com/v1/swrm_104d24688adcae992878acabfd41b2ed5800817b20d57aa9b17a64d225c0bf8f', // Canteen Primary
  'https://rpc.testnet.arc.network',                              // Official public Arc RPC
  'https://arc-testnet.g.alchemy.com/v2/okKqIdABiZt8WuR2aDvev', // Alchemy Fallback
  'https://rpc.quicknode.testnet.arc.network',                    // QuickNode Fallback
  'https://arc-testnet.drpc.org',                                 // dRPC Fallback
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
  governor: process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS as `0x${string}`,
  treasury: process.env.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}`,
  token: process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`,
  eurc: process.env.NEXT_PUBLIC_EURC_CONTRACT_ADDRESS as `0x${string}`,
} as const

export const EVM_BRIDGE_CHAINS: Record<number, any> = {
  11155111: sepolia,
  84532: baseSepolia,
  43113: avalancheFuji,
  5042002: ARC_CHAIN
} as const
