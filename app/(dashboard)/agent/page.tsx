"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Bot, Zap, Activity, Play, RotateCw, ExternalLink,
  BrainCircuit, Coins, ArrowRight, CheckCircle, XCircle,
  Clock, AlertTriangle, Shield, Cpu, Wallet, ChevronRight,
  TrendingUp, ArrowLeftRight, CreditCard, Plus, Users, X, Check,
  Calendar, DollarSign, Percent, Globe, BarChart2, BellRing,
  Lock, Layers, TrendingDown, Repeat, Eye, ChevronDown
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { AGENT_CAPABILITIES, AGENT_INTEGRATIONS, AGENT_CONFIG } from "@/lib/agent/smart-account";
import { useAuth } from "@/hooks/auth/useAuth";
import { useWallets as usePrivyWallets } from "@privy-io/react-auth";
import { createPublicClient, http, fallback, parseUnits } from "viem";
import { ARC_CHAIN, ARC_RPC_URLS } from "@/lib/arc-config";
import { AgentABI } from "@/lib/governance/contracts";
import { parseArcError } from "@/lib/utils";
import { getAuthenticatedClient, getAggressiveGasParams, waitForTransaction } from "@/lib/tx-helper";

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
  treasury: { usdc: number; eurc: number; sepoliaUsdc?: number };
  recentActions: AgentAction[];
  isRunning: boolean;
  lastCheck: string;
  treasurySource?: 'live' | 'fallback';
  payments?: {
    history: any[];
    totalSpent: number;
    callCount: number;
    avgCost: number;
  };
}

