/**
 * Arc RPC Configuration
 * 
 * Centralized management of Arc RPC endpoints with fallback support.
 * Supports personalized RPC URLs from ARC CLI (arc-canteen rpc-url).
 * 
 * Setup:
 * 1. Get personalized Arc RPC endpoint: arc-canteen rpc-url
 * 2. Set NEXT_PUBLIC_ARC_RPC_URL in .env.local
 * 3. Fallback to Arc Testnet public RPC if not configured
 */

export const ARC_TESTNET_RPC = 'https://rpc.testnet.arc.network';

/**
 * Get the primary Arc RPC URL with fallback support
 * Prioritizes personalized RPC from environment, falls back to public testnet
 */
export function getArcRpcUrl(): string {
  const customRpcUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL;
  
  if (customRpcUrl && customRpcUrl.trim()) {
    return customRpcUrl.trim();
  }
  
  return ARC_TESTNET_RPC;
}

/**
 * Get the fallback Arc RPC URL (always public testnet)
 * Used when primary RPC fails
 */
export function getArcRpcFallback(): string {
  return ARC_TESTNET_RPC;
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
 * Get all configured RPC URLs in priority order
 * Primary: personalized from ARC CLI
 * Fallback: public testnet RPC
 */
export function getArcRpcUrls(): string[] {
  const urls: string[] = [];
  
  const primaryUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL;
  if (primaryUrl?.trim() && primaryUrl !== ARC_TESTNET_RPC) {
    urls.push(primaryUrl.trim());
  }
  
  urls.push(ARC_TESTNET_RPC);
  
  return urls;
}

/**
 * RPC configuration object for WAGMI
 * Provides all Arc RPC endpoints
 */
export const arcRpcConfig = {
  primary: getArcRpcUrl(),
  fallback: getArcRpcFallback(),
  all: getArcRpcUrls(),
  testnet: ARC_TESTNET_RPC,
};
