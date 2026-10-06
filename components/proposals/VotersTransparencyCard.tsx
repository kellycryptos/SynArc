"use client";

import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Loader2 } from "lucide-react";

export interface VoterEntry {
  voter: string;
  support: number;
  weight: number;
  reason?: string;
}

interface VotersTransparencyCardProps {
  voters: VoterEntry[];
  loadingVoters: boolean;
  explorerUrl: string;
}

export function VotersTransparencyCard({
  voters,
  loadingVoters,
  explorerUrl,
}: VotersTransparencyCardProps) {
  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
        <span>Voters Transparency</span>
        <span className="text-xs text-text-tertiary bg-surface-elevated px-2.5 py-0.5 rounded-full border border-border-thin font-bold">
          {voters.length} {voters.length === 1 ? "voter" : "voters"}
        </span>
      </h3>

      {loadingVoters ? (
        <div className="py-4 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        </div>
      ) : voters.length > 0 ? (
        <div className="space-y-3.5 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {voters.map((v, i) => (
            <div
              key={i}
              className="flex justify-between items-center text-xs border-b border-border-thin/40 pb-3 last:border-b-0 last:pb-0"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <a
                    href={`${explorerUrl}/address/${v.voter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-primary hover:underline"
                  >
                    {v.voter.slice(0, 6)}...{v.voter.slice(-4)}
                  </a>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                      v.support === 1
                        ? "bg-success/15 text-success border border-success/20"
                        : v.support === 0
                        ? "bg-danger/15 text-danger border border-danger/20"
                        : "bg-surface-elevated text-text-tertiary border border-border-thin"
                    }`}
                  >
                    {v.support === 1
                      ? "FOR"
                      : v.support === 0
                      ? "AGAINST"
                      : "ABSTAIN"}
                  </span>
                </div>
                {v.reason && (
                  <p className="text-text-tertiary italic text-[11px] leading-relaxed">
                    &quot;{v.reason}&quot;
                  </p>
                )}
              </div>
              <span className="font-mono font-bold text-white text-[11px]">
                {v.weight.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}{" "}
                VP
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-tertiary text-center py-4">
          No votes cast yet.
        </p>
      )}
    </GlassCard>
  );
}
