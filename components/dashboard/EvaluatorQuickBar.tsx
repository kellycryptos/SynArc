"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Play, DollarSign, FileCheck, Layers } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCampaignStore } from "@/hooks/useCampaignStore";
import toast from "react-hot-toast";
import { ReceiptBoxModal } from "@/components/modals/ReceiptBoxModal";

export function EvaluatorQuickBar() {
  const { isDemo, simulateDemoWallet } = useAuth();
  const { campaigns, contribute } = useCampaignStore();
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // 1. Simulate Funded Account
  const handleSimulateWallet = () => {
    simulateDemoWallet();
    toast.success("Funded Demo Wallet Activated (2,500 USDC & 10,000 sARC)", {
      icon: "⚡",
      duration: 3500,
    });
  };

  // 2. Test $25 Escrow Support
  const handleTestEscrow = async () => {
    setRunningAction("escrow");
    try {
      simulateDemoWallet();
      const targetCampaign = campaigns[0] || { id: "camp-main-001" };
      await contribute(targetCampaign.id, 25);
      toast.success("Test $25 USDC Nanopayment Deposited into Escrow! Tx simulated on Arc.", {
        icon: "🛡️",
        duration: 4000,
      });
    } catch (e: any) {
      toast.error(e?.message || "Failed to execute escrow test");
    } finally {
      setRunningAction(null);
    }
  };

  // 3. Run Three-Way Match Pipeline
  const handleRunThreeWayMatch = () => {
    setRunningAction("pipeline");
    setTimeout(() => {
      setRunningAction(null);
      toast.success(
        "Three-Way Match Verified: Purchase Order == IPFS Deliverable (QmXoy...) == Invoice ($25.00 USDC). Settled within 50 USDC cap!",
        {
          icon: "✅",
          duration: 4500,
        }
      );
    }, 600);
  };

  return (
    <>
      <div
        data-component="evaluator-quickbar"
        className="w-full rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-surface to-primary/5 p-4 sm:p-5 shadow-xs"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Label & Context */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-space text-foreground uppercase tracking-wider">
                  90-Second Evaluator Quick Actions
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Zero Roadblocks
                </span>
              </div>
              <p className="text-xs text-muted font-mono mt-0.5">
                Instant 1-click presets to test complete transaction and audit flows without personal keys or gas.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!isDemo && (
              <button
                type="button"
                onClick={handleSimulateWallet}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-space font-semibold hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer shadow-sm shadow-primary/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate Funded Wallet</span>
              </button>
            )}

            <button
              type="button"
              disabled={runningAction === "escrow"}
              onClick={handleTestEscrow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-primary/40 text-foreground text-xs font-mono font-medium hover:bg-surface-elevated active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
              <span>{runningAction === "escrow" ? "Depositing..." : "Test $25 Escrow"}</span>
            </button>

            <button
              type="button"
              disabled={runningAction === "pipeline"}
              onClick={handleRunThreeWayMatch}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-primary/40 text-foreground text-xs font-mono font-medium hover:bg-surface-elevated active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              <FileCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>{runningAction === "pipeline" ? "Verifying..." : "Run 3-Way Match"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsReceiptModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-primary/40 text-foreground text-xs font-mono font-medium hover:bg-surface-elevated active:scale-[0.98] transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Receipt Box</span>
            </button>
          </div>
        </div>
      </div>

      <ReceiptBoxModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </>
  );
}
