import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import {
  rainbowWallet,
  base,
  metaMaskWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { http, fallback } from 'wagmi'
import { arcTestnet, arcMainnet, ARC_TESTNET_RPC_URLS, ARC_MAINNET_RPC_URLS, ACTIVE_NETWORK } from '@/lib/arc-config'
import { sepolia, baseSepolia, avalancheFuji } from 'viem/chains'

const defaultChains = ACTIVE_NETWORK === 'mainnet'
  ? ([arcMainnet, arcTestnet, sepolia, baseSepolia, avalancheFuji] as const)
  : ([arcTestnet, arcMainnet, sepolia, baseSepolia, avalancheFuji] as const);

export const wagmiConfig = getDefaultConfig({
  appName: 'Syn DAO',
  // Free WalletConnect Project ID for mobile wallet QR support
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '4d95e30a7e3788a66e1c27b26698f0ff',
  chains: defaultChains,
  wallets: [
    {
      groupName: 'Popular',
      wallets: [
        rainbowWallet,
        base,
        metaMaskWallet,
        walletConnectWallet,
      ],
    },
  ],
  transports: {
    [arcTestnet.id]: fallback(
      ARC_TESTNET_RPC_URLS.map(url =>
        http(url, {
          timeout: 10000,
          retryCount: 3,
          retryDelay: 1000,
        })
      ),
      {
        retryCount: 3,
        retryDelay: 1000,
      }
    ),
    [arcMainnet.id]: fallback(
      ARC_MAINNET_RPC_URLS.map(url =>
        http(url, {
          timeout: 10000,
          retryCount: 3,
          retryDelay: 1000,
        })
      ),
      {
        retryCount: 3,
        retryDelay: 1000,
      }
    ),
    [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com"),
    [baseSepolia.id]: http("https://sepolia.base.org"),
    [avalancheFuji.id]: http("https://api.avax-test.network/ext/bc/C/rpc"),
  },
  ssr: true,
})


