import { defineChain } from "viem";

export const arcTestnet = defineChain({
  id: 216,
  name: "Arc Testnet",
  nativeCurrency: { name: "Arc", symbol: "ARC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.arc.network"] },
  },
  blockExplorers: {
    default: { name: "Arc Explorer", url: "https://testnet.arc.network" },
  },
});
