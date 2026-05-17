"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { votingTrends, delegationAnalytics, healthMetrics } from "@/lib/mockData";
import { BarChart3, TrendingUp, Users, Activity } from "lucide-react";

export default function AnalyticsPage() {
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
              <span className="font-medium text-sm text-muted">Total Delegations</span>
            </div>
            <h3 className="text-3xl font-bold">{delegationAnalytics.totalDelegations}</h3>
            <p className="text-xs text-success mt-2">+5.2% this month</p>
          </GlassCard>
          
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium text-sm text-muted">Active Delegates</span>
            </div>
            <h3 className="text-3xl font-bold">{delegationAnalytics.activeDelegates}</h3>
            <p className="text-xs text-success mt-2">+2 new this week</p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <span className="font-medium text-sm text-muted">Avg Participation</span>
            </div>
            <h3 className="text-3xl font-bold">{votingTrends[votingTrends.length - 1].participation}%</h3>
            <p className="text-xs text-success mt-2">+2.4% from last month</p>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-warning" />
              <span className="font-medium text-sm text-muted">Proposals Passed</span>
            </div>
            <h3 className="text-3xl font-bold">
              {healthMetrics.find(m => m.label === 'Proposal Pass Rate')?.value}%
            </h3>
            <p className="text-xs text-muted mt-2">Historical average</p>
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
              {delegationAnalytics.topDelegates.map((delegate, i) => (
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
              ))}
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
