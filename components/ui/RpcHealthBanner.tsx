"use client";

import { useArcRpcHealth } from "@/hooks/useArcRpcHealth";
import { AlertCircle, RefreshCw } from "lucide-react";

interface RpcHealthBannerProps {
  hasLoadedBalance?: boolean;
}

/**
 * RpcHealthBanner Component
 * 
 * Elegant dynamic banner displaying a warning when the Arc RPC endpoint is down.
 * - Suppresses itself if the RPC is healthy.
 * - Suppresses itself if a wallet balance was successfully loaded from the node.
 * - Fits modern Arc/SynArc visual parameters (glass layout, micro-animations).
 */
export function RpcHealthBanner({ hasLoadedBalance = false }: RpcHealthBannerProps) {
  const { isRpcHealthy } = useArcRpcHealth();

  if (isRpcHealthy || hasLoadedBalance) return null;

  return (
    <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl flex items-center justify-between gap-3 text-sm text-warning animate-pulse mb-6">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 text-warning animate-bounce" />
        <div>
          <span className="font-bold">⚠ Unable to reach Arc RPC</span>
          <p className="text-xs text-muted/80 mt-0.5 font-semibold">Retrying automatically...</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-warning/10 border border-warning/20 text-xs font-bold animate-spin-slow select-none">
        <RefreshCw className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}
