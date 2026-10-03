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
      let lastResult: RpcHealthStatus | null = null;
      for (const url of urls) {
        if (!url) continue;
        const result = await checkRpcHealth(url, 4000);
        if (result.isHealthy) {
          return result;
        }
        lastResult = result;
      }
      return lastResult || {
        isHealthy: false,
        latency: 0,
        url: urls[0] || "",
        timestamp: Date.now(),
        error: "All RPC endpoints unresponsive",
      };
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
