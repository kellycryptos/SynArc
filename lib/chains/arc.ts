import { defineChain, fallback, http } from "viem";
import { getArcRpcUrls } from "@/lib/rpc/config";

export const rpcConfig = fallback([
  http(process.env.NEXT_PUBLIC_ALCHEMY_ARC_URL),
  http('https://testnet.arcscan.app/rpc'), // Public fallback node
])

/**
 * Arc Testnet Chain Configuration
 * 
 * This chain is configured with personalized RPC endpoints from the ARC CLI.
 * - Primary RPC: From NEXT_PUBLIC_ARC_RPC_URL environment variable
 * - Fallback RPC: https://rpc.testnet.arc.network (public Arc testnet)
 * 
 * The Arc Network is a stablecoin-native blockchain supporting programmable governance
 * and agentic economy coordination through smart contracts.
 */
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { 
    name: "USDC", 
    symbol: "USDC", 
    decimals: 18 
  },
  rpcUrls: {
    // Primary RPC endpoint (personalized from ARC CLI) with fallback endpoints in order
    default: { 
      http: getArcRpcUrls()
    },
  },
  blockExplorers: {
    default: { 
      name: "ArcScan", 
      url: "https://testnet.arcscan.app" 
    },
  },
});
