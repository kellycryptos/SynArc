"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend
} from "recharts";

interface Props {
  chartData: any[];
  compositionData: { name: string; value: number; color: string }[];
}

export function TreasuryChartsSection({ chartData, compositionData }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Growth Chart */}
      <GlassCard className="lg:col-span-2 p-6 h-[400px] flex flex-col">
        <h3 className="text-lg font-bold text-foreground mb-6 font-space">Treasury Valuation Trend (USD Value)</h3>
        <div className="flex-1 w-full h-full min-h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2F6FFF" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#2F6FFF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
              <XAxis dataKey="date" stroke="#6B7385" tick={{fill: '#6B7385', fontSize: 11}} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B7385" tick={{fill: '#6B7385', fontSize: 11}} tickFormatter={(val) => (val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val.toFixed(2)}`)} tickLine={false} axisLine={false} width={48} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0B111C', borderColor: '#1B2536', borderRadius: '12px', color: '#F5F7FA' }}
                formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "US Valuation"]}
              />
              <Area type="monotone" dataKey="balance" stroke="#2F6FFF" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBalance)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Allocation Composition */}
      <GlassCard className="p-6 h-[400px] flex flex-col">
        <h3 className="text-lg font-bold text-foreground mb-6 font-space">Asset Composition (USD)</h3>
        <div className="flex-1 w-full min-h-0 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={compositionData}
                cx="50%"
                cy="40%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {compositionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0B111C', borderColor: '#1B2536', borderRadius: '12px', color: '#F5F7FA' }}
                formatter={(v) => [`${v}%`, "Allocation"]}
              />
              <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs font-medium text-muted font-space">{value}</span>} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
