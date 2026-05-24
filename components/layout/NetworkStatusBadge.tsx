"use client";

import { useRpcStatus } from "@/lib/hooks/useRpcStatus";
import React from "react";

/**
 * Network Status Badge Component
 * 
 * Displays the current Arc RPC connection status with:
 * - Visual indicator (green = healthy, red = unhealthy)
 * - Latency information
 * - Tooltip with detailed status
 */
export function NetworkStatusBadge() {
  const { isHealthy, latency, message } = useRpcStatus();

  const statusColor = isHealthy
    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    : "bg-red-500/10 border-red-500/20 text-red-400";

  const indicatorColor = isHealthy
    ? "bg-emerald-400"
    : "bg-red-400";

  const animationClass = isHealthy ? "animate-pulse" : "animate-none";

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusColor} transition-all`}
      title={message}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${indicatorColor} ${animationClass}`} />
      <span className="hidden sm:inline">{isHealthy ? `${latency}ms` : "Reconnecting"}</span>
      <span className="sm:hidden">{isHealthy ? "Arc ✓" : "Arc ✗"}</span>
    </div>
  );
}
