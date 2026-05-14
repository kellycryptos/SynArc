import { NetworkConfig } from "@/types";

export const arcTestnet: NetworkConfig = {
  chainId: 5042002,
  name: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  currencySymbol: "USDC",
  blockExplorer: "https://testnet.arcscan.app",
};

export const networks: NetworkConfig[] = [arcTestnet];
