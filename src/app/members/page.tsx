"use client";

import { motion } from "framer-motion";
import {
  Users,
  Crown,
  Shield,
  Award,
  Star,
  User,
  TrendingUp,
  Vote,
  FileText,
  Search,
  Filter,
} from "lucide-react";
import { useState, useMemo } from "react";
import { daoMembers } from "@/lib/mockData";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";
import { cn } from "@/lib/utils";
import { DAOMember } from "@/types";

const reputationConfig = {
  Architect: { icon: Crown, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
  Guardian: { icon: Shield, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20" },
  Steward: { icon: Award, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
  Contributor: { icon: Star, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  Novice: { icon: User, color: "text-muted", bg: "bg-white/[0.04]", border: "border-white/[0.06]" },
};

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("All");

  const totalDelegates = daoMembers.filter((m) => m.isDelegate).length;
  const totalVotingPower = daoMembers.reduce((acc, m) => acc + m.votingPower, 0);
  const avgParticipation =
    daoMembers.reduce((acc, m) => acc + m.votingParticipationRate, 0) /
    daoMembers.length;

  const filteredMembers = useMemo(() => {
    return daoMembers.filter((m) => {
      const matchesSearch =
        m.address.toLowerCase().includes(search.toLowerCase()) ||
        (m.ensName?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesLevel = filterLevel === "All" || m.reputationLevel === filterLevel;
      return matchesSearch && matchesLevel;
    });
  }, [search, filterLevel]);

  const levels = ["All", "Architect", "Guardian", "Steward", "Contributor", "Novice"];

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-bold">DAO Members</h1>
          <p className="text-muted">
            Explore delegates, reputation levels, and governance participation
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Members"
            value={daoMembers.length.toString()}
            icon={<Users className="w-5 h-5" />}
            delay={0}
          />
          <StatCard
            label="Active Delegates"
            value={totalDelegates.toString()}
            icon={<Crown className="w-5 h-5" />}
            delay={0.1}
          />
          <StatCard
            label="Total Voting Power"
            value={`${(totalVotingPower / 1000000).toFixed(1)}M`}
            icon={<TrendingUp className="w-5 h-5" />}
            delay={0.2}
          />
          <StatCard
            label="Avg Participation"
            value={`${avgParticipation.toFixed(1)}%`}
            icon={<Vote className="w-5 h-5" />}
            delay={0.3}
          />
        </div>

        {/* Filters */}
        <GlassCard hover={false} className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search by address or ENS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-4 h-4 text-muted shrink-0" />
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => setFilterLevel(level)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border",
                    filterLevel === level
                      ? "bg-accent/10 border-accent/20 text-accent"
                      : "bg-white/[0.04] border-white/[0.08] text-muted hover:text-foreground"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Members Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMembers.map((member, i) => (
            <MemberCard key={member.id} member={member} delay={i * 0.05} />
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <GlassCard hover={false} className="text-center py-16">
            <Users className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No members found</h3>
            <p className="text-sm text-muted">Try adjusting your search or filters</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

function MemberCard({ member, delay }: { member: DAOMember; delay: number }) {
  const config = reputationConfig[member.reputationLevel];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card p-5 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/20 flex items-center justify-center text-sm font-bold text-accent">
            {member.ensName?.charAt(0).toUpperCase() ?? member.address.charAt(2)}
          </div>
          <div>
            <p className="font-medium text-sm">
              {member.ensName ?? member.address}
            </p>
            {member.ensName && (
              <p className="text-xs text-muted">{member.address}</p>
            )}
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
            config.bg,
            config.color,
            config.border
          )}
        >
          <Icon className="w-3 h-3" />
          {member.reputationLevel}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 rounded-lg bg-white/[0.03]">
          <p className="text-lg font-bold">{(member.votingPower / 1000000).toFixed(1)}M</p>
          <p className="text-[10px] text-muted uppercase tracking-wider">Voting Power</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/[0.03]">
          <p className="text-lg font-bold">{member.proposalsVoted}</p>
          <p className="text-[10px] text-muted uppercase tracking-wider">Votes Cast</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/[0.03]">
          <p className="text-lg font-bold">{member.votingParticipationRate}%</p>
          <p className="text-[10px] text-muted uppercase tracking-wider">Participation</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Reputation Score</span>
          <span className="font-medium">{member.reputationScore.toLocaleString()}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(member.reputationScore / 10000) * 100}%` }}
            transition={{ duration: 1, delay: delay + 0.3 }}
            className={cn("h-full rounded-full", config.color.replace("text-", "bg-"))}
          />
        </div>

        {member.isDelegate && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.04]">
            <span className="text-muted">Delegated Power</span>
            <span className="font-medium text-accent">
              {(member.delegatedPower / 1000000).toFixed(1)}M ({member.delegatorsCount} delegators)
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-muted">Proposals Created</span>
          <span className="font-medium flex items-center gap-1">
            <FileText className="w-3 h-3 text-muted" />
            {member.proposalsCreated}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
