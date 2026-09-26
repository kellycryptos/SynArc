"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import Link from "next/link";
import { AuthPromptBanner } from "@/components/auth/AuthPromptBanner";

/**
 * Isolated client CTA button that subscribes to useAuth().
 * Keeping useAuth inside this sub-component prevents the header title/subtitle
 * from re-rendering when Privy finishes initializing.
 */
export function CreateProposalCTA() {
  const { isAuthenticated, login } = useAuth();

  if (isAuthenticated) {
    return (
      <Link
        href="/proposals/create"
        className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#2F6FFF] to-[#22D3EE] text-[#04101C] text-sm font-bold font-space rounded-lg hover:opacity-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]"
      >
        Create proposal
      </Link>
    );
  }

  return (
    <button
      onClick={login}
      className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#2F6FFF] to-[#22D3EE] text-[#04101C] text-sm font-bold font-space rounded-lg hover:opacity-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] cursor-pointer"
    >
      Create proposal
    </button>
  );
}

export function DashboardHeader() {
  return (
    <div className="space-y-4">
      {/* Title & Subtitle — static layout, paints immediately at FCP and never repaints */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-heading tracking-tight">Overview</h1>
          <p className="text-muted">
            Autonomous Treasury Management on Arc — monitor, govern, and execute.
          </p>
        </div>

        <CreateProposalCTA />
      </div>

      {/* AuthPromptBanner placed BELOW the header row so its appearance never shifts the header title/subtitle */}
      <AuthPromptBanner action="vote, create proposals, and deposit to the treasury" />
    </div>
  );
}
