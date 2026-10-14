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
        <h3 className="text-lg font-bold text-text-primary mb-6">Treasury Valuation Trend (USD Value)</h3>
        <div className="flex-1 w-full h-full min-h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D1B4E" opacity={0.3} vertical={false} />
              <XAxis dataKey="date" stroke="#9E8CA9" tick={{fill: '#9E8CA9', fontSize: 11}} tickLine={false} axisLine={false} />
              <YAxis stroke="#9E8CA9" tick={{fill: '#9E8CA9', fontSize: 11}} tickFormatter={(val) => (val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val.toFixed(2)}`)} tickLine={false} axisLine={false} width={48} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#150A2E', borderColor: '#3D2E68', borderRadius: '12px', color: '#FFF' }}
                formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "US Valuation"]}
              />
              <Area type="monotone" dataKey="balance" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Allocation Composition */}
      <GlassCard className="p-6 h-[400px] flex flex-col">
        <h3 className="text-lg font-bold text-text-primary mb-6">Asset Composition (USD)</h3>
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
                contentStyle={{ backgroundColor: '#150A2E', borderColor: '#3D2E68', borderRadius: '12px', color: '#FFF' }}
                formatter={(v) => [`${v}%`, "Allocation"]}
              />
              <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs font-medium text-muted">{value}</span>} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
