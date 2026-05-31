import { createConfig, http, fallback } from 'wagmi'
import { injected, metaMask } from 'wagmi/connectors'
import { ARC_CHAIN, ARC_RPC_URLS } from '@/lib/arc-config'

export const wagmiConfig = createConfig({
  chains: [ARC_CHAIN],
  transports: {
    [ARC_CHAIN.id]: fallback(
      ARC_RPC_URLS.map(url => http(url))
    )
  },
  connectors: [
    injected(),
    metaMask(),
  ]
})
