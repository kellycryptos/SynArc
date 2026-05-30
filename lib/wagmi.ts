import { createConfig } from '@privy-io/wagmi'
import { http, fallback } from 'wagmi'
import { injected, metaMask } from 'wagmi/connectors'
import { ARC_CHAIN, ARC_RPC_URLS } from './arc-config'
import { sepolia, baseSepolia, avalancheFuji } from 'viem/chains'

export const wagmiConfig = createConfig({
  chains: [ARC_CHAIN, sepolia, baseSepolia, avalancheFuji],
  transports: {
    [ARC_CHAIN.id]: fallback(
      ARC_RPC_URLS.map(url => http(url)),
      { rank: true }
    ),
    [sepolia.id]: fallback([
      http('https://rpc.ankr.com/eth_sepolia'),
      http('https://ethereum-sepolia-rpc.publicnode.com'),
    ], { rank: true }),
    [baseSepolia.id]: fallback([
      http('https://sepolia.base.org'),
      http('https://base-sepolia-rpc.publicnode.com'),
    ], { rank: true }),
    [avalancheFuji.id]: fallback([
      http('https://api.avax-test.network/ext/bc/C/rpc'),
      http('https://avalanche-fuji-c-chain-rpc.publicnode.com'),
    ], { rank: true }),
  },
  connectors: [
    injected(),
    metaMask(),
  ],
  ssr: true,
})
