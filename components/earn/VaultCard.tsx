"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { TrendingUp, Shield, Droplets, ArrowUpRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { TokenIcon } from "@/components/ui/TokenIcon";
import type { EarnVault, EarnPosition } from "@/types/earn";

interface VaultCardProps {
  vault: EarnVault;
  userPosition?: EarnPosition;
  onDepositClick: (vault: EarnVault) => void;
  onWithdrawClick: (position: EarnPosition) => void;
}

export function VaultCard({
  vault,
  userPosition,
  onDepositClick,
  onWithdrawClick,
}: VaultCardProps) {
  const apyPercent = (vault.currentApy * 100).toFixed(2);
  const isLowLiquidity = vault.status === "low_liquidity";
  const hasPosition = userPosition && parseFloat(userPosition.currentBalance || "0") > 0;

  // Format TVL/Deposits
  const formattedDeposits = (() => {
    const num = parseFloat(vault.totalDeposits || "0");
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  })();

  const formattedLiquidity = (() => {
    const num = parseFloat(vault.liquidity || "0");
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  })();

  return (
    <GlassCard className="p-5 flex flex-col justify-between border border-[#1E293B] hover:border-primary/40 transition-all group relative overflow-hidden">
      {/* Top row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-blue-600/10 border border-primary/30 flex items-center justify-center p-1.5 shrink-0">
              <TokenIcon symbol={vault.asset} size={28} />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-[#F8FAFC] group-hover:text-primary transition-colors flex items-center gap-1.5">
                {vault.name}
              </h4>
              <p className="text-xs text-[#94A3B8]">
                {vault.protocol} {vault.manager?.name ? `• ${vault.manager.name}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xl font-bold font-mono text-emerald-400">
              {apyPercent}%
            </span>
            <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-medium">Net APY</span>
          </div>
        </div>

        {/* Status / Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#151C29] text-[#94A3B8] border border-[#1E293B] flex items-center gap-1">
            <TokenIcon symbol={vault.asset} size={12} />
            <span>{vault.asset}</span>
          </span>
          {vault.circleGuarded && (
            <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Circle Guarded
            </span>
          )}
          {isLowLiquidity ? (
            <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Low Liquidity
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Active
            </span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 bg-[#05080F] border border-[#1E293B] rounded-xl p-3 mb-4 text-xs">
          <div>
            <span className="text-[#94A3B8] block text-[11px]">Total Deposits</span>
            <span className="text-[#F8FAFC] font-semibold font-mono">{formattedDeposits}</span>
          </div>
          <div>
            <span className="text-[#94A3B8] block text-[11px]">Available Liquidity</span>
            <span className="text-[#F8FAFC] font-semibold font-mono">{formattedLiquidity}</span>
          </div>
        </div>

        {/* User Active Position callout if exists */}
        {hasPosition && (
          <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
            <div>
              <span className="text-emerald-400 font-medium block">Your Position:</span>
              <span className="text-[#F8FAFC] font-bold font-mono">
                {userPosition.currentBalance} {vault.asset}
              </span>
            </div>
            {userPosition.pnl?.totalYieldEarned && (
              <div className="text-right">
                <span className="text-xs text-[#94A3B8] block">Yield Earned</span>
                <span className="text-emerald-400 font-mono font-medium">
                  +{userPosition.pnl.totalYieldEarned}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-[#1E293B]">
        {hasPosition && (
          <button
            onClick={() => onWithdrawClick(userPosition)}
            className="flex-1 py-2 px-3 rounded-lg border border-[#1E293B] hover:border-emerald-500/40 text-xs font-semibold text-[#F8FAFC] hover:bg-emerald-500/10 transition-colors cursor-pointer"
          >
            Withdraw
          </button>
        )}
        <button
          onClick={() => onDepositClick(vault)}
          disabled={isLowLiquidity}
          className="flex-1 py-2 px-3 rounded-lg bg-primary hover:bg-primary/90 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm shadow-primary/20"
        >
          <span>{hasPosition ? "Deposit More" : "Deposit"}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </GlassCard>
  );
}
