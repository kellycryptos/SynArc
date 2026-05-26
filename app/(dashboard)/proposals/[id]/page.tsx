"use client";

import { useState, useEffect, useMemo, use } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { useAuth } from "@/hooks/auth/useAuth";
import { useBalance, useSignMessage } from "wagmi";
import { formatUnits } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallets } from "@privy-io/react-auth";
import { BrowserProvider } from "ethers";
import { 
  FileText, 
  ThumbsUp, 
  ThumbsDown, 
  CircleDot, 
  Check, 
  Lock, 
  X, 
  ShieldCheck, 
  Coins, 
  PenTool, 
  Sparkles, 
  AlertCircle,
  ArrowLeft,
  Calendar,
  Play
} from "lucide-react";

export default function ProposalDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { isAuthenticated, walletAddress, login } = useAuth();
  const { wallets } = useWallets();
  const { signMessageAsync } = useSignMessage();

  const { proposals, initialized, initializeStore, userVotes, castVote, executeProposal } = useGovernanceStore();
  const proposal = proposals.find(p => p.id === unwrappedParams.id);
  
  useEffect(() => {
    if (!initialized) initializeStore();
  }, [initialized, initializeStore]);

  // Handle redirect if not found
  useEffect(() => {
    if (initialized && !proposal) {
      router.push("/proposals");
    }
  }, [initialized, proposal, router]);

  // Voting Power Hook
  const { data: balanceData } = useBalance({
    address: walletAddress ? (walletAddress as `0x${string}`) : undefined,
  });

  const activeBalance = useMemo(() => {
    if (typeof window !== "undefined" && walletAddress) {
      const savedBalance = localStorage.getItem(`synarc_balance_override_${walletAddress}`);
      if (savedBalance) return parseFloat(savedBalance);
    }
    return balanceData ? parseFloat(formatUnits(balanceData.value, balanceData.decimals)) : 1500.0;
  }, [walletAddress, balanceData]);

  // Modal and signing UI states
  const [selectedOption, setSelectedOption] = useState<"For" | "Against" | "Abstain" | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signingStep, setSigningStep] = useState<"idle" | "requesting" | "submitting" | "completed" | "error">("idle");
  const [generatedSignature, setGeneratedSignature] = useState<string>("");

  if (!proposal) return <div className="pt-24 min-h-screen flex items-center justify-center text-text-tertiary">Loading...</div>;

  const totalVotes = proposal.totalVotes;
  const forPercentage = totalVotes > 0 ? (proposal.forVotes / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (proposal.againstVotes / totalVotes) * 100 : 0;
  const abstainPercentage = totalVotes > 0 ? (proposal.abstainVotes / totalVotes) * 100 : 0;
  const userVoteRecord = userVotes[proposal.id];
  const isProposalActive = proposal.status === "Active";
  const isProposalPassed = (proposal.status !== "Active" && proposal.status !== "Pending" && proposal.status !== "Executed" && proposal.forVotes > proposal.againstVotes);

  // Handle Triggering a Vote
  const handleVoteClick = (option: "For" | "Against" | "Abstain") => {
    if (!isAuthenticated) {
      login();
      return;
    }
    if (userVoteRecord) return;

    setSelectedOption(option);
    setSigningStep("idle");
    setGeneratedSignature("");
  };

  const handleSignAndSubmit = async () => {
    if (!selectedOption || !walletAddress) return;

    setIsSigning(true);
    setSigningStep("requesting");

    try {
      const timestamp = new Date().toISOString();
      const message = `SynArc DAO Governance Vote
---------------------------
Proposal ID: ${proposal.id}
Proposal Title: ${proposal.title}
Choice: ${selectedOption}
Voting Weight: ${activeBalance.toFixed(2)} USDC
Voter Address: ${walletAddress}
Timestamp: ${timestamp}`;

      const privy = wallets.find(w => w.walletClientType === "privy");
      if (!privy) {
        throw new Error("Privy wallet not found");
      }

      // Force Arc Testnet before transaction
      const currentChainId = parseInt(privy.chainId.replace("eip155:", ""));
      if (currentChainId !== 5042002) {
        await privy.switchChain(5042002);
      }

      const ethereumProvider = await privy.getEthereumProvider();
      const browserProvider = new BrowserProvider(ethereumProvider);
      const signer = await browserProvider.getSigner();

      const signature = await signMessageAsync({ message });
      setSigningStep("submitting");

      await castVote(proposal.id, selectedOption, activeBalance, signature, signer);

      setGeneratedSignature(signature);
      setSigningStep("completed");
    } catch (err) {
      console.error("Cryptographic signing rejected", err);
      setSigningStep("error");
    } finally {
      setIsSigning(false);
    }
  };

  const handleCloseModal = () => {
    if (isSigning) return;
    setSelectedOption(null);
    setSigningStep("idle");
    setGeneratedSignature("");
  };

  const handleExecute = async () => {
    try {
      const privy = wallets.find(w => w.walletClientType === "privy");
      if (!privy) {
        throw new Error("Privy wallet not found");
      }

      // Force Arc Testnet before transaction
      const currentChainId = parseInt(privy.chainId.replace("eip155:", ""));
      if (currentChainId !== 5042002) {
        await privy.switchChain(5042002);
      }

      const ethereumProvider = await privy.getEthereumProvider();
      const browserProvider = new BrowserProvider(ethereumProvider);
      const signer = await browserProvider.getSigner();

      await executeProposal(proposal.id, signer);
    } catch (err) {
      console.error("Proposal execution failed", err);
    }
  };

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link href="/proposals" className="inline-flex items-center gap-2 text-text-tertiary hover:text-primary transition-colors text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" />
            Back to Proposals
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-mono text-text-tertiary bg-surface-elevated px-2 py-0.5 rounded border border-border-subtle">{proposal.id}</span>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                  proposal.status === 'Active' ? 'bg-success/10 border-success/20 text-success' :
                  proposal.status === 'Executed' ? 'bg-primary/10 border-primary/20 text-primary-glow text-purple-400' :
                  'bg-surface-elevated border-border-thin text-muted'
                }`}>
                  {proposal.status}
                </span>
                <span className="text-xs text-text-secondary font-bold bg-surface-elevated border border-border-thin px-2.5 py-1 rounded-full">
                  {proposal.category}
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">{proposal.title}</h1>
            </div>
            
            {/* Execute Button if conditions met (simulation) */}
            {(isProposalPassed || proposal.status === "Active") && !isProposalActive && proposal.status !== "Executed" && (
              <button 
                onClick={handleExecute}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-success text-black font-bold text-sm hover:bg-success/90 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] shrink-0 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                Execute Proposal
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <GlassCard className="p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-wider mb-4">Description</h3>
                <div className="prose prose-invert prose-p:text-text-secondary prose-p:leading-relaxed prose-headings:text-text-primary prose-a:text-primary max-w-none">
                  {proposal.description.split('\n\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>

              {/* Execution Details if applicable */}
              {proposal.executionTarget && proposal.executionTarget !== "0x0000000000000000000000000000000000000000" && (
                <div className="pt-6 border-t border-border-subtle">
                  <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-wider mb-4">Execution Details</h3>
                  <div className="bg-background border border-border-thin rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary">Target Contract</span>
                      <span className="font-mono text-primary text-xs bg-primary/10 px-2 py-1 rounded">{proposal.executionTarget}</span>
                    </div>
                    {proposal.treasuryImpactValue !== 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-secondary">Treasury Impact</span>
                        <span className={`font-semibold ${proposal.treasuryImpactValue < 0 ? 'text-danger' : 'text-success'}`}>
                          {proposal.treasuryImpact}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-text-primary">Timeline</h3>
              <div className="space-y-0 pl-3">
                {proposal.timeline.map((event, i) => (
                  <div key={i} className="relative pb-6 last:pb-0">
                    <div className="absolute left-[-5px] top-1.5 w-3 h-3 rounded-full bg-primary z-10 shadow-[0_0_8px_rgba(124,58,237,0.8)]" />
                    {i !== proposal.timeline.length - 1 && (
                      <div className="absolute left-[0.5px] top-3 bottom-0 w-[1px] bg-border-thin" />
                    )}
                    <div className="pl-6">
                      <div className="text-sm font-bold text-text-primary">{event.title}</div>
                      <div className="text-xs text-text-tertiary flex items-center gap-2 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(event.timestamp).toLocaleString()}
                        {event.txHash && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-primary/70">{event.txHash}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Voting & Metrics */}
          <div className="space-y-6">
            <GlassCard className="p-6 relative overflow-hidden">
              {isProposalActive && (
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
              )}
              
              <h3 className="text-lg font-bold text-text-primary mb-6">Voting</h3>
              
              <div className="space-y-5">
                {/* For Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-success flex items-center gap-1">For</span>
                    <span className="text-text-primary">{(proposal.forVotes / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k VP ({forPercentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-surface-elevated border border-border-subtle h-2 rounded-full overflow-hidden">
                    <div className="bg-success h-full transition-all duration-500" style={{ width: `${forPercentage}%` }} />
                  </div>
                </div>

                {/* Against Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-danger flex items-center gap-1">Against</span>
                    <span className="text-text-primary">{(proposal.againstVotes / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k VP ({againstPercentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-surface-elevated border border-border-subtle h-2 rounded-full overflow-hidden">
                    <div className="bg-danger h-full transition-all duration-500" style={{ width: `${againstPercentage}%` }} />
                  </div>
                </div>

                {/* Abstain Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-muted flex items-center gap-1">Abstain</span>
                    <span className="text-text-primary">{(proposal.abstainVotes / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k VP ({abstainPercentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-surface-elevated border border-border-subtle h-2 rounded-full overflow-hidden">
                    <div className="bg-muted h-full transition-all duration-500" style={{ width: `${abstainPercentage}%` }} />
                  </div>
                </div>
              </div>

              {/* Voting Action Area */}
              <div className="mt-8 pt-6 border-t border-border-subtle">
                {isProposalActive ? (
                  userVoteRecord ? (
                    <div className="w-full py-3 rounded-xl bg-surface border border-emerald-500/25 flex flex-col items-center justify-center gap-1">
                      <div className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Cast Complete
                      </div>
                      <span className="text-xs text-text-tertiary">Voted {userVoteRecord.option} with {userVoteRecord.vp.toLocaleString()} VP</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleVoteClick("For")}
                        className="py-3 rounded-xl border border-border-thin bg-surface hover:bg-success/10 hover:border-success/30 hover:text-success text-sm font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        For
                      </button>
                      <button
                        onClick={() => handleVoteClick("Against")}
                        className="py-3 rounded-xl border border-border-thin bg-surface hover:bg-danger/10 hover:border-danger/30 hover:text-danger text-sm font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Against
                      </button>
                      <button
                        onClick={() => handleVoteClick("Abstain")}
                        className="py-3 rounded-xl border border-border-thin bg-surface hover:bg-surface-elevated hover:text-foreground text-sm font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer"
                      >
                        <CircleDot className="w-4 h-4" />
                        Abstain
                      </button>
                    </div>
                  )
                ) : (
                  <button className="w-full py-3 rounded-xl bg-surface border border-border-thin text-text-tertiary text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                    Voting Terminated
                  </button>
                )}
              </div>
            </GlassCard>

            <GlassCard className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Proposer</span>
                  <Link href={`https://testnet.arcscan.app/address/${proposal.proposer}`} target="_blank" className="text-primary hover:underline font-mono">
                    {proposal.proposer.slice(0,6)}...{proposal.proposer.slice(-4)}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Start Date</span>
                  <span className="text-text-primary">{new Date(proposal.votingStarts).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">End Date</span>
                  <span className="text-text-primary">{new Date(proposal.votingEnds).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Total VP</span>
                  <span className="text-text-primary font-mono">{totalVotes.toLocaleString()}</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Floating Premium Modal (Signing & Authorization) */}
      <AnimatePresence>
        {selectedOption && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 w-full max-w-lg glass-elevated rounded-3xl border border-border-thin p-6 md:p-8 flex flex-col gap-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-border-subtle">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 border border-primary/20 text-purple-400">
                    <Sparkles className="w-3 h-3" />
                    Off-chain Gasless Voting
                  </div>
                  <h3 className="text-xl font-bold font-heading text-white">Authorize Governance Vote</h3>
                </div>
                <button onClick={handleCloseModal} disabled={isSigning} className="p-1.5 rounded-xl hover:bg-surface-elevated text-text-tertiary hover:text-foreground transition-all cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Vote Details Summary */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Active Governance Proposal</span>
                  <div className="p-4 bg-surface rounded-2xl border border-border-thin font-medium text-text-primary text-sm">
                    {proposal.title}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Selected Choice</span>
                    <div className={`p-3.5 rounded-2xl border font-bold text-center text-sm flex items-center justify-center gap-2
                      ${selectedOption === "For" ? "bg-success/10 border-success/30 text-success" :
                        selectedOption === "Against" ? "bg-danger/10 border-danger/30 text-danger" :
                        "bg-surface-elevated border-border-thin text-text-primary"
                      }`}>
                      {selectedOption === "For" ? <ThumbsUp className="w-4 h-4" /> :
                        selectedOption === "Against" ? <ThumbsDown className="w-4 h-4" /> :
                        <CircleDot className="w-4 h-4" />
                      }
                      Vote {selectedOption}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Voting Weight (VP)</span>
                    <div className="p-3.5 bg-surface-elevated border border-border-thin rounded-2xl font-bold text-center text-sm text-primary flex items-center justify-center gap-1.5">
                      <Coins className="w-4 h-4 text-primary" />
                      {activeBalance.toLocaleString()} VP
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-1">
                    <Lock className="w-3 h-3 text-purple-400" />
                    Cryptographic Payload to Sign
                  </span>
                  <div className="p-4 bg-background font-mono text-[10px] text-text-secondary border border-border-subtle rounded-2xl select-none leading-relaxed whitespace-pre overflow-x-auto">
{`SynArc Governance Signature Request
---------------------------------------
Voter: ${walletAddress?.substring(0, 16)}...
Weight: ${activeBalance.toLocaleString()} USDC
Proposal ID: ${proposal.id}
Choice: ${selectedOption}
Timestamp: ${new Date().toLocaleTimeString()}
---------------------------------------
Payload verified by Arc Security layers.`}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-3 border-t border-border-subtle">
                {signingStep === "requesting" && (
                  <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3 text-xs text-purple-300 animate-pulse">
                    <PenTool className="w-4 h-4 animate-spin text-purple-400" />
                    Awaiting signature confirmation from secure Privy credentials...
                  </div>
                )}
                {signingStep === "submitting" && (
                  <div className="p-3.5 bg-cyan-soft/10 border border-cyan-soft/20 rounded-2xl flex items-center gap-3 text-xs text-cyan-300">
                    <ShieldCheck className="w-4 h-4 animate-pulse text-cyan-soft" />
                    Broadcasting signed voting weight to Arc Testnet validators...
                  </div>
                )}
                {signingStep === "error" && (
                  <div className="p-3.5 bg-danger/10 border border-danger/20 rounded-2xl flex items-center gap-3 text-xs text-danger">
                    <AlertCircle className="w-4 h-4 text-danger" />
                    Signature rejected or wallet connection lost. Please try again.
                  </div>
                )}
                {signingStep === "completed" && (
                  <div className="space-y-3.5">
                    <div className="p-3.5 bg-success/10 border border-success/20 rounded-2xl flex items-center gap-3 text-xs text-success-glow text-emerald-400 font-bold">
                      <Check className="w-4.5 h-4.5 animate-bounce" />
                      Vote Cryptographically Sealed & Counted!
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-1">
                  {signingStep !== "completed" ? (
                    <>
                      <button onClick={handleCloseModal} disabled={isSigning} className="px-5 py-2.5 border border-border-thin hover:bg-surface-elevated rounded-xl font-semibold text-sm transition-all cursor-pointer">
                        Cancel
                      </button>
                      <button onClick={handleSignAndSubmit} disabled={isSigning} className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-primary/20">
                        <Lock className="w-4 h-4" />
                        Sign & Cast Vote
                      </button>
                    </>
                  ) : (
                    <button onClick={handleCloseModal} className="px-6 py-2.5 rounded-xl bg-success/20 border border-success/30 hover:bg-success/35 text-success font-bold text-sm transition-all cursor-pointer">
                      Close Control Sheet
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
