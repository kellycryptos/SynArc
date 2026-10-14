"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Bot,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  FileCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface ReleaseResult {
  decision: {
    shouldRelease: boolean;
    score: number;
    reasoning: string;
    refusalReason?: string;
  };
  txHash?: string;
  explorerUrl?: string;
  refused?: boolean;
  refusalReason?: string;
}

export function ReleaseCheckPanel() {
  const [proposalId, setProposalId] = useState<number>(1);
  const [proposalTitle, setProposalTitle] = useState<string>(
    "Landing page design & smart contract review"
  );
  const [proposalDescription, setProposalDescription] = useState<string>(
    "Milestone 1 payout for UI landing page design delivery and smart contract security audit review."
  );
  const [deliverableCID, setDeliverableCID] = useState<string>(
    "invoice.txt"
  );
  const [payeeAddress, setPayeeAddress] = useState<string>("0x1BDA1797E1839861C1CF539359246e2bb77c8E53");
  const [amount, setAmount] = useState<number>(0.05);

  const [checking, setChecking] = useState<boolean>(false);
  const [result, setResult] = useState<ReleaseResult | null>(null);

  const handleFillDemo1 = () => {
    setProposalId(1);
    setProposalTitle("Landing page design & smart contract review");
    setProposalDescription(
      "Milestone 1 payout for UI landing page design delivery and smart contract security audit review."
    );
    setDeliverableCID("invoice.txt");
    setPayeeAddress("0x1BDA1797E1839861C1CF539359246e2bb77c8E53");
    setAmount(0.05);
    setResult(null);
    toast.success("Loaded valid invoice (0.05 USDC)");
  };

  const handleFillDemo2 = () => {
    setProposalId(2);
    setProposalTitle("Untrusted external contractor claim");
    setProposalDescription(
      "Suspicious deliverable milestone payout with missing or malformed IPFS storage CID."
    );
    setDeliverableCID("bafybei000fake");
    setPayeeAddress("0x1BDA1797E1839861C1CF539359246e2bb77c8E53");
    setAmount(0.05);
    setResult(null);
    toast.error("Loaded bad CID");
  };

  const handleReleaseCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setResult(null);

    const toastId = toast.loading("Agent analyzing deliverable & verifying proposal...");

    try {
      const res = await fetch("/api/agent/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: Number(proposalId),
          proposalTitle,
          proposalDescription,
          deliverableCID,
          payeeAddress,
          amount: Number(amount),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Release check request failed");
      }

      setResult(data.result);

      if (data.result.refused) {
        toast.error("Fund release refused by agent", { id: toastId });
      } else {
        toast.success("Milestone approved and released on-chain!", { id: toastId });
      }
    } catch (err: any) {
      console.error("[ReleaseCheck Error]", err);
      toast.error(err.message || "Release check failed", { id: toastId });
    } finally {
      setChecking(false);
    }
  };

  return (
    <GlassCard className="p-4 sm:p-6 relative overflow-hidden border border-purple-500/25 bg-surface-elevated/70 shadow-[0_0_30px_rgba(124,58,237,0.08)] mb-6" hover={false}>
      {/* Decorative ambient gradients */}
      <div className="absolute -right-20 -top-20 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-thin pb-4 relative z-10">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <span>Agent Release Engine</span>
          </h2>
          <p className="text-xs text-text-tertiary mt-1">
            Automated milestone deliverable verification and fund release.
          </p>
        </div>

        {/* Quick preset buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleFillDemo1}
            disabled={checking}
            className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
            <span>Valid invoice</span>
          </button>
          <button
            type="button"
            onClick={handleFillDemo2}
            disabled={checking}
            className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-200 border border-red-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>Bad CID</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid: Form + Decision Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 relative z-10">
        {/* Form Panel */}
        <div className="lg:col-span-7">
          <form onSubmit={handleReleaseCheck} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Proposal ID
                </label>
                <input
                  type="number"
                  name="proposalId"
                  value={proposalId}
                  onChange={(e) => setProposalId(Number(e.target.value))}
                  required
                  min={1}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-purple-500 focus:outline-none text-sm text-white font-medium placeholder-gray-500 transition-colors"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                  min={0.01}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-purple-500 focus:outline-none text-sm text-white font-medium placeholder-gray-500 transition-colors"
                  placeholder="5.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                Proposal Title
              </label>
              <input
                type="text"
                name="proposalTitle"
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-purple-500 focus:outline-none text-sm text-white font-medium placeholder-gray-500 transition-colors"
                placeholder="e.g. Landing page design & smart contract review"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                Proposal Description
              </label>
              <textarea
                name="proposalDescription"
                rows={3}
                value={proposalDescription}
                onChange={(e) => setProposalDescription(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-purple-500 focus:outline-none text-sm text-white font-medium placeholder-gray-500 transition-colors resize-none"
                placeholder="Detailed scope and deliverables expected..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Deliverable IPFS CID / Invoice Path</span>
                <span className="text-[10px] text-purple-400 font-normal lowercase">ipfs://bafybei... or invoice.txt</span>
              </label>
              <input
                type="text"
                name="deliverableCID"
                value={deliverableCID}
                onChange={(e) => setDeliverableCID(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-purple-500 focus:outline-none text-sm text-white font-mono placeholder-gray-500 transition-colors"
                placeholder="bafybeig... or invoice.txt"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                Payee Address (Contractor)
              </label>
              <input
                type="text"
                name="payeeAddress"
                value={payeeAddress}
                onChange={(e) => setPayeeAddress(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-purple-500 focus:outline-none text-sm text-white font-mono placeholder-gray-500 transition-colors"
                placeholder="0x..."
              />
            </div>

            <button
              type="submit"
              disabled={checking}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                checking
                  ? "bg-purple-900/50 text-purple-300 border border-purple-500/30 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/25 active:scale-[0.99]"
              }`}
            >
              {checking ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-300" />
                  <span>Evaluating release...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-purple-200" />
                  <span>Run Release Check</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Decision Card Panel */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="flex-1 rounded-2xl bg-surface/80 border border-border-thin p-5 flex flex-col">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-border-thin/60 pb-3">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Decision Output</span>
            </h3>

            {!result && !checking && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-tertiary">
                <div className="w-12 h-12 rounded-2xl bg-surface-elevated flex items-center justify-center mb-3 border border-border-thin">
                  <Bot className="w-6 h-6 text-purple-400/60" />
                </div>
                <p className="text-xs text-text-secondary font-medium">Ready for verification</p>
                <p className="text-[11px] text-muted mt-1 max-w-[220px]">
                  Submit details to verify deliverable and trigger release.
                </p>
              </div>
            )}

            {checking && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center animate-pulse">
                  <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-purple-300">Evaluating Deliverable...</p>
                  <p className="text-[11px] text-muted">Verifying on-chain requirements</p>
                </div>
              </div>
            )}

            {result && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Step Sequence */}
                  <div className="space-y-2">
                    {/* Step 1: Fetch */}
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-elevated/40 border border-border-thin text-xs">
                      {result.refused && result.decision.score === 0 ? (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <span className="font-semibold text-text-primary">
                        {result.refused && result.decision.score === 0
                          ? "Failed to fetch deliverable"
                          : "Fetched deliverable from IPFS"}
                      </span>
                    </div>

                    {/* Step 2: AI Score */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-surface-elevated/40 border border-border-thin text-xs">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-text-primary">Deliverable verification</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                          result.decision.score >= 70
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/15 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {result.decision.score}/100
                      </span>
                    </div>

                    {/* Step 3: Release or Refuse */}
                    <div
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs ${
                        result.refused
                          ? "bg-red-500/10 border-red-500/30 text-red-300"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      }`}
                    >
                      {result.refused ? (
                        <>
                          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <span className="font-bold">
                            Refused: {result.refusalReason || "Requirements not met"}
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-bold">Released — on-chain contract called</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Agent Reasoning Box */}
                  <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-thin space-y-1.5">
                    <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-purple-400" />
                      Verification Analysis
                    </h4>
                    <p className="text-xs text-text-primary leading-relaxed">
                      {result.decision.reasoning}
                    </p>
                  </div>

                  {/* Explorer Link if released */}
                  {result.txHash && (
                    <a
                      href={result.explorerUrl || `https://explorer.arc.io/tx/${result.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                        <span>View Release TX on Arc Explorer</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[11px] text-purple-300">
                        <code>
                          {result.txHash.slice(0, 8)}...{result.txHash.slice(-6)}
                        </code>
                        <ExternalLink className="w-3.5 h-3.5 ml-1 shrink-0" />
                      </div>
                    </a>
                  )}

                  {/* Refusal Notice if refused */}
                  {result.refused && (
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 space-y-1">
                      <h4 className="text-xs font-extrabold text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Release Refused
                      </h4>
                      <p className="text-xs text-red-200/90">{result.refusalReason}</p>
                      <p className="text-[11px] text-gray-400 pt-1">
                        Contract was not called. Treasury funds remain locked.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
