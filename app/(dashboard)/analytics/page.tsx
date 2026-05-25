"use client";

import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { useTreasury } from "@/hooks/useTreasury";
import { GlassCard } from "@/components/ui/GlassCard";
import { BarChart3, TrendingUp, Users, Activity, AlertCircle, RefreshCw, Calendar } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { ethers, JsonRpcProvider, Contract, formatUnits } from "ethers";
import { GOVERNANCE_CONTRACTS, ERC20ABI, GovernorABI } from "@/lib/governance/contracts";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

export default function AnalyticsPage() {
  const { proposals, metrics, initialized, initializeStore } = useGovernanceStore();
  const { balance, activities, loading: treasuryLoading, error: treasuryError, refetch: refetchTreasury } = useTreasury();
  const [dateFilter, setDateFilter] = useState<"7d" | "30d" | "all">("all");
  const [activeVoters, setActiveVoters] = useState<{ address: string; votesCount: number; power: number }[]>([]);
  const [votersLoading, setVotersLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initializeStore();
  }, [initializeStore]);

  // Fetch active voters from VoteCast events
  useEffect(() => {
    async function loadActiveVoters() {
      try {
        setVotersLoading(true);
        const rpcUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network";
        let provider;
        try {
          provider = new JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
          await provider.getNetwork();
        } catch {
          provider = new JsonRpcProvider("https://arc-testnet.drpc.org", undefined, { staticNetwork: true });
        }

        const governorAddress = GOVERNANCE_CONTRACTS.governor;
        const governorContract = new Contract(governorAddress, GovernorABI, provider);

        const filter = governorContract.filters.VoteCast();
        const events = await governorContract.queryFilter(filter, 0, "latest");
        
        const voterCounts = new Map<string, number>();
        const voterPower = new Map<string, number>();

        events.forEach(event => {
          const log = event as ethers.EventLog;
          if (log.args) {
            const voter = log.args[0] as string;
            const weight = Number(formatUnits(log.args[3], 6)); // USDC 6 decimals
            voterCounts.set(voter, (voterCounts.get(voter) || 0) + 1);
            voterPower.set(voter, Math.max(voterPower.get(voter) || 0, weight));
          }
        });

        const sortedVoters = Array.from(voterCounts.entries()).map(([address, count]) => ({
          address,
          votesCount: count,
          power: voterPower.get(address) || 0,
        })).sort((a, b) => b.votesCount - a.votesCount).slice(0, 5);

        setActiveVoters(sortedVoters);
      } catch (err) {
        console.error("Failed to load active voters:", err);
      } finally {
        setVotersLoading(false);
      }
    }

    loadActiveVoters();
  }, [proposals]);

  // Date Range Filtering
  const filteredProposals = useMemo(() => {
    const now = Date.now();
    return proposals.filter(p => {
      const createdAtTime = new Date(p.createdAt).getTime();
      if (dateFilter === "7d") return now - createdAtTime <= 7 * 86400 * 1000;
      if (dateFilter === "30d") return now - createdAtTime <= 30 * 86400 * 1000;
      return true;
    });
  }, [proposals, dateFilter]);

  const filteredActivities = useMemo(() => {
    const now = Date.now();
    return activities.filter(act => {
      const actTime = new Date(act.timestamp).getTime();
      if (dateFilter === "7d") return now - actTime <= 7 * 86400 * 1000;
      if (dateFilter === "30d") return now - actTime <= 30 * 86400 * 1000;
      return true;
    });
  }, [activities, dateFilter]);

  // Calculations
  const totalVotesCast = useMemo(() => {
    return filteredProposals.reduce((sum, p) => sum + p.totalVotes, 0);
  }, [filteredProposals]);

  const executedCount = filteredProposals.filter(p => p.status === "Executed").length;
  const defeatedCount = filteredProposals.filter(p => p.status === "Defeated").length;
  const proposalPassRate = useMemo(() => {
    const completed = executedCount + defeatedCount;
    if (completed === 0) return "100.0";
    return ((executedCount / completed) * 100).toFixed(1);
  }, [executedCount, defeatedCount]);

  const avgParticipation = useMemo(() => {
    if (filteredProposals.length === 0) return "0.0";
    const sum = filteredProposals.reduce((acc, p) => acc + p.participationPercentage, 0);
    return (sum / filteredProposals.length).toFixed(1);
  }, [filteredProposals]);

  // Line Chart — Treasury balance over time
  const treasuryTrendData = useMemo(() => {
    let runningBalance = balance;
    // Reconstruction of balance backwards chronologically
    const trend = filteredActivities.map(act => {
      const point = {
        date: new Date(act.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        balance: runningBalance,
      };
      if (act.type === "Inflow") {
        runningBalance -= act.amount;
      } else if (act.type === "Outflow") {
        runningBalance += act.amount;
      }
      return point;
    }).reverse();

    if (trend.length === 0) {
      return [{ date: "Now", balance }];
    }
    // Add current balance as final endpoint
    return [...trend, { date: "Current", balance }];
  }, [balance, filteredActivities]);

  // Bar Chart — Proposals per month
  const proposalsPerMonth = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const groups: Record<string, number> = {};
    const now = new Date();
    const rangeLabels = [];

    // Last 6 months labels
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      groups[label] = 0;
      rangeLabels.push(label);
    }

    filteredProposals.forEach(p => {
      const date = new Date(p.createdAt);
      const label = `${months[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
      if (groups[label] !== undefined) {
        groups[label]++;
      }
    });

    return rangeLabels.map(name => ({
      name,
      proposals: groups[name],
    }));
  }, [filteredProposals]);

  // Pie Chart — Vote distribution
  const voteDistribution = useMemo(() => {
    let forVotes = 0;
    let againstVotes = 0;
    let abstainVotes = 0;

    filteredProposals.forEach(p => {
      forVotes += p.forVotes;
      againstVotes += p.againstVotes;
      abstainVotes += p.abstainVotes;
    });

    if (forVotes === 0 && againstVotes === 0 && abstainVotes === 0) {
      return [
        { name: "For", value: 1, color: "#10B981" },
        { name: "Against", value: 0, color: "#EF4444" },
        { name: "Abstain", value: 0, color: "#6B7280" }
      ];
    }

    return [
      { name: "For", value: forVotes, color: "#10B981" },
      { name: "Against", value: againstVotes, color: "#EF4444" },
      { name: "Abstain", value: abstainVotes, color: "#6B7280" }
    ];
  }, [filteredProposals]);

  const handleRefresh = async () => {
    initializeStore();
    refetchTreasury();
  };

  if (treasuryError) {
    return (
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg border border-danger/20 bg-danger/5 p-6 flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Failed to load analytics</h3>
              <p className="text-sm text-muted mt-1">{treasuryError.message}</p>
              <button 
                onClick={handleRefresh}
                className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-md bg-danger/10 hover:bg-danger/15 text-danger text-sm font-medium transition-colors"
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
        
        {/* Header and Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">DAO Analytics</h1>
            <p className="text-muted mt-1">Real-time charts and metrics retrieved directly from Arc Testnet contracts.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-surface border border-border-thin rounded-2xl p-1.5 shrink-0 self-start sm:self-auto">
            {(["7d", "30d", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateFilter(range)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  dateFilter === range
                    ? "bg-primary text-white shadow-[0_0_15px_rgba(124,58,237,0.25)]"
                    : "text-muted hover:text-foreground hover:bg-surface-elevated"
                }`}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "All Time"}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-primary" />
              <span className="font-medium text-sm text-muted">Total Proposals</span>
            </div>
            {!initialized ? (
              <div className="h-10 bg-surface-elevated rounded animate-pulse" />
            ) : (
              <>
                <h3 className="text-3xl font-extrabold text-white">{filteredProposals.length}</h3>
                <p className="text-xs text-primary-glow mt-2">Active + Resolved</p>
              </>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-arc-blue" />
              <span className="font-medium text-sm text-muted">Total Votes Cast</span>
            </div>
            {!initialized ? (
              <div className="h-10 bg-surface-elevated rounded animate-pulse" />
            ) : (
              <>
                <h3 className="text-3xl font-extrabold text-white">{totalVotesCast.toLocaleString()}</h3>
                <p className="text-xs text-success mt-2">From live vote events</p>
              </>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              <span className="font-medium text-sm text-muted">Avg Participation</span>
            </div>
            {!initialized ? (
              <div className="h-10 bg-surface-elevated rounded animate-pulse" />
            ) : (
              <>
                <h3 className="text-3xl font-extrabold text-white">{avgParticipation}%</h3>
                <p className="text-xs text-success mt-2">Threshold: 4% Quorum</p>
              </>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-success" />
              <span className="font-medium text-sm text-muted">Proposal Pass Rate</span>
            </div>
            {!initialized ? (
              <div className="h-10 bg-surface-elevated rounded animate-pulse" />
            ) : (
              <>
                <h3 className="text-3xl font-extrabold text-white">{proposalPassRate}%</h3>
                <p className="text-xs text-muted mt-2">{executedCount} execution target hits</p>
              </>
            )}
          </GlassCard>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Line Chart — Treasury balance over time */}
          <GlassCard className="p-6 col-span-1 lg:col-span-2 h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white text-base">Treasury Balance Over Time</h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-purple-300">USDC</span>
            </div>
            <div className="flex-1 w-full min-h-0">
              {mounted && !treasuryLoading ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={treasuryTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D1B4E" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#9E8CA9" fontSize={11} tickLine={false} />
                    <YAxis stroke="#9E8CA9" fontSize={11} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#150A2E", borderColor: "#3D2E68", borderRadius: "12px", color: "#FFF" }}
                      formatter={(value: any) => [`$${Number(value).toLocaleString()} USDC`, "Balance"]}
                    />
                    <Line type="monotone" dataKey="balance" stroke="#7C3AED" strokeWidth={2.5} activeDot={{ r: 6 }} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-surface-elevated rounded animate-pulse" />
              )}
            </div>
          </GlassCard>

          {/* Pie Chart — Vote distribution */}
          <GlassCard className="p-6 h-[400px] flex flex-col">
            <h3 className="font-bold text-white mb-6 text-base">Vote Distribution</h3>
            <div className="flex-1 w-full min-h-0 relative flex items-center justify-center">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={voteDistribution}
                      cx="50%"
                      cy="45%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {voteDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#150A2E", borderColor: "#3D2E68", borderRadius: "12px", color: "#FFF" }}
                      formatter={(v) => [`${Number(v).toLocaleString()} sARC`, "Total"]}
                    />
                    <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs font-medium text-muted">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-surface-elevated rounded animate-pulse" />
              )}
            </div>
          </GlassCard>

          {/* Bar Chart — Proposals per month */}
          <GlassCard className="p-6 col-span-1 lg:col-span-2 h-[380px] flex flex-col">
            <h3 className="font-bold text-white mb-6 text-base">Proposals Created per Month</h3>
            <div className="flex-1 w-full min-h-0">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={proposalsPerMonth} margin={{ top: 5, right: 10, left: -30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D1B4E" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#9E8CA9" fontSize={11} tickLine={false} />
                    <YAxis stroke="#9E8CA9" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#150A2E", borderColor: "#3D2E68", borderRadius: "12px", color: "#FFF" }}
                      formatter={(v) => [v, "Proposals"]}
                    />
                    <Bar dataKey="proposals" fill="#EC4899" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-surface-elevated rounded animate-pulse" />
              )}
            </div>
          </GlassCard>

          {/* Active Voters Listing */}
          <GlassCard className="p-6 h-[380px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white text-base">Most Active Voters</h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center gap-1">
                On-Chain
              </span>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {votersLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-surface-elevated rounded animate-pulse" />
                ))
              ) : activeVoters.length > 0 ? (
                activeVoters.map((voter, i) => {
                  const truncated = `${voter.address.slice(0, 6)}...${voter.address.slice(-4)}`;
                  return (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border-thin last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">
                          {i + 1}
                        </div>
                        <span className="font-mono text-sm text-white" title={voter.address}>{truncated}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-white font-mono">{voter.votesCount}</span>
                        <span className="text-xs text-muted ml-1">votes</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-text-tertiary">No vote cast events registered yet.</div>
              )}
            </div>
          </GlassCard>

        </div>

      </div>
    </div>
  );
}
