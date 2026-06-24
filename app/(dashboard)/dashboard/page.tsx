"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { WalletFaucetCard } from "@/components/dashboard/WalletFaucetCard";
import { ProposalFeed } from "@/components/proposals/ProposalFeed";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useCampaignStore } from "@/hooks/useCampaignStore";
import { GlassCard } from "@/components/ui/GlassCard";
import { ArrowRight, Rocket, Plus, Coins, Users, Trophy, Zap, Bot, Activity } from "lucide-react";
import Link from "next/link";
import { useCreatorStore } from "@/hooks/useCreatorStore";

const GovernanceAnalytics = dynamic(
  () => import("@/components/analytics/GovernanceAnalytics").then((m) => m.GovernanceAnalytics),
  {
    loading: () => <div className="h-64 w-full bg-surface-elevated/40 animate-pulse rounded-xl border border-border-thin" />,
    ssr: false,
  }
);

export default function DashboardOverview() {
  const { campaigns, initialized, initializeStore } = useCampaignStore();
  const { creators, initializeStore: initializeCreatorsStore } = useCreatorStore();

  useEffect(() => {
    initializeStore();
    initializeCreatorsStore();
  }, [initializeStore, initializeCreatorsStore]);

  // Calculate stats
  const activeCampaigns = campaigns.filter(c => c.state === "Active" || c.state === "Voting").length;
  const totalRaised = campaigns.reduce((sum, c) => sum + c.raised, 0);
  const fundedCount = campaigns.filter(c => c.state === "Funded").length;
  
  // Get latest 2 campaigns as featured
  const featuredCampaigns = campaigns.slice(0, 2);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Auth-aware header: banner + Create Proposal button */}
      <DashboardHeader />

      {/* ⚡ Agent Status Banner */}
      <Link href="/agent" className="block">
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl border border-primary/25 bg-primary/5 hover:bg-primary/8 hover:border-primary/40 transition-all group cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="w-5 h-5 text-primary" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
            </div>
            <div>
              <span className="text-sm font-bold text-text-primary">Treasury Agent Active</span>
              <span className="ml-3 text-xs text-muted">Monitoring treasury · Groq AI · CCTP ready</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold group-hover:gap-3 transition-all">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            View Agent
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </Link>
  
      {/* Metrics */}
      <OverviewCards />
  
      {/* Wallet Balance & Arc Testnet Faucet */}
      <WalletFaucetCard />

      {/* ⚡ Treasury Agent Feature Card */}
      <GlassCard className="p-6 border border-primary/30 bg-primary/[0.02] space-y-5 relative overflow-hidden" hover={false}>
        <div className="absolute top-0 right-0 w-64 h-32 bg-primary/5 blur-3xl rounded-full" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/15 border border-primary/25">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold font-heading text-text-primary">Autonomous Treasury Management</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/20 border border-primary/30 text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping inline-block" />
              LIVE
            </span>
          </div>
          <Link href="/agent" className="text-xs font-bold text-primary hover:text-primary-glow flex items-center gap-1 transition-all">
            View Agent Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <p className="text-sm text-muted relative z-10 max-w-2xl">
          AI agent monitors your treasury 24/7, creates governance proposals autonomously, and executes CCTP cross-chain transfers when approved by community vote. Deep Circle integration: CCTP burn-and-mint, Gateway nanopayments, Modular Smart Account.
        </p>
        <div className="grid grid-cols-3 gap-4 relative z-10">
          {[
            { label: "Agent Status", value: "WATCHING", color: "text-primary" },
            { label: "AI Model", value: "Groq Llama 3.3", color: "text-purple-400" },
            { label: "CCTP Enabled", value: "Arc → Sepolia", color: "text-blue-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface-elevated/60 rounded-xl p-3 border border-border-thin">
              <p className="text-xs text-muted mb-1">{stat.label}</p>
              <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="relative z-10">
          <Link
            href="/agent"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-purple to-accent-blue text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)]"
          >
            <Zap className="w-4 h-4" />
            Open Treasury Agent
          </Link>
        </div>
      </GlassCard>

      {/* ⚡ Creator DAOs Section */}
      <GlassCard className="p-6 border border-primary/20 bg-primary/[0.01] space-y-6" hover={false}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold font-heading text-text-primary">⚡ Creator DAOs</h2>
          </div>
          <Link href="/creator-daos" className="text-xs font-bold text-primary hover:text-primary-glow flex items-center gap-1 transition-all">
            View All Creator DAOs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Dynamic Aggregated Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="px-4 py-3 rounded-xl bg-surface/30 border border-border-thin/60">
            <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Active DAOs</span>
            <span className="text-lg font-bold text-success mt-1 block">{activeCampaigns}</span>
          </div>
          <div className="px-4 py-3 rounded-xl bg-surface/30 border border-border-thin/60">
            <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Total USDC Raised</span>
            <span className="text-lg font-bold text-purple-300 mt-1 block">{totalRaised.toLocaleString()} USDC</span>
          </div>
          <div className="px-4 py-3 rounded-xl bg-surface/30 border border-border-thin/60">
            <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">DAOs Funded</span>
            <span className="text-lg font-bold text-arc-blue mt-1 block">{fundedCount}</span>
          </div>
        </div>

        {/* Mini Creator DAOs list */}
        {featuredCampaigns.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-border-thin bg-surface/10 text-center space-y-2">
            <Rocket className="w-8 h-8 text-muted mx-auto" />
            <h4 className="text-sm font-bold text-text-primary">No Active DAOs</h4>
            <p className="text-xs text-muted max-w-sm mx-auto">No DAOs have been launched yet. Be the first to launch a community Creator DAO on Arc!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredCampaigns.map((c) => {
              const progress = Math.min(100, (c.raised / c.goal) * 100);
              return (
                <Link href={`/creator-daos/${c.id}`} key={c.id} className="block group">
                  <div className="p-4 rounded-xl border border-border-thin/80 bg-surface/20 group-hover:border-primary/20 group-hover:bg-primary/[0.01] transition-all flex flex-col justify-between h-full gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] px-2 py-0.2 rounded font-extrabold tracking-wide uppercase ${
                          c.isAgent 
                            ? "bg-purple-500/10 border border-purple-400/20 text-purple-300" 
                            : "bg-blue-500/10 border border-blue-400/20 text-blue-300"
                        }`}>
                          {c.isAgent ? "🤖 Agent" : "👤 Human"}
                        </span>
                        <span className="text-[9px] text-muted uppercase font-bold">{c.state}</span>
                      </div>
                      <h4 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{c.title}</h4>
                      <p className="text-xs text-muted leading-relaxed line-clamp-1">{c.description}</p>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-text-tertiary">
                        <span className="flex items-center gap-1 font-semibold text-text-secondary">
                          <Coins className="w-3 h-3 text-primary" />
                          {c.raised.toLocaleString()} / {c.goal.toLocaleString()} USDC
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {c.contributors} contributors
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* CTA Launch shortcut */}
        <div className="flex justify-end pt-2">
          <Link href="/create-dao">
            <button className="px-4 py-2.5 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white-keep font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] cursor-pointer">
              <Plus className="w-4 h-4" />
              🚀 Launch Creator DAO
            </button>
          </Link>
        </div>
      </GlassCard>
  
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold font-heading">Recent Proposals</h2>
            <Link href="/proposals" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <ProposalFeed />
        </div>
        <div className="space-y-4">
          <div className="mb-2">
            <h2 className="text-xl font-bold font-heading">Analytics</h2>
          </div>
          <GovernanceAnalytics />

          {/* Creator Economy Card */}
          {(() => {
            const activeCreators = creators.length;
            const totalCreatorFunds = creators.reduce((sum, c) => sum + c.raised, 0);
            const totalSupporters = creators.reduce((sum, c) => sum + c.supporters, 0);
            const avgSupport = totalSupporters > 0 ? totalCreatorFunds / totalSupporters : 0;
            const topCreators = [...creators].sort((a, b) => b.raised - a.raised).slice(0, 3);

            return (
              <GlassCard className="p-6 border border-primary/20 bg-primary/[0.01] space-y-6 mt-6" hover={false}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-extrabold font-heading text-text-primary uppercase tracking-wider">⚡ Creator Economy</h3>
                  </div>
                  <Link href="/leaderboard" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                
                {/* Creator Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="px-1.5 py-3 rounded-xl bg-surface/30 border border-border-thin">
                    <span className="text-[8px] uppercase font-bold text-muted tracking-wider block">Creators</span>
                    <span className="text-sm font-extrabold text-white mt-1 block">{activeCreators}</span>
                  </div>
                  <div className="px-1.5 py-3 rounded-xl bg-surface/30 border border-border-thin">
                    <span className="text-[8px] uppercase font-bold text-muted tracking-wider block">Total Raised</span>
                    <span className="text-sm font-extrabold text-success mt-1 block">{totalCreatorFunds.toLocaleString()} USDC</span>
                  </div>
                  <div className="px-1.5 py-3 rounded-xl bg-surface/30 border border-border-thin">
                    <span className="text-[8px] uppercase font-bold text-muted tracking-wider block">Avg Support</span>
                    <span className="text-xs font-extrabold text-purple-300 mt-1.5 block">{avgSupport.toFixed(2)} USDC</span>
                  </div>
                </div>

                {/* Top Creators Podium list */}
                <div className="space-y-2.5">
                  <span className="text-[9px] uppercase font-bold text-muted tracking-wider block">Top Ranked Creators</span>
                  {topCreators.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-border-thin bg-surface/10 text-center">
                      <p className="text-xs text-muted">No creators registered yet.</p>
                    </div>
                  ) : (
                    topCreators.map((creator, i) => (
                      <Link href={`/creator/${creator.id}`} key={creator.id} className="block group">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface/25 border border-border-subtle hover:border-primary/20 group-hover:bg-primary/[0.01] transition-all duration-300">
                          <div className="flex items-center gap-2">
                            <span className="text-xs select-none">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                            <span className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">{creator.name}</span>
                          </div>
                          <span className="text-xs font-bold text-purple-300">{creator.raised.toLocaleString()} USDC</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>

                <Link href="/create-dao" className="block">
                  <button className="w-full py-2.5 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white-keep font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] hover:shadow-[0_0_20px_rgba(124,58,237,0.45)] cursor-pointer">
                    <Plus className="w-4 h-4" />
                    Launch Creator DAO
                  </button>
                </Link>
              </GlassCard>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
