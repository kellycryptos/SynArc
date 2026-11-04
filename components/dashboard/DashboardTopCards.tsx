"use client";

import { useTreasuryBalances } from "@/hooks/useTreasuryBalances";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { Shield, FileText, CheckCircle2, Bot } from "lucide-react";
import Link from "next/link";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export function DashboardTopCards() {
  const { balance: treasuryBalance } = useTreasuryBalances();
  const { metrics, proposals } = useGovernanceStore();

  const formattedTreasury = typeof treasuryBalance === "number"
    ? `$${treasuryBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : metrics?.treasuryValue && metrics.treasuryValue !== "—"
      ? metrics.treasuryValue
      : "—";

  const activeProposalsCount = metrics?.activeProposals !== undefined
    ? metrics.activeProposals
    : proposals.filter((p) => p.status === "Active").length;

  const executionRate = metrics?.proposalExecutionRate && metrics.proposalExecutionRate !== "—"
    ? metrics.proposalExecutionRate
    : (proposals.length > 0
        ? `${Math.round((proposals.filter(p => (p.status as string) === "Executed").length / proposals.length) * 100)}%`
        : "100%");

  return (
    <div 
      data-component="dashboard-metrics"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* 1. Treasury Reserves */}
      <Link href="/treasury" className="block group">
        <div className="h-full rounded-2xl border border-border bg-surface/60 p-5 hover:border-primary/40 hover:bg-surface-elevated transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-muted">Reserves</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
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
            </div>
          </div>
        </div>
      </Link>

      {/* 2. Active Proposals */}
      <Link href="/proposals" className="block group">
        <div className="h-full rounded-2xl border border-border bg-surface/60 p-5 hover:border-primary/40 hover:bg-surface-elevated transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-muted">Active Proposals</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-space text-foreground tracking-tight">
              <span>{activeProposalsCount}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* 3. Execution Rate */}
      <Link href="/proposals" className="block group">
        <div className="h-full rounded-2xl border border-border bg-surface/60 p-5 hover:border-primary/40 hover:bg-surface-elevated transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-muted">Execution Rate</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-space text-foreground tracking-tight">
              <span>{executionRate}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* 4. Treasury Guard */}
      <Link href="/agent" className="block group">
        <div className="h-full rounded-2xl border border-border bg-surface/60 p-5 hover:border-primary/40 hover:bg-surface-elevated transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-muted">Treasury Guard</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-space text-foreground tracking-tight flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Active</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
