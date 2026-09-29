"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { VotingTrend } from "@/types";
import { TOKENS } from "@/lib/theme-tokens";

interface Props {
  data: VotingTrend[];
}

export function ParticipationChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="participationGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={TOKENS.brand} stopOpacity={0.3} />
            <stop offset="95%" stopColor={TOKENS.brand} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="turnoutGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={TOKENS.brandLight} stopOpacity={0.2} />
            <stop offset="95%" stopColor={TOKENS.brandLight} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="period"
          tick={{ fill: "#64748b", fontSize: 12 }}
          axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#64748b", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(15,15,25,0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            fontSize: "13px",
            color: "#f8fafc",
          }}
        />
        <Area
          type="monotone"
          dataKey="participation"
          stroke={TOKENS.brand}
          strokeWidth={2}
          fill="url(#participationGrad)"
          name="Participation %"
        />
        <Area
          type="monotone"
          dataKey="averageTurnout"
          stroke={TOKENS.brandLight}
          strokeWidth={2}
          fill="url(#turnoutGrad)"
          name="Avg Turnout %"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
