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
    ? "bg-[#0B111C] border-[#1B2536] text-[#22D3EE]"
    : "bg-[#170F09] border-[#3A2A1E] text-[#E2A66B]";

  const indicatorColor = isHealthy
    ? "bg-[#22D3EE]"
    : "bg-[#E2A66B]";

  const animationClass = isHealthy ? "animate-pulse" : "animate-none";

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono border ${statusColor} transition-all`}
      title={message}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${indicatorColor} ${animationClass}`} />
      <span className="hidden sm:inline">{isHealthy ? `${latency}ms` : "Reconnecting"}</span>
      <span className="sm:hidden">{isHealthy ? "Arc ✓" : "Arc ✗"}</span>
    </div>
  );
}
