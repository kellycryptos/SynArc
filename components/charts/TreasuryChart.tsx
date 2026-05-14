"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: { name: string; value: number }[];
}

const COLORS = ["#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444"];

export function TreasuryChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={4}
          dataKey="value"
          stroke="none"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "rgba(15,15,25,0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            fontSize: "13px",
            color: "#f8fafc",
          }}
          formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
