import { defineChain } from 'viem'
import { sepolia, baseSepolia, avalancheFuji, mainnet, base, avalanche } from 'viem/chains'

// Documented public fallback constant for Arc Testnet
export const ARC_TESTNET_FALLBACK_RPC = 'https://rpc.testnet.arc.network';

/**
 * Resolves the proxy URL safely across both browser and server (SSR/Node) contexts.
 * In the browser, returns '/api/rpc/testnet'.
 * In Node.js/SSR, returns the absolute URL to prevent 'Failed to parse URL' errors.
 */
export function getTestnetProxyUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api/rpc/testnet';
  }
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  if (!/^https?:\/\//i.test(siteUrl)) {
    siteUrl = `https://${siteUrl}`;
  }
  return `${siteUrl.replace(/\/$/, '')}/api/rpc/testnet`;
}

// Arc Testnet list (chain 5042002) - uses same-origin proxy with public fallback
export const ARC_TESTNET_RPC_URLS = [
  getTestnetProxyUrl(),
  ARC_TESTNET_FALLBACK_RPC,
  'https://rpc.testnet.arc.io',
];

// Arc Mainnet list (chain 5042)
// Priority: Official Arc Mainnet RPC (https://rpc.mainnet.arc.io) → Official Fallbacks → Alchemy
export const ARC_MAINNET_RPC_URLS = Array.from(new Set([
  process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL,
  'https://rpc.mainnet.arc.io',
  'https://rpc.arc.network',
  'https://rpc.mainnet.arc.network',
  process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_RPC,
  process.env.NEXT_PUBLIC_CANTEEN_MAINNET_RPC,
].filter(Boolean) as string[]))

// Default network on any fresh page load with no wallet connected is always mainnet
export const ACTIVE_NETWORK: 'mainnet' | 'testnet' = 'mainnet';

let _activeNetworkState: 'mainnet' | 'testnet' = 'mainnet';

export function getActiveNetwork(): 'mainnet' | 'testnet' {
  return _activeNetworkState;
}

export function setActiveNetwork(net: 'mainnet' | 'testnet') {
  _activeNetworkState = net;
}

// Active-network RPC array (respects active network: mainnet or testnet)
export const ARC_RPC_URLS = new Proxy([] as typeof ARC_MAINNET_RPC_URLS, {
  get(_target, prop) {
    const urls = getActiveNetwork() === 'mainnet' ? ARC_MAINNET_RPC_URLS : ARC_TESTNET_RPC_URLS;
    return (urls as any)[prop];
  }
});

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: [getTestnetProxyUrl(), ARC_TESTNET_FALLBACK_RPC] },
    public: { http: [ARC_TESTNET_FALLBACK_RPC] }
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

export const ARC_CHAIN = new Proxy({} as typeof arcMainnet, {
  get(_target, prop) {
    const chain = getActiveNetwork() === 'mainnet' ? arcMainnet : arcTestnet;
    return (chain as any)[prop];
  }
});

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

// Arc Mainnet — falls back to deployed addresses when mainnet-specific overrides are unset
export const CONTRACTS_MAINNET = {
  get governor() { return (process.env.NEXT_PUBLIC_MAINNET_GOVERNOR_ADDRESS || process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS || '0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e') as `0x${string}` },
  get treasuryGovernance() { return (process.env.NEXT_PUBLIC_MAINNET_TREASURY_ADDRESS || process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '0xFE0F6bF45D363d34CD5fC1781594a7471736dC18') as `0x${string}` },
  get treasuryAgent() { return (process.env.NEXT_PUBLIC_MAINNET_TREASURY_AGENT_ADDRESS || process.env.NEXT_PUBLIC_TREASURY_AGENT_ADDRESS || '0xE6bAC65d7f060B805B8dd6f1c4DBfa6571905f28') as `0x${string}` },
  get treasury() { return this.treasuryGovernance },
  get token() { return (process.env.NEXT_PUBLIC_MAINNET_TOKEN_ADDRESS || process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e') as `0x${string}` },
  get eurc() { return (process.env.NEXT_PUBLIC_MAINNET_EURC_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_EURC_CONTRACT_ADDRESS || '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a') as `0x${string}` },
  get tokenMessenger() { return (process.env.NEXT_PUBLIC_MAINNET_TOKEN_MESSENGER_ADDRESS || process.env.NEXT_PUBLIC_TOKEN_MESSENGER_ADDRESS || '0xd0C3da4E20F0D24dB1cE8f1fF36814Ea8F60309e') as `0x${string}` },
  get crowdfund() { return (process.env.NEXT_PUBLIC_MAINNET_CROWDFUND_ADDRESS || process.env.NEXT_PUBLIC_CROWDFUND_ADDRESS || '0xd5374DFC4B01F60115A52Df027704062506b3030') as `0x${string}` },
}

export const CONTRACTS = new Proxy({} as typeof CONTRACTS_MAINNET, {
  get(_target, prop) {
    const contracts = getActiveNetwork() === 'mainnet' ? CONTRACTS_MAINNET : CONTRACTS_TESTNET;
    return (contracts as any)[prop];
  }
});

export const IS_MAINNET = true;

export function getIsMainnet(): boolean {
  return getActiveNetwork() === 'mainnet';
}

export const CIRCLE_IRIS_API_URL = IS_MAINNET
  ? 'https://iris-api.circle.com/v1/attestations'
  : 'https://iris-api-sandbox.circle.com/v1/attestations';

export const CIRCLE_ETH_CONFIG = IS_MAINNET
  ? {
      name: 'Ethereum',
      domain: 0,
      tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d' as `0x${string}`,
      messageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722a4c464B64' as `0x${string}`,
      usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
      explorer: 'https://etherscan.io',
      transmitterUrl: 'https://etherscan.io/address/0x81D40F21F12A8F0E3252Bccb954D722a4c464B64',
    }
  : {
      name: 'Ethereum Sepolia',
      domain: 0,
      tokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA' as `0x${string}`,
      messageTransmitter: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275' as `0x${string}`,
      usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}`,
      explorer: 'https://sepolia.etherscan.io',
      transmitterUrl: 'https://sepolia.etherscan.io/address/0xe737e5cebeeba77efe34d4aa090756590b1ce275',
    };

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

