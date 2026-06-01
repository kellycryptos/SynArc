import { defineChain, createPublicClient, http } from "viem";
import { JsonRpcProvider } from "ethers";

const CANTEEN_RPC = "https://rpc.testnet.arc-node.thecanteenapp.com/v1/swrm_104d24688adcae992878acabfd41b2ed5800817b20d57aa9b17a64d225c0bf8f";
const PUBLIC_ARC_RPC = "https://rpc.testnet.arc.network";
const ALCHEMY_ARC_RPC = "https://arc-testnet.g.alchemy.com/v2/okKqIdABiZt8WuR2aDvev";
const QUICKNODE_ARC_RPC = "https://rpc.quicknode.testnet.arc.network";
const DRPC_ARC_RPC = "https://arc-testnet.drpc.org";

export const ARC_RPC_URLS = [
  process.env.NEXT_PUBLIC_ARC_RPC_URL || CANTEEN_RPC, // Canteen Primary
  PUBLIC_ARC_RPC,
  ALCHEMY_ARC_RPC,
  QUICKNODE_ARC_RPC,
  DRPC_ARC_RPC,
].filter(Boolean) as string[];

export const ARC_RPC_URL = ARC_RPC_URLS[0];

// Arc Testnet Chain Definition
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { 
    name: "USD Coin", 
    symbol: "USDC", 
    decimals: 6 // Arc is stablecoin-native: gas fees paid in USDC
  },
  rpcUrls: {
    default: { http: ARC_RPC_URLS },
    public:  { http: ARC_RPC_URLS },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
});

// Stable HTTP transport — uses custom RPC if available, falls back to public
export const arcTransport = http(ARC_RPC_URL, {
  retryCount: 3,
  retryDelay: 1000,
  timeout: 15000,
});

// Centralized Viem Public Client
export const arcPublicClient = createPublicClient({
  chain: arcTestnet,
  transport: arcTransport,
});

// Ethers.js provider helper
export function getArcEthersProvider(): JsonRpcProvider {
  return new JsonRpcProvider(ARC_RPC_URL, undefined, { staticNetwork: true, batchMaxCount: 1 });
}

// Wallet helper: switch or add Arc Testnet in MetaMask/OKX/etc.
export async function ensureArcNetwork(ethereumProvider: any): Promise<void> {
  const chainIdHex = "0x4cef52"; // 5042002 in hex
  try {
    await ethereumProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (switchError: any) {
    const errorMsg = switchError.message || "";
    const isChainMissing = 
      switchError.code === 4902 || 
      switchError.data?.originalError?.code === 4902 ||
      errorMsg.toLowerCase().includes("unrecognized chain") ||
      errorMsg.toLowerCase().includes("4902");

    if (isChainMissing) {
      await ethereumProvider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: chainIdHex,
            chainName: "Arc Testnet",
            rpcUrls: ARC_RPC_URLS,
            nativeCurrency: {
              name: "USDC",
              symbol: "USDC",
              decimals: 6,
            },
            blockExplorerUrls: ["https://testnet.arcscan.app"],
          },
        ],
      });
      await ethereumProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
    } else {
      throw switchError;
    }
  }
}
