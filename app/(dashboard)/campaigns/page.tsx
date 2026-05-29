"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useCampaignStore } from "@/hooks/useCampaignStore";
import { AuthPromptBanner } from "@/components/auth/AuthPromptBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { 
  Rocket, 
  Plus, 
  Search, 
  Filter, 
  Coins, 
  Users, 
  Clock, 
  ArrowRight,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Grid,
  Bot,
  Briefcase,
  GitBranch,
  Globe,
  RefreshCw
} from "lucide-react";

export default function CampaignsPage() {
  const router = useRouter();
  const { isAuthenticated, login } = useAuth();
  const { campaigns, initialized, initializeStore } = useCampaignStore();
  const [filter, setFilter] = useState("All");
  const [badgeFilter, setBadgeFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  // Calculate dynamic stats
  const totalCampaigns = campaigns.length;
  const totalUSDCPercent = campaigns.reduce((acc, curr) => acc + curr.raised, 0);
  const activeCount = campaigns.filter(c => c.state === 'Active' || c.state === 'Voting').length;
  const fundedCount = campaigns.filter(c => c.state === 'Funded' || c.state === 'Completed').length;

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesFilter = filter === "All" || c.state === filter;
    
    let matchesBadge = true;
    if (badgeFilter === "Agent") {
      matchesBadge = c.isAgent;
    } else if (badgeFilter === "Human") {
      matchesBadge = !c.isAgent;
    }

    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.category.toLowerCase().includes(searchQuery.toLowerCase());
                          
    return matchesFilter && matchesBadge && matchesSearch;
  });

  const getDaysLeft = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr);
    const diff = deadline.getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days}d remaining` : "Ended";
  };

  // AI Reviewed Badge System
  const getAIBadge = (recommendation?: string) => {
    if (recommendation === 'FUND') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          🤖 AI Reviewed — Recommended ✅
        </span>
      );
    }
    if (recommendation === 'REVIEW') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide bg-amber-500/10 border border-amber-500/20 text-amber-400">
          🤖 AI Reviewed — Needs Review ⚠️
        </span>
      );
    }
    if (recommendation === 'REJECT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide bg-red-500/10 border border-red-500/20 text-red-400">
          🤖 AI Reviewed — High Risk ❌
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide bg-white/[0.04] border border-white/[0.08] text-muted/80">
        🤖 AI Review Pending...
      </span>
    );
  };

  const getLifecycleStateBadge = (state: string) => {
    const configs: Record<string, { color: string; icon: string }> = {
      Draft: { color: 'bg-white/10 border-white/20 text-muted', icon: '📝' },
      Active: { color: 'bg-blue-500/10 border-blue-400/20 text-blue-300', icon: '🚀' },
      Voting: { color: 'bg-purple-500/10 border-purple-400/20 text-purple-300 animate-pulse', icon: '🗳️' },
      Funded: { color: 'bg-emerald-500/10 border-emerald-400/20 text-emerald-300', icon: '✅' },
      Failed: { color: 'bg-red-500/10 border-red-400/20 text-red-300', icon: '❌' },
      Completed: { color: 'bg-amber-500/10 border-amber-400/25 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]', icon: '🏆' }
    };
    const c = configs[state] || configs['Active'];
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${c.color}`}>
        <span>{c.icon}</span> {state}
      </span>
    );
  };

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Auth prompt banner */}
        <AuthPromptBanner action="launch or contribute to crowdfunding campaigns" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              <span className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Rocket className="w-8 h-8" />
              </span>
              SynArc Crowdfund Hub
            </h1>
            <p className="text-muted mt-2 text-sm sm:text-base leading-relaxed">
              Permissionless USDC crowdfunding for humans and autonomous AI agents on Arc.
            </p>
          </div>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                login();
              } else {
                router.push("/campaigns/create");
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/95 transition-all shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] cursor-pointer shrink-0"
          >
            <Plus className="w-4.5 h-4.5" />
            Launch a Campaign
          </button>
        </div>

        {/* 9. Visual Architecture Separation Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-elevated/40 border border-border-thin rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.01] to-purple-glow/[0.01] pointer-events-none" />
          
          <div className="space-y-2 flex flex-col justify-between h-full">
            <div>
              <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <span className="p-1 rounded bg-blue-500/10 border border-blue-400/20 text-blue-400">🏛</span>
                SynArc Governance
              </h4>
              <p className="text-xs text-muted leading-relaxed mt-1">
                Protocol-wide governance upgrades, parameter alterations, delegate listings, and core DAO treasury allocations.
              </p>
            </div>
            <Link href="/proposals" className="text-xs font-bold text-primary hover:text-primary-glow flex items-center gap-1 pt-3">
              View Proposals <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          <div className="space-y-2 md:pl-6 md:border-l md:border-border-thin flex flex-col justify-between h-full">
            <div>
              <h4 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                <span className="p-1 rounded bg-purple-500/15 border border-purple-400/20 text-purple-300">⚡</span>
                Crowdfund Hub
              </h4>
              <p className="text-xs text-muted leading-relaxed mt-1">
                Permissionless coordinate platforms, dynamic milestone-locked escrows, and automated AI Risk due diligence.
              </p>
            </div>
            <Link href="/campaigns" className="text-xs font-bold text-purple-300 hover:text-purple-200 flex items-center gap-1 pt-3">
              Browse Campaigns <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-5 flex flex-col gap-1 border border-border-thin" hover={false}>
            <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-muted/60">Total Campaigns</span>
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-text-primary mt-1">{totalCampaigns}</span>
          </GlassCard>
          <GlassCard className="p-5 flex flex-col gap-1 border border-border-thin" hover={false}>
            <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-muted/60">Total USDC Raised</span>
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-primary-glow text-purple-300 mt-1">
              {totalUSDCPercent.toLocaleString()} USDC
            </span>
          </GlassCard>
          <GlassCard className="p-5 flex flex-col gap-1 border border-border-thin" hover={false}>
            <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-muted/60">Active Campaigns</span>
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-success mt-1">{activeCount}</span>
          </GlassCard>
          <GlassCard className="p-5 flex flex-col gap-1 border border-border-thin" hover={false}>
            <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-muted/60">Campaigns Funded</span>
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-arc-blue mt-1">{fundedCount}</span>
          </GlassCard>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col gap-4 bg-surface-elevated/40 p-4 rounded-2xl border border-border-thin backdrop-blur-md">
          {/* Main State Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar w-full sm:w-auto">
              <Filter className="w-4 h-4 text-text-tertiary shrink-0" />
              <div className="flex gap-2">
                {["All", "Active", "Voting", "Funded", "Failed", "Completed"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      filter === status 
                        ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(124,58,237,0.2)]" 
                        : "bg-surface/50 border-border-thin text-text-secondary hover:text-foreground hover:bg-surface"
                    } border`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input 
                type="text" 
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface/50 border border-border-thin rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-text-tertiary transition-colors"
              />
            </div>
          </div>

          {/* Badge Filter Tabs */}
          <div className="flex items-center gap-2 pt-2 border-t border-border-thin/40">
            <span className="text-xs text-text-tertiary font-bold uppercase tracking-wider shrink-0">Filter Type:</span>
            <div className="flex gap-2">
              {[
                { key: "All", label: "All Types" },
                { key: "Agent", label: "🤖 Autonomous Agent Fund" },
                { key: "Human", label: "👤 Human Campaign" }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setBadgeFilter(tab.key)}
                  className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    badgeFilter === tab.key
                      ? "bg-purple-500/15 border-purple-500/35 text-purple-300"
                      : "bg-transparent border-transparent text-text-tertiary hover:text-foreground"
                  } border`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Campaign List / Grid */}
        {initialized && filteredCampaigns.length === 0 ? (
          <EmptyState
            title="No campaigns found"
            description="Be the first to launch a permissionless crowdfunding campaign on Arc Network."
            action={
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    login();
                  } else {
                    router.push("/campaigns/create");
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] cursor-pointer"
              >
                Launch a Campaign
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign, i) => {
              const raisedPercent = Math.min(100, (campaign.raised / campaign.goal) * 100);
              const isAgent = campaign.isAgent;

              return (
                <GlassCard 
                  key={campaign.id} 
                  delay={i * 0.05} 
                  className="p-6 relative flex flex-col justify-between group overflow-hidden border border-border-thin/80 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(124,58,237,0.08)] h-full"
                >
                  {/* Subtle Glowing Background indicator */}
                  {campaign.state === 'Voting' && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-glow/5 rounded-full blur-xl animate-pulse pointer-events-none" />
                  )}

                  <div className="space-y-4">
                    {/* Badge */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        {isAgent ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-purple-500/15 border border-purple-400/25 text-purple-300 animate-pulse">
                            🤖 AUTONOMOUS AGENT FUND
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-blue-500/15 border border-blue-400/25 text-blue-300">
                            👤 HUMAN CAMPAIGN
                          </span>
                        )}

                        {getLifecycleStateBadge(campaign.state)}
                      </div>

                      {/* 2. AI Reviewed Badge System on Cards */}
                      <div>
                        {getAIBadge(campaign.aiAnalysis?.recommendation)}
                      </div>
                    </div>

                    {/* Title & Category */}
                    <div>
                      <h3 className="text-xl font-bold font-heading text-text-primary group-hover:text-primary transition-colors duration-300 leading-tight">
                        {campaign.title}
                      </h3>
                      <span className="inline-block mt-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest bg-surface-elevated border border-border-thin px-2 py-0.5 rounded">
                        {campaign.category}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-muted text-sm leading-relaxed line-clamp-3">
                      {campaign.description}
                    </p>

                    {/* 1. Escrow Trust Notice */}
                    <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-[10.5px] text-purple-300 leading-normal flex items-start gap-2">
                      <span className="shrink-0 text-xs">🔒</span>
                      <span>Funds are escrowed until governance approves milestone completion. Treasury cannot arbitrarily drain funds.</span>
                    </div>
                  </div>

                  {/* Funding stats & Progress */}
                  <div className="space-y-4 mt-6 pt-4 border-t border-border-thin/40">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary font-medium">Progress</span>
                        <span className="font-bold text-text-primary">{raisedPercent.toFixed(0)}%</span>
                      </div>
                      
                      {/* Custom premium Progress bar */}
                      <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border-thin/40">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500" 
                          style={{ width: `${raisedPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-text-secondary py-1">
                      <div className="flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-primary" />
                        <span><strong>{campaign.raised.toLocaleString()}</strong> of {campaign.goal.toLocaleString()} USDC</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <Users className="w-3.5 h-3.5 text-muted" />
                        <span><strong>{campaign.contributors}</strong> contributors</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-1 text-text-tertiary">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{getDaysLeft(campaign.deadline)}</span>
                      </div>

                      <Link 
                        href={`/campaigns/${campaign.id}`}
                        className="inline-flex items-center gap-1 font-bold text-xs text-primary group-hover:text-primary-glow hover:underline transition-all cursor-pointer"
                      >
                        View Campaign
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>

                </GlassCard>
              );
            })}
          </div>
        )}

        {/* 10. Agentic Capital Vision Section */}
        <div className="pt-8">
          <GlassCard className="p-8 border border-primary/20 bg-gradient-to-b from-primary/[0.01] to-primary/[0.03] space-y-6 text-center overflow-hidden relative" hover={false}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.06),transparent_60%)] pointer-events-none" />
            
            <div className="space-y-2 relative z-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading text-text-primary">
                🌐 The Future — Agentic Capital Coordination
              </h2>
              <p className="text-sm text-muted max-w-2xl mx-auto leading-relaxed">
                SynArc campaigns are evolving into autonomous economic actors. Each campaign will eventually transform into a self-governing subDAO with its own:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left relative z-10 pt-4 max-w-4xl mx-auto">
              {[
                { icon: "💼", title: "Campaign Treasury Wallet", desc: "Independent secure multisigs holding locked collateral", status: "Coming Soon" },
                { icon: "🏛", title: "Campaign Governance", desc: "Local consensus layers voting on operational changes", status: "Coming Soon" },
                { icon: "🤖", title: "AI-Managed Allocations", desc: "Yield optimization filters executed dynamically", status: "Coming Soon" },
                { icon: "🔄", title: "Recurring Milestone Voting", desc: "Continuous streams disbursed based on cycle approvals", status: "Coming Soon" },
                { icon: "🔗", title: "SubDAO Formation", desc: "Modular framework spawning child organizations on Arc", status: "Planned" },
                { icon: "🌐", title: "Cross-chain Campaign Funding", desc: "Interoperable stablecoin deposits via Circle CCTP", status: "Planned" }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border-thin bg-surface/30 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xl select-none">{item.icon}</span>
                      <span className={`text-[8.5px] px-2 py-0.2 rounded font-extrabold uppercase tracking-widest ${
                        item.status === 'Coming Soon' 
                          ? 'bg-primary/10 border border-primary/20 text-purple-300' 
                          : 'bg-white/[0.04] border border-white/[0.08] text-muted'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-text-primary pt-1">{item.title}</h4>
                    <p className="text-[11px] text-muted leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs font-bold italic text-purple-300 tracking-wider relative z-10 pt-4">
              SynArc is becoming programmable capital infrastructure for the agentic internet. Built on Arc. Powered by USDC.
            </p>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
