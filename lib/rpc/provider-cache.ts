import { JsonRpcProvider } from "ethers";
import { getResilientProvider } from "./config";
import { getActiveNetwork } from "@/lib/arc-config";

const cachedProviders: Record<string, { provider: JsonRpcProvider; expiry: number }> = {};
const pendingPromises: Record<string, Promise<JsonRpcProvider> | null> = {};

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
