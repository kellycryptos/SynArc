import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { treasuryActivities, healthMetrics } from "@/lib/mockData";
import { Wallet, ArrowUpRight, ArrowDownRight, RefreshCw, Send } from "lucide-react";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";

export default function TreasuryPage() {
  const { isUnsupported } = useArcNetwork();
  const treasuryValue = healthMetrics.find(m => m.label === 'Treasury Value')?.value || 2400000;

  return (
    <DashboardLayout>
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Treasury</h1>
              <p className="text-muted mt-1">Manage and track DAO funds.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                disabled={isUnsupported}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border-thin hover:bg-surface-elevated transition-colors text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                Swap
              </button>
              <button 
                disabled={isUnsupported}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Transfer
              </button>
            </div>
          </div>

          {/* Network Guard Warning */}
          {isUnsupported && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400 font-medium">
              Please switch to Arc Testnet to continue.
            </div>
          )}

          {/* Balance Cards & Asset Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-8 md:col-span-2 relative overflow-hidden" hover={false}>
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Wallet className="w-32 h-32 text-muted" />
              </div>
              <div className="relative z-10 space-y-6">
                <div>
                  <p className="text-sm font-medium text-muted mb-1">Total Balance</p>
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-5xl font-bold tracking-tight">${(treasuryValue / 1000000).toFixed(1)}M</h2>
                    <span className="text-success text-sm font-medium inline-flex items-center">
                      <ArrowUpRight className="w-3 h-3 mr-0.5" /> +12.5%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-6 border-t border-border-thin">
                  <div>
                    <p className="text-sm text-muted mb-1">USDC</p>
                    <p className="text-xl font-semibold">$1.8M</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted mb-1">sUSDC (Staked)</p>
                    <p className="text-xl font-semibold">$450K</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted mb-1">USDT</p>
                    <p className="text-xl font-semibold">$150K</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 flex flex-col justify-between" hover={false}>
              <div>
                <h3 className="font-semibold mb-4">Asset Distribution</h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#2775CA]" />
                        USDC
                      </span>
                      <span>75%</span>
                    </div>
                    <div className="w-full bg-surface-elevated h-2 rounded-full overflow-hidden">
                      <div className="bg-[#2775CA] h-full" style={{ width: '75%' }} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                        sUSDC
                      </span>
                      <span>19%</span>
                    </div>
                    <div className="w-full bg-surface-elevated h-2 rounded-full overflow-hidden">
                      <div className="bg-accent h-full" style={{ width: '19%' }} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        USDT
                      </span>
                      <span>6%</span>
                    </div>
                    <div className="w-full bg-surface-elevated h-2 rounded-full overflow-hidden">
                      <div className="bg-success h-full" style={{ width: '6%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Transactions List */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Transaction History</h2>
            {treasuryActivities.length === 0 ? (
              <GlassCard className="p-8 flex flex-col items-center justify-center">
                <EmptyState 
                  title="No Transactions" 
                  description="There are currently no transaction logs recorded for this DAO treasury." 
                />
              </GlassCard>
            ) : (
              <div className="bg-surface border border-border-thin rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-surface-elevated text-muted border-b border-border-thin">
                      <tr>
                        <th className="px-6 py-4 font-medium">Type</th>
                        <th className="px-6 py-4 font-medium">Description</th>
                        <th className="px-6 py-4 font-medium">Amount</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Hash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {treasuryActivities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-surface-elevated/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                              activity.type === 'Inflow' ? 'bg-success/10 text-success' :
                              activity.type === 'Outflow' ? 'bg-danger/10 text-danger' :
                              'bg-accent/10 text-accent'
                            }`}>
                              {activity.type === 'Inflow' ? <ArrowDownRight className="w-3 h-3" /> :
                               activity.type === 'Outflow' ? <ArrowUpRight className="w-3 h-3" /> :
                               <RefreshCw className="w-3 h-3" />}
                              {activity.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">{activity.description}</td>
                          <td className={`px-6 py-4 font-medium ${
                            activity.type === 'Inflow' ? 'text-success' :
                            activity.type === 'Outflow' ? 'text-danger' :
                            ''
                          }`}>
                            {activity.type === 'Inflow' ? '+' : activity.type === 'Outflow' ? '-' : ''}
                            {activity.amount.toLocaleString()} {activity.token}
                          </td>
                          <td className="px-6 py-4 text-muted">{new Date(activity.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-4 text-muted font-mono text-xs">{activity.txHash}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

        </div>
      </div>
    </DashboardLayout>
  );
}
