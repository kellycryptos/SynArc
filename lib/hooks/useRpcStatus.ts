"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { checkRpcHealth, RpcHealthStatus, getRpcStatusMessage } from "@/lib/rpc/health";
import { getArcRpcUrl, getArcRpcFallback } from "@/lib/rpc/config";

/**
 * Hook: useRpcStatus
 * 
 * Monitors the health of the Arc RPC endpoint and provides connection status.
 * Automatically retries with fallback if primary RPC fails.
 */
export function useRpcStatus() {
  const [rpcUrl, setRpcUrl] = useState<string>(() => getArcRpcUrl());

  const { data: status, isLoading, error } = useQuery({
    queryKey: ["rpcHealth", rpcUrl],
    queryFn: async () => {
      const result = await checkRpcHealth(rpcUrl);
      
      if (!result.isHealthy && rpcUrl !== getArcRpcFallback()) {
        setRpcUrl(getArcRpcFallback());
      }
      
      return result;
    },
    refetchInterval: 30000,
    staleTime: 10000,
    retry: 3,
  });

  const isHealthy = status?.isHealthy ?? false;
  const latency = status?.latency ?? 0;
  const message = status ? getRpcStatusMessage(status) : "Connecting...";

  return {
    isHealthy,
    latency,
    message,
    status,
    isLoading,
    error,
    rpcUrl,
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
