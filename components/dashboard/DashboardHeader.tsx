"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import Link from "next/link";
import { AuthPromptBanner } from "@/components/auth/AuthPromptBanner";
import { Plus } from "lucide-react";

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary font-space">
          Dashboard
        </h1>

        <CreateProposalCTA />
      </div>

      {/* AuthPromptBanner placed BELOW the header row */}
      <AuthPromptBanner action="vote, create proposals, and deposit to the treasury" />
    </div>
  );
}
