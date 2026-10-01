"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Coins, TrendingUp, ArrowDownCircle, ArrowUpRight, ShieldCheck, Wallet } from "lucide-react";
import type { EarnPosition, EarnVault } from "@/types/earn";

interface MyPositionsCardProps {
  positions: Record<string, EarnPosition>;
  vaults: EarnVault[];
  onDepositClick: (vault: EarnVault) => void;
  onWithdrawClick: (position: EarnPosition) => void;
}

export function MyPositionsCard({
  positions,
  vaults,
  onDepositClick,
  onWithdrawClick,
}: MyPositionsCardProps) {
  const activePositions = Object.values(positions).filter(
    (p) => parseFloat(p.currentBalance || "0") > 0
  );

  const totalDeposited = activePositions.reduce(
    (acc, p) => acc + parseFloat(p.currentBalance || "0"),
    0
  );

  const totalYield = activePositions.reduce((acc, p) => {
    const yieldVal = parseFloat(p.pnl?.totalYieldEarned || "0");
    return acc + (isNaN(yieldVal) ? 0 : yieldVal);
  }, 0);

  if (activePositions.length === 0) {
    return (
      <GlassCard className="p-8 text-center border border-[#1E293B]">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-3">
          <Wallet className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-[#F8FAFC]">No Active Yield Positions</h4>
        <p className="text-xs text-[#94A3B8] max-w-md mx-auto mt-1 mb-5">
          Deposit idle USDC or EURC into non-custodial Morpho vaults on Arc to start earning lending protocol returns.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4 border border-[#1E293B]">
          <span className="text-xs text-[#94A3B8] block mb-1">Total Vault Deposits</span>
          <span className="text-2xl font-bold font-mono text-[#F8FAFC]">
            ${totalDeposited.toFixed(2)}
          </span>
          <span className="text-[11px] text-[#94A3B8] block mt-0.5">Across {activePositions.length} vault(s)</span>
        </GlassCard>

        <GlassCard className="p-4 border border-[#1E293B]">
          <span className="text-xs text-[#94A3B8] block mb-1">Total Yield Accrued</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">
            +${totalYield.toFixed(4)}
          </span>
          <span className="text-[11px] text-emerald-400/80 block mt-0.5">Auto-compounding in vault shares</span>
        </GlassCard>

        <GlassCard className="p-4 border border-[#1E293B]">
          <span className="text-xs text-[#94A3B8] block mb-1">Security Standard</span>
          <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-sm mt-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Non-Custodial ERC-4626</span>
          </div>
          <span className="text-[11px] text-[#94A3B8] block mt-1">Direct on Arc Mainnet / Testnet</span>
        </GlassCard>
      </div>

      {/* Position List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activePositions.map((pos) => {
          const matchingVault = vaults.find(
            (v) => v.vaultAddress.toLowerCase() === pos.vaultAddress.toLowerCase()
          );

          const apyPercent = (pos.currentApy * 100).toFixed(2);

          return (
            <GlassCard
              key={pos.vaultAddress}
              className="p-5 border border-[#1E293B] hover:border-emerald-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-semibold text-sm text-[#F8FAFC]">
                      {pos.vaultName || "Morpho Vault"}
                    </h5>
                    <span className="text-xs text-[#94A3B8] font-mono">
                      {pos.vaultAddress.slice(0, 6)}...{pos.vaultAddress.slice(-4)}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {apyPercent}% APY
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#05080F] border border-[#1E293B] rounded-xl p-3 mb-4 text-xs">
                  <div>
                    <span className="text-[#94A3B8] block">Current Balance</span>
                    <span className="text-[#F8FAFC] font-bold font-mono text-sm">
                      {pos.currentBalance} {pos.asset}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block">Accrued Yield</span>
                    <span className="text-emerald-400 font-bold font-mono text-sm">
                      +{pos.pnl?.totalYieldEarned || "0.00"} {pos.asset}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#1E293B]">
                <button
                  onClick={() => onWithdrawClick(pos)}
                  className="flex-1 py-2 px-3 rounded-lg border border-[#1E293B] hover:border-emerald-500/40 text-xs font-semibold text-[#F8FAFC] hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Withdraw</span>
                </button>
                {matchingVault && (
                  <button
                    onClick={() => onDepositClick(matchingVault)}
                    className="flex-1 py-2 px-3 rounded-lg bg-primary hover:bg-primary/90 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Deposit More</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
