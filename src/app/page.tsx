"use client";

import { motion } from "framer-motion";
import {
  Hexagon,
  Users,
  Vote,
  Wallet,
  Activity,
  ArrowRight,
  Zap,
  Shield,
  Globe,
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

const features = [
  {
    icon: Vote,
    title: "On-Chain Voting",
    description: "Transparent, immutable governance votes secured by the Arc Network.",
  },
  {
    icon: Shield,
    title: "Delegated Power",
    description: "Delegate your voting power to trusted stewards or become one yourself.",
  },
  {
    icon: Zap,
    title: "Instant Execution",
    description: "Automated proposal execution via timelock contracts post-quorum.",
  },
  {
    icon: Globe,
    title: "Cross-Chain",
    description: "Governance that spans across the entire Arc ecosystem.",
  },
];

export default function HomePage() {
  const activeProposals = proposals.filter((p) => p.status === "Active").length;
  const totalDelegates = daoMembers.filter((m) => m.isDelegate).length;
  const totalVotingPower = daoMembers.reduce((acc, m) => acc + m.votingPower, 0);

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Hero */}
        <section className="text-center space-y-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Arc Testnet Live
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Govern the{" "}
              <span className="gradient-text">Arc Ecosystem</span>
            </h1>
            <p className="text-lg text-muted max-w-2xl mx-auto leading-relaxed">
              SynArc DAO is the decentralized governance layer for Arc Network.
              Create proposals, delegate voting power, and shape cross-chain
              infrastructure.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/members"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
            >
              <Users className="w-4 h-4" />
              Explore Members
            </Link>
            <Link
              href="/analytics"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-foreground font-medium hover:bg-white/[0.1] transition-colors"
            >
              <Activity className="w-4 h-4" />
              View Analytics
            </Link>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Proposals"
            value={activeProposals.toString()}
            change={25}
            changeType="increase"
            icon={<Vote className="w-5 h-5" />}
            delay={0}
          />
          <StatCard
            label="DAO Members"
            value={daoMembers.length.toString()}
            change={12.5}
            changeType="increase"
            icon={<Users className="w-5 h-5" />}
            delay={0.1}
          />
          <StatCard
            label="Active Delegates"
            value={totalDelegates.toString()}
            change={8.3}
            changeType="increase"
            icon={<Hexagon className="w-5 h-5" />}
            delay={0.2}
          />
          <StatCard
            label="Total Voting Power"
            value={`${(totalVotingPower / 1000000).toFixed(1)}M`}
            change={15.2}
            changeType="increase"
            icon={<Wallet className="w-5 h-5" />}
            delay={0.3}
          />
        </section>

        {/* Features */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Why SynArc DAO?</h2>
            <p className="text-muted">Built for modern decentralized governance</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <GlassCard key={feature.title} delay={i * 0.1}>
                  <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent w-fit mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {feature.description}
                  </p>
                </GlassCard>
              );
            })}
          </div>
        </section>

        {/* Health Metrics */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">DAO Health</h2>
              <p className="text-muted text-sm">Key performance indicators</p>
            </div>
            <Link
              href="/analytics"
              className="text-sm text-accent hover:text-accent/80 transition-colors inline-flex items-center gap-1"
            >
              Full analytics <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {healthMetrics.map((metric, i) => (
              <StatCard
                key={metric.label}
                label={metric.label}
                value={
                  metric.label.includes("Value")
                    ? `$${(metric.value / 1000000).toFixed(1)}M`
                    : metric.label.includes("Rate")
                    ? `${metric.value}%`
                    : metric.label.includes("Time")
                    ? `${metric.value}h`
                    : metric.value.toString()
                }
                change={metric.change}
                changeType={metric.changeType}
                icon={<Activity className="w-5 h-5" />}
                delay={i * 0.1}
              />
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Recent Treasury Activity</h2>
              <p className="text-muted text-sm">Latest on-chain movements</p>
            </div>
          </div>
          <GlassCard hover={false}>
            <div className="space-y-3">
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
                      {activity.amount.toLocaleString()} {activity.token}
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
  );
}
