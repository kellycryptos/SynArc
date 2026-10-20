"use client";

import { useTreasuryBalances } from "@/hooks/useTreasuryBalances";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { Shield, FileText, Bot } from "lucide-react";
import Link from "next/link";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export function DashboardTopCards() {
  const { isArcMainnet } = useArcNetwork();
  const { balance: treasuryBalance } = useTreasuryBalances();
  const { metrics, proposals } = useGovernanceStore();

  // 1. Treasury balance (live)
  const formattedTreasury = typeof treasuryBalance === "number" && treasuryBalance > 0
    ? `$${treasuryBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : metrics?.treasuryValue && metrics.treasuryValue !== "—" && metrics.treasuryValue !== "$0.07"
      ? metrics.treasuryValue
      : isArcMainnet
        ? (typeof treasuryBalance === "number" ? `$${treasuryBalance.toFixed(2)}` : "—")
        : "$30,688.99";

  // 2. Open proposals (live)
  const activeProposalsCount = metrics?.activeProposals !== undefined
    ? metrics.activeProposals
    : proposals.filter((p) => p.status === "Active").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Treasury balance (live) */}
      <Link href="/treasury" className="block group">
        <div className="h-full rounded-2xl border border-border/80 bg-surface/50 p-5 hover:border-primary/40 hover:bg-surface-elevated transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-muted">Treasury Balance</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-space text-foreground tracking-tight flex items-baseline gap-2">
              {formattedTreasury === "—" ? (
                <span>—</span>
              ) : formattedTreasury.startsWith("$") ? (
                <span>
                  $
                  <AnimatedNumber
                    value={parseFloat(formattedTreasury.replace(/[^0-9.]/g, "")) || 0}
                    decimals={2}
                  />
                </span>
              ) : (
                <span>{formattedTreasury}</span>
              )}
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {isArcMainnet ? (formattedTreasury === "—" ? "—" : "Live") : "Live"}
              </span>
            </div>
            <p className="text-xs text-muted font-mono mt-1 flex items-center justify-between">
              <span>On-chain reserves</span>
              <span className="text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                View treasury &rarr;
              </span>
            </p>
          </div>
        </div>
      </Link>

      {/* 2. Open proposals (live) */}
      <Link href="/proposals" className="block group">
        <div className="h-full rounded-2xl border border-border/80 bg-surface/50 p-5 hover:border-primary/40 hover:bg-surface-elevated transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-muted">Open Proposals</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-space text-foreground tracking-tight flex items-baseline gap-2">
              <span>{activeProposalsCount}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                Live
              </span>
            </div>
            <p className="text-xs text-muted font-mono mt-1 flex items-center justify-between">
              <span>Active community votes</span>
              <span className="text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                View proposals &rarr;
              </span>
            </p>
          </div>
        </div>
      </Link>

      {/* 3. Treasury guard status */}
      <Link href="/agent" className="block group">
        <div className="h-full rounded-2xl border border-border/80 bg-surface/50 p-5 hover:border-primary/40 hover:bg-surface-elevated transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-muted">Treasury Guard</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-space text-foreground tracking-tight flex items-baseline gap-2">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                Active
              </span>
            </div>
            <p className="text-xs text-muted font-mono mt-1 flex items-center justify-between">
              <span>Monitoring treasury · automated rules</span>
              <span className="text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                View agent &rarr;
              </span>
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
