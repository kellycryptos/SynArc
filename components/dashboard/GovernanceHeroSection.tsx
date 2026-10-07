"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Layers } from "lucide-react";
import { useCampaignStore } from "@/hooks/useCampaignStore";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";

export function GovernanceHeroSection() {
  const { isArcMainnet } = useArcNetwork();
  const { campaigns } = useCampaignStore();

  const featuredProposal = useMemo(() => {
    if (campaigns && campaigns.length > 0) {
      const active = campaigns.find(c => c.state === "Active" || c.state === "Voting");
      if (active) return active;
      return campaigns[0];
    }
    return {
      id: "awaiting-first",
      title: "Awaiting the first funded payout",
      description: "The governor is live. No proposal is on-chain yet.",
      state: "Empty",
      isAgent: true,
      raised: 0,
      goal: 0,
      isEmpty: true,
    };
  }, [campaigns]);

  const isEmpty = featuredProposal.id === "awaiting-first";

  const proposalNumberLabel = useMemo(() => {
    if (isEmpty) return "None";
    const num = String(featuredProposal.id).replace(/[^0-9]/g, "");
    return num ? `#${num}` : "#1";
  }, [featuredProposal.id, isEmpty]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-[#1B2536] bg-[#0B111C]/90 p-5 sm:p-6 flex flex-col justify-between hover:border-[#2F6FFF]/30 transition-all duration-200 group">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium tracking-[0.12em] text-[#4F8BFF] uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isEmpty ? "Treasury status" : "Proposal of the day"}</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-[#2F6FFF]/30 border border-[#4F8BFF]" />
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[#151C29] text-[#8A948E] border border-[#1B2536]">
              {proposalNumberLabel}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-[#2F6FFF]/10 text-[#4F8BFF] border border-[#2F6FFF]/30">
              {featuredProposal.state}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[#2F6FFF]/10 text-[#4F8BFF] border border-[#2F6FFF]/25">
              {isEmpty ? "Escrow initialized" : "Autonomous Agent"}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold font-space text-[#F5F7FA] group-hover:text-[#4F8BFF] transition-colors line-clamp-2 leading-snug">
            {featuredProposal.title}
          </h3>

          <div className="flex items-center gap-2 mt-3 text-xs text-[#8A948E]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4F8BFF]" />
              {isArcMainnet ? "Arc Mainnet" : "Arc Testnet"}
            </span>
            <span>·</span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#05080F] border border-[#151C29]">
              {isEmpty ? "0 USDC released" : "Payout"}
            </span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#151C29] flex items-center justify-between">
          <Link
            href={isEmpty ? "/treasury" : "/proposals"}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F8BFF] group-hover:gap-2.5 transition-all cursor-pointer font-space"
          >
            {isEmpty ? "Open treasury" : "Review & Vote"} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <span className="text-[11px] font-mono text-[#6B7385]">
            {isEmpty ? "No deadline — no proposal on the governor" : "Live proposal"}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-[#1B2536] bg-[#0B111C]/90 p-5 sm:p-6 flex flex-col justify-between hover:border-[#2F6FFF]/30 transition-all duration-200">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-medium tracking-[0.12em] text-[#8A948E] uppercase">
              Continue Where You Left Off
            </span>
            <Layers className="w-4 h-4 text-[#6B7385]" />
          </div>

          <p className="text-xs text-[#8A948E] leading-relaxed mt-2">
            No payout in progress. Fund USDC, attach an invoice hash, and release under the 50 USDC agent cap.
          </p>

          <div className="mt-4 p-3 rounded-xl bg-[#05080F] border border-[#151C29] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8A948E] font-medium">Quick Target</span>
              <span className="font-mono text-[10px] text-[#4F8BFF] bg-[#2F6FFF]/10 px-1.5 py-0.5 rounded border border-[#2F6FFF]/20">
                {isArcMainnet ? "Arc Mainnet" : "Arc Testnet"}
              </span>
            </div>
            <p className="text-[11px] text-[#6B7385] font-mono">
              Last check: Agent cap 50 USDC · human review above it · 0 warnings
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#151C29]">
          <Link
            href="/proposals/create"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F8BFF] hover:gap-2.5 transition-all cursor-pointer font-space"
          >
            Create a payout <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
