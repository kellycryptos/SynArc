"use client";

import { useEffect } from "react";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { GlassCard } from "@/components/ui/GlassCard";
import { DollarSign, FileText, Activity, Users, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function RenderAnimatedValue({ value }: { value: string | number }) {
  if (typeof value === "number") {
    return <AnimatedNumber value={value} />;
  }
  
  const numericString = value.replace(/[^0-9.]/g, "");
  const num = parseFloat(numericString);
  
  if (isNaN(num)) {
    return <span>{value}</span>;
  }
  
  const hasPercent = value.includes("%");
  const hasDollar = value.includes("$");
  const decimals = numericString.includes(".") ? numericString.split(".")[1].length : 0;
  
  return (
    <span>
      {hasDollar && "$"}
      <AnimatedNumber value={num} decimals={decimals} />
      {hasPercent && "%"}
    </span>
  );
}

export function OverviewCards() {
  const { metrics, initialized, initializeStore } = useGovernanceStore();

  useEffect(() => {
    if (!initialized) initializeStore();
  }, [initialized, initializeStore]);

  if (!initialized) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-4 animate-pulse bg-background-surface border border-border h-[130px] rounded-2xl flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-lg bg-white/[0.04]" />
              <div className="w-12 h-5 rounded-full bg-white/[0.04]" />
            </div>
            <div className="space-y-2">
              <div className="w-20 h-3 rounded bg-white/[0.04]" />
              <div className="w-28 h-6 rounded bg-white/[0.04]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { title: "Treasury Value", value: metrics?.treasuryValue || "$0", icon: DollarSign, trend: "+2.4%" },
    { title: "Total Proposals", value: metrics?.totalProposals !== undefined ? metrics.totalProposals : 0, icon: FileText, trend: "Live" },
    { title: "Active Proposals", value: metrics?.activeProposals !== undefined ? metrics.activeProposals : 0, icon: Activity, trend: "Stable" },
    { title: "Governance Participation", value: metrics?.governanceParticipation || "0%", icon: ArrowRightLeft, trend: "+5.1%" },
    { title: "DAO Members", value: metrics?.daoMembers !== undefined ? metrics.daoMembers : 0, icon: Users, trend: "Active" },
    { title: "Proposal Execution Rate", value: metrics?.proposalExecutionRate || "0%", icon: CheckCircle2, trend: "High" },
  ];

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#151C29] border border-[#151C29] rounded-[10px] overflow-hidden"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const isUp = card.trend.includes("+") || card.trend === "High";
        return (
          <motion.div key={card.title} variants={itemVariants} className="bg-[#080C14] p-5.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-5">
              <Icon className="w-4.5 h-4.5 text-[#6B7385]" />
              <span className={cn(
                "font-mono text-xs px-2 py-0.5 rounded-[5px] border",
                isUp 
                  ? "text-[#22D3EE] bg-[#08161C] border-[#163241]" 
                  : "text-[#8B93A5] bg-[#10151F] border-[#1B2536]"
              )}>
                {card.trend}
              </span>
            </div>
            <div>
              <p className="text-xs sm:text-[13px] text-[#6B7385] mb-2 font-space">{card.title}</p>
              <h3 className="font-mono text-2xl sm:text-[26px] font-medium text-[#F5F7FA]">
                <RenderAnimatedValue value={card.value} />
              </h3>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
