"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', participation: 45, proposals: 2 },
  { name: 'Feb', participation: 52, proposals: 4 },
  { name: 'Mar', participation: 48, proposals: 3 },
  { name: 'Apr', participation: 61, proposals: 6 },
  { name: 'May', participation: 68.5, proposals: 5 },
];

export function GovernanceAnalytics() {
  return (
    <GlassCard className="p-6 h-[400px] flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-semibold font-heading">Governance Activity</h3>
        <p className="text-sm text-muted">Proposal participation and volume over time</p>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorParticipation" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(15,15,25,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Area type="monotone" dataKey="participation" stroke="#7C3AED" strokeWidth={2} fillOpacity={1} fill="url(#colorParticipation)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
