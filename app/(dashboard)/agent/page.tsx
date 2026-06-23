"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Bot, Zap, Activity, Play, RotateCw, ExternalLink,
  BrainCircuit, Coins, ArrowRight, CheckCircle, XCircle,
  Clock, AlertTriangle, Shield, Cpu, Wallet, ChevronRight,
  TrendingUp, ArrowLeftRight, CreditCard, Plus, Users
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { AGENT_CAPABILITIES, AGENT_INTEGRATIONS, AGENT_CONFIG } from "@/lib/agent/smart-account";

interface AgentAction {
  timestamp: string;
  action: string;
  reasoning: string;
  txHash?: string;
  status: "pending" | "executed" | "failed";
  usdcAmount?: number;
}

interface AgentState {
  agentAddress: string;
  treasury: { usdc: number; eurc: number };
  recentActions: AgentAction[];
  isRunning: boolean;
  lastCheck: string;
  payments?: {
    history: any[];
    totalSpent: number;
    callCount: number;
    avgCost: number;
  };
}

function ActionIcon({ action }: { action: string }) {
  if (action === "bridge_to_ethereum") return <ArrowLeftRight className="w-4 h-4 text-blue-400" />;
  if (action === "monitoring") return <Activity className="w-4 h-4 text-primary" />;
  if (action === "error") return <AlertTriangle className="w-4 h-4 text-red-400" />;
  if (action === "emergency_funding") return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  return <Zap className="w-4 h-4 text-purple-400" />;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "executed") return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-success/15 border border-success/25 text-success">EXECUTED</span>;
  if (status === "pending") return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 border border-amber-500/25 text-amber-400 animate-pulse">PENDING</span>;
  return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 border border-red-500/25 text-red-400">FAILED</span>;
}

function RuleCard({ condition, action, met }: { condition: string; action: string; met: boolean }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${met ? "border-primary/30 bg-primary/5" : "border-border-thin bg-surface-elevated/40"}`}>
      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${met ? "bg-primary/20" : "bg-surface-elevated"}`}>
        {met ? <CheckCircle className="w-3 h-3 text-primary" /> : <Clock className="w-3 h-3 text-muted" />}
      </div>
      <div>
        <p className={`text-xs font-bold ${met ? "text-primary" : "text-text-secondary"}`}>{condition}</p>
        <p className="text-xs text-muted mt-0.5">→ {action}</p>
      </div>
      {met && <span className="ml-auto text-[10px] font-extrabold text-primary bg-primary/15 px-1.5 py-0.5 rounded border border-primary/20 animate-pulse">ACTIVE</span>}
    </div>
  );
}

