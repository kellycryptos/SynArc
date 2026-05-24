"use client";

import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { useTreasury } from "@/hooks/useTreasury";
import { GlassCard } from "@/components/ui/GlassCard";
import { votingTrends, delegationAnalytics, healthMetrics } from "@/lib/mockData";
import { BarChart3, TrendingUp, Users, Activity, AlertCircle, RefreshCw } from "lucide-react";

export default function AnalyticsPage() {
  const { proposals, metrics, initialized } = useGovernanceStore();
  const { balance, activities, loading: treasuryLoading, error: treasuryError } = useTreasury();

  // Calculate live metrics from proposals
  const activeProposalsCount = proposals.filter(p => p.status === "Active").length;
  const executedProposalsCount = proposals.filter(p => p.status === "Executed").length;
  const totalProposals = proposals.length;
  const passRate = totalProposals > 0 
    ? ((executedProposalsCount / totalProposals) * 100).toFixed(1)
    : "0.0";

  // Calculate participation from proposals
  const avgParticipation = proposals.length > 0
    ? (proposals.reduce((sum, p) => sum + p.participationPercentage, 0) / proposals.length).toFixed(1)
    : "0.0";

  if (treasuryError) {
    return (
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg border border-warning/20 bg-warning/5 p-6 flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Failed to load analytics</h3>
              <p className="text-sm text-muted mt-1">{treasuryError.message}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-md bg-warning/10 hover:bg-warning/15 text-warning text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DAO Analytics</h1>
          <p className="text-muted mt-1">Key metrics and governance trends.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-accent" />
              <span className="font-medium text-sm text-muted">Active Proposals</span>
            </div>
            {!initialized ? (
              <div className="h-10 bg-surface-elevated rounded animate-pulse" />
            ) : (
              <>
                <h3 className="text-3xl font-bold">{activeProposalsCount}</h3>
                <p className="text-xs text-success mt-2">Live from blockchain</p>
              </>
            )}
          </GlassCard>
          
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium text-sm text-muted">Treasury Balance</span>
            </div>
            {treasuryLoading ? (
              <div className="h-10 bg-surface-elevated rounded animate-pulse" />
            ) : (
              <>
                <h3 className="text-3xl font-bold">${(balance / 1000).toFixed(0)}k</h3>
                <p className="text-xs text-success mt-2">USDC on Arc Testnet</p>
              </>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <span className="font-medium text-sm text-muted">Avg Participation</span>
            </div>
            {!initialized ? (
              <div className="h-10 bg-surface-elevated rounded animate-pulse" />
            ) : (
              <>
                <h3 className="text-3xl font-bold">{avgParticipation}%</h3>
                <p className="text-xs text-success mt-2">Current average</p>
              </>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-warning" />
              <span className="font-medium text-sm text-muted">Pass Rate</span>
            </div>
            {!initialized ? (
              <div className="h-10 bg-surface-elevated rounded animate-pulse" />
            ) : (
              <>
                <h3 className="text-3xl font-bold">{passRate}%</h3>
                <p className="text-xs text-muted mt-2">{executedProposalsCount} executed</p>
              </>
            )}
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <GlassCard className="p-6 h-96 flex flex-col">
            <h3 className="font-bold mb-6">Voting Participation Trend</h3>
            <div className="flex-1 flex items-end gap-2">
              {votingTrends.slice(-6).map((trend, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full bg-surface-elevated rounded-t-sm relative overflow-hidden h-full flex items-end">
                    <div 
                      className="w-full bg-primary/80 group-hover:bg-primary transition-colors rounded-t-sm"
                      style={{ height: `${trend.participation}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted">{trend.period}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6 h-96 flex flex-col">
            <h3 className="font-bold mb-6">Top Delegates by Power</h3>
            <div className="flex-1 space-y-4">
              {!initialized ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 bg-surface-elevated rounded animate-pulse" />
                ))
              ) : (
                delegationAnalytics.topDelegates.map((delegate, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent font-bold">
                        {i + 1}
                      </div>
                      <span className="font-mono text-sm">{delegate.address}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{(delegate.power / 1000).toFixed(0)}k</span>
                      <span className="text-xs text-muted ml-1">USDC</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
