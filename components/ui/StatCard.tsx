"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  changeType?: "increase" | "decrease";
  icon: React.ReactNode;
  delay?: number;
}

export function StatCard({ label, value, change, changeType, icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card p-6 group cursor-default"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent group-hover:bg-accent/20 transition-colors">
          {icon}
        </div>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              changeType === "increase"
                ? "bg-success/10 text-success border border-success/20"
                : "bg-danger/10 text-danger border border-danger/20"
            )}
          >
            {changeType === "increase" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {change > 0 ? "+" : ""}
            {change}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted">{label}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
}