export default function AgentPage() {
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoRunning, setAutoRunning] = useState(false);

  // Interactive Lepton Demo States
  const [demoStep, setDemoStep] = useState<"idle" | "analyzing" | "proposed" | "voting" | "executing" | "success">("idle");
  const [demoVotes, setDemoVotes] = useState(0);
  const [cctpProgress, setCctpProgress] = useState<"idle" | "burn" | "attestation" | "mint" | "done">("idle");
  const [demoUSDCBalance, setDemoUSDCBalance] = useState<number | null>(null);

  const fetchAgentState = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/run");
      const data = await res.json();
      if (data.success !== false) setAgentState(data);
    } catch (err) {
      console.error("[AgentPage] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const startDemo = () => {
    setDemoStep("analyzing");
    setDemoVotes(0);
    setCctpProgress("idle");
    setDemoUSDCBalance(142.50);
    
    // Simulate AI thinking and deciding
    setTimeout(() => {
      setDemoStep("proposed");
    }, 2000);
  };

  const simulateVotes = () => {
    setDemoStep("voting");
    let currentVotes = 0;
    const targetVotes = 5840000;
    const increment = Math.floor(targetVotes / 15);
    const interval = setInterval(() => {
      currentVotes += increment;
      if (currentVotes >= targetVotes) {
        currentVotes = targetVotes;
        clearInterval(interval);
      }
      setDemoVotes(currentVotes);
    }, 100);
  };

  const executeSimulatedCctp = () => {
    setDemoStep("executing");
    setCctpProgress("burn");
    
    // Stage 1: Burn
    setTimeout(() => {
      setCctpProgress("attestation");
      
      // Stage 2: Attestation
      setTimeout(() => {
        setCctpProgress("mint");
        
        // Stage 3: Mint
        setTimeout(() => {
          setCctpProgress("done");
          setDemoUSDCBalance(100.00); // deduct bridged amount
          setDemoStep("success");
          
          // Inject action into the history console
          if (agentState) {
            const newAction = {
              timestamp: new Date().toISOString(),
              action: "bridge_to_ethereum",
              reasoning: "AUTONOMOUS REBALANCE SUCCESSFUL: Bridged 42.50 USDC from Arc Testnet to Ethereum Sepolia via CCTP. [Demo Simulation]",
              txHash: "0xbc84294c718a29b01284d72856fe8d3615418b7625ea4b971aefd82b130c25d8",
              status: "executed" as const,
              usdcAmount: 42.50
            };
            setAgentState({
              ...agentState,
              treasury: {
                ...agentState.treasury,
                usdc: 100.00
              },
              recentActions: [newAction, ...agentState.recentActions]
            });
          }
          toast.success("CCTP Rebalance Completed Autonomously!");
        }, 2000);
      }, 2500);
    }, 2000);
  };

  const resetDemo = () => {
    setDemoStep("idle");
    setDemoVotes(0);
    setCctpProgress("idle");
    setDemoUSDCBalance(null);
    fetchAgentState();
  };

  const runAgent = async () => {
    setRunning(true);
    const toastId = toast.loading("Agent analyzing treasury...");
    try {
      const res = await fetch("/api/agent/run", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await fetchAgentState();
        const action = data.action;
        if (action?.action === "bridge_to_ethereum") {
          toast.success(`Agent proposed CCTP bridge: ${action.usdcAmount} USDC → Ethereum`, { id: toastId, duration: 5000 });
        } else if (action?.action === "monitoring") {
          toast.success("Agent checked treasury — no action needed", { id: toastId });
        } else {
          toast.success(`Agent executed: ${action?.action}`, { id: toastId });
        }
      } else {
        toast.error(data.error || "Agent run failed", { id: toastId });
      }
    } catch {
      toast.error("Failed to run agent", { id: toastId });
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    fetchAgentState();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAgentState, 30_000);
    return () => clearInterval(interval);
  }, [fetchAgentState]);

  const treasury = agentState?.treasury;
  const actions = agentState?.recentActions || [];
  const payments = agentState?.payments;

  // Determine active rules based on treasury
  const usdcAbove100 = (treasury?.usdc || 0) > 100;
  const usdcBelow10 = (treasury?.usdc || 0) < 10;
  const eurcAbove50 = (treasury?.eurc || 0) > 50;

  return (
    <div className="space-y-8 animate-fade-in-up">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent-blue/20 border border-primary/30 flex items-center justify-center">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background animate-ping" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-heading text-text-primary">Treasury Agent</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/20 border border-primary/30 text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping inline-block" />
                LIVE
              </span>
            </div>
            <p className="text-sm text-muted">Autonomous treasury management on Arc · Groq Llama 3.3 · CCTP</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAgentState}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border-thin bg-surface-elevated hover:bg-surface text-sm font-medium text-text-secondary hover:text-text-primary transition-all cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <motion.button
            onClick={runAgent}
            disabled={running}
            whileHover={{ scale: running ? 1 : 1.02 }}
            whileTap={{ scale: running ? 1 : 0.98 }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] cursor-pointer disabled:cursor-not-allowed"
          >
            {running ? (
              <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Running...</>
            ) : (
              <><Play className="w-4 h-4" />Run Agent Now</>
            )}
          </motion.button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "USDC Balance", value: loading ? "..." : demoUSDCBalance !== null ? `${demoUSDCBalance.toFixed(2)}` : `${(treasury?.usdc || 0).toFixed(2)}`, unit: "USDC", icon: Coins, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
          { label: "EURC Balance", value: loading ? "..." : `${(treasury?.eurc || 0).toFixed(2)}`, unit: "EURC", icon: Coins, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
          { label: "Actions Today", value: actions.length.toString(), unit: "actions", icon: Zap, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          { label: "Inference Paid", value: (payments?.totalSpent || 0).toFixed(4), unit: "USDC", icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <GlassCard className="p-4 space-y-3" hover={false}>
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${stat.bg} border ${stat.border}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted font-medium">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>
                    {stat.value} <span className="text-xs text-muted font-normal">{stat.unit}</span>
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Decision Engine + Agent Identity */}
        <div className="space-y-6">

          {/* Decision Engine */}
          <GlassCard className="p-5 space-y-4" hover={false}>
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-text-primary">AI Decision Engine</h2>
              <span className="ml-auto text-xs text-muted">Groq Llama 3.3 70B</span>
            </div>
            <div className="space-y-2">
              <RuleCard condition="USDC > 100" action="Propose CCTP bridge to Ethereum Sepolia" met={usdcAbove100} />
              <RuleCard condition="USDC < 10" action="Propose emergency funding request" met={usdcBelow10} />
              <RuleCard condition="EURC > 50" action="Propose EURC rebalancing" met={eurcAbove50} />
              <RuleCard condition="Proposal passes vote" action="Execute CCTP transfer autonomously" met={false} />
            </div>
          </GlassCard>

          {/* Agent Identity */}
          <GlassCard className="p-5 space-y-4" hover={false}>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-text-primary">Agent Identity</h2>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Account Type", value: "Circle Modular Smart Account" },
                { label: "Auth Method", value: "Passkey (ERC-4337)" },
                { label: "AI Model", value: "Groq Llama 3.3 70B" },
                { label: "Network", value: "Arc Testnet (5042002)" },
                { label: "Registry", value: "ERC-8004 Identity" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-xs">
                  <span className="text-muted">{row.label}</span>
                  <span className="text-text-secondary font-medium">{row.value}</span>
                </div>
              ))}
              {agentState?.agentAddress && (
                <div className="pt-1 border-t border-border-thin">
                  <p className="text-xs text-muted mb-1">Agent Address</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-primary font-mono truncate flex-1">
                      {agentState.agentAddress.slice(0, 20)}...
                    </code>
                    <a
                      href={`https://testnet.arcscan.app/address/${agentState.agentAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* CCTP Bridge Status */}
          <GlassCard className="p-5 space-y-4" hover={false}>
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold text-text-primary">CCTP Bridge</h2>
              <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 border border-blue-500/25 text-blue-400">READY</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                  <span className="text-sm">⚡</span>
                </div>
                <span className="text-[10px] text-muted text-center">Arc Testnet</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <ArrowLeftRight className="w-4 h-4 text-blue-400" />
                <span className="text-[9px] text-blue-400 font-bold">CCTP</span>
              </div>
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
                  <span className="text-sm">🪙</span>
                </div>
                <span className="text-[10px] text-muted text-center">Eth Sepolia</span>
              </div>
            </div>
            <p className="text-xs text-muted">
              Agent executes governance-approved CCTP burn-and-mint. All transfers require community vote.
            </p>
          </GlassCard>
        </div>

        {/* Right: Agent Actions Console + Inference Payments */}
        <div className="lg:col-span-2 space-y-6">

          {/* Agent Controls */}
          <GlassCard className="p-5" hover={false}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-bold text-text-primary">Agent Action Console</h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Live
              </div>
            </div>

            {/* Recent Actions */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              <AnimatePresence>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-xl bg-surface-elevated/40 animate-pulse border border-border-thin" />
                    ))}
                  </div>
                ) : actions.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 gap-3"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Bot className="w-7 h-7 text-primary/60" />
                    </div>
                    <p className="text-sm text-muted text-center">
                      No actions yet.<br />Click <strong className="text-text-primary">Run Agent Now</strong> to start the autonomous loop.
                    </p>
                  </motion.div>
                ) : (
                  actions.map((action, i) => (
                    <motion.div
                      key={`${action.timestamp}-${i}`}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-start gap-3 p-3 rounded-xl border border-border-thin bg-surface-elevated/30 hover:bg-surface-elevated/60 transition-all"
                    >
                      <div className="mt-0.5 p-1.5 rounded-lg bg-surface-elevated border border-border-thin">
                        <ActionIcon action={action.action} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-text-primary truncate">
                            {action.action === "bridge_to_ethereum" ? `CCTP Bridge ${action.usdcAmount || 0} USDC` :
                             action.action === "monitoring" ? "Treasury Monitoring" :
                             action.action}
                          </span>
                          <StatusBadge status={action.status} />
                        </div>
                        <p className="text-xs text-muted leading-relaxed line-clamp-2">{action.reasoning}</p>
                        {action.txHash && (
                          <a
                            href={`https://testnet.arcscan.app/tx/${action.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary hover:text-primary-glow transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View on ArcScan
                          </a>
                        )}
                      </div>
                      <span className="text-[10px] text-muted shrink-0 mt-0.5">
                        {new Date(action.timestamp).toLocaleTimeString()}
                      </span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </GlassCard>

          {/* Circle Integrations */}
          <GlassCard className="p-5 space-y-4" hover={false}>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-text-primary">Deep Circle Integration</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AGENT_INTEGRATIONS.map((integration) => (
                <div key={integration.name} className="flex items-start gap-3 p-3 rounded-xl border border-border-thin bg-surface-elevated/30">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-text-primary">{integration.name}</p>
                    <p className="text-xs text-muted mt-0.5">{integration.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Gateway Inference Payments */}
          {payments && payments.callCount > 0 && (
            <GlassCard className="p-5 space-y-4" hover={false}>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-text-primary">Agent Inference Payments</h2>
                <span className="ml-auto text-xs text-muted">via Circle Gateway x402</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total Spent", value: `${payments.totalSpent.toFixed(4)} USDC` },
                  { label: "AI Calls", value: payments.callCount.toString() },
                  { label: "Avg Cost", value: `${payments.avgCost.toFixed(4)} USDC` },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-2 rounded-lg bg-surface-elevated/40 border border-border-thin">
                    <p className="text-xs text-muted">{stat.label}</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {payments.history.slice(0, 3).map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border-thin last:border-0">
                    <span className="text-muted">{p.model}</span>
                    <span className="text-muted">{p.tokensUsed} tokens</span>
                    <span className="text-emerald-400 font-medium">{p.amount.toFixed(4)} USDC</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Interactive Lepton Demo Console */}
          <GlassCard className="p-5 space-y-5 border-primary/30 bg-primary/[0.02] shadow-[0_0_30px_rgba(124,58,237,0.08)]" hover={false}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-text-primary">Lepton Interactive Demo Console</h2>
              <span className="ml-auto text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase tracking-widest animate-pulse">
                Interactive
              </span>
            </div>

            {demoStep === "idle" && (
              <div className="space-y-4">
                <p className="text-xs text-muted leading-relaxed">
                  Experience the end-to-end autonomous rebalance loop. The agent will monitor the treasury, submit a governance proposal on-chain, poll the community vote, and autonomously trigger the cross-chain CCTP transfer.
                </p>
                <button
                  onClick={startDemo}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue text-white text-xs font-bold hover:opacity-90 transition-all shadow-[0_0_15px_rgba(124,58,237,0.25)] cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  Start Demo Walkthrough
                </button>
              </div>
            )}

            {demoStep === "analyzing" && (
              <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <div>
                  <p className="text-xs font-bold text-text-primary">Step 1: AI Decision Engine Analysis</p>
                  <p className="text-[11px] text-muted mt-1">Llama 3.3 checking treasury metrics and evaluating rebalance rules...</p>
                </div>
              </div>
            )}

            {demoStep === "proposed" && (
              <div className="space-y-4">
                <div className="p-3 bg-surface-elevated/40 border border-primary/20 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/25 border border-primary/30 text-primary uppercase">Proposal Drafted</span>
                    <span className="text-muted ml-auto font-mono">ID: #436</span>
                  </div>
                  <h3 className="text-xs font-bold text-text-primary">[AGENT] Bridge 42.50 USDC to Ethereum via CCTP</h3>
                  <p className="text-[10px] text-muted leading-relaxed">
                    <strong>AI Reasoning:</strong> USDC balance of 142.50 is above the 100 threshold. Proposing rebalancing of 42.50 USDC (30%) to Ethereum Sepolia main pool.
                  </p>
                </div>
                <button
                  onClick={simulateVotes}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Submit Proposal to Governor
                </button>
              </div>
            )}

            {demoStep === "voting" && (
              <div className="space-y-4">
                <div className="p-3 bg-surface-elevated/40 border border-border-thin rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-text-primary">Proposal #436 Voting Status</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-success/15 border border-success/25 text-success uppercase">Active</span>
                  </div>
                  
                  {/* Vote Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted">For: {demoVotes.toLocaleString()} sARC</span>
                      <span className="font-bold text-primary">{(demoVotes > 0) ? Math.min(100, Math.floor((demoVotes / 5840000) * 100)) : 0}%</span>
                    </div>
                    <div className="h-1.5 bg-surface border border-border-thin rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent-blue transition-all duration-300"
                        style={{ width: `${Math.min(100, (demoVotes / 5840000) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-muted font-mono">
                      <span>Quorum: 5,000,000 sARC</span>
                      <span>Target: 5,840,000 sARC</span>
                    </div>
                  </div>
                </div>

                {demoVotes < 5840000 ? (
                  <button
                    onClick={simulateVotes}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-600/30 transition-all cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 animate-pulse" />
                    Simulate Community Votes
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-success/10 border border-success/20 text-success text-xs font-bold">
                      <CheckCircle className="w-4 h-4" />
                      Voting Quorum Passed (Succeeded)
                    </div>
                    <button
                      onClick={executeSimulatedCctp}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue text-white text-xs font-bold hover:opacity-90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.25)] cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Execute Rebalance (CCTP)
                    </button>
                  </div>
                )}
              </div>
            )}

            {demoStep === "executing" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[10px] text-muted font-mono">
                  <span>Source: Arc Testnet</span>
                  <span className="animate-pulse text-primary font-bold">CCTP Tunnel Active</span>
                  <span>Destination: Ethereum Sepolia</span>
                </div>
                
                {/* Visualizer Flowchart */}
                <div className="flex items-center justify-between gap-1 p-3.5 bg-surface-elevated/40 border border-border-thin rounded-2xl relative overflow-hidden">
                  {/* Progress Line */}
                  <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-[3px] bg-border-thin z-0" />
                  <div 
                    className="absolute left-10 top-1/2 -translate-y-1/2 h-[3px] bg-gradient-to-r from-primary via-purple-500 to-blue-500 z-0 transition-all duration-[2000ms]"
                    style={{
                      width: cctpProgress === "burn" ? "25%" : 
                             cctpProgress === "attestation" ? "60%" : 
                             cctpProgress === "mint" ? "90%" : 
                             cctpProgress === "done" ? "100%" : "0%"
                    }}
                  />

                  {/* Node 1: Burn */}
                  <div className="flex flex-col items-center gap-1 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-500 ${
                      cctpProgress !== "idle" ? "bg-primary border-primary text-white shadow-[0_0_12px_rgba(124,58,237,0.5)]" : "bg-surface border-border text-muted"
                    }`}>
                      <Coins className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[8px] font-bold text-text-primary">Burn Arc</span>
                  </div>

                  {/* Node 2: Attestation */}
                  <div className="flex flex-col items-center gap-1 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-500 ${
                      cctpProgress === "attestation" || cctpProgress === "mint" || cctpProgress === "done" ? "bg-purple-600 border-purple-500 text-white shadow-[0_0_12px_rgba(147,51,234,0.5)]" : "bg-surface border-border text-muted"
                    }`}>
                      <BrainCircuit className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[8px] font-bold text-text-primary">Attest</span>
                  </div>

                  {/* Node 3: Mint */}
                  <div className="flex flex-col items-center gap-1 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-500 ${
                      cctpProgress === "mint" || cctpProgress === "done" ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)]" : "bg-surface border-border text-muted"
                    }`}>
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[8px] font-bold text-text-primary">Mint Eth</span>
                  </div>
                </div>

                <div className="p-3 bg-surface-elevated/40 rounded-xl border border-border-thin text-xs text-center text-muted min-h-[50px] flex items-center justify-center">
                  {cctpProgress === "burn" && (
                    <div className="space-y-1 w-full">
                      <p className="font-bold text-text-primary text-[11px]">🔥 Burning 42.50 USDC on Arc Testnet</p>
                      <p className="text-[8px] font-mono text-primary truncate">Tx: 0xbc84294c718a29b01284d72856fe8d3615418b7625ea4b971aefd82b130c25d8</p>
                    </div>
                  )}
                  {cctpProgress === "attestation" && (
                    <div className="space-y-1 w-full">
                      <p className="font-bold text-text-primary text-[11px] animate-pulse">⏳ Requesting Attestation Proof</p>
                      <p className="text-[8px] text-purple-400">Polling Circle's Iris API for signature...</p>
                    </div>
                  )}
                  {cctpProgress === "mint" && (
                    <div className="space-y-1 w-full">
                      <p className="font-bold text-text-primary text-[11px]">🪙 Minting 42.50 USDC on Ethereum Sepolia</p>
                      <p className="text-[8px] font-mono text-blue-400 truncate">Tx: 0x90c42d386ea4286fb96bca487fe8d3615e4f2b38f8c2b5e2b130c25d82b130c25</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {demoStep === "success" && (
              <div className="space-y-4">
                <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-success/20 border border-success/30 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                  <h3 className="text-sm font-bold text-success">Rebalance Complete!</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    Successfully bridged 42.50 USDC from Arc Treasury to Ethereum Sepolia autonomously using CCTP.
                  </p>
                </div>
                <button
                  onClick={resetDemo}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-surface-elevated hover:bg-surface text-xs font-semibold text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Reset Interactive Demo
                </button>
              </div>
            )}
            
            <div className="flex gap-3 pt-1 border-t border-border-thin">
              <Link href="/proposals" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border text-[10px] font-medium text-text-secondary hover:text-primary hover:border-primary/30 transition-all">
                View Proposals <ChevronRight className="w-3 h-3" />
              </Link>
              <Link href="/treasury" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border text-[10px] font-medium text-text-secondary hover:text-primary hover:border-primary/30 transition-all">
                View Treasury <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </GlassCard>

        </div>
      </div>
    </div>
  );
}
