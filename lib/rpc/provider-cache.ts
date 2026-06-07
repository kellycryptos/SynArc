import { JsonRpcProvider } from "ethers";
import { getResilientProvider } from "./config";

let cachedProvider: JsonRpcProvider | null = null;
let cacheExpiry = 0;
let pendingPromise: Promise<JsonRpcProvider> | null = null;

export async function getCachedProvider(): Promise<JsonRpcProvider> {
  if (cachedProvider && Date.now() < cacheExpiry) {
    return cachedProvider;
  }

  // If there's already an active request, wait for it instead of starting a new race
  if (pendingPromise) {
    return pendingPromise;
  }

  pendingPromise = (async () => {
    try {
      const provider = await getResilientProvider();
      cachedProvider = provider;
      cacheExpiry = Date.now() + 60_000; // reuse for 60s
      return provider;
    } finally {
      pendingPromise = null;
    }
  })();

  return pendingPromise;
}
