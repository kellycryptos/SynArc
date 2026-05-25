"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Shield, Search, AlertCircle, RefreshCw, Users, Calendar, Wallet } from "lucide-react";
import { ethers, JsonRpcProvider, Contract, formatUnits } from "ethers";
import { GOVERNANCE_CONTRACTS, ERC20ABI } from "@/lib/governance/contracts";

interface Member {
  id: string;
  address: string;
  tokenBalance: number;
  usdcBalance: number;
  joinDate: string;
  timestamp: number;
}

export default function MembersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const rpcUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network";
      let provider;
      try {
        provider = new JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
        await provider.getNetwork();
      } catch (err) {
        console.warn("Primary RPC connection failed, falling back to secondary RPC:", err);
        try {
          provider = new JsonRpcProvider("https://arc-testnet.drpc.org", undefined, { staticNetwork: true });
          await provider.getNetwork();
        } catch (fallbackErr) {
          console.error("Secondary RPC connection failed too:", fallbackErr);
          throw new Error("All RPC endpoints are offline");
        }
      }

      const tokenAddress = GOVERNANCE_CONTRACTS.token;
      const tokenContract = new Contract(tokenAddress, ERC20ABI, provider);
      const usdcContract = new Contract("0x3600000000000000000000000000000000000000", ERC20ABI, provider);

      // Scrape Transfer events from Token contract
      const filter = tokenContract.filters.Transfer();
      const events = await tokenContract.queryFilter(filter, 0, "latest");
      
      const holders = new Set<string>();
      const holderFirstBlock = new Map<string, number>();

      events.forEach(event => {
        const log = event as ethers.EventLog;
        if (log.args) {
          const from = log.args[0] as string;
          const to = log.args[1] as string;
          const blockNum = event.blockNumber;
          
          if (to && to !== ethers.ZeroAddress) {
            holders.add(to);
            const current = holderFirstBlock.get(to);
            if (current === undefined || blockNum < current) {
              holderFirstBlock.set(to, blockNum);
            }
          }
          if (from && from !== ethers.ZeroAddress) {
            holders.add(from);
            const current = holderFirstBlock.get(from);
            if (current === undefined || blockNum < current) {
              holderFirstBlock.set(from, blockNum);
            }
          }
        }
      });

      // Fetch block timestamps in parallel
      const distinctBlockNumbers = Array.from(new Set(Array.from(holderFirstBlock.values())));
      const blockMap = new Map<number, number>();
      
      await Promise.all(
        distinctBlockNumbers.map(async (blockNum) => {
          try {
            const block = await provider.getBlock(blockNum);
            if (block) {
              blockMap.set(blockNum, block.timestamp);
            }
          } catch (err) {
            console.error(`Failed to fetch block ${blockNum}:`, err);
          }
        })
      );

      // Fetch balances for each holder
      const memberList: Member[] = await Promise.all(
        Array.from(holders).map(async (holder, idx) => {
          const [tokenBal, usdcBal] = await Promise.all([
            tokenContract.balanceOf(holder).catch(() => 0n),
            usdcContract.balanceOf(holder).catch(() => 0n),
          ]);

          const tokenBalanceNum = Number(formatUnits(tokenBal, 18));
          const usdcBalanceNum = Number(formatUnits(usdcBal, 6));
          
          const firstBlock = holderFirstBlock.get(holder);
          const timestamp = firstBlock ? (blockMap.get(firstBlock) || (Date.now() / 1000)) : (Date.now() / 1000);
          const joinDate = new Date(timestamp * 1000).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });

          return {
            id: idx.toString(),
            address: holder,
            tokenBalance: tokenBalanceNum,
            usdcBalance: usdcBalanceNum,
            joinDate,
            timestamp,
          };
        })
      );

      // Filter out holders with 0 token balance and sort by token balance descending
      const activeMembers = memberList
        .filter(m => m.tokenBalance > 0)
        .sort((a, b) => b.tokenBalance - a.tokenBalance);

      setMembers(activeMembers);
    } catch (err: any) {
      console.error("Failed to fetch on-chain token holders:", err);
      setError(err?.message || "Failed to load members. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      m.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [members, searchTerm]);

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
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              placeholder="Search by address..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full sm:w-64 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none transition-colors text-sm"
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Total DAO Members</p>
              <h3 className="text-3xl font-extrabold text-white mt-2">
                {isLoading ? (
                  <span className="inline-block w-12 h-8 bg-surface-elevated animate-pulse rounded" />
                ) : (
                  members.length
                )}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(124,58,237,0.1)]">
              <Users className="w-6 h-6" />
            </div>
          </GlassCard>
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
              // Generative background seed based on address
              const avatarGradient = `bg-gradient-to-tr from-purple-deep via-primary/30 to-arc-blue`;
              const initials = member.address.slice(2, 4).toUpperCase();

              return (
                <GlassCard key={member.address} delay={i * 0.05} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-extrabold text-white shadow-md ${avatarGradient}`}>
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-bold font-mono text-sm" title={member.address}>{truncatedAddress}</h3>
                        <p className="text-xs text-muted font-mono" title={member.address}>{truncatedAddress}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border-thin">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-primary" />
                        SynArcToken Balance
                      </span>
                      <span className="font-semibold font-mono text-white">
                        {member.tokenBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sARC
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
            <div className="col-span-full py-12 text-center text-text-tertiary">No members found matching that search.</div>
          )}
        </div>

      </div>
    </div>
  );
}
