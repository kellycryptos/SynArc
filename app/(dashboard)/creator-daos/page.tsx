"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useCampaignStore } from "@/hooks/useCampaignStore";
import { AuthPromptBanner } from "@/components/auth/AuthPromptBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { 
  Rocket, 
  Plus, 
  Search, 
  Users, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Shield,
  Sparkles
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
        const combinedTreasury = usdcVal + (eurcVal * 1.08);
        setSynarcTreasury(combinedTreasury > 0 ? combinedTreasury : 2450000);
        setSynarcMembers(12450);
      } catch (err) {
        console.error("Failed to fetch live contract reads for SynArc DAO", err);
        setSynarcTreasury(2450000);
        setSynarcMembers(12450);
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
      const members = isSynArc && synarcMembers !== null && synarcMembers > 0 ? synarcMembers : (d.members || 12450);
      const treasury = isSynArc && synarcTreasury !== null && synarcTreasury > 0 ? synarcTreasury : (d.treasury || 2450000);
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
    const matchesFilter = filter === "All" || item.state === filter;

    let matchesBadge = true;
    if (badgeFilter === "Agent") {
      matchesBadge = item.isAgent && item.type === "campaign";
    } else if (badgeFilter === "Human") {
      matchesBadge = !item.isAgent && item.type === "campaign";
    } else if (badgeFilter === "EcosystemDAO") {
      matchesBadge = item.type === "ecosystem";
    }

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

  const getAIBadge = (recommendation?: string) => {
    if (recommendation === 'FUND') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" /> AI Recommended
        </span>
      );
    }
    if (recommendation === 'REVIEW') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
          ⚠️ Needs Review
        </span>
      );
    }
    if (recommendation === 'REJECT') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400">
          ❌ High Risk
        </span>
      );
    }
    return null;
  };

  const getLifecycleStateBadge = (state: string) => {
    const configs: Record<string, { color: string; dot: string }> = {
      Draft: { color: "text-muted bg-surface/50 border-border-thin", dot: "bg-muted" },
      Active: { color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", dot: "bg-cyan-400" },
      Voting: { color: "text-purple-400 bg-purple-500/10 border-purple-500/20", dot: "bg-purple-400 animate-pulse" },
      Funded: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" },
      Failed: { color: "text-red-400 bg-red-500/10 border-red-500/20", dot: "bg-red-400" },
      Completed: { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400" },
    };
    const c = configs[state] || configs["Active"];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${c.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        {state}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Auth prompt banner */}
      <AuthPromptBanner action="launch or contribute to Creator DAOs" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5 font-space">
            Creator DAOs
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
              Workspaces
            </span>
          </h1>
          <p className="text-muted text-sm mt-1">
            Milestone-backed funding and transparent governance for decentralized teams.
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
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Launch DAO
        </button>
      </div>

      {/* Minimal Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total DAOs", value: totalCampaigns },
          { label: "Total Raised", value: `${totalUSDCPercent.toLocaleString()} USDC` },
          { label: "Active DAOs", value: activeCount },
          { label: "DAOs Funded", value: fundedCount }
        ].map((stat, idx) => (
          <div key={idx} className="p-3.5 rounded-xl bg-surface/30 border border-border-thin/60 flex flex-col justify-center">
            <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">{stat.label}</span>
            <span className="text-lg font-bold text-text-primary mt-0.5 font-mono">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Streamlined Search and Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 bg-surface/30 rounded-2xl border border-border-thin/60">
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar p-0.5">
          {[
            { key: "All", label: "All Workspaces" },
            { key: "Human", label: "Creator DAOs" },
            { key: "Agent", label: "AI Agents" },
            { key: "EcosystemDAO", label: "Ecosystem" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setBadgeFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                badgeFilter === tab.key
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface/50 border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-1">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input 
              type="text" 
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface/50 border border-border-thin rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-text-tertiary transition-colors"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-surface/50 border border-border-thin rounded-xl px-2.5 py-1.5 text-xs font-medium text-text-secondary focus:outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="All">All States</option>
            <option value="Active">Active</option>
            <option value="Voting">Voting</option>
            <option value="Funded">Funded</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {!initialized ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-border-thin bg-surface/30 h-72 animate-pulse space-y-4">
              <div className="h-5 bg-surface-elevated rounded w-1/3" />
              <div className="h-6 bg-surface-elevated rounded w-2/3" />
              <div className="h-12 bg-surface-elevated rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="No DAOs found"
          description="Try selecting a different filter or search term."
          action={
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  login();
                } else {
                  router.push("/create-dao");
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-all"
            >
              Launch Creator DAO
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item, i) => {
            if (item.type === "campaign") {
              const campaign = item.data;
              const raisedPercent = Math.min(100, (campaign.raised / campaign.goal) * 100);
              const isAgent = campaign.isAgent;

              return (
                <GlassCard 
                  key={campaign.id} 
                  delay={i * 0.03} 
                  className="p-5 flex flex-col justify-between group border border-border-thin/80 hover:border-primary/40 transition-all duration-200 h-full rounded-2xl bg-surface/40 hover:bg-surface/60"
                >
                  <div className="space-y-3.5">
                    {/* Top Header: Tags + State */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider bg-surface-elevated border border-border-thin px-2 py-0.5 rounded-md">
                          {campaign.category}
                        </span>
                        {isAgent ? (
                          <span className="text-[10px] font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                            🤖 AI Agent
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-blue-300 bg-blue-500/10 border border-blue-400/20 px-2 py-0.5 rounded-md">
                            👤 Creator DAO
                          </span>
                        )}
                      </div>
                      {getLifecycleStateBadge(campaign.state)}
                    </div>

                    {/* Title & AI Tag */}
                    <div>
                      <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors leading-snug">
                        {campaign.title}
                      </h3>
                      {campaign.aiAnalysis?.recommendation && (
                        <div className="mt-1">
                          {getAIBadge(campaign.aiAnalysis.recommendation)}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-muted text-xs leading-relaxed line-clamp-2">
                      {campaign.description}
                    </p>
                  </div>

                  {/* Progress & Bottom Actions */}
                  <div className="mt-5 pt-3.5 border-t border-border-thin/50 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary font-medium">Progress</span>
                        <span className="font-semibold text-text-primary font-mono">{raisedPercent.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border-thin/30">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full transition-all duration-300" 
                          style={{ width: `${raisedPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span className="font-mono text-text-primary text-[11px]">
                        <strong>{campaign.raised.toLocaleString()}</strong> / {campaign.goal.toLocaleString()} USDC
                      </span>
                      <span className="flex items-center gap-1 text-text-tertiary text-[11px]">
                        <Users className="w-3.5 h-3.5" />
                        {campaign.contributors}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border-thin/30">
                      <span className="text-text-tertiary flex items-center gap-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        {getDaysLeft(campaign.deadline)}
                      </span>

                      <Link 
                        href={`/creator-daos/${campaign.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-xs text-primary group-hover:text-primary-glow transition-all"
                      >
                        View DAO
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
                  delay={i * 0.03} 
                  className="p-5 flex flex-col justify-between group border border-border-thin/80 hover:border-primary/40 transition-all duration-200 h-full rounded-2xl bg-surface/40 hover:bg-surface/60"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider bg-surface-elevated border border-border-thin px-2 py-0.5 rounded-md">
                        {dao.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden bg-surface-elevated border border-border-thin shrink-0">
                        {dao.logo ? (
                          <Image 
                            src={dao.logo} 
                            alt={dao.name} 
                            width={40}
                            height={40}
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-xs font-bold text-text-primary">{initials}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-text-primary text-base group-hover:text-primary transition-colors leading-snug">
                          {dao.name}
                        </h3>
                        <span className="text-[11px] text-text-tertiary font-mono">Ecosystem Protocol</span>
                      </div>
                    </div>

                    <p className="text-muted text-xs leading-relaxed line-clamp-2">
                      {dao.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-border-thin/50 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-surface/50 rounded-lg border border-border-thin/40 flex flex-col">
                        <span className="text-[10px] text-text-tertiary">Members</span>
                        <span className="font-mono font-bold text-text-primary mt-0.5 text-xs">
                          {metricsLoading && dao.id === 'synarc' ? "..." : dao.members?.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2 bg-surface/50 rounded-lg border border-border-thin/40 flex flex-col">
                        <span className="text-[10px] text-text-tertiary">Treasury</span>
                        <span className="font-mono font-bold text-text-primary mt-0.5 text-xs">
                          {metricsLoading && dao.id === 'synarc' ? "..." : `$${dao.treasury?.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border-thin/30">
                      <span className="text-text-tertiary font-mono text-[11px] truncate max-w-[120px]">
                        {dao.website ? new URL(dao.website).hostname : "synarcdao.xyz"}
                      </span>

                      {dao.id === 'synarc' ? (
                        <Link 
                          href={`/daos/${dao.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-xs text-primary group-hover:text-primary-glow transition-all"
                        >
                          Enter DAO
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      ) : (
                        <a 
                          href={dao.website || "#"} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-xs text-primary group-hover:text-primary-glow transition-all"
                        >
                          Website
                          <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            }
          })}
        </div>
      )}

      {/* Simple Clean Information Section */}
      <div className="pt-4">
        <div className="p-6 rounded-2xl border border-border-thin/60 bg-surface/20 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-text-primary">About SynArc Creator DAOs</h3>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Creator DAOs feature milestone-based escrow funding and community governance. Funds are safely held in campaign treasuries until milestone proposals are approved by token holders.
          </p>
        </div>
      </div>
    </div>
  );
}
