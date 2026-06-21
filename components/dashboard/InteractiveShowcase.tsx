"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, Award, CheckCircle2, Lock, Vote, 
  Terminal, DollarSign, Users, ChevronRight, ArrowRight, Loader2
} from "lucide-react";

type TabId = "nanopayments" | "escrows" | "governance" | "copilot";

interface StreamState {
  id: string;
  name: string;
  avatar: string;
  ratePerMin: number;
  accumulated: number;
  active: boolean;
}

export function InteractiveShowcase() {
  const [activeTab, setActiveTab] = useState<TabId>("nanopayments");
  
  // 1. Nanopayments Stream State
  const [streams, setStreams] = useState<StreamState[]>([
    { id: "1", name: "Alice.eth", avatar: "🎨", ratePerMin: 0.06, accumulated: 0.1524, active: true },
    { id: "2", name: "Bob.eth", avatar: "🎮", ratePerMin: 0.015, accumulated: 14.4023, active: true },
    { id: "3", name: "Charlie.eth", avatar: "✔️", ratePerMin: 0.12, accumulated: 3.8451, active: false }
  ]);

  // Tick the streams up every 100ms
  useEffect(() => {
    const timer = setInterval(() => {
      setStreams(prev => 
        prev.map(s => {
          if (!s.active) return s;
          const ratePerSec = s.ratePerMin / 60;
          return {
            ...s,
            accumulated: s.accumulated + (ratePerSec * 0.1)
          };
        })
      );
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const toggleStream = (id: string) => {
    setStreams(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  // 2. Escrows State
  const [escrowStep, setEscrowStep] = useState<number>(2); // 1 = Released, 2 = Voting, 3 = Locked
  const [escrowVotes, setEscrowVotes] = useState({ yes: 84, no: 16 });
  const [userVotedEscrow, setUserVotedEscrow] = useState(false);

  const voteEscrow = (type: "yes" | "no") => {
    if (userVotedEscrow) return;
    setEscrowVotes(prev => {
      if (type === "yes") {
        return { yes: prev.yes + 1, no: prev.no };
      } else {
        return { yes: prev.yes, no: prev.no + 1 };
      }
    });
    setUserVotedEscrow(true);
  };

  // 3. Governance Vote State
  const [govVotes, setGovVotes] = useState({ yes: 624500, no: 176000 });
  const [userVotedGov, setUserVotedGov] = useState<"yes" | "no" | null>(null);

  const voteGov = (voteType: "yes" | "no") => {
    if (userVotedGov) return;
    setGovVotes(prev => ({
      yes: voteType === "yes" ? prev.yes + 50000 : prev.yes,
      no: voteType === "no" ? prev.no + 50000 : prev.no
    }));
    setUserVotedGov(voteType);
  };

  // 4. Copilot Logs State
  const [logs, setLogs] = useState<string[]>([
    "🚀 Initializing SynArc Autonomous Copilot...",
    "🔑 Loaded signer address: 0x8b3f...e4d2",
    "🔍 Scanning active proposals for alignment scores...",
    "🎯 Found proposal SAP-04. Analysis initiated."
  ]);
  const logTerminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab !== "copilot") return;
    
    const additionalLogs = [
      "📝 NLP Analysis complete: Circle CCTP bridge meets risk criteria.",
      "⚖️ Alignment score calculated: 94/100 (Strongly aligned).",
      "✔️ Signing transaction payload dynamically...",
      "📡 Broadcasting on-chain signature payload...",
      "🗳️ Vote cast: FOR on proposal SAP-04 (Tx: 0xdf84...c391).",
      "💸 Sweep trigger: 142.50 USDC reward routed to DAO treasury.",
      "💤 Sleeping until next block epoch..."
    ];

    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < additionalLogs.length) {
        setLogs(prev => [...prev, additionalLogs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Tab Details
  const tabs = [
    { id: "nanopayments", label: "⚡ USDC Streams", icon: DollarSign },
    { id: "escrows", label: "🏢 Milestone Escrow", icon: Award },
    { id: "governance", label: "🗳️ Governance", icon: Vote },
    { id: "copilot", label: "🤖 AI Copilot", icon: Terminal }
  ];

  return (
    <div className="w-full flex flex-col md:flex-row rounded-2xl border border-border bg-surface overflow-hidden shadow-md">
      {/* Sidebar Navigation inside the showcase */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-surface-elevated/20 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible shrink-0">
        <div className="hidden md:block pb-4 mb-2 border-b border-border-thin text-left">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">Interactive Demo</p>
          <p className="text-xs text-text-secondary px-2 mt-1">Try SynArc features live</p>
        </div>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                isActive 
                  ? "bg-accent-purple text-white shadow-sm animate-fade-in-up" 
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated/40"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 sm:p-8 bg-surface-elevated/10 min-h-[360px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col justify-between"
          >
            {/* 1. Nanopayments View */}
            {activeTab === "nanopayments" && (
              <div className="space-y-6">
                <div className="space-y-1 text-left">
                  <h4 className="text-lg font-bold text-text-primary">Real-time USDC Streams</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Creators receive sub-penny micropayments directly to their wallets every second, avoiding high batch payout fees.
                  </p>
                </div>

                <div className="space-y-3">
                  {streams.map(s => (
                    <div 
                      key={s.id} 
                      className="flex items-center justify-between p-4 rounded-xl border border-border-thin bg-surface/50 hover:border-accent-purple/20 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border-thin flex items-center justify-center text-lg select-none">
                          {s.avatar}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-text-primary">{s.name}</p>
                          <p className="text-[10px] text-text-muted font-mono">{s.ratePerMin} USDC / min</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-bold font-mono text-success">
                            ${s.accumulated.toFixed(6)}
                          </p>
                          <span className="text-[9px] text-text-muted font-mono uppercase tracking-wider block">Accumulated</span>
                        </div>

                        <button 
                          onClick={() => toggleStream(s.id)}
                          className={`p-2 rounded-lg border border-border-thin transition-colors cursor-pointer ${
                            s.active 
                              ? "bg-danger/10 text-danger hover:bg-danger/20 border-danger/25" 
                              : "bg-success/10 text-success hover:bg-success/20 border-success/25"
                          }`}
                          title={s.active ? "Pause Stream" : "Resume Stream"}
                        >
                          {s.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Escrows View */}
            {activeTab === "escrows" && (
              <div className="space-y-6">
                <div className="space-y-1 text-left">
                  <h4 className="text-lg font-bold text-text-primary">Milestone Escrow Tracks</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Protect backers by locking campaign funds in smart contracts. Funds release automatically upon community milestone approval.
                  </p>
                </div>

                <div className="relative pl-6 border-l border-border space-y-4">
                  {/* Step 1 */}
                  <div className="relative text-left">
                    <div className="absolute -left-[30px] top-0 w-4 h-4 rounded-full bg-success flex items-center justify-center text-[8px] text-white">✓</div>
                    <div>
                      <span className="text-[10px] font-bold text-success uppercase tracking-wider">Milestone 1 · Released</span>
                      <h5 className="text-xs font-bold text-text-primary mt-0.5">Deploy Smart Contracts &amp; SDK Core (1,500 USDC)</h5>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative text-left">
                    <div className="absolute -left-[30px] top-0 w-4 h-4 rounded-full bg-accent-purple flex items-center justify-center text-[8px] text-white animate-pulse" />
                    <div className="space-y-2 bg-surface/50 border border-border-thin rounded-xl p-4 mt-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-accent-purple uppercase tracking-wider">Milestone 2 · Active Vote</span>
                          <h5 className="text-xs font-bold text-text-primary mt-0.5">Integrate Web App Wallet Guard (2,500 USDC)</h5>
                        </div>
                        <span className="text-[10px] font-bold text-muted bg-surface border border-border-thin px-2 py-0.5 rounded">
                          Ends in 2 days
                        </span>
                      </div>

                      {/* Vote Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-text-muted">
                          <span>Yes ({escrowVotes.yes}%)</span>
                          <span>No ({escrowVotes.no}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden flex">
                          <div className="h-full bg-success transition-all duration-500" style={{ width: `${escrowVotes.yes}%` }} />
                          <div className="h-full bg-danger transition-all duration-500" style={{ width: `${escrowVotes.no}%` }} />
                        </div>
                      </div>

                      {/* Voting Buttons */}
                      <div className="flex gap-2 pt-1">
                        <button
                          disabled={userVotedEscrow}
                          onClick={() => voteEscrow("yes")}
                          className="flex-1 py-1.5 px-3 rounded-lg border border-success/30 hover:bg-success/10 text-success text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                        >
                          Approve Milestone
                        </button>
                        <button
                          disabled={userVotedEscrow}
                          onClick={() => voteEscrow("no")}
                          className="flex-1 py-1.5 px-3 rounded-lg border border-danger/30 hover:bg-danger/10 text-danger text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                        >
                          Reject Milestone
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative text-left opacity-60">
                    <div className="absolute -left-[30px] top-0 w-4 h-4 rounded-full bg-surface border border-border flex items-center justify-center text-[8px] text-muted"><Lock className="w-2.5 h-2.5" /></div>
                    <div className="pt-0.5">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Milestone 3 · Locked</span>
                      <h5 className="text-xs font-bold text-text-primary mt-0.5">Cross-chain bridge deployment (3,000 USDC)</h5>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Governance View */}
            {activeTab === "governance" && (
              <div className="space-y-6">
                <div className="space-y-1 text-left">
                  <h4 className="text-lg font-bold text-text-primary">Confidential Ballots</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Cast cryptographic votes for creator proposals. Balances are tallied securely using zero-knowledge identity parameters.
                  </p>
                </div>

                <div className="bg-surface/50 border border-border-thin rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="text-left space-y-1">
                      <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-accent-purple/10 border border-accent-purple/20 text-accent-purple">Active Proposal</span>
                      <h5 className="text-sm font-bold text-text-primary">SAP-04: Allocate 15k USDC for Developer SDK Audit</h5>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold text-warning rounded-full bg-warning/10 border border-warning/20">
                      Voting Live
                    </span>
                  </div>

                  {/* Vote stats */}
                  <div className="grid grid-cols-2 gap-4 bg-surface border border-border-thin rounded-xl p-3 text-left">
                    <div>
                      <span className="text-[10px] text-text-muted block">For (Yes)</span>
                      <span className="text-sm font-extrabold font-heading text-success">
                        {govVotes.yes.toLocaleString()} sARC
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block">Against (No)</span>
                      <span className="text-sm font-extrabold font-heading text-danger">
                        {govVotes.no.toLocaleString()} sARC
                      </span>
                    </div>
                  </div>

                  {/* Vote slider representation */}
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-surface rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-success transition-all duration-700" 
                        style={{ width: `${(govVotes.yes / (govVotes.yes + govVotes.no)) * 100}%` }} 
                      />
                      <div 
                        className="h-full bg-danger transition-all duration-700" 
                        style={{ width: `${(govVotes.no / (govVotes.yes + govVotes.no)) * 100}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-text-muted font-semibold">
                      <span>{((govVotes.yes / (govVotes.yes + govVotes.no)) * 100).toFixed(1)}% Yes</span>
                      <span>{((govVotes.no / (govVotes.yes + govVotes.no)) * 100).toFixed(1)}% No</span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      disabled={!!userVotedGov}
                      onClick={() => voteGov("yes")}
                      className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        userVotedGov === "yes" 
                          ? "bg-success text-white border border-success" 
                          : userVotedGov === "no"
                            ? "bg-surface-elevated text-text-muted border border-border-thin opacity-50 cursor-not-allowed"
                            : "bg-success/10 text-success border border-success/35 hover:bg-success/20"
                      }`}
                    >
                      {userVotedGov === "yes" && <CheckCircle2 className="w-3.5 h-3.5" />}
                      Vote FOR
                    </button>
                    <button
                      disabled={!!userVotedGov}
                      onClick={() => voteGov("no")}
                      className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        userVotedGov === "no" 
                          ? "bg-danger text-white border border-danger" 
                          : userVotedGov === "yes"
                            ? "bg-surface-elevated text-text-muted border border-border-thin opacity-50 cursor-not-allowed"
                            : "bg-danger/10 text-danger border border-danger/35 hover:bg-danger/20"
                      }`}
                    >
                      {userVotedGov === "no" && <CheckCircle2 className="w-3.5 h-3.5" />}
                      Vote AGAINST
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Copilot logs View */}
            {activeTab === "copilot" && (
              <div className="space-y-6">
                <div className="space-y-1 text-left">
                  <h4 className="text-lg font-bold text-text-primary">AI Copilot Autonomous Guard</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    AI agents co-pilot voting workflows: reading proposals, checking risk alignments, and signing transactions securely.
                  </p>
                </div>

                <div 
                  ref={logTerminalRef}
                  className="bg-black/90 font-mono text-[10px] leading-relaxed p-4 rounded-xl border border-border h-48 overflow-y-auto space-y-2 text-left"
                >
                  {logs.map((log, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-accent-purple select-none">&rarr;</span>
                      <span className={log.includes("success") || log.includes("complete") || log.includes("Cast") || log.includes("Signing") ? "text-success" : log.includes("🚀") || log.includes("🔍") || log.includes("🎯") || log.includes("Loaded") ? "text-cyan-400" : "text-white/80"}>
                        {log}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 text-text-muted">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-purple" />
                    <span className="text-white/60">Monitoring transactions...</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer actions inside the widget */}
        <div className="pt-4 border-t border-border-thin flex justify-between items-center text-[10px] text-text-muted">
          <span>Simulation Active</span>
          <span className="font-mono text-accent-purple font-bold">@synarc/sdk-demo</span>
        </div>
      </div>
    </div>
  );
}
