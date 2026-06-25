import { createConfig, http, fallback } from 'wagmi'
import { injected, metaMask } from 'wagmi/connectors'
import { ARC_CHAIN, ARC_RPC_URLS } from '@/lib/arc-config'
import { sepolia, baseSepolia, avalancheFuji } from 'viem/chains'

export const wagmiConfig = createConfig({
  chains: [ARC_CHAIN, sepolia, baseSepolia, avalancheFuji],
  transports: {
    [ARC_CHAIN.id]: fallback(
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
    [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com"),
    [baseSepolia.id]: http("https://sepolia.base.org"),
    [avalancheFuji.id]: http("https://api.avax-test.network/ext/bc/C/rpc"),
  },
  connectors: [
    injected(),
    metaMask(),
  ]
})

