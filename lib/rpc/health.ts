/**
 * Arc RPC Health Checking
 * 
 * Monitors RPC connection status and provides fallback handling.
 * Used to detect RPC failures and gracefully degrade to fallback endpoints.
 */

export interface RpcHealthStatus {
  isHealthy: boolean;
  latency: number;
  url: string;
  timestamp: number;
  error?: string;
}

/**
 * Check if an RPC endpoint is responsive and healthy
 * Uses a simple JSON-RPC health check (eth_chainId)
 */
export async function checkRpcHealth(rpcUrl: string, timeout: number = 5000): Promise<RpcHealthStatus> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    
    if (!response.ok) {
      return {
        isHealthy: false,
        latency,
        url: rpcUrl,
        timestamp: Date.now(),
        error: `HTTP ${response.status}`,
      };
    }
    
    const data = await response.json();
    const isHealthy = data.result !== undefined && !data.error;
    
    return {
      isHealthy,
      latency,
      url: rpcUrl,
      timestamp: Date.now(),
      error: isHealthy ? undefined : data.error?.message || 'Unknown RPC error',
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      isHealthy: false,
      latency,
      url: rpcUrl,
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check health of multiple RPC endpoints
 * Returns array of health status for each URL, sorted by health then latency
 */
export async function checkMultipleRpcHealth(
  rpcUrls: string[],
  timeout?: number
): Promise<RpcHealthStatus[]> {
  const results = await Promise.all(
    rpcUrls.map(url => checkRpcHealth(url, timeout))
  );
  
  return results.sort((a, b) => {
    if (a.isHealthy !== b.isHealthy) {
      return a.isHealthy ? -1 : 1;
    }
    return a.latency - b.latency;
  });
}

/**
 * Find the first healthy RPC endpoint from a list
 * Returns the URL of the first healthy endpoint, or the first one if all fail
 */
export async function findHealthyRpc(
  rpcUrls: string[],
  timeout?: number
): Promise<string> {
  const results = await checkMultipleRpcHealth(rpcUrls, timeout);
  
  const healthyRpc = results.find(r => r.isHealthy);
  if (healthyRpc) {
    return healthyRpc.url;
  }
  
  return rpcUrls[0];
}

/**
 * Create a real-time RPC health monitor
 * Periodically checks RPC health and updates state
 */
export function createRpcHealthMonitor(
  rpcUrl: string,
  onStatusChange?: (status: RpcHealthStatus) => void,
  checkInterval: number = 30000 // Check every 30 seconds
) {
  let currentStatus: RpcHealthStatus | null = null;
  let isMonitoring = false;
  let monitorInterval: NodeJS.Timeout | null = null;
  
  const startMonitoring = async () => {
    if (isMonitoring) return;
    isMonitoring = true;
    
    const performCheck = async () => {
      const status = await checkRpcHealth(rpcUrl);
      
      if (!currentStatus || status.isHealthy !== currentStatus.isHealthy || status.latency !== currentStatus.latency) {
        currentStatus = status;
        onStatusChange?.(status);
      }
    };
    
    await performCheck();
    monitorInterval = setInterval(performCheck, checkInterval);
  };
  
  const stopMonitoring = () => {
    if (monitorInterval) {
      clearInterval(monitorInterval);
      monitorInterval = null;
    }
    isMonitoring = false;
  };
  
  const getStatus = (): RpcHealthStatus | null => currentStatus;
  
  return {
    startMonitoring,
    stopMonitoring,
    getStatus,
    isMonitoring: () => isMonitoring,
  };
}

/**
 * Get human-readable RPC connection status
 */
export function getRpcStatusMessage(status: RpcHealthStatus): string {
  if (status.isHealthy) {
    return `Arc RPC: Connected (${status.latency}ms)`;
  }
  return `Arc RPC: Disconnected (${status.error || 'Unknown error'})`;
}
