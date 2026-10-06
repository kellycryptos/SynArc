import { NetworkConfig } from "@/types";
import { ARC_RPC_URL } from "@/lib/arc/config";
import { getMainnetProxyUrl } from "@/lib/arc-config";

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
  get rpcUrl() { return getMainnetProxyUrl(); },
  currencySymbol: "USDC",
  blockExplorer: "https://explorer.arc.io",
};

export const networks: NetworkConfig[] = [arcTestnet, arcMainnet];

