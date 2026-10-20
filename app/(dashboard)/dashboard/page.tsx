"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardTopCards } from "@/components/dashboard/DashboardTopCards";
import { LatestReleaseStrip } from "@/components/dashboard/LatestReleaseStrip";
import { useCampaignStore } from "@/hooks/useCampaignStore";
import { GlassCard } from "@/components/ui/GlassCard";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { ArrowRight, Rocket, Plus, Users, Trophy } from "lucide-react";
import Link from "next/link";
import { useCreatorStore } from "@/hooks/useCreatorStore";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";

// --- Lazy-loaded components ---
const OverviewCards = dynamic(
  () => import("@/components/dashboard/OverviewCards").then((m) => m.OverviewCards),
  {
    ssr: false,
    loading: () => <div className="skeleton h-32 w-full rounded-xl" />,
  }
);

const GovernanceHeroSection = dynamic(
  () => import("@/components/dashboard/GovernanceHeroSection").then((m) => m.GovernanceHeroSection),
  {
    ssr: false,
    loading: () => <div className="skeleton h-48 w-full rounded-xl" />,
  }
);

const WalletFaucetCard = dynamic(
  () => import("@/components/dashboard/WalletFaucetCard").then((m) => m.WalletFaucetCard),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 skeleton h-[220px] rounded-2xl" />
        <div className="skeleton h-[220px] rounded-2xl" />
        <div className="lg:col-span-3 skeleton h-[280px] rounded-2xl" />
      </div>
    ),
  }
);

const ProposalFeed = dynamic(
  () => import("@/components/proposals/ProposalFeed").then((m) => m.ProposalFeed),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-[88px] rounded-2xl" />
        ))}
      </div>
    ),
  }
);

const GovernanceAnalytics = dynamic(
  () => import("@/components/analytics/GovernanceAnalytics").then((m) => m.GovernanceAnalytics),
  {
    loading: () => <div className="skeleton h-[400px] w-full rounded-xl" />,
    ssr: false,
  }
);

