"use client";

import { motion } from "framer-motion";
import {
  Hexagon,
  Users,
  Vote,
  Wallet,
  Activity,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  daoMembers,
  proposals,
  treasuryActivities,
  healthMetrics,
} from "@/lib/mockData";
import Link from "next/link";

export default function DashboardPage() {
  const activeProposals = proposals.filter((p) => p.status === "Active").length;
  const totalDelegates = daoMembers.filter((m) => m.isDelegate).length;

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Governance Dashboard</h1>
          <div className="px-3 py-1.5 rounded-lg bg-surface border border-border-thin text-sm font-medium">
            Arc Mainnet
          </div>
        </div>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <StatCard
            label="Treasury Value"
            value={`$${(healthMetrics.find(m => m.label === 'Treasury Value')?.value || 0) / 1000000}M`}
            change={12.5}
            changeType="increase"
            icon={<Wallet className="w-5 h-5" />}
            delay={0}
          />
          <StatCard
            label="Active Proposals"
            value={activeProposals.toString()}
            change={25}
            changeType="increase"
            icon={<Vote className="w-5 h-5" />}
            delay={0.1}
          />
          <StatCard
            label="DAO Members"
            value={daoMembers.length.toString()}
            change={8.2}
            changeType="increase"
            icon={<Users className="w-5 h-5" />}
            delay={0.2}
          />
          <StatCard
            label="Active Delegates"
            value={totalDelegates.toString()}
            change={8.3}
            changeType="increase"
            icon={<Hexagon className="w-5 h-5" />}
            delay={0.3}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Proposals Summary */}
          <section className="lg:col-span-2 space-y-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Programmable Proposals</h2>
              </div>
              <Link
                href="/proposals"
                className="text-sm text-accent hover:text-accent/80 transition-colors inline-flex items-center gap-1 font-medium"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {proposals.slice(0, 3).map((proposal, i) => (
                <GlassCard key={proposal.id} delay={i * 0.1}>
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${proposal.status === 'Active' ? 'bg-success/20 text-success' : 'bg-surface-elevated text-muted'}`}>
                          {proposal.status}
                        </span>
                        <span className="text-xs text-muted">{proposal.category}</span>
                      </div>
                      <h3 className="font-semibold text-lg">{proposal.title}</h3>
                      <p className="text-sm text-muted mt-1 max-w-xl truncate">{proposal.description}</p>
                    </div>
                    <div className="flex sm:flex-col gap-4 text-sm whitespace-nowrap">
                      <div>
                        <span className="text-success font-medium">For:</span> {(proposal.forVotes / 1000).toFixed(0)}k
                      </div>
                      <div>
                        <span className="text-danger font-medium">Against:</span> {(proposal.againstVotes / 1000).toFixed(0)}k
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="space-y-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Stablecoin Treasury</h2>
              </div>
              <Link
                href="/treasury"
                className="text-sm text-accent hover:text-accent/80 transition-colors inline-flex items-center gap-1 font-medium"
              >
                Full history <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <GlassCard hover={false}>
              <div className="space-y-3 p-2">
                {treasuryActivities.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          activity.type === "Inflow"
                            ? "bg-success"
                            : activity.type === "Outflow"
                            ? "bg-danger"
                            : activity.type === "Stake"
                            ? "bg-accent"
                            : activity.type === "Unstake"
                            ? "bg-warning"
                            : "bg-muted"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted">{activity.txHash}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${
                          activity.type === "Inflow"
                            ? "text-success"
                            : activity.type === "Outflow"
                            ? "text-danger"
                            : "text-foreground"
                        }`}
                      >
                        {activity.type === "Inflow" ? "+" : activity.type === "Outflow" ? "-" : ""}
                        {(activity.amount / 1000).toFixed(1)}k
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </section>
        </div>
      </div>
    </div>
  );
}
