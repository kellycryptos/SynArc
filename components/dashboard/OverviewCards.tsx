"use client";

import { useEffect } from "react";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { useTreasuryBalances } from "@/hooks/useTreasuryBalances";
import { GlassCard } from "@/components/ui/GlassCard";
import { DollarSign, FileText, Activity, Users, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getActiveNetwork } from "@/lib/arc-config";

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
  const { balance: treasuryBalance } = useTreasuryBalances();

  useEffect(() => {
    if (!initialized) initializeStore();
  }, [initialized, initializeStore]);

  if (!initialized) {
    return (
      <div className="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
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

  const isMainnet = getActiveNetwork() === 'mainnet';

  const liveTreasuryValue = (typeof treasuryBalance === 'number' && treasuryBalance > 0)
    ? `$${treasuryBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : (metrics?.treasuryValue && metrics.treasuryValue !== "—" && metrics.treasuryValue !== "$0.07"
        ? metrics.treasuryValue
        : (isMainnet ? (typeof treasuryBalance === 'number' ? `$${treasuryBalance.toFixed(2)}` : "—") : "$30,688.99"));

  const cards = [
    { title: "Treasury Value", value: liveTreasuryValue, icon: DollarSign, trend: !isMainnet && liveTreasuryValue === "$30,688.99" ? "Testnet demo data" : (isMainnet && liveTreasuryValue === "—" ? "—" : "Live") },
    { title: "Total Proposals", value: metrics?.totalProposals !== undefined ? metrics.totalProposals : (isMainnet ? "—" : 0), icon: FileText, trend: isMainnet ? (metrics?.totalProposals !== undefined ? "Live" : "—") : "Live" },
    { title: "Active Proposals", value: metrics?.activeProposals !== undefined ? metrics.activeProposals : (isMainnet ? "—" : 0), icon: Activity, trend: isMainnet ? (metrics?.activeProposals !== undefined ? "Live" : "—") : "Active" },
    { title: "Governance Participation", value: metrics?.governanceParticipation ? metrics.governanceParticipation : (isMainnet ? "—" : "0.0%"), icon: ArrowRightLeft, trend: isMainnet ? (metrics?.governanceParticipation && metrics.governanceParticipation !== "—" ? "Live" : "—") : "Live" },
    { title: "DAO Members", value: metrics?.daoMembers !== undefined ? metrics.daoMembers : (isMainnet ? "—" : 1), icon: Users, trend: isMainnet ? (metrics?.daoMembers !== undefined ? "Live" : "—") : "Active" },
    { title: "Proposal Execution Rate", value: metrics?.proposalExecutionRate ? metrics.proposalExecutionRate : (isMainnet ? "—" : "0.0%"), icon: CheckCircle2, trend: isMainnet ? (metrics?.proposalExecutionRate && metrics.proposalExecutionRate !== "—" ? "Live" : "—") : "Live" },
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
      whileInView="show"
      viewport={{ once: true, margin: '-50px' }}
      className="stats-grid gap-px bg-[#151C29] border border-[#151C29] rounded-[10px] overflow-hidden"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const isPositive = card.trend.startsWith("+");
        const isNegative = card.trend.startsWith("-");
        const isLive = card.trend === "Live" || card.trend === "Active";
        return (
          <motion.div key={card.title} variants={itemVariants} className="bg-[#080C14] p-5.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-5">
              <Icon className="w-4.5 h-4.5 text-[#6B7385]" />
              <span className={cn(
                "font-mono text-xs px-2 py-0.5 rounded-[5px] border",
                card.trend.includes("demo")
                  ? "text-amber-400 bg-amber-500/10 border-amber-500/20 text-[10px]"
                  : isPositive 
                  ? "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20"
                  : isNegative
                  ? "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20"
                  : isLive
                  ? "text-[#4F8BFF] bg-[#2F6FFF]/10 border-[#2F6FFF]/20"
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
