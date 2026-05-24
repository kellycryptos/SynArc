"use client";

import { useEffect, useMemo } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from "recharts";
import { 
  ArrowUpRight, ArrowDownRight, Activity, Wallet, Shield, PieChart, Coins
} from "lucide-react";

export default function TreasuryPage() {
  const { treasuryActivities, metrics, initialized, initializeStore } = useGovernanceStore();

  useEffect(() => {
    if (!initialized) initializeStore();
  }, [initialized, initializeStore]);

  // Transform activities for charting
  const chartData = useMemo(() => {
    if (!treasuryActivities.length) return [];
    
    // Sort by chronological order
    const sorted = [...treasuryActivities].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Assuming starting balance a bit lower to simulate growth
    let currentBalance = 2100000;
    
    return sorted.map(act => {
      if (act.type === 'Inflow') currentBalance += act.amount;
      if (act.type === 'Outflow') currentBalance -= act.amount;
      // Staking doesn't change total treasury value immediately in this simple model
      
      return {
        date: new Date(act.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        balance: currentBalance,
        inflow: act.type === 'Inflow' ? act.amount : 0,
        outflow: act.type === 'Outflow' ? act.amount : 0,
        type: act.type
      };
    });
  }, [treasuryActivities]);

  const recentTransactions = treasuryActivities.slice(0, 10);

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">DAO Treasury</h1>
            <p className="text-muted mt-1">Real-time overview of the SynArc DAO assets and capital allocations.</p>
          </div>
          <div className="bg-surface-elevated border border-border-thin px-4 py-2 rounded-xl flex items-center gap-3 shadow-[0_0_15px_rgba(124,58,237,0.1)]">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-xs text-text-tertiary font-bold uppercase tracking-wider">Total Value</div>
              <div className="text-xl font-bold font-mono text-white">{metrics?.treasuryValue || "$0"}</div>
            </div>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-sm text-text-secondary">30d Revenue</div>
              <div className="text-lg font-bold text-white">+$125,000</div>
            </div>
          </GlassCard>
          <GlassCard className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-danger/20 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-danger" />
            </div>
            <div>
              <div className="text-sm text-text-secondary">30d Burn</div>
              <div className="text-lg font-bold text-white">-$350,000</div>
            </div>
          </GlassCard>
          <GlassCard className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-soft/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-cyan-soft" />
            </div>
            <div>
              <div className="text-sm text-text-secondary">Transactions</div>
              <div className="text-lg font-bold text-white">{metrics?.treasuryTransactions || "0"}</div>
            </div>
          </GlassCard>
          <GlassCard className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-text-secondary">Deployed Capital</div>
              <div className="text-lg font-bold text-white">$450,000</div>
            </div>
          </GlassCard>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Chart */}
          <GlassCard className="lg:col-span-2 p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-text-primary mb-6">Treasury Growth (USDC)</h3>
            <div className="flex-1 w-full h-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                  <XAxis dataKey="date" stroke="#666" tick={{fill: '#666', fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" tick={{fill: '#666', fontSize: 12}} tickFormatter={(val) => `${val / 1000}k`} tickLine={false} axisLine={false} width={50} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value), "Balance"]}
                  />
                  <Area type="monotone" dataKey="balance" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Allocation / Composition */}
          <GlassCard className="p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-text-primary mb-6">Asset Composition</h3>
            <div className="space-y-6 flex-1">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#2775CA]" />
                    <span className="font-semibold text-text-primary">Liquid USDC</span>
                  </div>
                  <span className="font-mono text-text-secondary">82%</span>
                </div>
                <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div className="h-full bg-[#2775CA] rounded-full" style={{ width: '82%' }} />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#7c3aed]" />
                    <span className="font-semibold text-text-primary">Staked sUSDC</span>
                  </div>
                  <span className="font-mono text-text-secondary">15%</span>
                </div>
                <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div className="h-full bg-[#7c3aed] rounded-full" style={{ width: '15%' }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#00C2FF]" />
                    <span className="font-semibold text-text-primary">DEX Liquidity</span>
                  </div>
                  <span className="font-mono text-text-secondary">3%</span>
                </div>
                <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div className="h-full bg-[#00C2FF] rounded-full" style={{ width: '3%' }} />
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-border-subtle">
                <div className="bg-surface p-4 rounded-xl border border-border-thin flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PieChart className="w-5 h-5 text-text-tertiary" />
                    <span className="text-sm font-semibold">Total Assets</span>
                  </div>
                  <span className="font-mono font-bold">3</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Transactions Table */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-text-primary mb-6">Recent Activities</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-thin text-text-tertiary text-xs uppercase tracking-wider">
                  <th className="pb-4 font-bold pl-2">Type</th>
                  <th className="pb-4 font-bold">Description</th>
                  <th className="pb-4 font-bold">Amount</th>
                  <th className="pb-4 font-bold">Date</th>
                  <th className="pb-4 font-bold text-right pr-2">Tx</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((tx, i) => (
                    <tr key={tx.id || i} className="border-b border-border-thin/50 hover:bg-surface-elevated/30 transition-colors">
                      <td className="py-4 pl-2">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold
                          ${tx.type === 'Inflow' ? 'bg-success/10 text-success' : 
                            tx.type === 'Outflow' ? 'bg-danger/10 text-danger' : 
                            'bg-primary/10 text-primary'}
                        `}>
                          {tx.type === 'Inflow' ? <ArrowDownRight className="w-3.5 h-3.5" /> : 
                           tx.type === 'Outflow' ? <ArrowUpRight className="w-3.5 h-3.5" /> :
                           <Activity className="w-3.5 h-3.5" />}
                          {tx.type}
                        </div>
                      </td>
                      <td className="py-4 text-text-secondary">{tx.description}</td>
                      <td className="py-4 font-mono font-bold text-text-primary">
                        {tx.type === 'Outflow' ? '-' : tx.type === 'Inflow' ? '+' : ''}
                        {tx.amount.toLocaleString()} {tx.token}
                      </td>
                      <td className="py-4 text-text-tertiary">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-right pr-2">
                        <a href={`https://testnet.arcscan.app/tx/${tx.txHash}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono text-xs">
                          {tx.txHash ? tx.txHash.slice(0,6) + '...' + tx.txHash.slice(-4) : 'Pending...'}
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-tertiary">No recent activities found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

      </div>
    </div>
  );
}
