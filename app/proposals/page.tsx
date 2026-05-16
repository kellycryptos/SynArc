"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { proposals } from "@/lib/mockData";
import { FileText, Plus } from "lucide-react";

export default function ProposalsPage() {
  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
            <p className="text-muted mt-1">Vote on active proposals or create new ones.</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            Create Proposal
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {proposals.map((proposal, i) => {
            const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
            const forPercentage = totalVotes > 0 ? (proposal.forVotes / totalVotes) * 100 : 0;
            const againstPercentage = totalVotes > 0 ? (proposal.againstVotes / totalVotes) * 100 : 0;

            return (
              <GlassCard key={proposal.id} delay={i * 0.05} className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        proposal.status === 'Active' ? 'bg-success/20 text-success' :
                        proposal.status === 'Passed' || proposal.status === 'Executed' ? 'bg-primary/20 text-primary' :
                        'bg-surface-elevated text-muted'
                      }`}>
                        {proposal.status}
                      </span>
                      <span className="text-xs text-muted font-medium bg-surface-elevated px-2.5 py-1 rounded-full">
                        {proposal.category}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold mb-2">{proposal.title}</h2>
                      <p className="text-muted text-sm leading-relaxed max-w-3xl">
                        {proposal.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Proposed by {proposal.proposer}</span>
                      </div>
                      <span>•</span>
                      <span>Ends {new Date(proposal.votingEnds).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="w-full md:w-64 space-y-4 md:border-l md:border-border-thin md:pl-6">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-success font-medium">For</span>
                        <span>{forPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-surface-elevated h-1.5 rounded-full overflow-hidden">
                        <div className="bg-success h-full" style={{ width: `${forPercentage}%` }} />
                      </div>
                      <div className="text-right text-xs text-muted">
                        {(proposal.forVotes / 1000).toFixed(1)}k
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-danger font-medium">Against</span>
                        <span>{againstPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-surface-elevated h-1.5 rounded-full overflow-hidden">
                        <div className="bg-danger h-full" style={{ width: `${againstPercentage}%` }} />
                      </div>
                      <div className="text-right text-xs text-muted">
                        {(proposal.againstVotes / 1000).toFixed(1)}k
                      </div>
                    </div>

                    <button className="w-full py-2 rounded-lg bg-surface border border-border-thin hover:bg-surface-elevated transition-colors text-sm font-medium mt-2">
                      View Details
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

      </div>
    </div>
  );
}
