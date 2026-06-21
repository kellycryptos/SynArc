"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Shield, Search, AlertCircle, RefreshCw, Users, Calendar, Wallet, Bot, Landmark, Zap } from "lucide-react";
import { ethers, Contract } from "ethers";
import { GOVERNANCE_CONTRACTS, ERC20ABI } from "@/lib/governance/contracts";
import { getResilientProvider } from "@/lib/rpc/config";

interface Member {
  address: string;
  sarcBalance: number;
  usdcBalance: number;
  joinDate: string;
  // Inferred category tags
  isAiAgent: boolean;
  hasTreasury: boolean;
}

type DaoCategory = "All" | "Active" | "AI Agent" | "Treasury";

const CATEGORY_CONFIG: { id: DaoCategory; label: string; icon: React.ElementType; color: string }[] = [
  { id: "All",       label: "All DAOs",       icon: Users,    color: "text-white" },
  { id: "Active",    label: "Active",          icon: Zap,      color: "text-success" },
  { id: "AI Agent",  label: "AI Agent DAOs",   icon: Bot,      color: "text-arc-blue" },
  { id: "Treasury",  label: "Treasury DAOs",   icon: Landmark, color: "text-accent" },
];

export default function MembersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<DaoCategory>("All");

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const provider = await getResilientProvider();
      const tokenAddress = GOVERNANCE_CONTRACTS.token;
      const usdcAddress = GOVERNANCE_CONTRACTS.eurc;

      const tokenContract = new Contract(tokenAddress, ERC20ABI, provider);
      const usdcContract = new Contract(usdcAddress, ERC20ABI, provider);

      const latestBlock = await provider.getBlockNumber();
      const chunkSize = 5000;
      const allEvents: any[] = [];

      // Fetch Transfer events in chunks of 5000 blocks to avoid RPC timeouts
      for (let fromBlock = 0; fromBlock <= latestBlock; fromBlock += chunkSize) {
        const toBlock = Math.min(fromBlock + chunkSize - 1, latestBlock);
        try {
          const events = await tokenContract.queryFilter(
            tokenContract.filters.Transfer(),
            fromBlock,
            toBlock
          );
          allEvents.push(...events);
        } catch (err) {
          console.error(`Error fetching blocks ${fromBlock}-${toBlock}:`, err);
        }
      }

      // Unique recipient addresses (exclude zero address mints from/to)
      const memberAddresses = [...new Set(
        allEvents
          .filter(e => e.args && e.args[1] !== ethers.ZeroAddress)
          .map(e => e.args[1] as string)
      )];

      // Fetch block timestamps for accurate join dates (cap at 100 unique blocks)
      const distinctBlockNumbers = Array.from(new Set(allEvents.map(e => e.blockNumber)));
      const blockMap = new Map<number, number>();
      await Promise.all(
        distinctBlockNumbers.slice(0, 100).map(async (blockNum) => {
          try {
            const block = await provider.getBlock(blockNum);
            if (block) blockMap.set(blockNum, block.timestamp);
          } catch (err) {
            console.error(`Failed to fetch block ${blockNum}:`, err);
          }
        })
      );

      // Fetch sARC + USDC balances for each member in parallel
      const membersList = await Promise.all(
        memberAddresses.map(async (address) => {
          const [sarcRaw, usdcRaw] = await Promise.all([
            tokenContract.balanceOf(address).catch(() => 0n),
            usdcContract.balanceOf(address).catch(() => 0n),
          ]);

          const firstEvent = allEvents.find(e => e.args && e.args[1] === address);
          const firstBlock = firstEvent?.blockNumber;
          const timestamp = firstBlock
            ? (blockMap.get(firstBlock) ?? Date.now() / 1000)
            : Date.now() / 1000;

          const joinDate = new Date(timestamp * 1000).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          });

          const sarcBalance = Number(sarcRaw) / 1e18;
          const usdcBalance = Number(usdcRaw) / 1e6;

          // Heuristic classification based on balances and address patterns
          // AI Agent DAOs: primarily sARC heavy with low USDC (bots tend not to hold gas)
          const isAiAgent = sarcBalance > 100 && usdcBalance < 5;
          // Treasury DAOs: hold significant USDC alongside sARC
          const hasTreasury = usdcBalance > 50;

          return {
            address,
            sarcBalance,
            usdcBalance,
            joinDate,
            isAiAgent,
            hasTreasury,
          };
        })
      );

      const activeMembers = membersList
        .filter(m => m.sarcBalance > 0)
        .sort((a, b) => b.sarcBalance - a.sarcBalance);

      setMembers(activeMembers);
    } catch (err: any) {
      console.error("Failed to fetch members:", err);
      setError(err?.message || "Failed to load members.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch = m.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        activeCategory === "All" ? true :
        activeCategory === "Active" ? m.sarcBalance > 0 :
        activeCategory === "AI Agent" ? m.isAiAgent :
        activeCategory === "Treasury" ? m.hasTreasury : true;
      return matchesSearch && matchesCategory;
    });
  }, [members, searchTerm, activeCategory]);

  const categoryCounts = useMemo(() => ({
    All:      members.length,
    Active:   members.filter(m => m.sarcBalance > 0).length,
    "AI Agent": members.filter(m => m.isAiAgent).length,
    Treasury: members.filter(m => m.hasTreasury).length,
  }), [members]);

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
                onClick={fetchMembers}
                className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-md bg-warning/10 hover:bg-warning/15 text-warning text-sm font-medium transition-colors cursor-pointer"
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

        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">DAO Members</h1>
            <p className="text-muted mt-1">Real-time token holders and voters on Arc Testnet.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchMembers}
              disabled={isLoading}
              title="Refresh members"
              className="p-2.5 rounded-xl bg-surface-elevated border border-border-thin text-muted hover:text-white hover:bg-surface transition-colors disabled:opacity-40 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search by address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full sm:w-56 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none transition-colors text-sm"
              />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORY_CONFIG.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`text-left w-full rounded-2xl transition-all duration-200 focus:outline-none ${
                activeCategory === id
                  ? "ring-1 ring-primary/40"
                  : ""
              }`}
            >
              <GlassCard
                className={`p-4 flex items-center gap-4 h-full ${
                  activeCategory === id
                    ? "border-primary/40 shadow-[0_0_20px_rgba(124,58,237,0.12)]"
                    : "hover:border-border-thin/60"
                }`}
              >
              <div className={`w-10 h-10 rounded-xl bg-surface-elevated border border-border-thin flex items-center justify-center shrink-0 ${
                activeCategory === id ? "bg-primary/10 border-primary/20" : ""
              }`}>
                <Icon className={`w-5 h-5 ${activeCategory === id ? "text-primary" : color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider">{label}</p>
                <h3 className="text-xl font-extrabold text-white">
                  {isLoading ? (
                    <span className="inline-block w-8 h-5 bg-surface-elevated animate-pulse rounded" />
                  ) : (
                    categoryCounts[id]
                  )}
                </h3>
              </div>
              </GlassCard>
            </button>
          ))}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {CATEGORY_CONFIG.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                activeCategory === id
                  ? "bg-accent-purple text-white-keep border-accent-purple shadow-[0_0_12px_rgba(124,58,237,0.2)]"
                  : "bg-surface border-border-thin text-text-secondary hover:text-foreground hover:bg-surface-elevated"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                activeCategory === id ? "bg-white/20" : "bg-surface-elevated"
              }`}>
                {isLoading ? "…" : categoryCounts[id]}
              </span>
            </button>
          ))}
        </div>

        {/* Members Grid */}
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
          ) : filteredMembers.length > 0 ? (
            filteredMembers.map((member, i) => {
              const truncatedAddress = `${member.address.slice(0, 6)}...${member.address.slice(-4)}`;
              const avatarGradient = `bg-gradient-to-tr from-purple-deep via-primary/30 to-arc-blue`;
              const initials = member.address.slice(2, 4).toUpperCase();

              return (
                <GlassCard key={member.address} delay={i * 0.05} className="p-6 hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-extrabold text-white shadow-md ${avatarGradient}`}>
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-bold font-mono text-sm" title={member.address}>{truncatedAddress}</h3>
                        <p className="text-xs text-muted font-mono truncate max-w-[140px]" title={member.address}>{member.address}</p>
                      </div>
                    </div>
                    {/* Category badges */}
                    <div className="flex flex-col gap-1 items-end">
                      {member.isAiAgent && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-arc-blue/10 border border-arc-blue/20 text-arc-blue flex items-center gap-1">
                          <Bot className="w-2.5 h-2.5" /> AI Agent
                        </span>
                      )}
                      {member.hasTreasury && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-accent/10 border border-accent/20 text-accent flex items-center gap-1">
                          <Landmark className="w-2.5 h-2.5" /> Treasury
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border-thin">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-primary" />
                        sARC Balance
                      </span>
                      <span className="font-semibold font-mono text-white">
                        {member.sarcBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sARC
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-arc-blue" />
                        USDC Balance
                      </span>
                      <span className="font-semibold font-mono text-white">
                        {member.usdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-accent" />
                        Join Date
                      </span>
                      <span className="font-semibold font-mono text-white">
                        {member.joinDate}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-text-tertiary">
              {searchTerm
                ? "No members found matching that search."
                : activeCategory !== "All"
                  ? `No ${activeCategory} DAOs found yet.`
                  : "No active members found on-chain yet."}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
