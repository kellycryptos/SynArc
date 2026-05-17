"use client";

import { MOCK_PROPOSALS } from "@/data/mock/proposals";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { Clock, TrendingUp } from "lucide-react";
import Link from "next/link";

export function ProposalFeed() {
  return (
    <div className="space-y-4">
      {MOCK_PROPOSALS.map((proposal, i) => (
        <GlassCard key={proposal.id} delay={i * 0.05} hover={true} className="p-0 overflow-hidden">
          <Link href={`/proposals/${proposal.id}`} className="block p-5 sm:p-6 transition-colors hover:bg-surface-elevated/50">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted bg-surface-elevated px-2 py-1 rounded-md border border-border-thin">
                    {proposal.id}
                  </span>
                  <StatusBadge status={proposal.status} />
                </div>
                <h4 className="text-lg font-semibold text-foreground leading-tight">
                  {proposal.title}
                </h4>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                  <span className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-arc-blue" />
                    {proposal.category}
                  </span>
                  {proposal.status === "Active" || proposal.status === "Pending" ? (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {proposal.timeRemaining}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {proposal.participationPercentage}% Participation
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col sm:items-end justify-center min-w-[140px] space-y-2">
                {proposal.status !== "Pending" && (
                  <div className="w-full">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-success font-medium">For</span>
                      <span className="text-danger font-medium">Against</span>
                    </div>
                    <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden flex border border-border-thin">
                      <div 
                        className="h-full bg-success transition-all" 
                        style={{ width: `${(proposal.forVotes / proposal.totalVotes) * 100 || 0}%` }} 
                      />
                      <div 
                        className="h-full bg-danger transition-all" 
                        style={{ width: `${(proposal.againstVotes / proposal.totalVotes) * 100 || 0}%` }} 
                      />
                    </div>
                  </div>
                )}
                {proposal.treasuryImpact !== "None" && (
                  <div className="text-xs text-muted pt-1">
                    Impact: <span className="font-medium text-foreground">{proposal.treasuryImpact}</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        </GlassCard>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "text-xs font-semibold px-2.5 py-0.5 rounded-full border",
      status === "Active" && "bg-primary/10 text-primary border-primary/20 animate-[pulse-glow_4s_ease-in-out_infinite]",
      status === "Pending" && "bg-warning/10 text-warning border-warning/20",
      status === "Executed" && "bg-success/10 text-success border-success/20",
      status === "Defeated" && "bg-danger/10 text-danger border-danger/20"
    )}>
      {status}
    </span>
  );
}
