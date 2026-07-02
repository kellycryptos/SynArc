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
  RefreshCw,
  ExternalLink,
  Shield
} from "lucide-react";
import { DAO_REGISTRY } from "@/data/daos";
import { ethers, Contract, formatUnits } from "ethers";
import { getResilientProvider } from "@/lib/rpc/config";

export default function CampaignsPage() {
  const router = useRouter();
  const { isAuthenticated, login } = useAuth();
  const { campaigns, initialized, initializeStore } = useCampaignStore();
  const [filter, setFilter] = useState("All");
  const [badgeFilter, setBadgeFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Live contract metrics for SynArc DAO
  const [synarcMembers, setSynarcMembers] = useState<number | null>(null);
  const [synarcTreasury, setSynarcTreasury] = useState<number | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  // Fetch live metrics for SynArc DAO from smart contracts
  useEffect(() => {
    async function fetchSynArcLiveMetrics() {
      try {
        setMetricsLoading(true);
        const provider = await getResilientProvider();
        
        // 1. Fetch live treasury balance
        const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_ADDRESS || "0xFE0F6bF45D363d34CD5fC1781594a7471736dC18";
        const TREASURY_ABI = [
          "function usdcBalance() external view returns (uint256)",
          "function eurcBalance() external view returns (uint256)"
        ];
        const treasuryContract = new Contract(treasuryAddress, TREASURY_ABI, provider);
        const [usdcBal, eurcBal] = await Promise.all([
          treasuryContract.usdcBalance().catch(() => 0n),
          treasuryContract.eurcBalance().catch(() => 0n)
        ]);
        const usdcVal = Number(formatUnits(usdcBal, 6));
        const eurcVal = Number(formatUnits(eurcBal, 6));
        const combinedTreasury = usdcVal + (eurcVal * 1.08); // combined USD value
        setSynarcTreasury(combinedTreasury);

        setSynarcMembers(12); // fast fallback for members on dashboard preview
      } catch (err) {
        console.error("Failed to fetch live contract reads for SynArc DAO", err);
      } finally {
        setMetricsLoading(false);
      }
    }

    fetchSynArcLiveMetrics();
  }, []);

  // Calculate dynamic stats
  const totalCampaigns = campaigns.length;
  const totalUSDCPercent = campaigns.reduce((acc, curr) => acc + curr.raised, 0);
  const activeCount = campaigns.filter(c => c.state === 'Active' || c.state === 'Voting').length;
  const fundedCount = campaigns.filter(c => c.state === 'Funded' || c.state === 'Completed').length;

  // Create combined list of Creator Campaigns and Ecosystem Partner DAOs
  const combinedItems = [
    ...campaigns.map(c => ({
      type: "campaign" as const,
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      state: c.state,
      isAgent: c.isAgent,
      data: c
    })),
    ...DAO_REGISTRY.map(d => {
      const isSynArc = d.id === 'synarc';
      const members = isSynArc && synarcMembers !== null ? synarcMembers : (d.members || 0);
      const treasury = isSynArc && synarcTreasury !== null ? synarcTreasury : (d.treasury || 0);
      return {
        type: "ecosystem" as const,
        id: d.id,
        title: d.name,
        description: d.description,
        category: d.category,
        state: "Active" as const,
        isAgent: d.id === 'synarc',
        data: {
          ...d,
          members,
          treasury
        }
      };
    })
  ];

  // Apply filters on the combined items
  const filteredItems = combinedItems.filter((item) => {
    // 1. Lifecycle filter: Standard/Ecosystem DAOs are Active
    const matchesFilter = filter === "All" || item.state === filter;

    // 2. Badge Filter
    let matchesBadge = true;
    if (badgeFilter === "Agent") {
      matchesBadge = item.isAgent && item.type === "campaign";
    } else if (badgeFilter === "Human") {
      matchesBadge = !item.isAgent && item.type === "campaign";
    } else if (badgeFilter === "EcosystemDAO") {
      matchesBadge = item.type === "ecosystem";
    }

    // 3. Search query
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

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
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Auth prompt banner */}
        <AuthPromptBanner action="launch or contribute to Creator DAOs" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <span className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Rocket className="w-8 h-8" />
              </span>
              SynArc Workspaces
            </h1>
            <p className="text-muted mt-2 text-sm sm:text-base leading-relaxed">
              Secure, milestone-based funding and transparent governance templates for creators, independent teams, and digital organizations.
            </p>
          </div>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                login();
              } else {
                router.push("/create-dao");
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent-purple text-white-keep font-bold text-sm hover:bg-accent-purple/90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] cursor-pointer shrink-0"
          >
            <Plus className="w-4.5 h-4.5" />
            Launch Creator DAO
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
                Creator DAOs
              </h4>
              <p className="text-xs text-muted leading-relaxed mt-1">
                Permissionless coordinate platforms, dynamic milestone-locked escrows, and automated AI Risk due diligence.
              </p>
            </div>
            <Link href="/creator-daos" className="text-xs font-bold text-purple-300 hover:text-purple-200 flex items-center gap-1 pt-3">
              Explore Creator DAOs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-5 flex flex-col gap-1 border border-border-thin" hover={false}>
            <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-muted/60">Total Creator DAOs</span>
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-text-primary mt-1">{totalCampaigns}</span>
          </GlassCard>
          <GlassCard className="p-5 flex flex-col gap-1 border border-border-thin" hover={false}>
            <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-muted/60">Total USDC Raised</span>
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-primary-glow text-purple-300 mt-1">
              {totalUSDCPercent.toLocaleString()} USDC
            </span>
          </GlassCard>
          <GlassCard className="p-5 flex flex-col gap-1 border border-border-thin" hover={false}>
            <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-muted/60">Active DAOs</span>
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-success mt-1">{activeCount}</span>
          </GlassCard>
          <GlassCard className="p-5 flex flex-col gap-1 border border-border-thin" hover={false}>
            <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-muted/60">DAOs Funded</span>
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
                        ? "bg-accent-purple text-white-keep border-accent-purple shadow-[0_0_15px_rgba(124,58,237,0.2)]" 
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
                placeholder="Search Creator DAOs..."
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
                { key: "Agent", label: "🤖 Automated Treasuries" },
                { key: "Human", label: "👤 Creator Workspaces" },
                { key: "EcosystemDAO", label: "🏛 Community Workspaces" }
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
        {!initialized ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <GlassCard key={i} className="p-6 h-[420px] flex flex-col justify-between border border-border-thin animate-pulse" hover={false}>
                <div className="space-y-4 w-full">
                  <div className="flex justify-between items-center">
                    <div className="h-5 bg-surface-elevated rounded-full w-24" />
                    <div className="h-5 bg-surface-elevated rounded-full w-16" />
                  </div>
                  <div className="h-7 bg-surface-elevated rounded-lg w-3/4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-surface-elevated rounded w-full" />
                    <div className="h-4 bg-surface-elevated rounded w-5/6" />
                  </div>
                  <div className="h-10 bg-surface-elevated/40 rounded-xl w-full" />
                </div>
                <div className="space-y-3 w-full pt-4 border-t border-border-thin/40">
                  <div className="h-3 bg-surface-elevated rounded w-full" />
                  <div className="flex justify-between">
                    <div className="h-3 bg-surface-elevated rounded w-1/3" />
                    <div className="h-3 bg-surface-elevated rounded w-1/4" />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="No DAOs or Creator Campaigns found"
            description="Be the first to launch a permissionless Creator DAO or submit an Ecosystem DAO."
            action={
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    login();
                  } else {
                    router.push("/create-dao");
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-purple text-white-keep font-semibold text-sm hover:bg-accent-purple/90 transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] cursor-pointer"
              >
                Launch Creator DAO
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, i) => {
              if (item.type === "campaign") {
                const campaign = item.data;
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
                              👤 HUMAN CREATOR DAO
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
                          href={`/creator-daos/${campaign.id}`}
                          className="inline-flex items-center gap-1 font-bold text-xs text-primary group-hover:text-primary-glow hover:underline transition-all cursor-pointer"
                        >
                          View Creator DAO
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>

                  </GlassCard>
                );
              } else {
                const dao = item.data;
                const initials = dao.name.slice(0, 2).toUpperCase();

                return (
                  <GlassCard 
                    key={dao.id} 
                    delay={i * 0.05} 
                    className="p-6 relative flex flex-col justify-between group overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(124,58,237,0.08)] h-full"
                  >
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-primary/20 border border-primary/30 text-[9px] font-extrabold uppercase text-purple-300 tracking-wider">
                      Featured Partner
                    </div>

                    <div className="space-y-4">
                      {/* Badge */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-purple-500/15 border border-purple-400/25 text-purple-300">
                          🏛 ECOSYSTEM PARTNER DAO
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-success/15 border border-success/30 text-[9px] font-bold text-success">
                          ✅ Verified
                        </span>
                      </div>

                      {/* Header (Logo + Title) */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md relative overflow-hidden bg-gradient-to-br from-purple-deep to-primary/40 shrink-0">
                          {dao.logo ? (
                            <img 
                              src={dao.logo} 
                              alt={dao.name} 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                e.currentTarget.src = '/dao-placeholder.png';
                              }}
                            />
                          ) : (
                            <span className="text-xs font-extrabold text-white">{initials}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-white text-lg group-hover:text-primary transition-colors leading-tight">
                            {dao.name}
                          </h3>
                          <span className="inline-block mt-1 text-[9px] font-bold text-text-secondary uppercase tracking-widest bg-surface-elevated border border-border-thin px-2 py-0.5 rounded">
                            {dao.category}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-muted text-sm leading-relaxed line-clamp-3">
                        {dao.description}
                      </p>

                      {/* Escrow Notice */}
                      <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-[10.5px] text-purple-300 leading-normal flex items-start gap-2">
                        <span className="shrink-0 text-xs">🏛</span>
                        <span>Verified Ecosystem Protocol integrated with SynArc decentralized governance networks.</span>
                      </div>
                    </div>

                    {/* Stats & Link */}
                    <div className="space-y-4 mt-6 pt-4 border-t border-border-thin/40">
                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                        <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl flex flex-col gap-1">
                          <span className="text-muted/60 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-primary/70" />
                            Members
                          </span>
                          <span className="text-white font-mono font-extrabold text-base">
                            {metricsLoading && dao.id === 'synarc' ? (
                              <span className="block w-12 h-5 bg-white/5 animate-pulse rounded" />
                            ) : (
                              dao.members?.toLocaleString() || "0"
                            )}
                          </span>
                        </div>
                        <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl flex flex-col gap-1">
                          <span className="text-muted/60 flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-arc-blue/70" />
                            Treasury
                          </span>
                          <span className="text-white font-mono font-extrabold text-base">
                            {metricsLoading && dao.id === 'synarc' ? (
                              <span className="block w-16 h-5 bg-white/5 animate-pulse rounded" />
                            ) : (
                              `$${dao.treasury?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "0"}`
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-1 text-text-tertiary">
                          <Globe className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[120px] font-mono">{dao.website ? new URL(dao.website).hostname : "synarcdao.xyz"}</span>
                        </div>

                        {dao.id === 'synarc' ? (
                          <Link 
                            href={`/daos/${dao.id}`}
                            className="inline-flex items-center gap-1 font-bold text-xs text-primary group-hover:text-primary-glow hover:underline transition-all cursor-pointer"
                          >
                            Enter DAO
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        ) : (
                          <a 
                            href={dao.website || "#"} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-xs text-primary group-hover:text-primary-glow hover:underline transition-all cursor-pointer"
                          >
                            Visit Website
                            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </a>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                );
              }
            })
          }
          </div>
        )}

        {/* 10. Future Vision Section */}
        <div className="pt-8">
          <GlassCard className="p-8 border border-primary/20 bg-gradient-to-b from-primary/[0.01] to-primary/[0.03] space-y-6 text-center overflow-hidden relative" hover={false}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.06),transparent_60%)] pointer-events-none" />
            
            <div className="space-y-2 relative z-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading text-text-primary">
                🌐 The Future of Creator Funding
              </h2>
              <p className="text-sm text-muted max-w-2xl mx-auto leading-relaxed">
                Creator DAOs are the building blocks of community-owned projects. Every Creator DAO has access to:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left relative z-10 pt-4 max-w-4xl mx-auto">
              {[
                { icon: "💼", title: "Campaign Treasury Wallet", desc: "Independent secure wallets that hold community-backed funds in escrow", status: "Live on Testnet" },
                { icon: "🏛", title: "Campaign Governance", desc: "Simple on-chain voting for community members to decide on fund releases", status: "Live on Testnet" },
                { icon: "🤖", title: "AI-Managed Allocations", desc: "Enable automated sweeps, scheduled payouts, and yield optimization via Treasury Guard", status: "Beta" },
                { icon: "🔄", title: "Recurring Milestone Voting", desc: "Milestone-based fund releases to protect backer capital", status: "Beta" },
                { icon: "🔗", title: "SubDAO Formation", desc: "Spawning smaller project groups or sub-teams with local coordination tools", status: "Planned" },
                { icon: "🌐", title: "Cross-chain Campaign Funding", desc: "Accepting community funding seamlessly from other networks", status: "Planned" }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border-thin bg-surface/30 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xl select-none">{item.icon}</span>
                      <span className={`text-[8.5px] px-2 py-0.5 rounded font-extrabold uppercase tracking-widest border ${
                        item.status === 'Live on Testnet'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : item.status === 'Beta'
                          ? 'bg-primary/10 border-primary/20 text-purple-300'
                          : 'bg-white/[0.04] border-white/[0.08] text-muted'
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
              SynArc provides secure, transparent funding infrastructure for creators and decentralized organizations to build together with their communities.
            </p>
          </GlassCard>
        </div>


    </div>
  );
}
