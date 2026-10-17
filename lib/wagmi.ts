import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import {
  rainbowWallet,
  base,
  metaMaskWallet,
  okxWallet,
  rabbyWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { http, fallback } from 'wagmi'
import { arcTestnet, arcMainnet, ARC_TESTNET_RPC_URLS, ARC_MAINNET_RPC_URLS, ACTIVE_NETWORK, getTestnetProxyUrl, getMainnetProxyUrl, CANTEEN_TESTNET_RPC } from '@/lib/arc-config'
import { sepolia, baseSepolia, avalancheFuji, mainnet, base as baseChain, avalanche } from 'viem/chains'

// Documented public fallback constant for Arc Testnet
export const ARC_TESTNET_FALLBACK_RPC = 'https://rpc.testnet.arc.io';

// Default network on any fresh page load with no wallet connected is always mainnet first
const defaultChains = [arcMainnet, arcTestnet, mainnet, baseChain, avalanche, sepolia, baseSepolia, avalancheFuji] as const;

export const wagmiConfig = getDefaultConfig({
  appName: 'Syn DAO',
  // Free WalletConnect Project ID for mobile wallet QR support
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '4d95e30a7e3788a66e1c27b26698f0ff',
  chains: defaultChains,
  ssr: true,
  wallets: [
    {
      groupName: 'Popular',
      wallets: [
        okxWallet,
        rabbyWallet,
        metaMaskWallet,
        rainbowWallet,
        base,
        walletConnectWallet,
      ],
    },
  ],
  transports: {
    // Arc Testnet: same-origin proxy first (fast & immune to adblockers/CORS) → direct official Arc Testnet RPC
    [arcTestnet.id]: fallback(
      [
        http(getTestnetProxyUrl(), {
          timeout: 6000,
          retryCount: 2,
          retryDelay: 300,
          fetchOptions: {
            headers: {
              'x-synarc-source': 'app-client',
            },
          },
        }),
        http('https://rpc.testnet.arc.io', {
          timeout: 6000,
          retryCount: 1,
          retryDelay: 300,
        }),
      ],
      {
        retryCount: 2,
        retryDelay: 300,
        rank: false,
      }
    ),
    // Arc Mainnet: same-origin proxy first (immune to browser adblockers) → direct official Arc RPC fallback
    [arcMainnet.id]: fallback(
      [
        http(getMainnetProxyUrl(), {
          timeout: 8000,
          retryCount: 2,
          retryDelay: 500,
          fetchOptions: {
            headers: {
              'x-synarc-source': 'app-client',
            },
          },
        }),
        http('https://rpc.mainnet.arc.io', {
          timeout: 8000,
          retryCount: 1,
          retryDelay: 500,
        }),
      ],
      {
        retryCount: 2,
        retryDelay: 500,
        rank: false,
      }
    ),
    [mainnet.id]: fallback([
      http("https://ethereum-rpc.publicnode.com"),
      http("https://eth.drpc.org"),
      http("https://1rpc.io/eth"),
    ]),
    [baseChain.id]: fallback([
      http("https://mainnet.base.org"),
      http("https://base-rpc.publicnode.com"),
      http("https://base.gateway.tenderly.co"),
      http("https://1rpc.io/base"),
    ]),
    [avalanche.id]: fallback([
      http("https://api.avax.network/ext/bc/C/rpc"),
      http("https://avalanche-c-chain-rpc.publicnode.com"),
      http("https://1rpc.io/avax/c"),
    ]),
    [sepolia.id]: fallback([
      http("https://ethereum-sepolia-rpc.publicnode.com"),
      http("https://sepolia.drpc.org"),
      http("https://1rpc.io/sepolia"),
    ]),
    [baseSepolia.id]: fallback([
      http("https://base-sepolia.drpc.org"),
      http("https://sepolia.base.org"),
      http("https://base-sepolia-rpc.publicnode.com"),
    ]),
    [avalancheFuji.id]: fallback([
      http("https://api.avax-test.network/ext/bc/C/rpc"),
      http("https://avalanche-fuji-c-chain-rpc.publicnode.com"),
    ]),
  },
})


