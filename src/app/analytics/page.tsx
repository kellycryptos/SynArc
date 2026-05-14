"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  Wallet,
  Vote,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { ParticipationChart } from "@/components/charts/ParticipationChart";
import { ProposalsChart } from "@/components/charts/ProposalsChart";
import { DelegationChart } from "@/components/charts/DelegationChart";
import { TreasuryChart } from "@/components/charts/TreasuryChart";
import {
  votingTrends,
  delegationAnalytics,
  treasuryActivities,
  proposals,
  daoMembers,
} from "@/lib/mockData";

const treasuryData = [
  { name: "USDC", value: 5200000 },
  { name: "ETH", value: 3100000 },
  { name: "ARC", value: 2100000 },
  { name: "Staked", value: 1500000 },
  { name: "Other", value: 550000 },
];

export default function AnalyticsPage() {
  const totalProposals = proposals.length;
  const passedProposals = proposals.filter((p) => p.status === "Passed" || p.status === "Executed").length;
  const passRate = totalProposals > 0 ? (passedProposals / totalProposals) * 100 : 0;
  const totalTreasury = treasuryData.reduce((acc, t) => acc + t.value, 0);

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-bold">Governance Analytics</h1>
          <p className="text-muted">
            Deep insights into proposal participation, treasury activity, and DAO health
          </p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Proposals"
            value={totalProposals.toString()}
            change={18.5}
            changeType="increase"
            icon={<BarChart3 className="w-5 h-5" />}
            delay={0}
          />
          <StatCard
            label="Pass Rate"
            value={`${passRate.toFixed(0)}%`}
            change={5.2}
            changeType="increase"
            icon={<TrendingUp className="w-5 h-5" />}
            delay={0.1}
          />
          <StatCard
            label="Total Delegations"
            value={delegationAnalytics.totalDelegations.toString()}
            change={24.1}
            changeType="increase"
            icon={<Users className="w-5 h-5" />}
            delay={0.2}
          />
          <StatCard
            label="Treasury Value"
            value={`$${(totalTreasury / 1000000).toFixed(1)}M`}
            change={12.5}
            changeType="increase"
            icon={<Wallet className="w-5 h-5" />}
            delay={0.3}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Voting Participation</h3>
                <p className="text-xs text-muted">Monthly participation & turnout</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-1 rounded-full border border-success/20">
                <ArrowUpRight className="w-3 h-3" />
                +18.5%
              </div>
            </div>
            <ParticipationChart data={votingTrends} />
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Proposals by Month</h3>
                <p className="text-xs text-muted">Governance activity over time</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-1 rounded-full border border-success/20">
                <ArrowUpRight className="w-3 h-3" />
                +8.3%
              </div>
            </div>
            <ProposalsChart data={votingTrends} />
          </GlassCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Top Delegates</h3>
                <p className="text-xs text-muted">Voting power distribution</p>
              </div>
            </div>
            <DelegationChart data={delegationAnalytics.topDelegates} />
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Treasury Allocation</h3>
                <p className="text-xs text-muted">Asset distribution breakdown</p>
              </div>
            </div>
            <TreasuryChart data={treasuryData} />
            <div className="grid grid-cols-5 gap-2 mt-4">
              {treasuryData.map((item, i) => (
                <div key={item.name} className="text-center">
                  <p className="text-xs text-muted">{item.name}</p>
                  <p className="text-sm font-semibold">{((item.value / totalTreasury) * 100).toFixed(0)}%</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Growth Metrics */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Governance Growth</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "New Members (30d)", value: "+24", change: 12.5, icon: Users },
              { label: "Avg Vote Duration", value: "18h", change: -5.4, icon: Vote },
              { label: "Delegation Growth", value: "+156", change: 24.1, icon: Activity },
            ].map((metric, i) => {
              const Icon = metric.icon;
              const isPositive = metric.change > 0;
              return (
                <GlassCard key={metric.label} delay={i * 0.1}>
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${
                        isPositive
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-danger/10 text-danger border-danger/20"
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {Math.abs(metric.change)}%
                    </div>
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="text-sm text-muted">{metric.label}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>

        {/* Recent Treasury Activity Table */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Recent Treasury Activity</h2>
          <GlassCard hover={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3 px-4 text-muted font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-muted font-medium">Description</th>
                    <th className="text-right py-3 px-4 text-muted font-medium">Amount</th>
                    <th className="text-right py-3 px-4 text-muted font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {treasuryActivities.map((activity) => (
                    <tr
                      key={activity.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${
                            activity.type === "Inflow"
                              ? "bg-success/10 text-success border-success/20"
                              : activity.type === "Outflow"
                              ? "bg-danger/10 text-danger border-danger/20"
                              : activity.type === "Stake"
                              ? "bg-accent/10 text-accent border-accent/20"
                              : "bg-warning/10 text-warning border-warning/20"
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              activity.type === "Inflow"
                                ? "bg-success"
                                : activity.type === "Outflow"
                                ? "bg-danger"
                                : activity.type === "Stake"
                                ? "bg-accent"
                                : "bg-warning"
                            }`}
                          />
                          {activity.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-xs text-muted font-mono">{activity.txHash}</p>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        <span
                          className={
                            activity.type === "Inflow"
                              ? "text-success"
                              : activity.type === "Outflow"
                              ? "text-danger"
                              : ""
                          }
                        >
                          {activity.type === "Inflow" ? "+" : activity.type === "Outflow" ? "-" : ""}
                          {activity.amount.toLocaleString()} {activity.token}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-muted">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* DAO Health */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">DAO Health Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Voter Turnout", value: "84.2%", target: "75%", status: "good" },
              { label: "Proposal Velocity", value: "9.3/mo", target: "8/mo", status: "good" },
              { label: "Treasury Runway", value: "42 mo", target: "24 mo", status: "good" },
              { label: "Member Retention", value: "91%", target: "85%", status: "good" },
            ].map((metric, i) => (
              <GlassCard key={metric.label} delay={i * 0.1}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted">{metric.label}</p>
                    <div className="w-2 h-2 rounded-full bg-success" />
                  </div>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Target: {metric.target}</span>
                    <span className="text-success">On track</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "85%" }}
                      transition={{ duration: 1, delay: i * 0.1 + 0.3 }}
                      className="h-full rounded-full bg-success"
                    />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
