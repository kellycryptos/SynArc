"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Bot, 
  CheckCircle2, 
  XCircle, 
  Play, 
  RotateCcw, 
  Lock, 
  Terminal, 
  FileText, 
  DollarSign, 
  ArrowRight, 
  Zap, 
  Layers, 
  ShieldX,
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";
import { 
  ForensicAuditor, 
  AttackScenario, 
  AttackSimulationResult 
} from "@/lib/agent/forensic-auditor";

const SCENARIOS: { id: AttackScenario; label: string; tag: string; icon: string }[] = [
  { id: "phantom_invoice", label: "Phantom Invoice", tag: "Fake CID / Omission", icon: "INV" },
  { id: "payee_substitution", label: "Payee Substitution", tag: "Prompt Injection", icon: "SUB" },
  { id: "silent_roundoff", label: "Silent Round-Off", tag: "ERPNext Float Drift", icon: "CALC" },
  { id: "unwitnessed_bridge", label: "Unwitnessed Bridge", tag: "No Iris Attestation", icon: "BRG" },
  { id: "whale_drain_bypass", label: "Whale Drain Bypass", tag: "50 USDC Cap Breached", icon: "CAP" }
];

export function AdversarialSimulator() {
  const [selectedScenario, setSelectedScenario] = useState<AttackScenario>("phantom_invoice");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [result, setResult] = useState<AttackSimulationResult | null>(null);

  const runSimulation = async (scenario: AttackScenario) => {
    setIsRunning(true);
    setCurrentStep(1);
    setResult(null);

    // Step 1: Operator Agent processes
    await new Promise((r) => setTimeout(r, 600));
    setCurrentStep(2);

    // Step 2: Forensic Sentinel intercepts and audits
    await new Promise((r) => setTimeout(r, 800));
    const simResult = await ForensicAuditor.runSimulatedAttack(scenario);
    setCurrentStep(3);

    // Step 3: Smart contract enforces on-chain guard
    await new Promise((r) => setTimeout(r, 700));
    setCurrentStep(4);
    setResult(simResult);
    setIsRunning(false);
  };

  const handleSelectScenario = (id: AttackScenario) => {
    setSelectedScenario(id);
    setResult(null);
    setCurrentStep(0);
  };

  return (
    <GlassCard className="p-6 space-y-6 border border-primary/25 relative overflow-hidden bg-gradient-to-br from-[#120826]/90 via-[#0d041c]/95 to-[#160B2E]/90 shadow-2xl rounded-3xl" hover={false}>
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-thin/80 pb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
              <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
            </span>
            <div>
              <h2 className="text-lg font-bold font-heading text-text-primary flex items-center gap-2">
                Autonomous Security Sentinel
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary uppercase font-bold">
                  Dual-Agent Mesh Active
                </span>
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Active defense verification for the six non-double-entry vulnerability vectors in autonomous accounting.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => runSimulation(selectedScenario)}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-primary to-accent-blue text-white text-xs font-bold hover:opacity-95 transition-all shadow-lg hover:shadow-primary/20 disabled:opacity-50 cursor-pointer"
          >
            {isRunning ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Verifying Security Controls...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Defense Verification</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scenario Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 relative z-10">
        {SCENARIOS.map((s) => {
          const isSelected = selectedScenario === s.id;
          return (
            <button
              key={s.id}
              onClick={() => handleSelectScenario(s.id)}
              disabled={isRunning}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? "bg-primary/15 border-primary shadow-[0_0_15px_rgba(124,58,237,0.25)]"
                  : "bg-surface-elevated/40 border-border-thin hover:border-border hover:bg-surface-elevated/70"
              }`}
            >
              <div className="text-base mb-1.5">{s.icon}</div>
              <p className={`text-xs font-bold leading-tight ${isSelected ? "text-white" : "text-text-secondary"}`}>
                {s.label}
              </p>
              <p className="text-[10px] text-muted truncate mt-0.5">{s.tag}</p>
            </button>
          );
        })}
      </div>

      {/* Real-time Attack Progress Pipeline */}
      {isRunning && (
        <div className="p-4 bg-surface-elevated/60 border border-primary/30 rounded-2xl space-y-3 animate-fade-in relative z-10">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-primary flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
              Autonomous Security Defense Pipeline
            </span>
            <span className="font-mono text-muted text-[10px]">Step {currentStep} of 4</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-[11px]">
            <div className={`p-2.5 rounded-xl border text-center transition-all ${
              currentStep >= 1 ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold" : "bg-surface/40 border-border-thin text-muted"
            }`}>
              1. Threat Detected
            </div>
            <div className={`p-2.5 rounded-xl border text-center transition-all ${
              currentStep >= 2 ? "bg-blue-500/15 border-blue-500/40 text-blue-300 font-bold" : "bg-surface/40 border-border-thin text-muted"
            }`}>
              2. Operator Dispatched
            </div>
            <div className={`p-2.5 rounded-xl border text-center transition-all ${
              currentStep >= 3 ? "bg-primary/20 border-primary/50 text-primary font-bold" : "bg-surface/40 border-border-thin text-muted"
            }`}>
              3. Sentinel Intercepts
            </div>
            <div className={`p-2.5 rounded-xl border text-center transition-all ${
              currentStep >= 4 ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold" : "bg-surface/40 border-border-thin text-muted"
            }`}>
              4. On-Chain Revert Enforced
            </div>
          </div>
        </div>
      )}

      {/* Simulation Result Presentation */}
      {result && (
        <div className="space-y-5 animate-fade-in relative z-10">
          {/* Verdict Banner */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Threat Neutralized: {result.scenarioTitle}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold">
                    Risk Score: {result.auditTicket.riskScore}/100
                  </span>
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  {result.vulnerabilityProfile || result.canteenVulnerability}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                On-Chain Integrity Intact
              </span>
            </div>
          </div>

          {/* Outcome Comparison Matrix: Naive ERP vs SynArc Mesh */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* The Naive Case (Odoo / ERPNext / Ghostfolio / Circle Escrow) */}
            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldX className="w-4 h-4 text-red-400" />
                  Standard Web3 ERP / Naive Agent
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">
                  DEBITS == CREDITS
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Standard double-entry ledgers allow this error because debits still equal credits. The contract blindly releases funds, or quietly rounds off differences into a hidden expense account.
              </p>
              <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-xl text-[11px] font-mono text-red-300">
                {result.naiveLedgerOutcome}
              </div>
            </div>

            {/* The SynDAO Forensic Security Mesh */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  SynDAO Forensic Security Mesh (Arc Mainnet)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  THREE-WAY MATCH
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                The Forensic Sentinel halts execution before broadcast. If forced, the on-chain contract reverts loudly with auditable parameters, refusing silent compensation.
              </p>
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-[11px] font-mono text-emerald-300">
                {result.synArcOutcome}
              </div>
            </div>
          </div>

          {/* Dual-Agent Live Execution Trace */}
          <div className="p-4 bg-black/60 border border-border-thin rounded-2xl space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-text-secondary pb-2 border-b border-white/10 text-[11px] font-bold uppercase tracking-wider">
              <Terminal className="w-4 h-4 text-primary" />
              Dual-Agent Security Trace Logs
            </div>

            <div className="space-y-2 text-[11px] leading-relaxed">
              <div className="text-amber-400/90 flex items-start gap-2">
                <span className="text-amber-500 font-bold select-none">[AGENT 1 - OPERATOR]</span>
                <span>{result.operatorLog}</span>
              </div>

              <div className="text-cyan-400/90 flex items-start gap-2">
                <span className="text-cyan-400 font-bold select-none">[AGENT 2 - SENTINEL]</span>
                <span>{result.sentinelLog}</span>
              </div>

              <div className="text-purple-400/90 flex items-start gap-2">
                <span className="text-purple-400 font-bold select-none">[ARC CONTRACT]</span>
                <span className="font-bold">{result.smartContractRevert}</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Audit Ticket Inspector */}
          <div className="p-4 bg-surface-elevated/40 border border-border-thin rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Cryptographic Forensic Audit Ticket
              </span>
              <span className="text-[10px] font-mono text-muted">
                ID: {result.auditTicket.ticketId}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-surface/60 border border-border-thin">
                <p className="text-[10px] text-muted font-medium">Verdict</p>
                <p className={`font-bold mt-0.5 ${
                  result.auditTicket.verdict === "PASS" ? "text-emerald-400" :
                  result.auditTicket.verdict === "FLAGGED_HUMAN_REVIEW" ? "text-amber-400" : "text-red-400"
                }`}>
                  {result.auditTicket.verdict}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-surface/60 border border-border-thin">
                <p className="text-[10px] text-muted font-medium">Risk Score</p>
                <p className="font-bold text-white mt-0.5">{result.auditTicket.riskScore} / 100</p>
              </div>

              <div className="p-2.5 rounded-xl bg-surface/60 border border-border-thin">
                <p className="text-[10px] text-muted font-medium">Digest Signature</p>
                <p className="font-mono text-[10px] text-primary truncate mt-0.5">
                  {result.auditTicket.ticketSignatureDigest}
                </p>
              </div>
            </div>

            {/* Individual Checks Summary */}
            <div className="space-y-1.5 pt-1">
              {Object.entries(result.auditTicket.checks).map(([key, check]) => (
                <div key={key} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-surface/40">
                  <span className="text-text-secondary">{check.name}</span>
                  <span className={`font-bold text-[11px] flex items-center gap-1 ${check.passed ? "text-emerald-400" : "text-red-400"}`}>
                    {check.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {check.passed ? "PASSED" : "FAILED"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