export default function DashboardOverview() {
  const { isArcMainnet } = useArcNetwork();
  const { campaigns, initializeStore } = useCampaignStore();
  const { creators, initializeStore: initializeCreatorsStore } = useCreatorStore();
  const { proposals, initialized, initializeStore: initializeGovStore } = useGovernanceStore();

  useEffect(() => {
    initializeStore();
    initializeCreatorsStore();
    if (!initialized) initializeGovStore();
  }, [initializeStore, initializeCreatorsStore, initialized, initializeGovStore]);

  // Calculate stats
  const activeCampaigns = campaigns.filter(c => c.state === "Active" || c.state === "Voting").length;
  const totalRaised = campaigns.reduce((sum, c) => sum + c.raised, 0);
  const fundedCount = campaigns.filter(c => c.state === "Funded").length;
  
  // Get latest 2 campaigns as featured
  const featuredCampaigns = campaigns.slice(0, 2);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Auth-aware header: banner ("Public Governance Explorer") + Create Proposal button */}
      <DashboardHeader />

      {/* Top 3 Operational Cards: Treasury balance (live), Open proposals (live), Treasury guard status */}
      <DashboardTopCards />

      {/* Mainnet Latest Release Strip (reads real contract events; renders null if no events) */}
      <LatestReleaseStrip />

      {/* Governance Spotlight Hero Row (hidden on mainnet if 0 live proposals) */}
      {(!isArcMainnet || proposals.length > 0) && (
        <SectionErrorBoundary sectionName="Hero Spotlight">
          <GovernanceHeroSection />
        </SectionErrorBoundary>
      )}
  
      {/* Metrics */}
      <SectionErrorBoundary sectionName="Overview Cards">
        <OverviewCards />
      </SectionErrorBoundary>
  
      {/* Wallet Balance & Arc Testnet Faucet */}
      <SectionErrorBoundary sectionName="Wallet & Faucet">
        <WalletFaucetCard />
      </SectionErrorBoundary>

      {/* Creator DAOs Section: Hidden on mainnet when count is 0 */}
      {(!isArcMainnet || campaigns.length > 0) && (
        <SectionErrorBoundary sectionName="Creator DAOs">
          <GlassCard className="p-6 border border-brand/20 bg-brand/[0.01] space-y-6" hover={false}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-brand" />
                <h2 className="text-lg sm:text-xl font-bold font-heading text-text-primary">Creator DAOs</h2>
              </div>
              <Link href="/creator-daos" className="text-xs font-bold text-brand hover:text-brand-light flex items-center gap-1 transition-all">
                View All Creator DAOs <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Dynamic Aggregated Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="px-4 py-3 rounded-xl bg-surface/30 border border-border-thin/60">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Active DAOs</span>
                <span className="text-lg font-bold text-positive mt-1 block">{activeCampaigns}</span>
              </div>
              <div className="px-4 py-3 rounded-xl bg-surface/30 border border-border-thin/60">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Total USDC Raised</span>
                <span className="text-lg font-bold text-[#4F8BFF] mt-1 block">{totalRaised.toLocaleString()} USDC</span>
              </div>
              <div className="px-4 py-3 rounded-xl bg-surface/30 border border-border-thin/60">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">DAOs Funded</span>
                <span className="text-lg font-bold text-[#4F8BFF] mt-1 block">{fundedCount}</span>
              </div>
            </div>

            {/* Mini Creator DAOs list */}
            {featuredCampaigns.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-border-thin bg-surface/10 text-center space-y-2">
                <Rocket className="w-8 h-8 text-muted mx-auto" />
                <h4 className="text-sm font-bold text-text-primary">No Active Workspaces</h4>
                <p className="text-xs text-muted max-w-sm mx-auto">No workspaces have been launched yet. Be the first to launch a community project workspace!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredCampaigns.map((c) => {
                  const progress = Math.min(100, (c.raised / c.goal) * 100);
                  return (
                    <Link href={`/creator-daos/${c.id}`} key={c.id} className="block group">
                      <div className="p-4 rounded-xl border border-border-thin/80 bg-surface/20 group-hover:border-brand/20 group-hover:bg-brand/[0.01] transition-all flex flex-col justify-between h-full gap-3">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] px-2 py-0.2 rounded font-extrabold tracking-wide uppercase ${
                              c.isAgent 
                                ? "bg-[#2F6FFF]/10 border border-[#2F6FFF]/20 text-[#4F8BFF]" 
                                : "bg-white/5 border border-white/10 text-[#F5F7FA]"
                            }`}>
                              {c.isAgent ? "Agent" : "Human"}
                            </span>
                            <span className="text-[9px] text-muted uppercase font-bold">{c.state}</span>
                          </div>
                          <h4 className="text-sm font-bold text-text-primary group-hover:text-brand transition-colors">{c.title}</h4>
                          <p className="text-xs text-muted leading-relaxed line-clamp-1">{c.description}</p>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#2F6FFF] to-[#4F8BFF] transition-all duration-300" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-text-tertiary">
                            <span className="flex items-center gap-1 font-semibold text-text-secondary">
                              <TokenIcon symbol="USDC" size={12} />
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
                <button className="px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-light text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(47,111,255,0.2)] cursor-pointer">
                  <Plus className="w-4 h-4" />
                  Launch Creator DAO
                </button>
              </Link>
            </div>
          </GlassCard>
        </SectionErrorBoundary>
      )}
  
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg sm:text-xl font-bold font-heading">Recent Proposals</h2>
            <Link href="/proposals" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <SectionErrorBoundary sectionName="Recent Proposals Feed">
            <ProposalFeed />
          </SectionErrorBoundary>
        </div>
        <div className="space-y-4">
          <div className="mb-2">
            <h2 className="text-lg sm:text-xl font-bold font-heading">Analytics</h2>
          </div>
          <SectionErrorBoundary sectionName="Governance Analytics">
            <GovernanceAnalytics />
          </SectionErrorBoundary>

          {/* Creator Economy Card: Hidden on mainnet when count is 0 */}
          {(!isArcMainnet || creators.length > 0) && (
            (() => {
              const activeCreators = creators.length;
              const totalCreatorFunds = creators.reduce((sum, c) => sum + c.raised, 0);
              const totalSupporters = creators.reduce((sum, c) => sum + c.supporters, 0);
              const avgSupport = totalSupporters > 0 ? totalCreatorFunds / totalSupporters : 0;
              const topCreators = [...creators].sort((a, b) => b.raised - a.raised).slice(0, 3);

              return (
                <GlassCard className="p-6 border border-brand/20 bg-brand/[0.01] space-y-6 mt-6" hover={false}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-brand" />
                      <h3 className="text-sm font-extrabold font-heading text-text-primary uppercase tracking-wider">Creator Economy</h3>
                    </div>
                    <Link href="/leaderboard" className="text-xs font-bold text-brand hover:text-brand-light transition-colors flex items-center gap-0.5">
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
                      <span className="text-sm font-extrabold text-brand-light mt-1 block">{totalCreatorFunds.toLocaleString()} USDC</span>
                    </div>
                    <div className="px-1.5 py-3 rounded-xl bg-surface/30 border border-border-thin">
                      <span className="text-[8px] uppercase font-bold text-muted tracking-wider block">Avg Support</span>
                      <span className="text-xs font-extrabold text-brand-light mt-1.5 block">{avgSupport.toFixed(2)} USDC</span>
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
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface/25 border border-border-subtle hover:border-brand/20 group-hover:bg-brand/[0.01] transition-all duration-300">
                            <div className="flex items-center gap-2">
                              <span className="text-xs select-none">{`#${i + 1}`}</span>
                              <span className="text-xs font-bold text-text-primary group-hover:text-brand-light transition-colors">{creator.name}</span>
                            </div>
                            <span className="text-xs font-bold text-brand-light">{creator.raised.toLocaleString()} USDC</span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>

                  <Link href="/create-dao" className="block">
                    <button className="w-full py-2.5 rounded-xl bg-brand hover:bg-brand-light text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(47,111,255,0.2)] hover:shadow-[0_0_20px_rgba(47,111,255,0.45)] cursor-pointer">
                      <Plus className="w-4 h-4" />
                      Launch Creator DAO
                    </button>
                  </Link>
                </GlassCard>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}
