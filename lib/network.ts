import { NetworkConfig } from "@/types";
import { ARC_RPC_URL } from "@/lib/arc/config";

export const arcTestnet: NetworkConfig = {
  chainId: 5042002,
  name: "Arc Testnet",
  rpcUrl: ARC_RPC_URL,
  currencySymbol: "USDC",
  blockExplorer: "https://testnet.arcscan.app",
};

// Arc Mainnet (Chain ID 5042)
export const arcMainnet: NetworkConfig = {
  chainId: 5042,
  name: "Arc",
  rpcUrl: process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL || "https://rpc.mainnet.arc.io",
  currencySymbol: "USDC",
  blockExplorer: "https://explorer.arc.io",
};

export const networks: NetworkConfig[] = [arcTestnet, arcMainnet];

