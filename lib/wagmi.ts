import { createConfig, http, fallback } from 'wagmi'
import { injected, metaMask } from 'wagmi/connectors'
import { arcTestnet, arcMainnet, ARC_RPC_URLS, ARC_MAINNET_RPC_URLS } from '@/lib/arc-config'
import { sepolia, baseSepolia, avalancheFuji } from 'viem/chains'

export const wagmiConfig = createConfig({
  // arcTestnet MUST remain the first chain in the list to maintain default chain priority
  chains: [arcTestnet, arcMainnet, sepolia, baseSepolia, avalancheFuji],
  transports: {
    [arcTestnet.id]: fallback(
      ARC_RPC_URLS.map(url =>
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


