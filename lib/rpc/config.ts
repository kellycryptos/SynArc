import { JsonRpcProvider } from "ethers";

/**
 * Arc RPC Configuration
 * 
 * Centralized management of Arc RPC endpoints with fallback support.
 * Supports personalized RPC URLs from ARC CLI (arc-canteen rpc-url).
 */

export const ARC_TESTNET_RPC = 'https://rpc.testnet.arc.network';

// Priority array of RPC endpoints with fallback URLs
export const RPC_URLS = [
  process.env.NEXT_PUBLIC_ARC_RPC_URL || '',
  'https://rpc.testnet.arc.network',
  'https://arc-testnet.drpc.org',
  'https://5042002.rpc.thirdweb.com'
].filter(url => url.trim() !== '');

/**
 * Get resilient provider by racing all RPC URLs with a per-endpoint timeout.
 *
 * Uses getBlockNumber() instead of getNetwork() — lighter call, faster fail.
 * A 3-second per-URL timeout ensures a hanging Canteen endpoint doesn't stall
 * the entire app while it waits for a TCP response.
 */
export async function getResilientProvider(): Promise<JsonRpcProvider> {
  const TIMEOUT_MS = 3000;

  for (const rpcUrl of RPC_URLS) {
    try {
      const provider = new JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });

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
