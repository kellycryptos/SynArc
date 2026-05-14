"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Props {
  data: { address: string; power: number }[];
}

const colors = ["#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95"];

export function DelegationChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: "#64748b", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`}
        />
        <YAxis
          type="category"
          dataKey="address"
          tick={{ fill: "#64748b", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(15,15,25,0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            fontSize: "13px",
            color: "#f8fafc",
          }}
          formatter={(value: number) => [value.toLocaleString(), "Voting Power"]}
        />
        <Bar dataKey="power" radius={[0, 6, 6, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
