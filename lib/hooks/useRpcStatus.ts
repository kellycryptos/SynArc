"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { checkRpcHealth, RpcHealthStatus, getRpcStatusMessage } from "@/lib/rpc/health";
import { getArcRpcUrl, getArcRpcFallback } from "@/lib/rpc/config";

import { getActiveNetwork, ARC_TESTNET_RPC_URLS, ARC_MAINNET_RPC_URLS } from "@/lib/arc-config";


/**
 * Hook: useRpcStatus
 * 
 * Monitors the health of the active Arc RPC endpoint and provides connection status.
 * Automatically checks fallback endpoints if primary RPC fails or times out.
 */
export function useRpcStatus(network?: 'mainnet' | 'testnet') {
  const activeNet = network || getActiveNetwork();
  const urls = activeNet === 'testnet' ? ARC_TESTNET_RPC_URLS : ARC_MAINNET_RPC_URLS;

  const { data: status, isLoading, error } = useQuery({
    queryKey: ["rpcHealth", activeNet],
    queryFn: async () => {
      const validUrls = urls.filter(Boolean);
      if (validUrls.length === 0) {
        return {
          isHealthy: false,
          latency: 0,
          url: "",
          timestamp: Date.now(),
          error: "No RPC endpoints configured",
        };
      }

      // 1. Fast-path: Check primary endpoint first (fast return under 100ms when healthy)
      const primaryResult = await checkRpcHealth(validUrls[0], 2500);
      if (primaryResult.isHealthy) {
        return primaryResult;
      }

      // 2. Resilient fallback: Test remaining backup endpoints concurrently (avoids sequential 12s stall)
      if (validUrls.length > 1) {
        const fallbackResults = await Promise.all(
          validUrls.slice(1).map((url) => checkRpcHealth(url, 3000))
        );
        const healthyFallback = fallbackResults.find((r) => r.isHealthy);
        if (healthyFallback) {
          return healthyFallback;
        }
        return fallbackResults[0] || primaryResult;
      }

      return primaryResult;
    },
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 2,
  });

  const isHealthy = status?.isHealthy ?? false;
  const latency = status?.latency ?? 0;
  const isConnecting = isLoading && !status;
  const message = isConnecting ? "Connecting..." : (status ? getRpcStatusMessage(status) : "Connecting...");

  return {
    isHealthy,
    latency,
    message,
    status,
    isLoading: isConnecting,
    error,
    rpcUrl: status?.url || urls[0],
  };
}

/**
 * Hook: useNetworkStatus
 * 
 * Monitors overall network connectivity status.
 * Returns true if browser has internet and RPC is reachable.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const { isHealthy: isRpcHealthy } = useRpcStatus();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline,
    isRpcHealthy,
    isConnected: isOnline && isRpcHealthy,
  };
}

/**
 * Hook: useArcRpcUrl
 * 
 * Returns the current active Arc RPC URL.
 * Useful for components that need to know which RPC endpoint is being used.
 */
export function useArcRpcUrl() {
  const [rpcUrl, setRpcUrl] = useState<string>(() => getArcRpcUrl());

  useEffect(() => {
    const handleRpcChange = () => {
      setRpcUrl(getArcRpcUrl());
    };

    window.addEventListener("focus", handleRpcChange);
    return () => window.removeEventListener("focus", handleRpcChange);
  }, []);

  return rpcUrl;
}
