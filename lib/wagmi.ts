import { createConfig, http, fallback } from 'wagmi'
import { injected, metaMask } from 'wagmi/connectors'
import { ARC_CHAIN } from './arc-config'

export const wagmiConfig = createConfig({
  chains: [ARC_CHAIN],
  transports: {
    [ARC_CHAIN.id]: fallback([
      http(process.env.NEXT_PUBLIC_ARC_RPC_URL || ''),
      http('https://rpc.testnet.arc.network'),
      http('https://arc-testnet.drpc.org'),
      http('https://5042002.rpc.thirdweb.com'),
    ])
  },
  connectors: [
    injected(),
    metaMask(),
  ]
})
