"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { daoMembers } from "@/lib/mockData";
import { Award, Shield, Search, AlertCircle, RefreshCw } from "lucide-react";

export default function MembersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: replace with contract call
    // For now, using mock data as fallback
    // Future: fetch token holders from SynArcToken contract and derive member list
    setIsLoading(false);
  }, []);

  if (error) {
    return (
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg border border-warning/20 bg-warning/5 p-6 flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Failed to load members</h3>
              <p className="text-sm text-muted mt-1">{error}</p>
              <button 
                onClick={() => setError(null)}
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
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">DAO Members</h1>
            <p className="text-muted mt-1">Delegates and contributors in the SynArc ecosystem.</p>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              placeholder="Search members..." 
              className="pl-9 pr-4 py-2 w-full sm:w-64 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none transition-colors text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <GlassCard key={i} delay={i * 0.05} className="p-6">
                <div className="space-y-4">
                  <div className="h-12 bg-surface-elevated rounded-full w-3/4 animate-pulse" />
                  <div className="h-8 bg-surface-elevated rounded w-1/2 animate-pulse" />
                  <div className="h-6 bg-surface-elevated rounded w-2/3 animate-pulse" />
                </div>
              </GlassCard>
            ))
          ) : (
            daoMembers.map((member, i) => (
            daoMembers.map((member, i) => (
              <GlassCard key={member.id} delay={i * 0.05} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface-elevated border border-white/10 flex items-center justify-center overflow-hidden">
                      {/* Placeholder for avatar, could use jazzicon */}
                      <div className="w-full h-full bg-gradient-to-br from-primary/40 to-accent/40" />
                    </div>
                    <div>
                      <h3 className="font-bold">{member.ensName || member.address}</h3>
                      <p className="text-xs text-muted font-mono">{member.address}</p>
                    </div>
                  </div>
                  {member.isDelegate && (
                    <span className="px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium flex items-center gap-1">
                      <Award className="w-3 h-3" /> Delegate
                    </span>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-border-thin">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted">Voting Power</span>
                    <span className="font-semibold">{(member.votingPower / 1000).toFixed(0)}k USDC</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted">Delegated To</span>
                    <span className="font-semibold">{member.delegatorsCount} addresses</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted">Participation</span>
                    <span className="font-semibold text-success">{member.votingParticipationRate}%</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button className="w-full py-2.5 rounded-lg bg-surface border border-border-thin hover:bg-surface-elevated transition-colors text-sm font-medium flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" />
                    Delegate Votes
                  </button>
                </div>
              </GlassCard>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
