"use client";

import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { Sparkles, CheckCircle2 } from "lucide-react";

export function DemoModeBadge() {
  const { isDemo, simulateDemoWallet } = useAuth();

  if (!isDemo) return null;

  return (
    <div
      role="status"
      aria-label="Demo Mode Active"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-300 font-mono text-xs select-none shadow-[0_0_12px_rgba(245,158,11,0.12)]"
      title="Demo Mode: Simulated funded wallet and local RPC fallbacks active"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
      <span className="font-semibold tracking-wide">Demo Mode</span>
    </div>
  );
}
