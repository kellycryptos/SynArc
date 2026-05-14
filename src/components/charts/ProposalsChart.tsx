"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { VotingTrend } from "@/types";

interface Props {
  data: VotingTrend[];
}

export function ProposalsChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
        <Bar
          dataKey="proposals"
          fill="#8b5cf6"
          radius={[6, 6, 0, 0]}
          name="Proposals"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
