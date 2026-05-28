import { defineChain, createPublicClient, http } from "viem";
import { JsonRpcProvider } from "ethers";

// Centralized custom RPC URL from environment variable, fallback to default Arc node
export const ARC_RPC_URL = process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network";

// Center-locked Arc Testnet Chain Definition
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { 
    name: "USD Coin", 
    symbol: "USDC", 
    decimals: 6 // Forces browser wallets to interpret gas at 6 decimals!
  },
  rpcUrls: {
    default: { http: [ARC_RPC_URL] },
    public: { http: [ARC_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
});

// Centralized stable HTTP transport with retry logic and batching
export const arcTransport = http(ARC_RPC_URL, {
  retryCount: 3,
  retryDelay: 1000,
  timeout: 15000, // 15s timeout for maximum network stability
  batch: {
    batchSize: 100, // Max 100 calls per batch
    wait: 16,       // 16ms debounce window — ~1 frame, keeps UX snappy
  },
});

// Centralized Viem Public Client
export const arcPublicClient = createPublicClient({
  chain: arcTestnet,
  transport: arcTransport,
});

// Resilient Ethers JSON-RPC Provider helper
export function getArcEthersProvider(): JsonRpcProvider {
  return new JsonRpcProvider(ARC_RPC_URL, undefined, { staticNetwork: true });
}

// Wallet client helper: automatically checks and requests network switch or adds the network
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
            rpcUrls: [ARC_RPC_URL],
            nativeCurrency: {
              name: "USDC",
              symbol: "USDC",
              decimals: 6,
            },
            blockExplorerUrls: ["https://testnet.arcscan.app"],
          },
        ],
      });
      // Switch again after adding
      await ethereumProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
    } else {
      throw switchError;
    }
  }
}
