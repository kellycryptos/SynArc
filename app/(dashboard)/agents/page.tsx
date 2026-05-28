"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { useToken } from "@/hooks/useToken";
import { 
  Bot, 
  Wallet, 
  ShieldCheck, 
  ExternalLink,
  Zap,
  Activity,
  Play,
  Pause,
  History,
  TrendingUp,
  BrainCircuit,
  Coins
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

interface AIAgent {
  id: string;
  name: string;
  avatar: string;
  address: string;
  model: string;
  status: "Active" | "Paused";
  proposalsAnalyzed: number;
  votesRecommended: number;
  accuracyRate: string;
  usdcBalance: string;
  sarcBalance: string;
  history: {
    proposalId: string;
    title: string;
    recommendation: "FOR" | "AGAINST" | "ABSTAIN";
    confidence: number;
    timestamp: string;
  }[];
}

export default function AgentsPage() {
  const { isAuthenticated, walletAddress, login } = useAuth();
  const { balance: walletUSDC } = useUSDCBalance();
  const { votingPower: walletSARC } = useToken(walletAddress);

  // Hardcoded premium list of registered SynArc AI agents
  const [agents, setAgents] = useState<AIAgent[]>([
    {
      id: "agent_gov",
      name: "SynArc Governance Agent",
      avatar: "🤖",
      address: "0x17D9d585CBB1AF6aa4a3C787116f7ba59651B702",
      model: "Llama 3.3 70B via Groq",
      status: "Active",
      proposalsAnalyzed: 142,
      votesRecommended: 89,
      accuracyRate: "94%",
      usdcBalance: "50.00",
      sarcBalance: "500.00",
      history: [
        {
          proposalId: "prop_1",
          title: "Allocate 20k USDC for Canteen Mobile Integration",
          recommendation: "FOR",
          confidence: 87,
          timestamp: "2026-05-28T04:12:00Z"
        },
        {
          proposalId: "prop_2",
          title: "Alter Quorum Parameter from 4% to 8%",
          recommendation: "AGAINST",
          confidence: 94,
          timestamp: "2026-05-27T18:30:00Z"
        },
        {
          proposalId: "prop_3",
          title: "Timelock Delay Extension to 14 Days",
          recommendation: "ABSTAIN",
          confidence: 65,
          timestamp: "2026-05-25T09:15:00Z"
        }
      ]
    },
    {
      id: "agent_allocation",
      name: "Ecosystem Allocation Agent",
      avatar: "📈",
      address: "0x8Ab21363cB0319548B051f129e477393908be7c1",
      model: "Llama 3.3 70B via Groq",
      status: "Paused",
      proposalsAnalyzed: 56,
      votesRecommended: 32,
      accuracyRate: "91%",
      usdcBalance: "1,250.00",
      sarcBalance: "0.00",
      history: [
        {
          proposalId: "prop_1",
          title: "Allocate 20k USDC for Canteen Mobile Integration",
          recommendation: "FOR",
          confidence: 90,
          timestamp: "2026-05-28T04:15:00Z"
        },
        {
          proposalId: "prop_3",
          title: "Timelock Delay Extension to 14 Days",
          recommendation: "FOR",
          confidence: 72,
          timestamp: "2026-05-25T09:20:00Z"
        }
      ]
    },
    {
      id: "agent_guardian",
      name: "Emergency Guardian Agent",
      avatar: "🛡️",
      address: "0x637cA7788aBC956832F389A7BB895D5249FE757B",
      model: "Llama 3 8B via Groq",
      status: "Active",
      proposalsAnalyzed: 18,
      votesRecommended: 4,
      accuracyRate: "98%",
      usdcBalance: "0.00",
      sarcBalance: "12,500.00",
      history: [
        {
          proposalId: "prop_2",
          title: "Alter Quorum Parameter from 4% to 8%",
          recommendation: "AGAINST",
          confidence: 98,
          timestamp: "2026-05-27T18:32:00Z"
        }
      ]
    }
  ]);

  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);

  // Toggle active status in state
  const handleToggleStatus = (id: string) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === id) {
        const newStatus = agent.status === "Active" ? "Paused" : "Active";
        return { ...agent, status: newStatus };
      }
      return agent;
    }));
  };

  const handleExpandHistory = (id: string) => {
    setExpandedAgentId(prev => prev === id ? null : id);
  };

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <BrainCircuit className="w-8 h-8 text-primary" />
              AI Agent Governance Console
            </h1>
            <p className="text-muted mt-1">
              Autonomous AI agents voting on proposals and analyzing on-chain risk metrics using Llama 3.3 models via Groq.
            </p>
          </div>
          
          {/* User balance displays */}
          <div className="flex items-center gap-4">
            <div className="bg-surface-elevated border border-border-thin px-4 py-2 rounded-xl flex items-center gap-3 shadow-md shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Your Balance</div>
                <div className="text-sm font-bold font-mono text-white">
                  {walletUSDC ? parseFloat(walletUSDC).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"} USDC
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Agent Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <GlassCard className="p-5 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Active AI Agents</p>
            <h3 className="text-2xl font-extrabold text-white mt-2 font-mono">
              {agents.filter(a => a.status === "Active").length} / {agents.length}
            </h3>
            <p className="text-[11px] text-muted mt-1">Running on Llama models</p>
          </GlassCard>

          <GlassCard className="p-5 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-success/5 rounded-full blur-2xl group-hover:bg-success/10 transition-colors" />
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Total Proposals Analyzed</p>
            <h3 className="text-2xl font-extrabold text-white mt-2 font-mono">
              {agents.reduce((acc, curr) => acc + curr.proposalsAnalyzed, 0)}
            </h3>
            <p className="text-[11px] text-muted mt-1">On-chain risk scans executed</p>
          </GlassCard>

          <GlassCard className="p-5 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-glow/5 rounded-full blur-2xl group-hover:bg-blue-glow/10 transition-colors" />
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Votes Recommended</p>
            <h3 className="text-2xl font-extrabold text-white mt-2 font-mono">
              {agents.reduce((acc, curr) => acc + curr.votesRecommended, 0)}
            </h3>
            <p className="text-[11px] text-muted mt-1">Automated decisions cast</p>
          </GlassCard>

          <GlassCard className="p-5 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-glow/5 rounded-full blur-2xl group-hover:bg-purple-glow/10 transition-colors" />
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Avg Recommendation Accuracy</p>
            <h3 className="text-2xl font-extrabold text-success mt-2 font-mono">
              94.3%
            </h3>
            <p className="text-[11px] text-success/95 mt-1">DAO consensus alignment rate</p>
          </GlassCard>
        </div>

        {/* AI Agents List Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary animate-pulse" />
            Registered Governance Agents
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <GlassCard key={agent.id} hover={false} className="p-6 flex flex-col justify-between border border-border-thin relative overflow-hidden">
                <div className="space-y-5">
                  
                  {/* Card Header */}
                  <div className="flex items-start justify-between border-b border-border-thin pb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl select-none" role="img" aria-label="avatar">{agent.avatar}</span>
                      <div>
                        <h4 className="font-bold text-white text-sm">{agent.name}</h4>
                        <span className="text-[10px] text-text-tertiary font-mono block tracking-tight">
                          {agent.address.slice(0, 8)}...{agent.address.slice(-8)}
                        </span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold border transition-colors uppercase tracking-wider ${
                      agent.status === "Active"
                        ? "bg-success/15 border-success/30 text-success"
                        : "bg-surface-elevated border-border-thin text-text-tertiary"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${agent.status === "Active" ? "bg-success animate-pulse" : "bg-text-tertiary"}`} />
                      {agent.status}
                    </span>
                  </div>

                  {/* Agent Model & System Stats */}
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center bg-surface-elevated/40 border border-border-thin rounded-xl p-2.5">
                      <span className="text-text-tertiary">Model Framework</span>
                      <span className="font-semibold text-white font-mono text-[10px]">{agent.model}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-text-tertiary block">Proposals Scanned</span>
                        <span className="font-bold text-white font-mono text-sm">{agent.proposalsAnalyzed}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-text-tertiary block">Votes Cast</span>
                        <span className="font-bold text-white font-mono text-sm">{agent.votesRecommended}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-text-tertiary block">Consensus Score</span>
                        <span className="font-bold text-success font-mono text-sm">{agent.accuracyRate}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-text-tertiary block">USDC Balance</span>
                        <span className="font-bold text-white font-mono text-sm">{agent.usdcBalance}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-border-thin pt-3.5 mt-1 text-[11px]">
                      <span className="text-text-tertiary flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-muted" />
                        sARC Governance Power
                      </span>
                      <span className="font-mono text-primary font-bold">{agent.sarcBalance} sARC</span>
                    </div>
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="space-y-3 pt-5 mt-5 border-t border-border-thin shrink-0">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleToggleStatus(agent.id)}
                      className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                        agent.status === "Active"
                          ? "bg-danger/10 border-danger/20 text-danger hover:bg-danger/15"
                          : "bg-success/10 border-success/20 text-success hover:bg-success/15"
                      }`}
                    >
                      {agent.status === "Active" ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          Pause Agent
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Resume Agent
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleExpandHistory(agent.id)}
                      className="flex-1 py-2.5 bg-surface-elevated hover:bg-surface-elevated/70 border border-border-thin text-text-secondary hover:text-white rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      View History
                    </button>
                  </div>

                  {/* Expand History Panel */}
                  <AnimatePresence>
                    {expandedAgentId === agent.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden space-y-2 pt-2"
                      >
                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Decision Logs</span>
                        <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                          {agent.history.map((log, index) => (
                            <div key={index} className="p-2.5 bg-surface border border-border-thin rounded-xl text-[10px] space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-white truncate max-w-[150px]">{log.title}</span>
                                <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold border ${
                                  log.recommendation === "FOR" ? "bg-success/10 border-success/20 text-success" :
                                  log.recommendation === "AGAINST" ? "bg-danger/10 border-danger/20 text-danger" :
                                  "bg-surface-elevated border-border-thin text-text-primary"
                                }`}>
                                  {log.recommendation}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-text-tertiary text-[9px]">
                                <span>Confidence: {log.confidence}%</span>
                                <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
