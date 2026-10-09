import { createPublicClient, http, fallback } from "viem";
import { JsonRpcProvider } from "ethers";
import { 
  ARC_TESTNET_RPC_URLS, 
  ARC_MAINNET_RPC_URLS, 
  ARC_RPC_URLS, 
  arcTestnet, 
  arcMainnet,
  ARC_CHAIN,
  ACTIVE_NETWORK,
  getMainnetProxyUrl,
  getTestnetProxyUrl,
} from "@/lib/arc-config";
import { ARC_MAINNET_NETWORK, ARC_TESTNET_NETWORK } from "@/lib/rpc/config";

export { ARC_TESTNET_RPC_URLS, ARC_MAINNET_RPC_URLS, ARC_RPC_URLS, arcTestnet, arcMainnet, ARC_CHAIN };

// Primary RPC URL — first in the ACTIVE_RPC_URLS priority array (Arc official on mainnet)
export const ARC_RPC_URL = ARC_RPC_URLS[0] || (ACTIVE_NETWORK === 'mainnet' ? getMainnetProxyUrl() : getTestnetProxyUrl());
// Active-network RPC array (respects ACTIVE_NETWORK: mainnet or testnet)
const ACTIVE_RPC_URLS = ACTIVE_NETWORK === 'mainnet' ? ARC_MAINNET_RPC_URLS : ARC_TESTNET_RPC_URLS;

// Stable HTTP transport — Arc official (primary) → Alchemy → additional fallbacks, 3 retries / 1s backoff
export const arcTransport = fallback(
  ACTIVE_RPC_URLS.map(url =>
    http(url, {
      timeout: 10000,
      retryCount: 3,
      retryDelay: 1000,
    })
  ),
  {
    retryCount: 3,
    retryDelay: 1000,
  }
);


// Centralized Viem Public Client — always targets the active chain (mainnet or testnet)
export const arcPublicClient = createPublicClient({
  chain: ARC_CHAIN,
  transport: arcTransport,
});

// Ethers.js provider helper — uses Canteen as primary (ACTIVE_RPC_URLS[0])
export function getArcEthersProvider(): JsonRpcProvider {
  const primaryUrl = ACTIVE_RPC_URLS[0] || ARC_RPC_URL;
  const isMainnet = ACTIVE_NETWORK === 'mainnet';
  const network = isMainnet ? ARC_MAINNET_NETWORK : ARC_TESTNET_NETWORK;
  return new JsonRpcProvider(primaryUrl, network, { staticNetwork: true, batchMaxCount: 1 });
}

// Wallet helper: switch or add Arc Testnet / Mainnet in MetaMask/OKX/etc.
export async function ensureArcNetwork(ethereumProvider: any, targetChainId: number = ARC_CHAIN.id): Promise<void> {
  const isMainnet = targetChainId === 5042;
  const chainIdHex = `0x${targetChainId.toString(16)}`;
  const chainName = isMainnet ? "Arc" : "Arc Testnet";
  const rawRpcUrls = isMainnet 
    ? [
        'https://rpc.mainnet.arc.io',
        process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL,
      ]
    : [
        'https://rpc.testnet.arc.network',
        'https://rpc.testnet.arc.io',
      ];
  const rpcUrls = Array.from(new Set(rawRpcUrls.filter(Boolean))) as string[];
  const explorerUrl = isMainnet ? "https://explorer.arc.io" : "https://testnet.arcscan.app";

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
            chainName: chainName,
            rpcUrls: rpcUrls,
            nativeCurrency: {
              name: "USDC",
              symbol: "USDC",
              decimals: isMainnet ? 18 : 6,
            },
            blockExplorerUrls: [explorerUrl],
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

