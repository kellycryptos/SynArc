"use client";

import { useEffect } from "react";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { GlassCard } from "@/components/ui/GlassCard";
import { DollarSign, FileText, Activity, Users, ArrowRightLeft, CheckCircle2 } from "lucide-react";

export function OverviewCards() {
  const { metrics, initialized, initializeStore } = useGovernanceStore();

  useEffect(() => {
    if (!initialized) initializeStore();
  }, [initialized, initializeStore]);

  const cards = [
    { title: "Treasury Value", value: metrics?.treasuryValue || "$0", icon: DollarSign, trend: "+2.4%" },
    { title: "Active Proposals", value: metrics?.activeProposals || 0, icon: FileText, trend: "Stable" },
    { title: "Governance Participation", value: metrics?.governanceParticipation || "0%", icon: Activity, trend: "+5.1%" },
    { title: "DAO Members", value: metrics?.daoMembers || 0, icon: Users, trend: "+124 this week" },
    { title: "Treasury Transactions", value: metrics?.treasuryTransactions || 0, icon: ArrowRightLeft, trend: "Active" },
    { title: "Proposal Execution Rate", value: metrics?.proposalExecutionRate || "0%", icon: CheckCircle2, trend: "High" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <GlassCard key={card.title} delay={i * 0.1} className="p-5 flex flex-col gap-4 relative overflow-hidden group bg-background-surface border border-border">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
            <div className="flex items-start justify-between relative z-10">
              <div className="p-2 bg-surface-elevated rounded-lg border border-border-thin shadow-sm">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full border border-success/20">
                {card.trend}
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-sm text-muted font-medium mb-1">{card.title}</p>
              <h3 className="text-2xl font-bold font-heading tracking-tight text-text-primary">{card.value}</h3>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
