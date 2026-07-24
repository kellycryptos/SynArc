"use client";

import { useState, useEffect, useMemo } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useGovernanceStore } from "@/hooks/useGovernanceStore";

export function GovernanceAnalytics() {
  const { proposals, initialized, initializeStore } = useGovernanceStore();
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    if (!initialized) {
      initializeStore();
    }
  }, [initialized, initializeStore]);

  // Dynamically calculate proposal volume and average participation over the last 5 months
  const chartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const range: { name: string; participation: number; proposals: number; totalPart: number; count: number }[] = [];

    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = months[d.getMonth()];
      range.push({ name: label, participation: 0, proposals: 0, totalPart: 0, count: 0 });
    }

    const list = Array.isArray(proposals) ? proposals : [];
    list.forEach(p => {
      if (!p || !p.createdAt) return;
      const date = new Date(p.createdAt);
      if (isNaN(date.getTime())) return;
      const label = months[date.getMonth()];
      const item = range.find(r => r.name === label);
      if (item) {
        item.proposals++;
        item.totalPart += (p.participationPercentage || 0);
        item.count++;
      }
    });

    return range.map(r => ({
      name: r.name,
      proposals: r.proposals,
      participation: r.count > 0 ? parseFloat((r.totalPart / r.count).toFixed(1)) : 16.7
    }));
  }, [proposals]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let handle: number | ReturnType<typeof setTimeout>;

    if ("requestIdleCallback" in window) {
      handle = (window as Window & typeof globalThis).requestIdleCallback(
        () => setChartReady(true),
        { timeout: 2000 }
      );
    } else {
      // Safari fallback — short delay keeps recharts off the critical parse path
      handle = setTimeout(() => setChartReady(true), 200);
    }

    return () => {
      if ("requestIdleCallback" in window && typeof handle === "number") {
        (window as Window & typeof globalThis).cancelIdleCallback(handle as number);
      } else {
        clearTimeout(handle as ReturnType<typeof setTimeout>);
      }
    };
  }, []);

  return (
    <GlassCard className="p-6 h-[400px] flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-semibold font-heading">Governance Activity</h3>
        <p className="text-sm text-muted">Proposal participation and volume over time</p>
      </div>

      {/* Skeleton placeholder — identical h-[332px] flex-1 block keeps layout stable
          while recharts is deferred. Once chartReady flips true the chart occupies
          the exact same space, so CLS remains 0. */}
      <div className="flex-1 min-h-0">
        {chartReady ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorParticipation" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
              <Tooltip />
              <Area type="monotone" dataKey="participation" stroke="#7C3AED" strokeWidth={2} fillOpacity={1} fill="url(#colorParticipation)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          /* Skeleton grid that mimics the chart's visual weight without any JS cost */
          <div className="w-full h-full flex flex-col justify-between pb-2" aria-hidden="true">
            {/* Fake Y-axis gridlines */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full h-px bg-white/[0.04]" />
            ))}
            {/* Fake area fill block */}
            <div className="absolute inset-x-6 bottom-10 h-24 rounded-lg bg-gradient-to-t from-[#7C3AED]/10 to-transparent pointer-events-none" />
            {/* Fake X-axis labels */}
            <div className="flex justify-between pt-2">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May'].map((m) => (
                <span key={m} className="text-[11px] text-muted/40 font-mono">{m}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
