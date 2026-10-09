import { JsonRpcProvider } from "ethers";
import { getResilientProvider } from "./config";
import { getActiveNetwork, ARC_MAINNET_RPC_URLS, ARC_TESTNET_RPC_URLS, arcTestnet, arcMainnet } from "@/lib/arc-config";
import { createPublicClient, http, fallback, PublicClient } from "viem";

const cachedProviders: Record<string, { provider: JsonRpcProvider; expiry: number }> = {};
const pendingPromises: Record<string, Promise<JsonRpcProvider> | null> = {};

const cachedClients: Record<string, { client: PublicClient; expiry: number }> = {};

export function getCachedPublicClient(customChainId?: number): PublicClient {
  const net = getActiveNetwork();
  const key = customChainId ? `chain_${customChainId}` : net;
  const cached = cachedClients[key];

  if (cached && Date.now() < cached.expiry) {
    return cached.client;
  }

  const isTestnet = customChainId ? customChainId === 5042002 : net === "testnet";
  const chain = isTestnet ? arcTestnet : arcMainnet;
  const rpcUrls = isTestnet ? ARC_TESTNET_RPC_URLS : ARC_MAINNET_RPC_URLS;

  const client = createPublicClient({
    chain,
    transport: fallback(rpcUrls.map(url => http(url, { timeout: 8000 }))),
  }) as PublicClient;

  cachedClients[key] = {
    client,
    expiry: Date.now() + 60_000, // cache for 60s
  };

  return client;
}

export async function getCachedProvider(): Promise<JsonRpcProvider> {
  const net = getActiveNetwork();
  const cached = cachedProviders[net];

  if (cached && Date.now() < cached.expiry) {
    return cached.provider;
  }

  // If there's already an active request for this network, wait for it instead of starting a new race
  if (pendingPromises[net]) {
    return pendingPromises[net]!;
  }

  pendingPromises[net] = (async () => {
    try {
      const provider = await getResilientProvider();
      cachedProviders[net] = {
        provider,
        expiry: Date.now() + 60_000, // reuse for 60s
      };
      return provider;
    } finally {
      pendingPromises[net] = null;
    }
  })();

  return pendingPromises[net]!;
}

