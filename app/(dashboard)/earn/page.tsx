"use client";

import { useState, useMemo } from "react";
import { useEarn } from "@/hooks/useEarn";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { GlassCard } from "@/components/ui/GlassCard";
import { VaultCard } from "@/components/earn/VaultCard";
import { MyPositionsCard } from "@/components/earn/MyPositionsCard";
import { DepositModal } from "@/components/earn/DepositModal";
import { WithdrawModal } from "@/components/earn/WithdrawModal";
import { TokenIcon } from "@/components/ui/TokenIcon";
import {
  TrendingUp,
  Percent,
  Coins,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import type { EarnVault, EarnPosition } from "@/types/earn";

export default function EarnPage() {
  const {
    vaults,
    positions,
    currentEarnChain,
    activeNetwork,
    networkName,
    isLoadingVaults,
    isLoadingPositions,
    isTransacting,
    error,
    fetchVaults,
    fetchPositions,
    getDepositQuote,
    deposit,
    getWithdrawalQuote,
    withdraw,
  } = useEarn();

  const { isArcMainnet, isArcTestnet, switchToMainnet, switchToTestnet, isSwitching, explorerUrl } = useArcNetwork();
  const { isAuthenticated, login, walletAddress } = useAuth();
  const { balance: usdcBalance } = useUSDCBalance();

  const [activeTab, setActiveTab] = useState<"explore" | "positions">("explore");
  const [selectedAsset, setSelectedAsset] = useState<"ALL" | "USDC" | "EURC">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);

  // Modals state
  const [depositVault, setDepositVault] = useState<EarnVault | null>(null);
  const [withdrawPosition, setWithdrawPosition] = useState<EarnPosition | null>(null);

  // Filtered vaults
  const filteredVaults = useMemo(() => {
    return vaults.filter((v) => {
      if (activeOnly && v.status === "low_liquidity") return false;
      if (selectedAsset !== "ALL" && v.asset !== selectedAsset) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          v.name.toLowerCase().includes(q) ||
          v.vaultAddress.toLowerCase().includes(q) ||
          (v.manager?.name || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [vaults, activeOnly, selectedAsset, searchQuery]);

  // Aggregate stats
  const maxApy = useMemo(() => {
    if (vaults.length === 0) return 0;
    return Math.max(...vaults.map((v) => v.currentApy || 0));
  }, [vaults]);

  const activePositionCount = useMemo(() => {
    return Object.values(positions).filter((p) => parseFloat(p.currentBalance || "0") > 0).length;
  }, [positions]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-space text-[#F5F7FA] tracking-tight">
              Earn & Vaults
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isArcMainnet
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-purple-500/10 text-purple-400 border-purple-500/20"
              }`}
            >
              {isArcMainnet ? "Mainnet" : "Testnet"}
            </span>
          </div>
          <p className="text-sm text-[#8F9CAE] mt-1">
            Non-custodial DeFi lending yield on Arc powered by Circle App Kit & Morpho protocols.
          </p>
        </div>

        {/* Network & Refresh Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (isArcMainnet) {
                switchToTestnet();
              } else {
                switchToMainnet();
              }
            }}
            disabled={isSwitching}
            className="px-3.5 py-2 rounded-xl bg-[#0A0E17] border border-[#1E293B] hover:border-primary/40 text-xs font-semibold text-[#F8FAFC] transition-colors flex items-center gap-2 cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
            <span>Switch to {isArcMainnet ? "Arc Testnet" : "Arc Mainnet"}</span>
          </button>

          <button
            onClick={() => {
              fetchVaults();
              if (walletAddress) fetchPositions();
            }}
            disabled={isLoadingVaults}
            className="p-2 rounded-xl bg-[#0A0E17] border border-[#1E293B] hover:border-[#334155] text-[#8F9CAE] hover:text-[#F8FAFC] transition-colors cursor-pointer"
            title="Refresh Vaults"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingVaults ? "animate-spin text-primary" : ""}`} />
          </button>
        </div>
      </div>

      {/* Highlights / Hero Stat Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4 border border-[#1E293B]">
          <div className="flex items-center justify-between text-xs text-[#8F9CAE] mb-1">
            <span>Peak APY</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {(maxApy * 100).toFixed(2)}%
          </div>
          <span className="text-[11px] text-[#8F9CAE] block mt-0.5">Underlying Morpho protocols</span>
        </GlassCard>

        <GlassCard className="p-4 border border-[#1E293B]">
          <div className="flex items-center justify-between text-xs text-[#8F9CAE] mb-1">
            <span>Active Vaults</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#F8FAFC]">
            {vaults.filter((v) => v.status === "active").length}
          </div>
          <span className="text-[11px] text-[#8F9CAE] block mt-0.5">
            {vaults.length} total on {networkName}
          </span>
        </GlassCard>

        <GlassCard className="p-4 border border-[#1E293B]">
          <div className="flex items-center justify-between text-xs text-[#8F9CAE] mb-1">
            <span>Your Yield Positions</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#F8FAFC]">
            {activePositionCount}
          </div>
          <span className="text-[11px] text-[#8F9CAE] block mt-0.5">
            {isAuthenticated ? "Live connected wallet" : "Connect wallet to view"}
          </span>
        </GlassCard>

        <GlassCard className="p-4 border border-[#1E293B]">
          <div className="flex items-center justify-between text-xs text-[#8F9CAE] mb-1">
            <span>Wallet Available</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#F8FAFC] flex items-center gap-2">
            <TokenIcon symbol="USDC" size={20} />
            <span>{parseFloat(usdcBalance || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</span>
          </div>
          <span className="text-[11px] text-[#8F9CAE] block mt-0.5">Ready to deploy into vaults</span>
        </GlassCard>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#151C29] pb-2">
        <button
          onClick={() => setActiveTab("explore")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "explore"
              ? "bg-[#151C29] text-[#F8FAFC] border border-[#1E293B] shadow-sm"
              : "text-[#8F9CAE] hover:text-[#F8FAFC]"
          }`}
        >
          <TrendingUp className="w-4 h-4 text-primary" />
          <span>Explore Vaults ({filteredVaults.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("positions")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "positions"
              ? "bg-[#151C29] text-[#F8FAFC] border border-[#1E293B] shadow-sm"
              : "text-[#8F9CAE] hover:text-[#F8FAFC]"
          }`}
        >
          <Coins className="w-4 h-4 text-emerald-400" />
          <span>My Yield Positions ({activePositionCount})</span>
        </button>
      </div>

      {/* Content Area */}
      {activeTab === "explore" ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0A0E17] border border-[#1E293B] p-3 rounded-2xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8F9CAE]" />
              <input
                type="text"
                placeholder="Search vaults by name, address, curator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#05080F] border border-[#1E293B] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F8FAFC] placeholder:text-[#8F9CAE]/60 focus:outline-none focus:border-primary"
              />
            </div>

            {/* Asset pills */}
            <div className="flex items-center gap-1.5 shrink-0">
              {(["ALL", "USDC", "EURC"] as const).map((asset) => (
                <button
                  key={asset}
                  onClick={() => setSelectedAsset(asset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    selectedAsset === asset
                      ? "bg-primary text-white"
                      : "bg-[#05080F] text-[#8F9CAE] hover:text-[#F8FAFC] border border-[#1E293B]"
                  }`}
                >
                  {asset !== "ALL" && <TokenIcon symbol={asset} size={14} />}
                  <span>{asset}</span>
                </button>
              ))}

              <label className="flex items-center gap-1.5 text-xs text-[#8F9CAE] ml-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                  className="rounded border-[#1E293B] text-primary focus:ring-0 bg-[#05080F]"
                />
                <span>Active only</span>
              </label>
            </div>
          </div>

          {/* Vaults Grid */}
          {isLoadingVaults ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <GlassCard key={i} className="p-6 border border-[#1E293B] animate-pulse h-64">
                  <div className="h-6 w-32 bg-[#151C29] rounded mb-3" />
                  <div className="h-8 w-20 bg-[#151C29] rounded mb-4" />
                  <div className="h-20 bg-[#05080F] rounded mb-4" />
                  <div className="h-10 bg-[#151C29] rounded" />
                </GlassCard>
              ))}
            </div>
          ) : filteredVaults.length === 0 ? (
            <GlassCard className="p-12 text-center border border-[#1E293B]">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-[#F8FAFC]">No Vaults Found</h3>
              <p className="text-xs text-[#8F9CAE] max-w-sm mx-auto mt-1 mb-4">
                No vaults matching your current search or filter criteria on {networkName}.
              </p>
              <button
                onClick={() => {
                  setSelectedAsset("ALL");
                  setSearchQuery("");
                  setActiveOnly(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#151C29] text-xs font-semibold text-[#F8FAFC] border border-[#1E293B] hover:border-primary cursor-pointer"
              >
                Reset Filters
              </button>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVaults.map((vault) => {
                const userPos = positions[vault.vaultAddress.toLowerCase()];
                return (
                  <VaultCard
                    key={vault.vaultAddress}
                    vault={vault}
                    userPosition={userPos}
                    onDepositClick={(v) => setDepositVault(v)}
                    onWithdrawClick={(p) => setWithdrawPosition(p)}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* My Positions Tab */
        <MyPositionsCard
          positions={positions}
          vaults={vaults}
          onDepositClick={(v) => setDepositVault(v)}
          onWithdrawClick={(p) => setWithdrawPosition(p)}
        />
      )}

      {/* Modals */}
      <DepositModal
        vault={depositVault}
        isOpen={Boolean(depositVault)}
        onClose={() => setDepositVault(null)}
        onDeposit={deposit}
        onGetQuote={getDepositQuote}
        isTransacting={isTransacting}
      />

      <WithdrawModal
        position={withdrawPosition}
        isOpen={Boolean(withdrawPosition)}
        onClose={() => setWithdrawPosition(null)}
        onWithdraw={withdraw}
        onGetQuote={getWithdrawalQuote}
        isTransacting={isTransacting}
      />
    </div>
  );
}
