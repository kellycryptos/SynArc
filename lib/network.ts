import { NetworkConfig } from "@/types";
import { ARC_RPC_URL } from "@/lib/arc/config";

export const arcTestnet: NetworkConfig = {
  chainId: 5042002,
  name: "Arc Testnet",
  rpcUrl: ARC_RPC_URL,
  currencySymbol: "USDC",
  blockExplorer: "https://testnet.arcscan.app",
};

// Arc Mainnet Placeholder Chain ID (Expected ~5042 — update when official Public Mainnet opens)
export const arcMainnet: NetworkConfig = {
  chainId: 5042,
  name: "Arc Mainnet",
  rpcUrl: process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL || "https://rpc.arc.network",
  currencySymbol: "USDC",
  blockExplorer: "https://arcscan.app",
};

export const networks: NetworkConfig[] = [arcTestnet, arcMainnet];

