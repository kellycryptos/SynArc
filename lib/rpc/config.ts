import { JsonRpcProvider, Network } from "ethers";
import { checkRpcHealth } from "./health";

import { ARC_TESTNET_RPC_URLS, ARC_MAINNET_RPC_URLS, ACTIVE_NETWORK, ARC_RPC_URLS, getActiveNetwork, CANTEEN_TESTNET_RPC } from "@/lib/arc-config";

export const ARC_MAINNET_NETWORK = Network.from({ name: 'arc', chainId: 5042 });
export const ARC_TESTNET_NETWORK = Network.from({ name: 'arc-testnet', chainId: 5042002 });

/**
 * Arc RPC Configuration
 *
 * Centralized management of Arc RPC endpoints with fallback support.
 * Priority (mainnet): Arc official (https://rpc.mainnet.arc.io) → Alchemy → additional fallbacks
 * Priority (testnet): Arc official (https://rpc.testnet.arc.network) → Arc secondary (https://rpc.testnet.arc.io) → Same-Origin Proxy
 */

export const TESTNET_RPC_URLS = ARC_TESTNET_RPC_URLS;
export const MAINNET_RPC_URLS = ARC_MAINNET_RPC_URLS;

// Centralized resilient fallbacks dynamically proxying active network (Mainnet or Testnet)
export const RPC_URLS = ARC_RPC_URLS;
export const CANTEEN_RPC = TESTNET_RPC_URLS[0] || 'https://rpc.testnet.arc.network';
export const ARC_TESTNET_RPC = CANTEEN_RPC;

/**
 * Initialize dynamic client-side RPC fallbacks in-place.
 * 
 * Verifies health of the primary RPC. If offline, rate-limited,
 * or returning raw non-JSON error pages, it re-orders the RPC priority array in the
 * chain configuration to prevent Privy embedded wallet crashes.
 */
export async function initializeResilientRpc(chain: any) {
  if (typeof window === "undefined") return;
  
  try {
    const primaryUrl = RPC_URLS[0];
    if (!primaryUrl) return;
    
    console.log(`Verifying primary RPC node: ${primaryUrl}`);
    const health = await checkRpcHealth(primaryUrl, 2500); // 2.5 second timeout
    
    if (!health.isHealthy) {
      console.warn(`Primary RPC ${primaryUrl} is rate-limited or offline (${health.error || 'unresponsive'}). Dynamically swapping to backup RPCs...`);
      
      const healthyUrls = [...RPC_URLS];
      const index = healthyUrls.indexOf(primaryUrl);
      if (index > -1) {
        healthyUrls.splice(index, 1);
        healthyUrls.push(primaryUrl); // Shift to end
      }
      
      if (chain && chain.rpcUrls && chain.rpcUrls.default) {
        chain.rpcUrls.default.http = healthyUrls;
        console.log("Chain default RPCs dynamically reordered:", chain.rpcUrls.default.http);
      }
    } else {
      console.log(`Primary RPC node is healthy. (Latency: ${health.latency}ms)`);
    }
  } catch (err) {
    console.error("Failed to dynamically configure resilient RPCs:", err);
  }
}

/**
 * Get resilient provider by racing all RPC URLs with a per-endpoint timeout.
 *
 * Uses getBlockNumber() instead of getNetwork() — lighter call, faster fail.
 * A 3-second per-URL timeout ensures a hung RPC endpoint doesn't stall
 * the entire app while it waits for a TCP response.
 */
export async function getResilientProvider(): Promise<JsonRpcProvider> {
  const TIMEOUT_MS = 2500;
  const isMainnet = getActiveNetwork() === 'mainnet';
  const network = isMainnet ? ARC_MAINNET_NETWORK : ARC_TESTNET_NETWORK;
  const validUrls = Array.from(RPC_URLS).filter(url => Boolean(url) && !url.includes('rpc.mainnet.arc.network'));

  // 1. Fast path: check primary RPC first
  if (validUrls.length > 0) {
    try {
      const primaryUrl = validUrls[0];
      const provider = new JsonRpcProvider(primaryUrl, network, { staticNetwork: true, batchMaxCount: 1 });
      await Promise.race([
        provider.getBlockNumber(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`RPC timeout: ${primaryUrl}`)), TIMEOUT_MS)
        ),
      ]);
      return provider;
    } catch (err) {
      console.warn(`Primary RPC unavailable, racing backups in parallel...`);
    }
  }

  // 2. Resilient fallback: race remaining healthy endpoints concurrently
  const fallbacks = validUrls.slice(1);
  if (fallbacks.length > 0) {
    try {
      const fastestProvider = await Promise.any(
        fallbacks.map(async (url) => {
          const provider = new JsonRpcProvider(url, network, { staticNetwork: true, batchMaxCount: 1 });
          await Promise.race([
            provider.getBlockNumber(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`RPC timeout: ${url}`)), TIMEOUT_MS)
            ),
          ]);
          return provider;
        })
      );
      return fastestProvider;
    } catch {
      // All raced fallbacks failed
    }
  }

  throw new Error("All RPC endpoints are offline. Please try again later.");
}


/**
 * Get the primary Arc RPC URL with fallback support
 */
export function getArcRpcUrl(): string {
  return RPC_URLS[0] || ARC_TESTNET_RPC;
}

/**
 * Get the fallback Arc RPC URL (public testnet)
 */
export function getArcRpcFallback(): string {
  return RPC_URLS[1] || ARC_TESTNET_RPC;
}

/**
 * Get all configured RPC URLs in priority order
 */
export function getArcRpcUrls(): string[] {
  return RPC_URLS;
}

/**
 * Validate Arc RPC URL format
 */
export function isValidRpcUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * RPC configuration object for WAGMI / Privy
 */
export const arcRpcConfig = {
  primary: getArcRpcUrl(),
  fallback: getArcRpcFallback(),
  all: getArcRpcUrls(),
  testnet: ARC_TESTNET_RPC,
};

/**
 * Execute a log-query callback function resiliently across all RPC nodes.
 * If the primary RPC fails due to rate limits or free-tier block range restrictions,
 * it automatically retries with the backup public RPCs.
 */
export async function getLogsResiliently<T>(
  queryFn: (rpcUrl: string) => Promise<T>
): Promise<T> {
  const urls = getArcRpcUrls();
  let lastError: any = null;
  
  for (const url of urls) {
    try {
      return await queryFn(url);
    } catch (err) {
      console.warn(`getLogsResiliently: Query failed on RPC ${url}, trying next fallback...`, err);
      lastError = err;
    }
  }
  
  throw lastError || new Error("All RPC endpoints failed to query logs.");
}

