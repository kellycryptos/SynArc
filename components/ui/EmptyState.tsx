"use client";

import { motion } from "framer-motion";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = "No data available",
  description = "There is nothing to display here yet.",
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4">
        <Inbox className="w-8 h-8 text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted max-w-sm">{description}</p>
    </motion.div>
  );
}
