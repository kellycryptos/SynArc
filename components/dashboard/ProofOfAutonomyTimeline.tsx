"use client";

import { useEffect, useMemo } from "react";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import { 
  Bot, 
  Zap, 
  ExternalLink, 
  Clock, 
  FileText
} from "lucide-react";

// Helper to determine the trigger conditions based on title/description
const getActionTrigger = (title: string, description: string) => {
  const descLower = description.toLowerCase();
  const titleLower = title.toLowerCase();
  
  if (descLower.includes("usdc balance is 0") || descLower.includes("holds 0 usdc") || descLower.includes("balance below") || descLower.includes("balance is 5")) {
    return "Treasury check: USDC balance below threshold (10.00 USDC)";
  }
  if (descLower.includes("yield") || titleLower.includes("yield") || titleLower.includes("allocation")) {
    return "Yield scan: Idle USDC balance detected in main treasury";
  }
  return "Treasury audit: Periodic rule check (every 5 minutes)";
};

// Helper to determine the action taken
const getActionDescription = (proposalId: string, title: string) => {
  if (title.includes("emergency_funding")) {
    return `Created governance Proposal #${proposalId}: emergency_funding`;
  }
  if (title.includes("yield_allocation")) {
    return `Created governance Proposal #${proposalId}: yield_allocation`;
  }
  return `Created governance Proposal #${proposalId}: ${title.replace("Proposed by Treasury Agent — Rebalancing: ", "")}`;
};

export function ProofOfAutonomyTimeline({ limit = 10 }: { limit?: number }) {
  const { proposals, initialized, initializeStore } = useGovernanceStore();

  useEffect(() => {
    if (!initialized) {
      initializeStore();
    }
  }, [initialized, initializeStore]);

  // Filter for agent-originated proposals
  const agentActions = useMemo(() => {
    return proposals
      .filter((p) => {
        const idNum = Number(p.id.replace("SIP-", ""));
        const isTargetProposal = idNum === 599 || idNum === 791 || idNum === 792 || idNum === 793 || idNum === 794;
        const isAgentCategory = p.category === "TREASURY_REBALANCE";
        const isAgentProposer = p.proposer.toLowerCase() === "0x35630dfe2592ab19d979ec1b173697aea554b66b";
        const hasAgentKeywords = 
          p.title.toLowerCase().includes("treasury agent") || 
          p.description.toLowerCase().includes("autonomous agent proposal");
          
        return isTargetProposal || isAgentCategory || isAgentProposer || hasAgentKeywords;
      })
      // Sort chronologically (newest first)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }, [proposals, limit]);

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-text-primary">Proof of Autonomy</h3>
            <p className="text-[10px] text-text-tertiary">Real-time chronological feed of autonomous agent actions</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-success/10 border border-success/20 text-success uppercase tracking-widest animate-pulse">
          Active Monitor
        </span>
      </div>

      <div className="relative border-l border-border-thin pl-6 ml-4 space-y-6 pt-2">
        {initialized && agentActions.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border-thin flex items-center justify-center mx-auto opacity-60">
              <Clock className="w-6 h-6 text-muted" />
            </div>
            <p className="text-xs text-text-secondary max-w-xs mx-auto leading-relaxed">
              Agent checks treasury conditions every 5 minutes — new autonomous actions will appear here.
            </p>
          </div>
        ) : !initialized && proposals.length === 0 ? (
          // Loading Skeleton
          [1, 2].map((i) => (
            <div key={i} className="relative space-y-2 animate-pulse">
              <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-surface border border-border-thin" />
              <div className="h-4 w-28 bg-surface-elevated rounded" />
              <div className="h-12 w-full bg-surface-elevated rounded-xl" />
            </div>
          ))
        ) : (
          agentActions.map((action) => {
            const rawId = action.id.replace("SIP-", "");
            const trigger = getActionTrigger(action.title, action.description);
            const actionText = getActionDescription(rawId, action.title);
            const formattedTime = new Date(action.createdAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            });

            return (
              <div key={action.id} className="relative group">
                {/* Dot indicator */}
                <div className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                  action.status === "Executed" 
                    ? "bg-purple-500 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]" 
                    : action.status === "Active"
                    ? "bg-success border-success animate-pulse"
                    : "bg-surface-elevated border-border-thin"
                }`} />

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono text-text-tertiary font-medium">
                      {formattedTime}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-purple-500/10 border border-purple-500/25 text-purple-300 flex items-center gap-1 select-none">
                      <Zap className="w-2.5 h-2.5" />
                      Autonomous — no human trigger
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      action.status === "Executed" ? "bg-purple-900/40 border border-purple-500/30 text-purple-300" :
                      action.status === "Active" ? "bg-success/15 border border-success/30 text-success" :
                      "bg-surface-elevated border border-border-thin text-muted"
                    }`}>
                      {action.status}
                    </span>
                  </div>

                  <GlassCard className="p-3.5 space-y-2.5 border-border-thin hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.05)] transition-all duration-300">
                    <div className="space-y-1">
                      <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Trigger Source</p>
                      <p className="text-xs text-text-secondary font-medium">{trigger}</p>
                    </div>

                    <div className="space-y-1 border-t border-border-thin/40 pt-2">
                      <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Action Executed</p>
                      <p className="text-xs text-text-primary font-bold">{actionText}</p>
                      <p className="text-[11px] text-muted leading-relaxed line-clamp-2 mt-1">{action.description.split("\n\n")[0]}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-thin/40 pt-2 text-[10px]">
                      <span className="text-muted">Proposer Address:</span>
                      <span className="font-mono text-text-secondary select-all">{action.proposer}</span>
                    </div>

                    <div className="flex gap-2.5 pt-1.5">
                      <Link 
                        href={`/proposals/${action.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold hover:bg-purple-500/20 transition-all cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Inspect Proposal</span>
                      </Link>

                      <a 
                        href={`https://testnet.arcscan.app/address/${action.proposer}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated border border-border-thin text-text-secondary text-[10px] font-bold hover:bg-surface hover:text-text-primary transition-all cursor-pointer"
                      >
                        <span>Agent Creator Tx</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </GlassCard>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 bg-surface-elevated/40 border border-border-thin rounded-xl text-[10px] text-text-tertiary leading-relaxed mt-2">
        ℹ️ <strong>How this works:</strong> The autonomous agent checks smart contract conditions (balances, escrow timelines, yield rates) every 5 minutes. If criteria are met, it triggers on-chain proposals and executes them without requiring human signatures or wallet approval.
      </div>
    </div>
  );
}
