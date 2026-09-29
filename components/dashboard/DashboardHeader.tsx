"use client";

import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import Link from "next/link";
import { AuthPromptBanner } from "@/components/auth/AuthPromptBanner";
import { Plus, Bookmark, Flame, Sparkles } from "lucide-react";

/**
 * Isolated client CTA button that subscribes to useAuth().
 */
export function CreateProposalCTA() {
  const { isAuthenticated, login } = useAuth();

  if (isAuthenticated) {
    return (
      <Link
        href="/proposals/create"
        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#2F6FFF] to-[#4F8BFF] text-white text-xs font-bold font-space rounded-xl hover:opacity-95 transition-all shadow-[0_0_15px_rgba(47,111,255,0.25)]"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        Create proposal
      </Link>
    );
  }

  return (
    <button
      onClick={login}
      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#2F6FFF] to-[#4F8BFF] text-white text-xs font-bold font-space rounded-xl hover:opacity-95 transition-all shadow-[0_0_15px_rgba(47,111,255,0.25)] cursor-pointer"
    >
      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      Create proposal
    </button>
  );
}

export function DashboardHeader() {
  const [greeting, setGreeting] = useState("Good day.");
  const [dateStr, setDateStr] = useState("2026-09-29");

  useEffect(() => {
    const now = new Date();
    const hours = now.getHours();
    if (hours < 12) {
      setGreeting("Good morning.");
    } else if (hours < 18) {
      setGreeting("Good afternoon.");
    } else {
      setGreeting("Good evening.");
    }

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    setDateStr(`${yyyy}-${mm}-${dd}`);
  }, []);

  return (
    <div className="space-y-4">
      {/* Editorial Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
        <div className="space-y-1.5">
          {/* Micro Date */}
          <div className="font-mono text-xs text-[#8A948E] tracking-wider">
            {dateStr}
          </div>

          {/* Large Editorial Serif Greeting */}
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#F5F7FA] font-normal tracking-tight">
            {greeting}
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[#8A948E] font-space">
            Pick an ecosystem DAO or review today&apos;s active proposals.
          </p>
        </div>

        {/* Action Pills & CTA */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#1B2536] bg-[#0B111C] text-xs font-mono text-[#8A948E]">
            <Bookmark className="w-3.5 h-3.5 text-[#6B7385]" />
            <span>Saved 0</span>
          </div>

          <CreateProposalCTA />
        </div>
      </div>

      {/* AuthPromptBanner placed BELOW the header row */}
      <AuthPromptBanner action="vote, create proposals, and deposit to the treasury" />
    </div>
  );
}
