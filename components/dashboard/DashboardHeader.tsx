"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import Link from "next/link";
import { AuthPromptBanner } from "@/components/auth/AuthPromptBanner";
import { Plus, Bookmark } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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
  return (
    <div className="space-y-4">
      {/* Action Pills & CTA */}
      <div className="flex items-center justify-end gap-2 flex-wrap pt-1">
        <ThemeToggle variant="pill" className="hidden sm:inline-flex" />

        <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-surface text-xs font-mono text-muted">
          <Bookmark className="w-3.5 h-3.5 text-muted" />
          <span>Saved 0</span>
        </div>

        <CreateProposalCTA />
      </div>

      {/* AuthPromptBanner placed BELOW the header row */}
      <AuthPromptBanner action="vote, create proposals, and deposit to the treasury" />
    </div>
  );
}
