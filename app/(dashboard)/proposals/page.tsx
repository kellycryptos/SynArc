"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { AuthPromptBanner } from "@/components/auth/AuthPromptBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { 
  FileText, 
  Plus, 
  Check, 
  Search,
  Filter
} from "lucide-react";

export default function ProposalsPage() {
  const router = useRouter();
  const { isAuthenticated, login } = useAuth();
  const { proposals, initialized, initializeStore, userVotes } = useGovernanceStore();
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!initialized) {
      initializeStore();
    }
  }, [initialized, initializeStore]);

  // Filtering and Sorting
  const filteredProposals = proposals.filter((p) => {
    const matchesFilter = filter === "All" || p.status === filter;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Non-blocking auth prompt */}
        <AuthPromptBanner action="vote or create proposals" />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Governance Proposals</h1>
            <p className="text-muted mt-1 flex flex-wrap items-center gap-1.5 text-sm">
              <span>Review, discuss, and vote on Arc Testnet DAO proposals.</span>
              <span className="text-text-tertiary">•</span>
              <a 
                href="https://faucet.circle.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline font-bold"
              >
                🚰 Claim USDC Gas Faucet
              </a>
            </p>
          </div>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                login();
              } else {
                router.push("/proposals/create");
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Proposal
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-elevated/50 p-4 rounded-2xl border border-border-thin">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-text-tertiary" />
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
              {["All", "Active", "Pending", "Executed", "Defeated"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    filter === status 
                      ? "bg-primary text-white border-primary" 
                      : "bg-surface border-border-thin text-text-secondary hover:text-foreground"
                  } border`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input 
              type="text" 
              placeholder="Search proposals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-border-thin rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-text-tertiary transition-colors"
            />
          </div>
        </div>

        {/* Proposals List */}
        <div className="grid grid-cols-1 gap-6">
          {proposals.length === 0 ? (
            <EmptyState
              title="No proposals yet"
              description="Be the first to create a governance proposal for SynArc DAO"
              action={
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      login();
                    } else {
                      router.push("/proposals/create");
                    }
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] cursor-pointer"
                >
                  Create Proposal
                </button>
              }
            />
          ) : filteredProposals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-tertiary">No proposals found matching your criteria.</p>
            </div>
          ) : (
            filteredProposals.map((proposal, i) => {
              const totalVotes = proposal.totalVotes;
              const forPercentage = totalVotes > 0 ? (proposal.forVotes / totalVotes) * 100 : 0;
              const againstPercentage = totalVotes > 0 ? (proposal.againstVotes / totalVotes) * 100 : 0;
              const abstainPercentage = totalVotes > 0 ? (proposal.abstainVotes / totalVotes) * 100 : 0;
              
              const userVoteRecord = userVotes[proposal.id];
              const isProposalActive = proposal.status === "Active";

              return (
                <Link href={`/proposals/${proposal.id}`} key={proposal.id} className="block group">
                  <GlassCard delay={i * 0.05} className="p-6 relative overflow-hidden h-full group-hover:border-primary/30 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(124,58,237,0.1)]">
                    {/* Visual Glow background on active proposals */}
                    {isProposalActive && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/15 transition-all duration-500 pointer-events-none" />
                    )}

                    <div className="flex flex-col md:flex-row gap-6 justify-between">
                      {/* Left Column: Details */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                            proposal.status === 'Active' ? 'bg-success/10 border-success/20 text-success' :
                            proposal.status === 'Executed' ? 'bg-primary/10 border-primary/20 text-primary-glow text-purple-400' :
                            'bg-surface-elevated border-border-thin text-muted'
                          }`}>
                            {proposal.status}
                          </span>
                          <span className="text-xs text-text-secondary font-bold bg-surface-elevated border border-border-thin px-2.5 py-1 rounded-full">
                            {proposal.category}
                          </span>
                          {userVoteRecord && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                              <Check className="w-3.5 h-3.5" />
                              Voted {userVoteRecord.option}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold font-heading text-text-primary group-hover:text-primary transition-colors duration-300">
                              {proposal.title}
                            </h2>
                            <span className="text-xs font-mono text-text-tertiary bg-surface-elevated px-2 py-0.5 rounded border border-border-subtle">{proposal.id}</span>
                          </div>
                          <p className="text-muted text-sm leading-relaxed max-w-3xl mt-2 line-clamp-2">
                            {proposal.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-text-tertiary flex-wrap">
                          <div className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            <span>Proposed by <span className="font-mono text-text-secondary">{proposal.proposer.slice(0,6)}...{proposal.proposer.slice(-4)}</span></span>
                          </div>
                          <span>•</span>
                          <span>Ends {new Date(proposal.votingEnds).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Right Column: Voting Metrics */}
                      <div className="w-full md:w-72 space-y-4 md:border-l md:border-border-thin md:pl-6 shrink-0 flex flex-col justify-center">
                        <div className="space-y-3">
                          {/* For Progress */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-success flex items-center gap-1">For</span>
                              <span className="text-text-primary">{(proposal.forVotes / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k VP ({forPercentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-surface-elevated border border-border-subtle h-1.5 rounded-full overflow-hidden">
                              <div className="bg-success h-full transition-all duration-500" style={{ width: `${forPercentage}%` }} />
                            </div>
                          </div>

                          {/* Against Progress */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-danger flex items-center gap-1">Against</span>
                              <span className="text-text-primary">{(proposal.againstVotes / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k VP ({againstPercentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-surface-elevated border border-border-subtle h-1.5 rounded-full overflow-hidden">
                              <div className="bg-danger h-full transition-all duration-500" style={{ width: `${againstPercentage}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
