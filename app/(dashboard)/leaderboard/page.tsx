"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCreatorStore } from "@/hooks/useCreatorStore";
import { GlassCard } from "@/components/ui/GlassCard";
import { Trophy, ChevronRight, User, Users, Star, Coins, RefreshCw } from "lucide-react";

export default function LeaderboardPage() {
  const { creators, initializeStore, initialized } = useCreatorStore();
  const [period, setPeriod] = useState<"week" | "month" | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  if (!initialized) {
    return (
      <div className="max-w-5xl mx-auto py-6 px-4 space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
          <div className="space-y-2">
            <div className="h-8 bg-white/[0.04] rounded w-48" />
            <div className="h-4 bg-white/[0.02] rounded w-64" />
          </div>
          <div className="h-10 bg-white/[0.04] rounded-xl w-72" />
        </div>

        {/* Categories Skeleton */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 bg-white/[0.04] rounded-xl w-16" />
          ))}
        </div>

        {/* Podium Skeleton */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 items-end pt-8 max-w-2xl mx-auto text-center">
          {/* 2nd place */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/[0.04] mx-auto" />
            <div className="h-4 bg-white/[0.04] rounded w-16 mx-auto" />
            <div className="w-full h-36 bg-white/[0.02] border-t border-x border-border-subtle/30 rounded-t-2xl" />
          </div>
          {/* 1st place */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 md:w-18 md:h-18 rounded-full bg-white/[0.04] mx-auto" />
            <div className="h-4 bg-white/[0.04] rounded w-20 mx-auto" />
            <div className="w-full h-44 bg-white/[0.02] border-t border-x border-border-subtle/30 rounded-t-2xl" />
          </div>
          {/* 3rd place */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/[0.04] mx-auto" />
            <div className="h-4 bg-white/[0.04] rounded w-16 mx-auto" />
            <div className="w-full h-28 bg-white/[0.02] border-t border-x border-border-subtle/30 rounded-t-2xl" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="glass-card p-0 border border-border overflow-hidden">
          <div className="p-4 bg-surface-elevated/20 border-b border-border-thin flex justify-between">
            <div className="h-4 bg-white/[0.04] rounded w-12" />
            <div className="h-4 bg-white/[0.04] rounded w-32" />
            <div className="h-4 bg-white/[0.04] rounded w-20" />
            <div className="h-4 bg-white/[0.04] rounded w-20" />
          </div>
          <div className="divide-y divide-border-subtle/35">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <div className="h-4 bg-white/[0.02] rounded w-6" />
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04]" />
                  <div className="h-4 bg-white/[0.02] rounded w-24" />
                </div>
                <div className="h-4 bg-white/[0.02] rounded w-16" />
                <div className="h-4 bg-white/[0.02] rounded w-16" />
                <div className="h-8 bg-white/[0.04] rounded-lg w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const categories = ["All", "Music", "Art", "Writing", "Gaming", "AI Agent", "Builder"];

  // Filter and compute active list
  const filteredCreators = creators
    .filter((c) => {
      if (selectedCategory === "All") return true;
      return c.category.toLowerCase() === selectedCategory.toLowerCase().replace(" ", "-");
    })
    .map((c) => {
      // Simulate weekly/monthly scores so changing tabs dynamically shifts values realistically
      let multiplier = 1.0;
      if (period === "week") multiplier = 0.35 + (c.name.charCodeAt(0) % 15) / 100;
      if (period === "month") multiplier = 0.75 + (c.name.charCodeAt(0) % 10) / 100;

      const simulatedRaised = Number((c.raised * multiplier).toFixed(2));
      const simulatedSupporters = Math.round(c.supporters * multiplier);

      return {
        ...c,
        raised: simulatedRaised,
        supporters: simulatedSupporters,
      };
    })
    // Sort descending by raised amount
    .sort((a, b) => b.raised - a.raised);

  const topThree = filteredCreators.slice(0, 3);
  const remainingCreators = filteredCreators.slice(3);

  // Podium Positions helpers
  const podiumOrder = [
    { rank: 2, index: 1, height: "h-40", border: "border-slate-400/20", glow: "rgba(148,163,184,0.05)", text: "🥈" },
    { rank: 1, index: 0, height: "h-48", border: "border-amber-400/30", glow: "rgba(245,158,11,0.08)", text: "🥇" },
    { rank: 3, index: 2, height: "h-36", border: "border-amber-700/20", glow: "rgba(180,83,9,0.04)", text: "🥉" },
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-8 animate-fade-in-up">
      {/* Header section */}
      <div className="border-b border-border-subtle pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-white tracking-tight flex items-center gap-2.5">
            🏆 Creator Leaderboard
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Top funded creators and AI agents on Arc — ranked by USDC raised.
          </p>
        </div>

        {/* Time period tabs */}
        <div className="inline-flex p-1 rounded-xl bg-surface border border-border-thin">
          <button
            onClick={() => setPeriod("week")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === "week" ? "bg-accent-purple text-white-keep" : "text-muted hover:text-white"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === "month" ? "bg-accent-purple text-white-keep" : "text-muted hover:text-white"
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setPeriod("all")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === "all" ? "bg-accent-purple text-white-keep" : "text-muted hover:text-white"
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 items-center">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedCategory === cat
                ? "bg-accent-purple border-accent-purple text-white-keep shadow-[0_0_12px_rgba(124,58,237,0.25)]"
                : "bg-surface border-border-thin text-muted hover:text-white hover:border-border"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Podium Showcase (Top 3 Banners) */}
      {filteredCreators.length > 0 && (
        <div className="grid grid-cols-3 gap-3 md:gap-6 items-end pt-8 max-w-2xl mx-auto text-center">
          {podiumOrder.map((spot) => {
            const creator = spot.index < filteredCreators.length ? filteredCreators[spot.index] : null;
            if (!creator) return <div key={spot.rank} />;
            
            const isFirst = spot.rank === 1;

            return (
              <div key={spot.rank} className="flex flex-col items-center">
                <Link href={`/creator/${creator.id}`} className="group block space-y-3 relative z-10">
                  <div className="relative">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-white/10 flex items-center justify-center text-xl font-bold mx-auto group-hover:scale-105 transition-transform duration-300 shadow-md overflow-hidden relative">
                      {creator.image ? (
                        <Image src={creator.image} alt={creator.name} fill sizes="64px" className="object-cover" />
                      ) : (
                        creator.name[0]
                      )}
                    </div>
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-lg drop-shadow select-none">
                      {spot.text}
                    </span>
                  </div>
                  
                  <div className="space-y-0.5">
                    <h3 className="text-xs md:text-sm font-extrabold text-white group-hover:text-primary transition-colors line-clamp-1">
                      {creator.name}
                    </h3>
                    <span className="text-[10px] text-text-tertiary uppercase tracking-wider">{creator.category}</span>
                  </div>
                </Link>

                {/* Podium pillar display */}
                <div 
                  className={`w-full ${spot.height} rounded-t-2xl border-t border-x ${spot.border} flex flex-col justify-end p-4 relative overflow-hidden mt-4`}
                  style={{
                    background: `linear-gradient(to top, rgba(20,20,32,0.8), rgba(20,20,32,0.4))`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px ${spot.glow}`,
                  }}
                >
                  <div className="absolute inset-0 grid-overlay opacity-10" />
                  <div className="relative z-10 space-y-0.5">
                    <span className="text-[10px] font-bold text-success block">
                      {creator.raised.toLocaleString()} USDC
                    </span>
                    <span className="text-[9px] text-text-tertiary block">
                      {creator.supporters} backers
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full ranked table */}
      <GlassCard className="p-0 border border-border overflow-hidden" hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border-thin bg-surface-elevated/20 text-text-tertiary uppercase font-bold tracking-wider select-none">
                <th className="p-4 w-16 text-center">Rank</th>
                <th className="p-4">Creator</th>
                <th className="p-4">Category</th>
                <th className="p-4">USDC Raised</th>
                <th className="p-4">Backers</th>
                <th className="p-4 w-40">Funding Progress</th>
                <th className="p-4 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/35">
              {filteredCreators.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-tertiary font-semibold">
                    No creators found in this category.
                  </td>
                </tr>
              ) : (
                filteredCreators.map((creator, i) => {
                  const progress = Math.min(100, (creator.raised / creator.goal) * 100);
                  
                  return (
                    <tr key={creator.id} className="hover:bg-surface-elevated/15 transition-colors group">
                      {/* Rank Column */}
                      <td className="p-4 text-center font-extrabold text-sm text-text-secondary">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </td>
                      
                      {/* Creator Details Column */}
                      <td className="p-4">
                        <Link href={`/creator/${creator.id}`} className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-border-thin flex items-center justify-center font-bold text-white group-hover:scale-105 transition-transform overflow-hidden shrink-0 relative">
                            {creator.image ? (
                              <Image src={creator.image} alt={creator.name} fill sizes="36px" className="object-cover" />
                            ) : (
                              creator.name[0]
                            )}
                          </div>
                          <div>
                            <span className="font-extrabold text-white text-xs group-hover:text-primary transition-colors block">
                              {creator.name}
                            </span>
                            {creator.twitter && (
                              <span className="text-[10px] text-sky-400 block mt-0.5">@{creator.twitter}</span>
                            )}
                          </div>
                        </Link>
                      </td>
                      
                      {/* Category Column */}
                      <td className="p-4">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-surface-elevated border border-border-thin text-text-secondary font-bold uppercase tracking-wider">
                          {creator.category}
                        </span>
                      </td>
                      
                      {/* Raised Amount Column */}
                      <td className="p-4 font-bold text-success">
                        {creator.raised.toLocaleString()} USDC
                      </td>
                      
                      {/* Supporters Backers Column */}
                      <td className="p-4 font-bold text-text-secondary flex items-center gap-1 mt-3">
                        <Users className="w-3.5 h-3.5 text-text-tertiary" />
                        {creator.supporters}
                      </td>
                      
                      {/* Funding Progress Column */}
                      <td className="p-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[9px] text-text-tertiary">
                            <span>{progress.toFixed(0)}%</span>
                            <span>Target: {creator.goal.toLocaleString()} USDC</span>
                          </div>
                          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border-thin">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      
                      {/* Action Column */}
                      <td className="p-4 text-right">
                        <Link href={`/creator/${creator.id}`}>
                          <button className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-primary border border-border-thin hover:border-primary/20 text-white font-extrabold text-[10px] flex items-center gap-1 transition-all cursor-pointer">
                            View Profile
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* CTA Banner at bottom */}
      <GlassCard className="p-6 md:p-8 border border-primary/20 bg-primary/[0.01] flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden" hover={false}>
        <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1.5 text-center md:text-left relative z-10">
          <h3 className="text-lg font-extrabold font-heading text-white tracking-tight">Want to launch on the leaderboard?</h3>
          <p className="text-xs text-text-secondary max-w-md leading-relaxed">
            Launch your Creator DAO in less than a minute and start receiving USDC support.
          </p>
        </div>
        
        <Link href="/create-dao" className="relative z-10 shrink-0 self-stretch md:self-auto">
          <button className="w-full px-6 py-3 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white-keep font-extrabold text-xs transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] hover:shadow-[0_0_20px_rgba(124,58,237,0.455)] cursor-pointer flex items-center justify-center gap-1.5">
            Launch Your Creator DAO
            <ChevronRight className="w-4 h-4" />
          </button>
        </Link>
      </GlassCard>
    </div>
  );
}
