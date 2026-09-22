import { createConfig, http, fallback } from 'wagmi'
import { injected, metaMask } from 'wagmi/connectors'
import { arcTestnet, arcMainnet, ARC_TESTNET_RPC_URLS, ARC_MAINNET_RPC_URLS, ACTIVE_NETWORK } from '@/lib/arc-config'
import { sepolia, baseSepolia, avalancheFuji } from 'viem/chains'

const defaultChains = ACTIVE_NETWORK === 'mainnet'
  ? ([arcMainnet, arcTestnet, sepolia, baseSepolia, avalancheFuji] as const)
  : ([arcTestnet, arcMainnet, sepolia, baseSepolia, avalancheFuji] as const);

export const wagmiConfig = createConfig({
  // Default chain follows ACTIVE_NETWORK while keeping both 5042 and 5042002 supported
  chains: defaultChains,
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
  connectors: [
    injected(),
    metaMask(),
  ]
})


