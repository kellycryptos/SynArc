"use client";

/**
 * LandingActivitySection
 *
 * Client component — reads real on-chain proposal data from useGovernanceStore
 * and renders a chronological activity list. If the store has zero proposals
 * (which is the expected state on Arc Mainnet at launch), it shows an honest
 * "nothing here yet" empty state rather than fabricated content.
 *
 * Mounting triggers a store init call so data loads on the marketing page
 * without requiring the user to be connected.
 */

import { useEffect } from "react";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { GlassCard } from "@/components/ui/GlassCard";
import { Clock, ArrowRight, Inbox } from "lucide-react";
import Link from "next/link";

function statusLabel(status: string): { label: string; cls: string } {
  switch (status?.toLowerCase()) {
    case "active":
      return { label: "Active", cls: "text-[#2F6FFF] border-[#2F6FFF]/30 bg-[#2F6FFF]/10" };
    case "succeeded":
    case "executed":
      return { label: "Executed", cls: "text-[#22C55E] border-[#22C55E]/30 bg-[#22C55E]/10" };
    case "defeated":
      return { label: "Defeated", cls: "text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/10" };
    case "pending":
      return { label: "Pending", cls: "text-[#9CA6B8] border-[#9CA6B8]/30 bg-[#9CA6B8]/10" };
    default:
      return { label: status ?? "Unknown", cls: "text-[#9CA6B8] border-[#9CA6B8]/30 bg-[#9CA6B8]/10" };
  }
}

export function LandingActivitySection() {
  const { proposals, initialized, initializeStore } = useGovernanceStore();

  useEffect(() => {
    // Fire-and-forget — we don't need wallet connection for a read-only view
    initializeStore().catch(() => {
      // Silently swallow; the empty state handles the no-data case
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = proposals.slice(0, 5);

  return (
    <section
      id="activity"
      className="py-24 px-4 border-t border-border"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs font-mono font-medium text-muted uppercase tracking-wider mb-4 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            On-chain activity
          </div>
          <h2 className="text-2xl sm:text-3xl font-mono font-semibold text-foreground tracking-tight">
            Real proposals, real votes
          </h2>
          <p className="mt-2 text-sm text-muted max-w-xl">
            Every entry here is sourced directly from the Arc Mainnet governor
            contract — no fabricated history.
          </p>
        </div>

        {/* Content: list or honest empty state */}
        {!initialized ? (
          /* Loading skeleton */
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl border border-border bg-surface animate-pulse"
              />
            ))}
          </div>
        ) : visible.length > 0 ? (
          <div className="space-y-3">
            {visible.map((p, i) => {
              const { label, cls } = statusLabel(p.status);
              return (
                <GlassCard
                  key={p.id}
                  delay={i * 0.05}
                  className="p-4 sm:p-5 border border-border"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="font-mono text-xs text-muted mt-0.5 shrink-0">
                        #{i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {p.title}
                        </p>
                        {p.createdAt && (
                          <p className="flex items-center gap-1 text-xs text-muted mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(p.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {p.treasuryImpact && (
                        <span className="font-mono text-xs text-muted">
                          {p.treasuryImpact}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded border ${cls}`}
                      >
                        {label}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        ) : (
          /* Honest empty state */
          <div className="rounded-2xl border border-dashed border-border bg-surface/60 px-8 py-16 text-center">
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-2xl border border-border bg-background flex items-center justify-center">
                <Inbox className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h3 className="font-mono text-base font-semibold text-foreground mb-2">
              No proposals yet on Arc Mainnet
            </h3>
            <p className="text-sm text-muted max-w-sm mx-auto mb-8 leading-relaxed">
              The governor contract is live. Be among the first to submit a
              funded proposal — fund USDC into the DAO treasury and create one
              from the dashboard.
            </p>
            <Link
              href="/proposals/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-mono font-medium hover:bg-primary/90 transition-colors shadow-xs"
            >
              Submit first proposal
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* See all link — only when there are proposals */}
        {initialized && visible.length > 0 && (
          <div className="mt-6 text-center">
            <Link
              href="/proposals"
              className="inline-flex items-center gap-1.5 text-sm font-mono text-primary hover:underline transition-colors"
            >
              View all proposals
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
