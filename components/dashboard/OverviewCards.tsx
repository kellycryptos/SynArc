"use client";

import { useEffect } from "react";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { GlassCard } from "@/components/ui/GlassCard";
import { DollarSign, FileText, Activity, Users, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { motion } from "framer-motion";

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
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div key={card.title} variants={itemVariants}>
            <motion.div
              whileHover={{ 
                y: -4,
                boxShadow: '0 20px 40px rgba(124, 58, 237, 0.12)',
                borderColor: 'rgba(124, 58, 237, 0.3)',
              }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl overflow-hidden h-full"
            >
              <GlassCard className="p-5 flex flex-col gap-4 relative overflow-hidden group bg-background-surface border border-border h-full">
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
                  <h3 className="text-2xl font-bold font-heading tracking-tight text-text-primary">
                    <RenderAnimatedValue value={card.value} />
                  </h3>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
