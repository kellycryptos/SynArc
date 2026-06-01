import { JsonRpcProvider } from "ethers";
import { checkRpcHealth } from "./health";

/**
 * Arc RPC Configuration
 * 
 * Centralized management of Arc RPC endpoints with fallback support.
 * Supports personalized RPC URLs from ARC CLI (arc-canteen rpc-url).
 */

// Primary: Custom Canteen RPC (June 2026 Recommended Setup)
// Fallbacks: official public, Alchemy, QuickNode, and dRPC endpoints
export const CANTEEN_RPC = 'https://rpc.testnet.arc-node.thecanteenapp.com/v1/swrm_104d24688adcae992878acabfd41b2ed5800817b20d57aa9b17a64d225c0bf8f';
export const ARC_TESTNET_RPC = CANTEEN_RPC;

// Centralized resilient fallbacks — Canteen primary, official publics, Alchemy, QuickNode, dRPC as backups
export const RPC_URLS = [
  process.env.NEXT_PUBLIC_ARC_RPC_URL || CANTEEN_RPC,
  'https://rpc.testnet.arc.network',
  'https://arc-testnet.g.alchemy.com/v2/okKqIdABiZt8WuR2aDvev',
  'https://rpc.quicknode.testnet.arc.network',
  'https://arc-testnet.drpc.org',
].filter(Boolean).filter(
  (url, index, arr) => arr.indexOf(url) === index // deduplicate
) as string[];

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
 * A 3-second per-URL timeout ensures a hanging Canteen endpoint doesn't stall
 * the entire app while it waits for a TCP response.
 */
export async function getResilientProvider(): Promise<JsonRpcProvider> {
  const TIMEOUT_MS = 4000; // Slightly more generous — Alchemy connects fast

  for (const rpcUrl of RPC_URLS) {
    try {
      const provider = new JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true, batchMaxCount: 1 });

      // Race the health check against a timeout so a hanging URL fails fast
      await Promise.race([
        provider.getBlockNumber(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`RPC timeout: ${rpcUrl}`)), TIMEOUT_MS)
        ),
      ]);

      return provider;
    } catch (err) {
      console.warn(`RPC unavailable (${rpcUrl}), trying next fallback...`);
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

