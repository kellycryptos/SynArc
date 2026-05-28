import { NetworkConfig } from "@/types";
import { ARC_RPC_URL } from "@/lib/arc/config";

export const arcTestnet: NetworkConfig = {
  chainId: 5042002,
  name: "Arc Testnet",
  rpcUrl: ARC_RPC_URL,
  currencySymbol: "USDC",
  blockExplorer: "https://testnet.arcscan.app",
};

export const networks: NetworkConfig[] = [arcTestnet];
