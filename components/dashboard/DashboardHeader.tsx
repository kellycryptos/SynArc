"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import Link from "next/link";
import { AuthPromptBanner } from "@/components/auth/AuthPromptBanner";

/**
 * Client wrapper for the dashboard header that handles auth-aware
 * "Create Proposal" button and the public access banner.
 * Kept as a separate client component so the parent page stays a server component.
 */
export function DashboardHeader() {
  const { isAuthenticated, login } = useAuth();

  return (
    <>
      {/* Non-blocking auth prompt for unauthenticated visitors */}
      <AuthPromptBanner action="vote, create proposals, and deposit to the treasury" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-heading tracking-tight">Overview</h1>
          <p className="text-muted">
            Monitor governance activity and treasury health across the SynArc ecosystem.
          </p>
        </div>

        {isAuthenticated ? (
          <Link
            href="/proposals/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-purple text-white-keep text-sm font-medium rounded-xl hover:bg-accent-purple/90 transition-colors shadow-[0_0_15px_rgba(124,58,237,0.2)]"
          >
            Create Proposal
          </Link>
        ) : (
          <button
            onClick={login}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-purple text-white-keep text-sm font-medium rounded-xl hover:bg-accent-purple/90 transition-colors shadow-[0_0_15px_rgba(124,58,237,0.2)] cursor-pointer"
          >
            Create Proposal
          </button>
        )}
      </div>
    </>
  );
}
