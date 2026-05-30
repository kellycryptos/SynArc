"use client";

import { useState, useEffect } from "react";
import { checkArcRPCHealth } from "@/lib/arc/rpc-health";

/**
 * Hook: useArcRpcHealth
 * 
 * Periodically monitors and reports the real health of the Arc Testnet RPC node.
 * Automatically retries every 15 seconds to check if connection has recovered.
 */
export function useArcRpcHealth() {
  const [isRpcHealthy, setIsRpcHealthy] = useState(true);
  const [currentBlock, setCurrentBlock] = useState<number | null>(null);

  const checkHealth = async () => {
    const res = await checkArcRPCHealth();
    setIsRpcHealthy(res.healthy);
    if (res.healthy && res.blockNumber) {
      setCurrentBlock(res.blockNumber);
    }
    return res.healthy;
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return { isRpcHealthy, currentBlock, checkHealth };
}
