"use client";

import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShieldCheck } from "lucide-react";

interface ArcDebugPanelProps {
  currentBlock?: number | null;
  walletAddress?: string;
  activeBalance: number;
  proposalStatus: string;
}

export function ArcDebugPanel({
  currentBlock,
  walletAddress,
  activeBalance,
  proposalStatus,
}: ArcDebugPanelProps) {
  return (
    <GlassCard className="p-6 border border-warning/20 bg-warning/5 rounded-2xl mt-8">
      <div className="flex items-center gap-2 mb-4 text-warning font-bold text-sm">
        <ShieldCheck className="w-5 h-5 text-warning animate-pulse" />
        <span>Arc Developer Debug Panel</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        <div className="space-y-1.5">
          <div>
            <span className="text-text-tertiary">RPC Proxy:</span>{" "}
            <span className="text-white">/api/rpc/testnet (server-side)</span>
          </div>
          <div>
            <span className="text-text-tertiary">Current Block:</span>{" "}
            <span className="text-primary font-bold">
              {currentBlock || "Loading..."}
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div>
            <span className="text-text-tertiary">Wallet Address:</span>{" "}
            <span className="text-white">{walletAddress || "Not Connected"}</span>
          </div>
          <div>
            <span className="text-text-tertiary">Voting Power:</span>{" "}
            <span className="text-success font-bold">
              {activeBalance.toFixed(2)} USDC/sARC
            </span>
          </div>
          <div>
            <span className="text-text-tertiary">Proposal State:</span>{" "}
            <span className="text-white font-bold">{proposalStatus}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