function ActionIcon({ action }: { action: string }) {
  if (action === "bridge_to_ethereum") return <ArrowLeftRight className="w-4 h-4 text-blue-400" />;
  if (action === "return_funds") return <RotateCw className="w-4 h-4 text-blue-400" />;
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
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [treasurySource, setTreasurySource] = useState<'live' | 'fallback' | null>(null);
  const [verifyResult, setVerifyResult] = useState<AgentAction | null>(null);
  const [showVerifyResult, setShowVerifyResult] = useState(false);

  // On-Chain State Hooks & Variables
  const { wallets: privyWallets } = usePrivyWallets();
  const wallets = privyWallets ?? [];
  const { isAuthenticated, login, walletAddress, isCircle } = useAuth();

  const [onChainPaused, setOnChainPaused] = useState<boolean>(false);
  const [maxRebalanceAmount, setMaxRebalanceAmount] = useState<number>(50);
  const [queuedWithdrawals, setQueuedWithdrawals] = useState<any[]>([]);
  const [onChainLoading, setOnChainLoading] = useState<boolean>(true);
  const [isPausing, setIsPausing] = useState<boolean>(false);
  const [isSettingLimit, setIsSettingLimit] = useState<boolean>(false);
  const [newLimitInput, setNewLimitInput] = useState<string>("");
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);

  const [executingWithdrawalId, setExecutingWithdrawalId] = useState<string | null>(null);
  const [cancelingWithdrawalId, setCancelingWithdrawalId] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  const [showWithdrawalModal, setShowWithdrawalModal] = useState<boolean>(false);
  const [withdrawalToken, setWithdrawalToken] = useState<string>("0x3600000000000000000000000000000000000000");
  const [withdrawalRecipient, setWithdrawalRecipient] = useState<string>("");
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>("");
  const [isQueueingWithdrawal, setIsQueueingWithdrawal] = useState<boolean>(false);
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [proposingReturn, setProposingReturn] = useState<boolean>(false);

  // ── Auto Payments State ──────────────────────────────────────────────────
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentForm, setPaymentForm] = useState({ recipient: "", label: "", amount: "", frequency: "monthly", asset: "USDC" });
  const [scheduledPayments, setScheduledPayments] = useState<Array<{id:number;label:string;recipient:string;amount:number;asset:string;frequency:string;status:string;nextRun:string}>>([]);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Live Feature States
  const [isSweepRunning, setIsSweepRunning] = useState(false);
  const [isYieldProposing, setIsYieldProposing] = useState(false);
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [alertThresholdInput, setAlertThresholdInput] = useState("10");
  const [alertThreshold, setAlertThreshold] = useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("synarc_alert_threshold") || "10", 10);
    }
    return 10;
  });

  const fetchOnChainState = useCallback(async () => {
    setOnChainLoading(true);
    const publicClient = createPublicClient({
      chain: ARC_CHAIN,
      transport: fallback(ARC_RPC_URLS.map((url) => http(url))),
    });

    const agentAddr = (process.env.NEXT_PUBLIC_AGENT_SMART_ACCOUNT || 
                      process.env.NEXT_PUBLIC_AGENT_ADDRESS || 
                      "0x88BdF819466C1802ce6C780a9fbdF3A314cab07D") as `0x${string}`;

    try {
      const [paused, limit, rawQueued] = await Promise.all([
        publicClient.readContract({
          address: agentAddr,
          abi: AgentABI,
          functionName: 'paused',
        }).catch(() => false),
        publicClient.readContract({
          address: agentAddr,
          abi: AgentABI,
          functionName: 'maxRebalanceAmount',
        }).catch(() => 50n * 10n**6n),
        publicClient.readContract({
          address: agentAddr,
          abi: AgentABI,
          functionName: 'getQueuedWithdrawals',
        }).catch(() => [] as any),
      ]);

      setOnChainPaused(paused);
      setMaxRebalanceAmount(Number(limit) / 1_000_000);
      
      const formattedQueued = (rawQueued || []).map((q: any) => ({
        id: q.id.toString(),
        token: q.token,
        recipient: q.recipient,
        amount: Number(q.amount) / 1_000_000,
        executionTime: Number(q.executionTime),
        executed: q.executed,
        canceled: q.canceled,
      }));
      setQueuedWithdrawals(formattedQueued);
    } catch (err) {
      console.error("fetchOnChainState error:", err);
    } finally {
      setOnChainLoading(false);
    }
  }, []);

  const handlePauseToggle = async () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    
    setIsPausing(true);
    const toastId = toast.loading(onChainPaused ? "Initiating agent unpause..." : "Initiating agent pause (emergency stop)...");
    
    try {

      
      const agentAddr = (process.env.NEXT_PUBLIC_AGENT_SMART_ACCOUNT || 
                        process.env.NEXT_PUBLIC_AGENT_ADDRESS || 
                        "0x88BdF819466C1802ce6C780a9fbdF3A314cab07D") as `0x${string}`;

      const { walletClient, publicClient, address } = await getAuthenticatedClient(wallets, 5042002, walletAddress);
      const gasParams = await getAggressiveGasParams(publicClient);
      
      const hash = await walletClient.writeContract({
        address: agentAddr,
        abi: AgentABI,
        functionName: onChainPaused ? 'unpause' : 'pause',
        args: [],
        account: address,
        gas: 300000n,
        ...gasParams
      });
      
      toast.loading(onChainPaused ? "⏳ Confirming unpause..." : "⏳ Confirming pause...", { id: toastId });
      await waitForTransaction(publicClient, hash);
      toast.success(onChainPaused ? "Agent resumed successfully! ✅" : "Agent paused successfully! 🛑", { id: toastId });
      fetchOnChainState();
    } catch (err: any) {
      console.error(err);
      toast.error(parseArcError(err), { id: toastId });
    } finally {
      setIsPausing(false);
    }
  };

  const handleUpdateLimit = async (newLimit: number) => {
    if (!isAuthenticated) {
      login();
      return;
    }
    
    setIsSettingLimit(true);
    const toastId = toast.loading("Updating rebalance limit...");
    
    try {

      
      const agentAddr = (process.env.NEXT_PUBLIC_AGENT_SMART_ACCOUNT || 
                        process.env.NEXT_PUBLIC_AGENT_ADDRESS || 
                        "0x88BdF819466C1802ce6C780a9fbdF3A314cab07D") as `0x${string}`;

      const { walletClient, publicClient, address } = await getAuthenticatedClient(wallets, 5042002, walletAddress);
      const gasParams = await getAggressiveGasParams(publicClient);
      
      const limitInUnits = parseUnits(newLimit.toString(), 6);
      
      const hash = await walletClient.writeContract({
        address: agentAddr,
        abi: AgentABI,
        functionName: 'setMaxRebalanceAmount',
        args: [limitInUnits],
        account: address,
        gas: 300000n,
        ...gasParams
      });
      
      toast.loading("⏳ Confirming limit update...", { id: toastId });
      await waitForTransaction(publicClient, hash);
      toast.success(`Limit successfully updated to ${newLimit} USDC! ✅`, { id: toastId });
      setShowLimitModal(false);
      fetchOnChainState();
    } catch (err: any) {
      console.error(err);
      toast.error(parseArcError(err), { id: toastId });
    } finally {
      setIsSettingLimit(false);
    }
  };

  const handleExecuteAgentWithdrawal = async (id: string) => {
    if (!isAuthenticated) {
      login();
      return;
    }
    
    setExecutingWithdrawalId(id);
    const toastId = toast.loading("Executing agent withdrawal...");
    
    try {

      
      const agentAddr = (process.env.NEXT_PUBLIC_AGENT_SMART_ACCOUNT || 
                        process.env.NEXT_PUBLIC_AGENT_ADDRESS || 
                        "0x88BdF819466C1802ce6C780a9fbdF3A314cab07D") as `0x${string}`;

      const { walletClient, publicClient, address } = await getAuthenticatedClient(wallets, 5042002, walletAddress);
      const gasParams = await getAggressiveGasParams(publicClient);
      
      const hash = await walletClient.writeContract({
        address: agentAddr,
        abi: AgentABI,
        functionName: 'executeWithdrawal',
        args: [BigInt(id)],
        account: address,
        gas: 300000n,
        ...gasParams
      });
      
      toast.loading("⏳ Confirming execution...", { id: toastId });
      await waitForTransaction(publicClient, hash);
      toast.success("Agent withdrawal executed successfully! ✅", { id: toastId });
      fetchOnChainState();
    } catch (err: any) {
      console.error(err);
      toast.error(parseArcError(err), { id: toastId });
    } finally {
      setExecutingWithdrawalId(null);
    }
  };

  const handleCancelAgentWithdrawal = async (id: string) => {
    if (!isAuthenticated) {
      login();
      return;
    }
    
    setCancelingWithdrawalId(id);
    const toastId = toast.loading("Canceling agent withdrawal...");
    
    try {

      
      const agentAddr = (process.env.NEXT_PUBLIC_AGENT_SMART_ACCOUNT || 
                        process.env.NEXT_PUBLIC_AGENT_ADDRESS || 
                        "0x88BdF819466C1802ce6C780a9fbdF3A314cab07D") as `0x${string}`;

      const { walletClient, publicClient, address } = await getAuthenticatedClient(wallets, 5042002, walletAddress);
      const gasParams = await getAggressiveGasParams(publicClient);
      
      const hash = await walletClient.writeContract({
        address: agentAddr,
        abi: AgentABI,
        functionName: 'cancelWithdrawal',
        args: [BigInt(id)],
        account: address,
        gas: 300000n,
        ...gasParams
      });
      
      toast.loading("⏳ Confirming cancellation...", { id: toastId });
      await waitForTransaction(publicClient, hash);
      toast.success("Agent withdrawal canceled successfully! ✅", { id: toastId });
      fetchOnChainState();
    } catch (err: any) {
      console.error(err);
      toast.error(parseArcError(err), { id: toastId });
    } finally {
      setCancelingWithdrawalId(null);
    }
  };

  const handleQueueWithdrawal = async () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    if (!withdrawalRecipient || !withdrawalAmount) {
      toast.error("Please fill in all fields.");
      return;
    }
    
    setIsQueueingWithdrawal(true);
    const toastId = toast.loading("Queueing agent withdrawal...");
    
    try {

      
      const agentAddr = (process.env.NEXT_PUBLIC_AGENT_SMART_ACCOUNT || 
                        process.env.NEXT_PUBLIC_AGENT_ADDRESS || 
                        "0x88BdF819466C1802ce6C780a9fbdF3A314cab07D") as `0x${string}`;

      const { walletClient, publicClient, address } = await getAuthenticatedClient(wallets, 5042002, walletAddress);
      const gasParams = await getAggressiveGasParams(publicClient);
      
      const decimals = withdrawalToken.toLowerCase() === "0x3600000000000000000000000000000000000000" || 
                       withdrawalToken.toLowerCase() === "0x89b50855aa3be2f677cd6303cec089b5f319d72a" ? 6 : 18;
      const amountInUnits = parseUnits(withdrawalAmount, decimals);
      
      const hash = await walletClient.writeContract({
        address: agentAddr,
        abi: AgentABI,
        functionName: 'queueWithdrawal',
        args: [withdrawalToken as `0x${string}`, withdrawalRecipient as `0x${string}`, amountInUnits],
        account: address,
        gas: 300000n,
        ...gasParams
      });
      
      toast.loading("⏳ Confirming queued withdrawal...", { id: toastId });
      await waitForTransaction(publicClient, hash);
      toast.success("Withdrawal queued successfully! ✅ (24h delay enforced)", { id: toastId });
      setShowWithdrawalModal(false);
      fetchOnChainState();
    } catch (err: any) {
      console.error(err);
      toast.error(parseArcError(err), { id: toastId });
    } finally {
      setIsQueueingWithdrawal(false);
    }
  };

  const handleProposeReturn = async () => {
    setProposingReturn(true);
    const toastId = toast.loading("Creating governance proposal for return of funds...");
    try {
      const response = await fetch("/api/agent/propose-return", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create return proposal");
      }
      toast.success("Governance proposal created successfully! ✅ Proposal Tx: " + data.txHash.substring(0, 10) + "...", { id: toastId, duration: 6000 });
      setShowReturnModal(false);
      fetchAgentState();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to create proposal.", { id: toastId });
    } finally {
      setProposingReturn(false);
    }
  };

  const pendingAgentWithdrawals = useMemo(() => {
    return (queuedWithdrawals || []).filter(q => !q.executed && !q.canceled);
  }, [queuedWithdrawals]);

  // Interactive Demo States
  const [demoStep, setDemoStep] = useState<"idle" | "analyzing" | "proposed" | "voting" | "executing" | "success">("idle");
  const [demoVotes, setDemoVotes] = useState(0);
  const [cctpProgress, setCctpProgress] = useState<"idle" | "burn" | "attestation" | "mint" | "done">("idle");
  const [demoUSDCBalance, setDemoUSDCBalance] = useState<number | null>(null);

  const fetchAgentState = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/run");
      const data = await res.json();
      if (data.success !== false) {
        setAgentState(data);
        setLastChecked(new Date());
        if (data.treasurySource) setTreasurySource(data.treasurySource);
      }
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

  const runAutoSweep = async () => {
    setIsSweepRunning(true);
    const toastId = toast.loading("Running auto sweep cycle...");
    try {
      const res = await fetch("/api/agent/run", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await fetchAgentState();
        const act = data.action;
        if (act?.action === "bridge_to_ethereum") {
          toast.success(`Sweep complete — bridged ${act.usdcAmount} USDC → Ethereum`, { id: toastId, duration: 5000 });
        } else {
          toast.success("Sweep cycle complete — check Action Console", { id: toastId });
        }
      } else {
        toast.error(data.error || "Sweep failed", { id: toastId });
      }
    } catch {
      toast.error("Failed to run sweep", { id: toastId });
    } finally {
      setIsSweepRunning(false);
    }
  };

  const proposeYieldAllocation = async () => {
    setIsYieldProposing(true);
    const toastId = toast.loading("Agent preparing yield allocation proposal...");
    try {
      const res = await fetch("/api/agent/run", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await fetchAgentState();
        toast.success("Yield allocation proposal submitted to governance!", { id: toastId, duration: 6000 });
      } else {
        toast.error(data.error || "Failed to propose yield allocation", { id: toastId });
      }
    } catch {
      toast.error("Failed to propose yield allocation", { id: toastId });
    } finally {
      setIsYieldProposing(false);
    }
  };

  const saveAlertThreshold = () => {
    const val = parseInt(alertThresholdInput, 10);
    if (!isNaN(val) && val >= 0) {
      setAlertThreshold(val);
      if (typeof window !== "undefined") {
        localStorage.setItem("synarc_alert_threshold", val.toString());
      }
      toast.success(`Alert threshold set to ${val} USDC`);
      setShowAlertSettings(false);
    } else {
      toast.error("Enter a valid threshold");
    }
  };

  const runAgent = async () => {
    setRunning(true);
    setShowVerifyResult(false);
    setVerifyResult(null);
    const toastId = toast.loading("Agent analyzing treasury...");
    try {
      const res = await fetch("/api/agent/run", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await fetchAgentState();
        const action = data.action;
        // Surface the result in the UI panel
        if (action) {
          setVerifyResult(action);
          setShowVerifyResult(true);
        }
        if (data.treasurySource) setTreasurySource(data.treasurySource);
        if (action?.action === "bridge_to_ethereum") {
          toast.success(`Agent proposed CCTP bridge: ${action.usdcAmount} USDC → Ethereum`, { id: toastId, duration: 5000 });
        } else if (action?.action === "monitoring") {
          toast.success("Agent verified rules — treasury healthy", { id: toastId });
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
    fetchOnChainState();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAgentState();
      fetchOnChainState();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchAgentState, fetchOnChainState]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const treasury = agentState?.treasury;
  const actions = agentState?.recentActions || [];
  const payments = agentState?.payments;

  // Determine active rules based on treasury
  const usdcAbove100 = (treasury?.usdc || 0) > 100;
  const usdcBelow10 = (treasury?.usdc || 0) < 10;
  const eurcAbove50 = (treasury?.eurc || 0) > 50;

  // ── Risk Score computation ────────────────────────────────────────────────
  const riskSignals = useMemo(() => {
    const usdc = demoUSDCBalance !== null ? demoUSDCBalance : (treasury?.usdc || 0);
    const signals: { label: string; severity: "low" | "medium" | "high"; active: boolean; icon: any }[] = [
      {
        label: `Low Liquidity (USDC < ${alertThreshold})`,
        severity: "high",
        active: usdc < alertThreshold,
        icon: TrendingDown,
      },
      {
        label: "Agent Emergency Stop Active",
        severity: "high",
        active: onChainPaused,
        icon: XCircle,
      },
      {
        label: "Large Outflow Detected (>80% of balance)",
        severity: "medium",
        active: actions.some(a => a.usdcAmount && usdc > 0 && (a.usdcAmount / (usdc + (a.usdcAmount || 0))) > 0.8),
        icon: AlertTriangle,
      },
      {
        label: "Agent Inactivity (>6 hours)",
        severity: "low",
        active: actions.length > 0
          ? (Date.now() - new Date(actions[0].timestamp).getTime()) > 6 * 3600 * 1000
          : false,
        icon: Clock,
      },
    ];
    return signals;
  }, [treasury, demoUSDCBalance, onChainPaused, actions, alertThreshold]);

  const riskScore = useMemo(() => {
    const weights = { high: 40, medium: 20, low: 10 };
    const score = riskSignals.reduce((acc, s) => s.active ? acc + weights[s.severity] : acc, 0);
    return Math.min(score, 100);
  }, [riskSignals]);

  return (
    <div className="space-y-8 animate-fade-in-up">

      {/* On-chain Pause Alert Banner */}
      {onChainPaused && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-500">Emergency Stop Active</h3>
            <p className="text-xs text-muted mt-1">
              The Treasury Guard is currently paused on-chain. All automated sweeps, checks, and transfer activities have been suspended. Only the owner can unpause the guard.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent-blue/20 border border-primary/30 flex items-center justify-center">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            {!onChainPaused && (
              <>
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background animate-ping" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background" />
              </>
            )}
            {onChainPaused && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-background" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-text-primary">Treasury Guard</h1>
              {onChainPaused ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/20 border border-red-500/30 text-red-500">
                  PAUSED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/20 border border-primary/30 text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping inline-block" />
                  ACTIVE
                </span>
              )}
            </div>
            <div>
              <p className="text-sm text-muted">Helps monitor your treasury capital and automated transfer rules.</p>
              {lastChecked && (
                <p className="text-[10px] text-muted/60 mt-0.5">
                  Last checked: {lastChecked.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              fetchAgentState();
              fetchOnChainState();
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border-thin bg-surface-elevated hover:bg-surface text-sm font-medium text-text-secondary hover:text-text-primary transition-all cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          
          <motion.button
            onClick={handlePauseToggle}
            disabled={isPausing}
            whileHover={{ scale: isPausing ? 1 : 1.02 }}
            whileTap={{ scale: isPausing ? 1 : 0.98 }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white-keep transition-all shadow-md cursor-pointer disabled:cursor-not-allowed ${
              onChainPaused
                ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                : "bg-red-600 hover:bg-red-500 shadow-red-600/20"
            }`}
          >
            {isPausing ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : onChainPaused ? (
              <>
                <Play className="w-4 h-4" />
                Resume Guard
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Emergency Stop
              </>
            )}
          </motion.button>
 
          <motion.button
            onClick={runAgent}
            disabled={running || onChainPaused}
            whileHover={{ scale: (running || onChainPaused) ? 1 : 1.02 }}
            whileTap={{ scale: (running || onChainPaused) ? 1 : 0.98 }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue text-white-keep text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] cursor-pointer disabled:cursor-not-allowed"
          >
            {running ? (
              <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Running...</>
            ) : (
              <><Play className="w-4 h-4" />Verify Rules Now</>
            )}
          </motion.button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "USDC Balance", value: loading ? "..." : demoUSDCBalance !== null ? `${demoUSDCBalance.toFixed(2)}` : `${(treasury?.usdc || 0).toFixed(2)}`, unit: "USDC", icon: Coins, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", isBalance: true },
          { label: "EURC Balance", value: loading ? "..." : `${(treasury?.eurc || 0).toFixed(2)}`, unit: "EURC", icon: Coins, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", isBalance: true },
          { label: "Actions Today", value: actions.length.toString(), unit: "actions", icon: Zap, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", isBalance: false },
          { label: "Inference Paid", value: (payments?.totalSpent || 0).toFixed(4), unit: "USDC", icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", isBalance: false },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <GlassCard className="p-4 space-y-3" hover={false}>
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${stat.bg} border ${stat.border}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  {stat.isBalance && !loading && (
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                      treasurySource === 'live'
                        ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
                        : treasurySource === 'fallback'
                        ? 'bg-amber-500/15 border-amber-500/25 text-amber-400'
                        : 'bg-surface-elevated border-border-thin text-muted'
                    }`}>
                      {treasurySource === 'live' ? '⬤ LIVE' : treasurySource === 'fallback' ? '⚠ RPC DOWN' : '...'}
                    </span>
                  )}
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

      {/* Verify Rules Result Panel */}
      <AnimatePresence>
        {showVerifyResult && verifyResult && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-start gap-4 ${
              verifyResult.status === 'executed'
                ? 'bg-emerald-500/5 border-emerald-500/25'
                : verifyResult.status === 'failed'
                ? 'bg-red-500/5 border-red-500/25'
                : 'bg-primary/5 border-primary/25'
            }`}
          >
            <div className={`p-2 rounded-xl shrink-0 self-start ${
              verifyResult.status === 'executed' ? 'bg-emerald-500/15' :
              verifyResult.status === 'failed'   ? 'bg-red-500/15' : 'bg-primary/15'
            }`}>
              {verifyResult.status === 'executed' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : verifyResult.status === 'failed' ? (
                <XCircle className="w-5 h-5 text-red-400" />
              ) : (
                <Activity className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-sm font-bold ${
                  verifyResult.status === 'executed' ? 'text-emerald-400' :
                  verifyResult.status === 'failed'   ? 'text-red-400' : 'text-primary'
                }`}>
                  {verifyResult.action === 'monitoring' ? 'Rules Verified — Treasury Healthy' :
                   verifyResult.action === 'bridge_to_ethereum' ? `Rule Triggered: Bridge ${verifyResult.usdcAmount} USDC → Ethereum` :
                   verifyResult.action === 'emergency_funding' ? 'Rule Triggered: Emergency Funding Required' :
                   verifyResult.action}
                </p>
                <StatusBadge status={verifyResult.status} />
              </div>
              <p className="text-xs text-muted mt-1 leading-relaxed">{verifyResult.reasoning}</p>
              {verifyResult.txHash && (
                <a
                  href={`https://testnet.arcscan.app/tx/${verifyResult.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View on ArcScan
                </a>
              )}
            </div>
            <button
              onClick={() => setShowVerifyResult(false)}
              className="text-muted hover:text-text-primary transition-colors self-start cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Decision Engine */}
        <GlassCard className="p-5 space-y-4 col-span-1 lg:col-span-1 order-3 lg:order-none" hover={false}>
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-text-primary">Treasury Decision Engine</h2>
              <span className="ml-auto text-xs text-muted">Rules Active</span>
            </div>
            <div className="space-y-2">
              <RuleCard condition="USDC > 100" action="Propose secure transfer to Ethereum Sepolia" met={usdcAbove100} />
              <RuleCard condition="USDC < 10" action="Propose emergency funding request" met={usdcBelow10} />
              <RuleCard condition="EURC > 50" action="Propose EURC rebalancing" met={eurcAbove50} />
              <RuleCard condition="Proposal passes vote" action="Execute transfer autonomously" met={false} />
            </div>
          </GlassCard>
 
          {/* Agent Identity */}
          <GlassCard className="p-5 space-y-4 col-span-1 lg:col-span-1 order-4 lg:order-none" hover={false}>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-text-primary">Workspace Identity</h2>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Smart Account", value: "SynArc Guard (Deployed)" },
                { label: "Signer / Executor", value: "Server Hot-Wallet EOA" },
                { label: "AI Assistant", value: "Active" },
                { label: "Network", value: "Arc Testnet (5042002)" },
                { label: "Registry", value: "ERC-8004 Registry" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-xs">
                  <span className="text-muted">{row.label}</span>
                  <span className="text-text-secondary font-medium">{row.value}</span>
                </div>
              ))}
              
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border-thin/40">
                <span className="text-muted">Max Rebalance Limit</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-text-secondary font-bold font-mono">
                    {onChainLoading ? "..." : `${maxRebalanceAmount} USDC`}
                  </span>
                  {isAuthenticated && (
                    <button
                      onClick={() => {
                        setNewLimitInput(maxRebalanceAmount.toString());
                        setShowLimitModal(true);
                      }}
                      className="text-primary hover:text-primary-glow text-[10px] font-bold cursor-pointer bg-transparent border-0 p-0"
                    >
                      (Edit)
                    </button>
                  )}
                </div>
              </div>

              {agentState?.agentAddress && (
                <div className="pt-2 border-t border-border-thin space-y-2">
                  <div>
                    <p className="text-[10px] text-muted mb-0.5">Smart Account Address</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-primary font-mono truncate flex-1">
                        {agentState.agentAddress}
                      </code>
                      <a
                        href={`https://testnet.arcscan.app/address/${agentState.agentAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted mb-0.5">Executor EOA Signer</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-text-secondary font-mono truncate flex-1">
                        0x35630dFE2592AB19d979ec1B173697aEa554b66b
                      </code>
                      <a
                        href={`https://testnet.arcscan.app/address/0x35630dFE2592AB19d979ec1B173697aEa554b66b`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {isAuthenticated && (
                <div className="pt-2 border-t border-border-thin">
                  <button
                    onClick={() => {
                      setWithdrawalRecipient("");
                      setWithdrawalAmount("");
                      setShowWithdrawalModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Queue New Withdrawal (Admin)
                  </button>
                </div>
              )}
            </div>
          </GlassCard>

          {/* CCTP Bridge Status */}
          <GlassCard className="p-5 space-y-4 col-span-1 lg:col-span-1 order-5 lg:order-none" hover={false}>
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
            <div className="space-y-1.5 pt-1 border-t border-border-thin/40 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Sepolia Balance</span>
                <span className="text-text-primary font-bold font-mono">
                  {loading ? "..." : `${(agentState?.treasury?.sepoliaUsdc ?? 0).toFixed(2)} USDC`}
                </span>
              </div>
            </div>
            {isAuthenticated && (
              <button
                onClick={() => setShowReturnModal(true)}
                disabled={proposingReturn || (agentState?.treasury?.sepoliaUsdc ?? 0) <= 0}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Return Funds from Ethereum
              </button>
            )}
            <p className="text-xs text-muted">
              The agent bridges USDC once a community vote passes. Transfers are fully secure and direct.
            </p>
          </GlassCard>

          {/* Agent Controls */}
          <GlassCard className="p-5 col-span-1 lg:col-span-2 order-1 lg:order-none" hover={false}>
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
                      No actions yet.<br />Click <strong className="text-text-primary">Verify Rules Now</strong> to run the rules check.
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
                             action.action === "return_funds" ? `CCTP Return ${action.usdcAmount || 0} USDC` :
                             action.action === "rebalance_eurc" ? `Rebalance ${action.usdcAmount || 0} EURC` :
                             action.action === "emergency_funding" ? "Emergency Funding Request" :
                             action.action === "monitoring" ? "Treasury Monitoring" :
                             action.action === "vote_for_proposal" ? "Voted FOR Proposal" :
                             action.action}
                          </span>
                          <StatusBadge status={action.status} />
                          {action.action !== "monitoring" && action.action !== "error" && (
                            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary shrink-0 whitespace-nowrap">
                              🤖 Treasury Agent
                            </span>
                          )}
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


          {/* Gateway Inference Payments */}
          {payments && payments.callCount > 0 && (
            <GlassCard className="p-5 space-y-4 col-span-1 lg:col-span-1 order-11 lg:order-none" hover={false}>
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

          {/* Live On-Chain Rebalance Monitor */}
          <GlassCard className="p-5 space-y-5 border-border-thin bg-surface-elevated/30 col-span-1 lg:col-span-2 order-2 lg:order-none" hover={false}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-text-primary">Live Treasury Monitor</h2>
              <span className="ml-auto text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase tracking-widest animate-pulse">
                Rule-Based
              </span>
            </div>
 
            {(() => {
              const activeCctp = actions.find(a => a.action === 'bridge_to_ethereum' || a.action === 'vote_for_proposal')
              
              if (!activeCctp) {
                return (
                  <div className="space-y-4">
                    <p className="text-xs text-muted leading-relaxed">
                      The Treasury Guard is actively running on the server. It monitors the treasury and executes rules on-chain when thresholds are met.
                    </p>
                    <div className="p-3 bg-surface-elevated/40 border border-border-thin rounded-xl flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-xs text-text-secondary font-medium">Status: Idle & Monitoring Rules</span>
                    </div>
                  </div>
                )
              }

              // Determine CCTP stage from description
              const reasoning = activeCctp.reasoning || ""
              let stage: "idle" | "burn" | "attestation" | "mint" | "done" | "failed" = "idle"
              let stageText = ""
              
              if (activeCctp.status === 'failed') {
                stage = "failed"
                stageText = "Rebalancing Failed"
              } else if (reasoning.includes('Step 1/3') || reasoning.includes('smart account')) {
                stage = "burn"
                stageText = "Step 1: Burning USDC on Arc Testnet"
              } else if (reasoning.includes('Step 2/3') || reasoning.includes('polling')) {
                stage = "attestation"
                stageText = "Step 2: Polling Circle Attestation API"
              } else if (reasoning.includes('Step 3/3') || reasoning.includes('minting')) {
                stage = "mint"
                stageText = "Step 3: Minting USDC on Sepolia"
              } else if (activeCctp.status === 'executed' || reasoning.includes('Success') || reasoning.includes('SUCCESSFUL')) {
                stage = "done"
                stageText = "Rebalance Completed Successfully"
              } else {
                stageText = reasoning
              }

              return (
                <div className="space-y-4">
                  <div className="p-3 bg-surface-elevated/40 border border-primary/20 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/25 border border-primary/30 text-primary uppercase">On-Chain Progress</span>
                      <span className="text-muted ml-auto font-mono text-[10px]">
                        {new Date(activeCctp.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-text-primary">{stageText}</h3>
                    <p className="text-[10px] text-muted leading-relaxed font-mono mt-1">
                      {reasoning}
                    </p>
                  </div>

                  {stage !== "failed" && (
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
                            width: stage === "burn" ? "25%" : 
                                   stage === "attestation" ? "60%" : 
                                   stage === "mint" ? "90%" : 
                                   stage === "done" ? "100%" : "0%"
                          }}
                        />

                        {/* Node 1: Burn */}
                        <div className="flex flex-col items-center gap-1 z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-500 ${
                            stage !== "idle" ? "bg-primary border-primary text-white-keep shadow-[0_0_12px_rgba(124,58,237,0.5)]" : "bg-surface border-border text-muted"
                          }`}>
                            <Coins className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[8px] font-bold text-text-primary">Burn Arc</span>
                        </div>

                        {/* Node 2: Attestation */}
                        <div className="flex flex-col items-center gap-1 z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-500 ${
                            stage === "attestation" || stage === "mint" || stage === "done" ? "bg-purple-600 border-purple-500 text-white-keep shadow-[0_0_12px_rgba(147,51,234,0.5)]" : "bg-surface border-border text-muted"
                          }`}>
                            <BrainCircuit className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[8px] font-bold text-text-primary">Attest</span>
                        </div>

                        {/* Node 3: Mint */}
                        <div className="flex flex-col items-center gap-1 z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-500 ${
                            stage === "mint" || stage === "done" ? "bg-blue-600 border-blue-500 text-white-keep shadow-[0_0_12px_rgba(37,99,235,0.5)]" : "bg-surface border-border text-muted"
                          }`}>
                            <CheckCircle className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[8px] font-bold text-text-primary">Mint Eth</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {stage === "done" && (
                    <div className="p-3 bg-success/10 border border-success/20 rounded-xl text-center space-y-1">
                      <p className="text-xs font-bold text-success">Rebalance Complete!</p>
                      <p className="text-[10px] text-muted font-mono truncate">
                        Burn Tx: {activeCctp.txHash || "0xbc84...25d8"}
                      </p>
                    </div>
                  )}
                </div>
              )
            })()}
            
            <div className="flex gap-3 pt-1 border-t border-border-thin">
              <Link href="/proposals" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border text-[10px] font-medium text-text-secondary hover:text-primary hover:border-primary/30 transition-all">
                View Proposals <ChevronRight className="w-3 h-3" />
              </Link>
              <Link href="/treasury" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border text-[10px] font-medium text-text-secondary hover:text-primary hover:border-primary/30 transition-all">
                View Treasury <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </GlassCard>

          {/* ════ AUTO YIELD FARMING ══════════════════════════════════════════ */}
          <GlassCard className="p-5 space-y-5 col-span-1 lg:col-span-1 order-9 lg:order-none" hover={false}>
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-violet-400" />
              <h2 className="text-sm font-bold text-text-primary">Auto Yield Farming</h2>
              <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-500/15 border border-violet-500/25 text-violet-400">TESTNET</span>
            </div>

            <div className="p-3 bg-surface-elevated/40 border border-border-thin rounded-xl flex items-start gap-3">
              <div className="p-2 bg-violet-500/15 rounded-lg border border-violet-500/20 shrink-0">
                <Layers className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary">Idle Capital</p>
                <p className="text-xs text-muted mt-0.5">
                  {((demoUSDCBalance ?? treasury?.usdc ?? 0)).toFixed(2)} USDC sitting idle — potential annual yield at 3–4% APY
                </p>
              </div>
              <div className="ml-auto text-right shrink-0">
                <p className="text-sm font-bold text-violet-400">
                  ~{((demoUSDCBalance ?? treasury?.usdc ?? 0) * 0.035).toFixed(2)}
                </p>
                <p className="text-[10px] text-muted">est. / year</p>
              </div>
            </div>

            {/* Strategy cards */}
            <div className="space-y-3">
              {[
                { name: "Aave USDC",    apy: 3.2, color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20",   logo: "A" },
                { name: "Compound",     apy: 2.9, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", logo: "C" },
                { name: "Morpho Blue",  apy: 4.1, color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20",  logo: "M" },
              ].map(s => (
                <div key={s.name} className={`p-3.5 rounded-xl border ${s.border} ${s.bg} flex items-center justify-between gap-4`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${s.bg} border ${s.border} flex items-center justify-center text-xs font-black shrink-0 ${s.color}`}>{s.logo}</div>
                    <div>
                      <p className="text-xs font-bold text-text-primary">{s.name}</p>
                      <p className="text-[10px] text-muted">APY (current estimate)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className={`text-sm font-black ${s.color}`}>{s.apy}%</p>
                      <span className="text-[9px] font-semibold text-muted bg-surface-elevated px-1.5 py-0.5 rounded border border-border-thin">
                        PLANNED
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-muted leading-relaxed">
              Agent will create a governance proposal to allocate idle USDC to the highest-yield strategy. Community votes before any funds move.
            </p>

            <motion.button
              onClick={proposeYieldAllocation}
              disabled={isYieldProposing || onChainPaused}
              whileHover={{ scale: (isYieldProposing || onChainPaused) ? 1 : 1.02 }}
              whileTap={{ scale: (isYieldProposing || onChainPaused) ? 1 : 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 text-xs font-bold hover:bg-violet-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isYieldProposing ? (
                <><span className="w-3.5 h-3.5 rounded-full border-2 border-violet-400/30 border-t-violet-400 animate-spin" />Proposing Yield Allocation...</>
              ) : (
                <><TrendingUp className="w-3.5 h-3.5" />Propose Yield Allocation</>
              )}
            </motion.button>
          </GlassCard>

          {/* ════ AUTO PAYMENTS ════════════════════════════════════════════ */}
          <GlassCard className="p-5 space-y-5 col-span-1 lg:col-span-2 order-6 lg:order-none" hover={false}>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-text-primary">Auto Payments</h2>
              <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">LIVE</span>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Scheduled / Mo", value: scheduledPayments.length > 0 ? `${scheduledPayments.filter(p => p.status === "scheduled").reduce((s, p) => s + p.amount, 0)} USDC` : "— USDC" },
                { label: "Next Payout",   value: scheduledPayments.filter(p => p.status === "scheduled").length > 0 ? (scheduledPayments.filter(p => p.status === "scheduled").sort((a, b) => a.nextRun.localeCompare(b.nextRun))[0]?.nextRun || "—") : "—" },
                { label: "Recipients",    value: scheduledPayments.length > 0 ? scheduledPayments.length.toString() : "0" },
              ].map(stat => (
                <div key={stat.label} className="text-center p-2.5 rounded-xl bg-surface-elevated/40 border border-border-thin">
                  <p className="text-[10px] text-muted">{stat.label}</p>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Payment schedule table */}
            {scheduledPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 rounded-xl border border-border-thin border-dashed">
                <Calendar className="w-8 h-8 text-muted/40" />
                <p className="text-xs text-muted text-center">No payments scheduled.<br />Click below to add your first recurring payment.</p>
              </div>
            ) : (
            <div className="overflow-x-auto rounded-xl border border-border-thin">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-thin text-text-tertiary text-[10px] uppercase tracking-wider bg-surface-elevated/30">
                    <th className="py-2.5 pl-3 font-bold">Label</th>
                    <th className="py-2.5 font-bold">Recipient</th>
                    <th className="py-2.5 font-bold">Amount</th>
                    <th className="py-2.5 font-bold">Frequency</th>
                    <th className="py-2.5 font-bold">Next Run</th>
                    <th className="py-2.5 pr-3 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-text-secondary">
                  {scheduledPayments.map(p => (
                    <tr key={p.id} className="border-b border-border-thin/50 hover:bg-surface-elevated/30 transition-colors">
                      <td className="py-3 pl-3 font-medium text-text-primary">{p.label}</td>
                      <td className="py-3 font-mono text-[10px] text-muted">{p.recipient}</td>
                      <td className="py-3 font-bold text-text-primary">{p.amount} <span className="text-muted font-normal">{p.asset}</span></td>
                      <td className="py-3 capitalize text-muted">{p.frequency}</td>
                      <td className="py-3 text-muted">{p.nextRun}</td>
                      <td className="py-3 pr-3 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                          p.status === "scheduled" ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400" :
                          p.status === "paused"    ? "bg-amber-500/15 border-amber-500/25 text-amber-400" :
                                                     "bg-blue-500/15 border-blue-500/25 text-blue-400"
                        }`}>
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}

            <button
              onClick={() => { setPaymentForm({ recipient: "", label: "", amount: "", frequency: "monthly", asset: "USDC" }); setShowPaymentModal(true); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule New Payment
            </button>
          </GlassCard>

          {/* ════ RISK MONITORING ═════════════════════════════════════════════ */}
          <GlassCard className={`p-5 space-y-5 col-span-1 lg:col-span-1 order-7 lg:order-none ${ riskScore >= 40 ? "border-red-500/30 bg-red-500/[0.01]" : riskScore >= 20 ? "border-amber-500/30 bg-amber-500/[0.01]" : "border-border-thin" }`} hover={false}>
            <div className="flex items-center gap-2">
              <BellRing className={`w-5 h-5 ${ riskScore >= 40 ? "text-red-400" : riskScore >= 20 ? "text-amber-400" : "text-emerald-400" }`} />
              <h2 className="text-sm font-bold text-text-primary">Risk Monitoring &amp; Alerts</h2>
              <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                riskScore >= 40 ? "bg-red-500/15 border-red-500/25 text-red-400 animate-pulse" :
                riskScore >= 20 ? "bg-amber-500/15 border-amber-500/25 text-amber-400" :
                                  "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"
              }`}>
                {riskScore >= 40 ? "HIGH RISK" : riskScore >= 20 ? "MEDIUM" : "ALL CLEAR"}
              </span>
            </div>

            {/* Risk Score Gauge */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted font-medium">Risk Score</span>
                <span className={`font-black text-lg ${ riskScore >= 40 ? "text-red-400" : riskScore >= 20 ? "text-amber-400" : "text-emerald-400" }`}>
                  {riskScore}<span className="text-xs font-normal text-muted">/100</span>
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-surface-elevated border border-border-thin overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${riskScore}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    riskScore >= 40 ? "bg-gradient-to-r from-red-600 to-red-400" :
                    riskScore >= 20 ? "bg-gradient-to-r from-amber-600 to-amber-400" :
                                      "bg-gradient-to-r from-emerald-600 to-emerald-400"
                  }`}
                />
              </div>
            </div>

            {/* Signal rows */}
            <div className="space-y-2">
              {riskSignals.map((signal, i) => {
                const Icon = signal.icon;
                return (
                  <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                    signal.active
                      ? signal.severity === "high"   ? "border-red-500/30 bg-red-500/10"
                      : signal.severity === "medium" ? "border-amber-500/30 bg-amber-500/10"
                      :                                "border-yellow-500/30 bg-yellow-500/10"
                      : "border-border-thin bg-surface-elevated/30"
                  }`}>
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      signal.active
                        ? signal.severity === "high"   ? "bg-red-500/20"
                        : signal.severity === "medium" ? "bg-amber-500/20"
                        :                                "bg-yellow-500/20"
                        : "bg-surface-elevated"
                    }`}>
                      <Icon className={`w-3.5 h-3.5 ${
                        signal.active
                          ? signal.severity === "high"   ? "text-red-400"
                          : signal.severity === "medium" ? "text-amber-400"
                          :                                "text-yellow-400"
                          : "text-muted"
                      }`} />
                    </div>
                    <p className={`text-xs flex-1 ${ signal.active ? "text-text-primary font-semibold" : "text-muted" }`}>
                      {signal.label}
                    </p>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                      signal.active
                        ? signal.severity === "high"   ? "bg-red-500/20 border-red-500/30 text-red-400"
                        : signal.severity === "medium" ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                        :                                "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                        : "bg-surface-elevated border-border-thin text-muted"
                    }`}>
                      {signal.active ? "ALERT" : "OK"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-1 border-t border-border-thin">
              <button
                onClick={() => { setAlertThresholdInput(alertThreshold.toString()); setShowAlertSettings(true); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border-thin bg-surface-elevated/40 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-all cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5" />
                Alert Settings
                {alertThreshold !== 10 && (
                  <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-primary/15 border border-primary/25 text-primary">{alertThreshold} USDC</span>
                )}
              </button>
              <button
                onClick={() => { fetchAgentState(); fetchOnChainState(); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border-thin bg-surface-elevated/40 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-all cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          </GlassCard>

          {/* Circle Integrations */}
          <GlassCard className="p-5 space-y-4 col-span-1 lg:col-span-2 order-10 lg:order-none" hover={false}>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-text-primary">Circle Integrations</h2>
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

          {/* ════ MULTI-CHAIN AUTO SWEEP ══════════════════════════════════════ */}
          <GlassCard className="p-5 space-y-5 col-span-1 lg:col-span-1 order-8 lg:order-none" hover={false}>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold text-text-primary">Multi-Chain Auto Sweep</h2>
              <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">LIVE</span>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Detects and sweeps incoming USDC from bridge contracts into the DAO treasury. Click below to trigger the agent sweep cycle now.
            </p>

            {/* Last sweep info */}
            {actions.find(a => a.action === "bridge_to_ethereum") ? (
              <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-1.5">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Last Sweep</p>
                <p className="text-xs text-text-secondary font-medium">
                  {actions.find(a => a.action === "bridge_to_ethereum")?.usdcAmount?.toFixed(2) ?? "—"} USDC bridged to Ethereum
                </p>
                <p className="text-[10px] text-muted font-mono">
                  {new Date(actions.find(a => a.action === "bridge_to_ethereum")?.timestamp || "").toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="p-3 bg-surface-elevated/40 border border-border-thin rounded-xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs text-text-secondary font-medium">No sweeps yet — agent monitoring bridge inflows</span>
              </div>
            )}

            {/* Visual chain map */}
            <div className="flex items-center justify-between gap-2 p-4 bg-surface-elevated/40 border border-border-thin rounded-2xl">
              {[
                { label: "Ethereum Sepolia", emoji: "🪙", color: "border-blue-500/30 bg-blue-500/10" },
                { label: "Arc Testnet",      emoji: "⚡", color: "border-primary/30 bg-primary/10" },
                { label: "DAO Treasury",     emoji: "🏛️",  color: "border-emerald-500/30 bg-emerald-500/10" },
              ].map((chain) => (
                <div key={chain.label} className="flex flex-col items-center gap-1.5">
                  <div className={`w-12 h-12 rounded-xl border ${chain.color} flex items-center justify-center text-xl`}>
                    {chain.emoji}
                  </div>
                  <span className="text-[10px] text-muted text-center font-medium">{chain.label}</span>
                </div>
              ))}
            </div>

            {/* Supported chains */}
            <div className="space-y-2">
              <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Chain Support</p>
              {[
                { name: "Arc Testnet",       status: "live" },
                { name: "Ethereum Sepolia",  status: "live" },
                { name: "Ethereum Mainnet",  status: "planned" },
                { name: "Base",              status: "planned" },
              ].map(c => (
                <div key={c.name} className="flex items-center justify-between text-xs py-1.5 border-b border-border-thin/50 last:border-0">
                  <span className="text-text-secondary font-medium">{c.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                    c.status === "live" ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400" : "bg-surface-elevated border-border-thin text-muted"
                  }`}>
                    {c.status === "live" ? "LIVE" : "PLANNED"}
                  </span>
                </div>
              ))}
            </div>

            <motion.button
              onClick={runAutoSweep}
              disabled={isSweepRunning || onChainPaused}
              whileHover={{ scale: (isSweepRunning || onChainPaused) ? 1 : 1.02 }}
              whileTap={{ scale: (isSweepRunning || onChainPaused) ? 1 : 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSweepRunning ? (
                <><span className="w-3.5 h-3.5 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />Running Sweep Cycle...</>
              ) : (
                <><Globe className="w-3.5 h-3.5" />Run Auto Sweep Now</>
              )}
            </motion.button>
          </GlassCard>

          {/* Agent Queued Withdrawals Section */}
          {pendingAgentWithdrawals.length > 0 && (
            <GlassCard className="p-5 border border-amber-500/20 bg-amber-500/[0.005] col-span-1 lg:col-span-3 order-12 lg:order-none">
              <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning" />
                Agent Pending Withdrawals (24h Timelocked)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-thin text-text-tertiary text-[10px] uppercase tracking-wider">
                      <th className="pb-3 font-bold pl-2">ID</th>
                      <th className="pb-3 font-bold">Recipient</th>
                      <th className="pb-3 font-bold">Amount</th>
                      <th className="pb-3 font-bold">Token</th>
                      <th className="pb-3 font-bold">Countdown</th>
                      <th className="pb-3 font-bold text-right pr-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-text-secondary">
                    {pendingAgentWithdrawals.map((q) => {
                      const diff = q.executionTime - currentTime;
                      const isReady = diff <= 0;
                      const timeLeftStr = isReady 
                        ? "Ready to Execute" 
                        : `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m ${diff % 60}s`;

                      const tokenSymbol = q.token.toLowerCase() === "0x3600000000000000000000000000000000000000" ? "USDC" : 
                                          q.token.toLowerCase() === "0x89b50855aa3be2f677cd6303cec089b5f319d72a" ? "EURC" : 
                                          q.token === "0x0000000000000000000000000000000000000000" ? "ARC" : "TOKEN";

                      return (
                        <tr key={q.id} className="border-b border-border-thin/50 hover:bg-surface-elevated/30 transition-colors">
                          <td className="py-3 pl-2 font-mono font-bold text-text-primary">#W-{q.id}</td>
                          <td className="py-3">
                            <span className="font-mono text-[10px] text-text-secondary bg-surface-elevated px-1.5 py-0.5 rounded border border-border-subtle" title={q.recipient}>
                              {q.recipient.slice(0, 6)}...{q.recipient.slice(-4)}
                            </span>
                          </td>
                          <td className="py-3 font-mono font-bold text-text-primary">
                            {q.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 font-medium text-text-secondary">{tokenSymbol}</td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              isReady 
                                ? "bg-success/15 text-success border border-success/20 animate-pulse" 
                                : "bg-warning/15 text-warning border border-warning/20"
                            }`}>
                              {timeLeftStr}
                            </span>
                          </td>
                          <td className="py-3 text-right pr-2 space-x-1.5">
                            <button
                              onClick={() => handleExecuteAgentWithdrawal(q.id)}
                              disabled={!isReady || executingWithdrawalId === q.id}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                isReady
                                  ? "bg-success text-black hover:bg-success/90 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                                  : "bg-surface-elevated text-text-tertiary border border-border-thin cursor-not-allowed"
                              }`}
                            >
                              {executingWithdrawalId === q.id ? "..." : "Execute"}
                            </button>
                            
                            <button
                              onClick={() => handleCancelAgentWithdrawal(q.id)}
                              disabled={cancelingWithdrawalId === q.id}
                              className="px-2 py-1 rounded text-[10px] font-bold bg-danger/10 border border-danger/25 text-danger hover:bg-danger/20 transition-all cursor-pointer"
                            >
                              {cancelingWithdrawalId === q.id ? "..." : "Cancel"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}

      </div>

      {/* Edit Limit Modal */}
      <AnimatePresence>
        {showLimitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-surface-elevated border border-border-thin p-6 rounded-2xl shadow-2xl relative"
            >
              <button 
                onClick={() => setShowLimitModal(false)}
                className="absolute top-4 right-4 text-muted hover:text-text-primary transition-colors cursor-pointer bg-transparent border-0 p-0"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Update Max Rebalance Limit
              </h3>
              <p className="text-xs text-muted mb-4">
                Set the maximum amount of USDC the agent is allowed to transfer per rebalance operation.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">New Limit (USDC)</label>
                  <input
                    type="number"
                    value={newLimitInput}
                    onChange={(e) => setNewLimitInput(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full bg-surface/50 border border-border-thin px-4 py-2.5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/50 font-mono font-bold"
                  />
                  {parseFloat(newLimitInput) > 50 && (
                    <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-400">
                        Warning: Limits above 50 USDC exceed recommended safety parameters. Large proposals will require a 66% community supermajority.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowLimitModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-transparent text-sm font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateLimit(parseFloat(newLimitInput))}
                    disabled={isSettingLimit || !newLimitInput || parseFloat(newLimitInput) <= 0}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-black hover:bg-primary-glow text-sm font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSettingLimit ? "Updating..." : "Save Limit"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Queue Withdrawal Modal */}
      <AnimatePresence>
        {showWithdrawalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-surface-elevated border border-border-thin p-6 rounded-2xl shadow-2xl relative"
            >
              <button 
                onClick={() => setShowWithdrawalModal(false)}
                className="absolute top-4 right-4 text-muted hover:text-text-primary transition-colors cursor-pointer bg-transparent border-0 p-0"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Queue Agent Withdrawal (Admin)
              </h3>
              <p className="text-xs text-muted mb-4">
                Queue a withdrawal from the Agent contract. Funds will be timelocked for 24 hours before they can be executed.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Asset Token</label>
                  <select
                    value={withdrawalToken}
                    onChange={(e) => setWithdrawalToken(e.target.value)}
                    className="w-full bg-surface/50 border border-border-thin px-4 py-2.5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/50"
                  >
                    <option value="0x3600000000000000000000000000000000000000">USDC (Stable)</option>
                    <option value="0x89b50855aa3be2f677cd6303cec089b5f319d72a">EURC (Stable)</option>
                    <option value="0x0000000000000000000000000000000000000000">ARC / Native ETH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Recipient Address</label>
                  <input
                    type="text"
                    value={withdrawalRecipient}
                    onChange={(e) => setWithdrawalRecipient(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-surface/50 border border-border-thin px-4 py-2.5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Amount</label>
                  <input
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-surface/50 border border-border-thin px-4 py-2.5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/50 font-mono"
                  />
                </div>

                <div className="p-3 bg-warning/5 border border-warning/20 rounded-xl flex items-start gap-2.5">
                  <Clock className="w-4.5 h-4.5 text-warning shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted leading-relaxed font-sans">
                    Once queued, this withdrawal cannot be bypassed or accelerated. A 24-hour public countdown will begin immediately on-chain.
                  </p>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowWithdrawalModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-transparent text-sm font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleQueueWithdrawal}
                    disabled={isQueueingWithdrawal || !withdrawalRecipient || !withdrawalAmount}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-black hover:bg-primary-glow text-sm font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isQueueingWithdrawal ? "Queueing..." : "Queue Withdrawal"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Auto Payments Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-surface-elevated border border-border-thin p-6 rounded-2xl shadow-2xl relative"
            >
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 text-muted hover:text-text-primary transition-colors cursor-pointer bg-transparent border-0 p-0"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-text-primary mb-1 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Schedule Auto Payment
              </h3>
              <p className="text-xs text-muted mb-5">Create a recurring USDC or EURC payment. Payments execute automatically when conditions are met.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Payment Label</label>
                  <input
                    type="text"
                    value={paymentForm.label}
                    onChange={e => setPaymentForm(f => ({ ...f, label: e.target.value }))}
                    placeholder="e.g. Creator Milestone #3"
                    className="w-full bg-surface/50 border border-border-thin px-4 py-2.5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Recipient Address</label>
                  <input
                    type="text"
                    value={paymentForm.recipient}
                    onChange={e => setPaymentForm(f => ({ ...f, recipient: e.target.value }))}
                    placeholder="0x..."
                    className="w-full bg-surface/50 border border-border-thin px-4 py-2.5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5">Amount</label>
                    <input
                      type="number"
                      value={paymentForm.amount}
                      onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full bg-surface/50 border border-border-thin px-4 py-2.5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5">Asset</label>
                    <select
                      value={paymentForm.asset}
                      onChange={e => setPaymentForm(f => ({ ...f, asset: e.target.value }))}
                      className="w-full bg-surface/50 border border-border-thin px-4 py-2.5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="USDC">USDC</option>
                      <option value="EURC">EURC</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Frequency</label>
                  <select
                    value={paymentForm.frequency}
                    onChange={e => setPaymentForm(f => ({ ...f, frequency: e.target.value }))}
                    className="w-full bg-surface/50 border border-border-thin px-4 py-2.5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="one-time">One-time</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>

                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted leading-relaxed">
                    Payments are queued on-chain and subject to the 24h timelock for security. The agent will execute automatically when the timelock expires.
                  </p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-transparent text-sm font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isSavingPayment || !paymentForm.recipient || !paymentForm.amount || !paymentForm.label}
                    onClick={() => {
                      if (!paymentForm.recipient || !paymentForm.amount || !paymentForm.label) return;
                      setIsSavingPayment(true);
                      setTimeout(() => {
                        const nextRunMap: Record<string, string> = { "weekly": "Jul 4, 2026", "monthly": "Jul 1, 2026", "quarterly": "Oct 1, 2026", "one-time": "Pending" };
                        setScheduledPayments(prev => [...prev, {
                          id: prev.length + 1,
                          label: paymentForm.label,
                          recipient: `${paymentForm.recipient.slice(0,6)}...${paymentForm.recipient.slice(-4)}`,
                          amount: parseFloat(paymentForm.amount),
                          asset: paymentForm.asset,
                          frequency: paymentForm.frequency,
                          status: "scheduled",
                          nextRun: nextRunMap[paymentForm.frequency] ?? "Pending",
                        }]);
                        setIsSavingPayment(false);
                        setShowPaymentModal(false);
                      }, 1000);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white-keep hover:bg-emerald-500 text-sm font-bold transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSavingPayment ? "Scheduling..." : "Schedule Payment"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Alert Settings Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAlertSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-surface-elevated border border-border-thin p-6 rounded-2xl shadow-2xl relative"
            >
              <button
                onClick={() => setShowAlertSettings(false)}
                className="absolute top-4 right-4 text-muted hover:text-text-primary transition-colors cursor-pointer bg-transparent border-0 p-0"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-text-primary mb-1 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-primary" />
                Risk Alert Settings
              </h3>
              <p className="text-xs text-muted mb-5">Configure thresholds for automated risk alerts. Settings are saved locally in your browser.</p>

              <div className="space-y-5">
                {/* Low Balance Threshold */}
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Low Balance Alert (USDC)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={alertThresholdInput}
                      onChange={e => setAlertThresholdInput(e.target.value)}
                      placeholder="e.g. 10"
                      className="flex-1 bg-surface/50 border border-border-thin px-4 py-2.5 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary/50 font-mono font-bold"
                    />
                    <span className="text-xs text-muted font-medium">USDC</span>
                  </div>
                  <p className="text-[10px] text-muted mt-1.5">
                    Alert fires when USDC balance drops below this amount. Currently: <span className="text-primary font-bold">{alertThreshold} USDC</span>
                  </p>
                </div>

                {/* Active Alert Rules */}
                <div className="space-y-2">
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Active Alert Rules</p>
                  {[
                    { label: "Low Liquidity Alert", desc: `USDC < ${alertThreshold} USDC` },
                    { label: "Agent Emergency Stop", desc: "Fires when agent is paused on-chain" },
                    { label: "Large Outflow Alert", desc: "Outflow > 80% of balance" },
                    { label: "Agent Inactivity Alert", desc: "No agent action in 6+ hours" },
                  ].map(rule => (
                    <div key={rule.label} className="flex items-start gap-3 p-2.5 rounded-xl border border-border-thin bg-surface-elevated/30">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-text-primary">{rule.label}</p>
                        <p className="text-[10px] text-muted">{rule.desc}</p>
                      </div>
                      <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">ON</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowAlertSettings(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-transparent text-sm font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveAlertThreshold}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-black hover:bg-primary-glow text-sm font-bold transition-all cursor-pointer"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Return Proposal Confirmation Modal */}
      <AnimatePresence>
        {showReturnModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-surface-elevated border border-border-thin p-6 rounded-2xl shadow-2xl relative"
            >
              <button
                onClick={() => setShowReturnModal(false)}
                className="absolute top-4 right-4 text-muted hover:text-text-primary transition-colors cursor-pointer bg-transparent border-0 p-0"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-blue-400" />
                Return Funds Proposal
              </h3>
              <p className="text-xs text-muted mb-4">
                This will submit an on-chain governance proposal to bridge USDC back from Ethereum Sepolia and deposit it to the main Treasury contract on Arc Testnet.
              </p>

              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-surface/50 border border-border-thin space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Return Amount</span>
                    <span className="text-text-primary font-bold font-mono">
                      {(agentState?.treasury?.sepoliaUsdc ?? 0).toFixed(2)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted">Source Wallet (Sepolia)</span>
                    <span className="text-text-secondary font-mono text-[10px] break-all text-right max-w-[200px]">
                      0x88BdF819466C1802ce6C780a9fbdF3A314cab07D
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted">Destination (Arc Testnet)</span>
                    <span className="text-text-secondary font-mono text-[10px] break-all text-right max-w-[200px]">
                      Main Treasury (0xFE0F6bF45D363d34CD5fC1781594a7471736dC18)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Voting Duration</span>
                    <span className="text-text-primary font-medium">5 minutes (300s)</span>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-400 leading-relaxed">
                  ⚠️ <strong>Security Note:</strong> Once created, the community must vote to pass the proposal. Upon success, the agent will autonomously trigger CCTP and complete the deposit securely.
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowReturnModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-transparent text-sm font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProposeReturn}
                    disabled={proposingReturn || (agentState?.treasury?.sepoliaUsdc ?? 0) <= 0}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 text-sm font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {proposingReturn ? "Submitting..." : "Submit Proposal"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
