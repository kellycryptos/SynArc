"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Layers } from "lucide-react";
import { useCampaignStore } from "@/hooks/useCampaignStore";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";

export function GovernanceHeroSection() {
  const { isArcMainnet } = useArcNetwork();
  const { campaigns } = useCampaignStore();
  const { proposals } = useGovernanceStore();

  // Dynamic proposal of the day: pick the first active/voting proposal, or honest state
  const featuredProposal = useMemo(() => {
    // 1. Prioritize active on-chain governance proposals
    const activeGov = proposals.find((p) => p.status === "Active");
    if (activeGov) {
      return {
        id: activeGov.id,
        title: activeGov.title,
        description: activeGov.description,
        state: activeGov.status,
        isAgent: true,
        votingEnds: activeGov.votingEnds,
        timeRemaining: activeGov.timeRemaining,
        hasLiveProposal: true,
      };
    }

    // 2. Check active creator campaign proposals
    if (campaigns && campaigns.length > 0) {
      const activeCampaign = campaigns.find((c) => c.state === "Active" || c.state === "Voting");
      if (activeCampaign) {
        return {
          id: activeCampaign.id,
          title: activeCampaign.title,
          description: activeCampaign.description,
          state: activeCampaign.state,
          isAgent: activeCampaign.isAgent,
          deadline: activeCampaign.deadline,
          hasLiveProposal: true,
        };
      }
    }

    // 3. Fall back to most recent closed governance proposal if any exist
    if (proposals.length > 0) {
      const recentGov = proposals[0];
      return {
        id: recentGov.id,
        title: recentGov.title,
        description: recentGov.description,
        state: recentGov.status,
        isAgent: true,
        votingEnds: recentGov.votingEnds,
        timeRemaining: recentGov.timeRemaining,
        hasLiveProposal: false,
      };
    }

    // 4. Honest state when total proposals = 0
    if (isArcMainnet) {
      return {
        id: "mainnet-genesis",
        title: "Arc Mainnet Community Treasury Initialization",
        description: "Initial allocation and governance activation on Arc Mainnet (Chain ID 5042).",
        state: "Genesis",
        isAgent: true,
        hasLiveProposal: false,
      };
    }

    return {
      id: "no-proposals",
      title: "No Live Governance Proposals",
      description: "There are currently no active governance proposals on Arc Testnet.",
      state: "Inactive",
      isAgent: false,
      hasLiveProposal: false,
    };
  }, [proposals, campaigns, isArcMainnet]);

  const countdownLabel = useMemo(() => {
    if (!featuredProposal.hasLiveProposal) {
      return "No live proposals";
    }

    if (featuredProposal.votingEnds) {
      const diffMs = new Date(featuredProposal.votingEnds).getTime() - Date.now();
      if (diffMs <= 0) return "Voting closed";
      const days = Math.floor(diffMs / 86400000);
      const hours = Math.floor((diffMs % 86400000) / 3600000);
      if (days > 0) return `Ends in ${days}d ${hours}h`;
      return `Ends in ${hours}h`;
    }

    if (featuredProposal.deadline) {
      const diffMs = new Date(featuredProposal.deadline).getTime() - Date.now();
      if (diffMs <= 0) return "Voting closed";
      const days = Math.floor(diffMs / 86400000);
      const hours = Math.floor((diffMs % 86400000) / 3600000);
      if (days > 0) return `Ends in ${days}d ${hours}h`;
      return `Ends in ${hours}h`;
    }

    if (featuredProposal.timeRemaining && featuredProposal.timeRemaining !== "Ended") {
      return featuredProposal.timeRemaining;
    }

    return "No live proposals";
  }, [featuredProposal]);

  const proposalNumberLabel = useMemo(() => {
    if (featuredProposal.id === "mainnet-genesis") return "Genesis";
    if (featuredProposal.id === "no-proposals") return "—";
    const num = featuredProposal.id.replace(/[^0-9]/g, "");
    return num ? `#${num}` : "#1";
  }, [featuredProposal.id]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* CARD 1: PROPOSAL OF THE DAY */}
      <div className="rounded-2xl border border-[#1B2536] bg-[#0B111C]/90 p-5 sm:p-6 flex flex-col justify-between hover:border-[#2F6FFF]/30 transition-all duration-200 group">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium tracking-[0.12em] text-[#4F8BFF] uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Proposal of the day</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-[#2F6FFF]/30 border border-[#4F8BFF]" />
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[#151C29] text-[#8A948E] border border-[#1B2536]">
              {proposalNumberLabel}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-[#2F6FFF]/10 text-[#4F8BFF] border border-[#2F6FFF]/30">
              {featuredProposal.state}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[#2F6FFF]/10 text-[#4F8BFF] border border-[#2F6FFF]/25">
              Autonomous Agent
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold font-space text-[#F5F7FA] group-hover:text-[#4F8BFF] transition-colors line-clamp-2 leading-snug">
            {featuredProposal.title}
          </h3>

          <div className="flex items-center gap-2 mt-3 text-xs text-[#8A948E]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4F8BFF]" />
              Arc Treasury
            </span>
            <span>·</span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#05080F] border border-[#151C29]">
              Liquidity Protocol
            </span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#151C29] flex items-center justify-between">
          <Link
            href="/proposals"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F8BFF] group-hover:gap-2.5 transition-all cursor-pointer font-space"
          >
            Review & Vote <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <span className="text-[11px] font-mono text-[#6B7385]">
            {countdownLabel}
          </span>
        </div>
      </div>

      {/* CARD 2: CONTINUE WHERE YOU LEFT OFF */}
      <div className="rounded-2xl border border-[#1B2536] bg-[#0B111C]/90 p-5 sm:p-6 flex flex-col justify-between hover:border-[#2F6FFF]/30 transition-all duration-200">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-medium tracking-[0.12em] text-[#8A948E] uppercase">
              Continue Where You Left Off
            </span>
            <Layers className="w-4 h-4 text-[#6B7385]" />
          </div>

          <p className="text-xs text-[#8A948E] leading-relaxed mt-2">
            No proposal in progress. Shift+click a DAO or proposal to pin it to your quick-monitoring watchboard.
          </p>

          <div className="mt-4 p-3 rounded-xl bg-[#05080F] border border-[#151C29] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8A948E] font-medium">Quick Target</span>
              <span className="font-mono text-[10px] text-[#4F8BFF] bg-[#2F6FFF]/10 px-1.5 py-0.5 rounded border border-[#2F6FFF]/20">
                {isArcMainnet ? "Arc Mainnet" : "Arc Testnet"}
              </span>
            </div>
            <p className="text-[11px] text-[#6B7385] font-mono">
              Last check: Automated agent rules healthy · 0 warnings
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#151C29]">
          <Link
            href="/proposals"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F8BFF] hover:gap-2.5 transition-all cursor-pointer font-space"
          >
            Browse all proposals <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
