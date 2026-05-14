import { defineChain } from "viem";

/**
 * Arc Testnet – custom chain definition for Wagmi / Viem
 * https://rpc.testnet.arc.network
 */
export const arcTestnetChain = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    decimals: 6,
    name: "USDC",
    symbol: "USDC",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
    public: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

export const ARC_TESTNET_CHAIN_ID = 5042002 as const;
