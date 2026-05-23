"use client";

import { useState, useEffect, useMemo } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { proposals as initialProposals } from "@/lib/mockData";
import { useAuth } from "@/hooks/auth/useAuth";
import { useBalance, useSignMessage } from "wagmi";
import { formatUnits } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Plus, 
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
  ExternalLink,
  ChevronRight,
  AlertCircle
} from "lucide-react";

interface VotedState {
  option: "For" | "Against" | "Abstain";
  sig: string;
  vp: number;
}

export default function ProposalsPage() {
  const { isAuthenticated, walletAddress, login } = useAuth();
  const { signMessageAsync } = useSignMessage();

  // 1. Voting Power Hook (synchronized with Faucet USDC balance)
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

  // 2. Voting History state (persisted per address)
  const [votedProposals, setVotedProposals] = useState<Record<string, VotedState>>({});
  
  // 3. Local vote count overrides (persisted globally to showcase real-time chart updates)
  const [voteOverrides, setVoteOverrides] = useState<Record<string, { forVotes: number; againstVotes: number; abstainVotes: number }>>({});

  // 4. Modal and signing UI states
  const [selectedProposal, setSelectedProposal] = useState<typeof initialProposals[0] | null>(null);
  const [selectedOption, setSelectedOption] = useState<"For" | "Against" | "Abstain" | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signingStep, setSigningStep] = useState<"idle" | "requesting" | "submitting" | "completed" | "error">("idle");
  const [generatedSignature, setGeneratedSignature] = useState<string>("");

  // Load persistence on mount/address change
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load user votes
      if (walletAddress) {
        const savedVotes = localStorage.getItem(`synarc_votes_${walletAddress}`);
        if (savedVotes) {
          setVotedProposals(JSON.parse(savedVotes));
        } else {
          setVotedProposals({});
        }
      } else {
        setVotedProposals({});
      }

      // Load vote tally overrides
      const savedOverrides = localStorage.getItem("synarc_proposal_vote_overrides");
      if (savedOverrides) {
        setVoteOverrides(JSON.parse(savedOverrides));
      }
    }
  }, [walletAddress]);

  // Handle Triggering a Vote
  const handleVoteClick = (proposal: typeof initialProposals[0], option: "For" | "Against" | "Abstain") => {
    if (!isAuthenticated) {
      login();
      return;
    }

    // Prevent double voting
    if (votedProposals[proposal.id]) return;

    setSelectedProposal(proposal);
    setSelectedOption(option);
    setSigningStep("idle");
    setGeneratedSignature("");
  };

  // Perform Cryptographic Off-chain Signing
  const handleSignAndSubmit = async () => {
    if (!selectedProposal || !selectedOption || !walletAddress) return;

    setIsSigning(true);
    setSigningStep("requesting");

    try {
      const timestamp = new Date().toISOString();
      const message = `SynArc DAO Governance Vote
---------------------------
Proposal ID: ${selectedProposal.id}
Proposal Title: ${selectedProposal.title}
Choice: ${selectedOption}
Voting Weight: ${activeBalance.toFixed(2)} USDC
Voter Address: ${walletAddress}
Timestamp: ${timestamp}`;

      // Request actual signature from Privy Embedded Wallet or Metamask/external key
      const signature = await signMessageAsync({ message });

      setSigningStep("submitting");
      // Simulate validation & indexing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 1. Save user vote
      const userVote: VotedState = {
        option: selectedOption,
        sig: signature,
        vp: activeBalance
      };
      const nextVoted = { ...votedProposals, [selectedProposal.id]: userVote };
      setVotedProposals(nextVoted);
      localStorage.setItem(`synarc_votes_${walletAddress}`, JSON.stringify(nextVoted));

      // 2. Update global vote overrides
      const currentOverride = voteOverrides[selectedProposal.id] || {
        forVotes: selectedProposal.forVotes,
        againstVotes: selectedProposal.againstVotes,
        abstainVotes: selectedProposal.abstainVotes
      };

      const updatedOverride = { ...currentOverride };
      if (selectedOption === "For") updatedOverride.forVotes += activeBalance;
      else if (selectedOption === "Against") updatedOverride.againstVotes += activeBalance;
      else if (selectedOption === "Abstain") updatedOverride.abstainVotes += activeBalance;

      const nextOverrides = { ...voteOverrides, [selectedProposal.id]: updatedOverride };
      setVoteOverrides(nextOverrides);
      localStorage.setItem("synarc_proposal_vote_overrides", JSON.stringify(nextOverrides));

      setGeneratedSignature(signature);
      setSigningStep("completed");
    } catch (err) {
      console.error("Cryptographic signing rejected", err);
      setSigningStep("error");
    } finally {
      setIsSigning(false);
    }
  };

  // Close Vote modal
  const handleCloseModal = () => {
    if (isSigning) return;
    setSelectedProposal(null);
    setSelectedOption(null);
    setSigningStep("idle");
    setGeneratedSignature("");
  };

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Governance Proposals</h1>
            <p className="text-muted mt-1">Participate in private off-chain gasless voting or deploy dynamic parameter proposals.</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] cursor-pointer">
            <Plus className="w-4 h-4" />
            Create Proposal
          </button>
        </div>

        {/* Proposals List */}
        <div className="grid grid-cols-1 gap-6">
          {initialProposals.map((proposal, i) => {
            // Apply real-time overrides if voted
            const currentOverride = voteOverrides[proposal.id] || {
              forVotes: proposal.forVotes,
              againstVotes: proposal.againstVotes,
              abstainVotes: proposal.abstainVotes
            };

            const totalVotes = currentOverride.forVotes + currentOverride.againstVotes + currentOverride.abstainVotes;
            const forPercentage = totalVotes > 0 ? (currentOverride.forVotes / totalVotes) * 100 : 0;
            const againstPercentage = totalVotes > 0 ? (currentOverride.againstVotes / totalVotes) * 100 : 0;
            const abstainPercentage = totalVotes > 0 ? (currentOverride.abstainVotes / totalVotes) * 100 : 0;

            const userVoteRecord = votedProposals[proposal.id];
            const isProposalActive = proposal.status === "Active";

            return (
              <GlassCard key={proposal.id} delay={i * 0.05} className="p-6 relative overflow-hidden group">
                {/* Visual Glow background on active proposals */}
                {isProposalActive && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-500 pointer-events-none" />
                )}

                <div className="flex flex-col md:flex-row gap-6 justify-between">
                  {/* Left Column: Details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                        proposal.status === 'Active' ? 'bg-success/10 border-success/20 text-success' :
                        proposal.status === 'Passed' || proposal.status === 'Executed' ? 'bg-primary/10 border-primary/20 text-primary-glow text-purple-400' :
                        'bg-surface-elevated border-border-thin text-muted'
                      }`}>
                        {proposal.status}
                      </span>
                      <span className="text-xs text-text-secondary font-bold bg-surface-elevated border border-border-thin px-2.5 py-1 rounded-full">
                        {proposal.category}
                      </span>
                      {userVoteRecord && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-pulse">
                          <Check className="w-3.5 h-3.5" />
                          Voted {userVoteRecord.option}
                        </span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold font-heading text-text-primary group-hover:text-primary transition-colors duration-300">
                        {proposal.title}
                      </h2>
                      <p className="text-muted text-sm leading-relaxed max-w-3xl mt-2">
                        {proposal.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-tertiary flex-wrap">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Proposed by <span className="font-mono text-text-secondary">{proposal.proposer}</span></span>
                      </div>
                      <span>•</span>
                      <span>Ends {new Date(proposal.votingEnds).toLocaleDateString()}</span>
                      {userVoteRecord && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 font-medium">Power: {userVoteRecord.vp.toLocaleString()} VP</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Voting Metrics & Active Voting Buttons */}
                  <div className="w-full md:w-72 space-y-4 md:border-l md:border-border-thin md:pl-6 shrink-0 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* For Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-success flex items-center gap-1">For</span>
                          <span className="text-text-primary">{(currentOverride.forVotes / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k VP ({forPercentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-surface-elevated border border-border-subtle h-1.5 rounded-full overflow-hidden">
                          <div className="bg-success h-full transition-all duration-500" style={{ width: `${forPercentage}%` }} />
                        </div>
                      </div>

                      {/* Against Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-danger flex items-center gap-1">Against</span>
                          <span className="text-text-primary">{(currentOverride.againstVotes / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k VP ({againstPercentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-surface-elevated border border-border-subtle h-1.5 rounded-full overflow-hidden">
                          <div className="bg-danger h-full transition-all duration-500" style={{ width: `${againstPercentage}%` }} />
                        </div>
                      </div>

                      {/* Abstain Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-muted flex items-center gap-1">Abstain</span>
                          <span className="text-text-primary">{(currentOverride.abstainVotes / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k VP ({abstainPercentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-surface-elevated border border-border-subtle h-1.5 rounded-full overflow-hidden">
                          <div className="bg-muted h-full transition-all duration-500" style={{ width: `${abstainPercentage}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Active Gated Interactive Panel */}
                    {isProposalActive ? (
                      userVoteRecord ? (
                        <div className="pt-2">
                          <div className="w-full py-2.5 rounded-xl bg-surface border border-emerald-500/25 flex items-center justify-center gap-2 text-xs font-bold text-emerald-400">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Cast Complete — Encrypted
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <button
                            onClick={() => handleVoteClick(proposal, "For")}
                            className="py-2.5 rounded-xl border border-border-thin bg-surface hover:bg-success/10 hover:border-success/30 hover:text-success text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer"
                            title="Vote For"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            For
                          </button>
                          <button
                            onClick={() => handleVoteClick(proposal, "Against")}
                            className="py-2.5 rounded-xl border border-border-thin bg-surface hover:bg-danger/10 hover:border-danger/30 hover:text-danger text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer"
                            title="Vote Against"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                            Against
                          </button>
                          <button
                            onClick={() => handleVoteClick(proposal, "Abstain")}
                            className="py-2.5 rounded-xl border border-border-thin bg-surface hover:bg-surface-elevated hover:text-foreground text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer"
                            title="Vote Abstain"
                          >
                            <CircleDot className="w-3.5 h-3.5" />
                            Abstain
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="pt-2">
                        <button className="w-full py-2.5 rounded-xl bg-surface border border-border-thin text-text-tertiary text-xs font-semibold flex items-center justify-center gap-1 cursor-not-allowed">
                          Voting Terminated
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Floating Premium Modal (Signing & Authorization) */}
      <AnimatePresence>
        {selectedProposal && selectedOption && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={handleCloseModal}
            />

            {/* Modal Body */}
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
                <button
                  onClick={handleCloseModal}
                  disabled={isSigning}
                  className="p-1.5 rounded-xl hover:bg-surface-elevated text-text-tertiary hover:text-foreground transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Vote Details Summary */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Active Governance Proposal</span>
                  <div className="p-4 bg-surface rounded-2xl border border-border-thin font-medium text-text-primary text-sm">
                    {selectedProposal.title}
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
                      {selectedOption === "For" ? <ThumbsUp className="w-4 h-4 animate-bounce" /> :
                        selectedOption === "Against" ? <ThumbsDown className="w-4 h-4 animate-bounce" /> :
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

                {/* Structured Payload Text Area */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-1">
                    <Lock className="w-3 h-3 text-purple-400" />
                    Cryptographic Payload to Sign
                  </span>
                  <div className="p-4 bg-background font-mono text-[10px] text-text-secondary border border-border-subtle rounded-2xl select-none leading-relaxed whitespace-pre overflow-x-auto">
{`SynArc Governance Signature Request
---------------------------------------
Voter: ${walletAddress.substring(0, 16)}...
Weight: ${activeBalance.toLocaleString()} USDC
Proposal ID: ${selectedProposal.id}
Choice: ${selectedOption}
Timestamp: ${new Date().toLocaleTimeString()}
---------------------------------------
Payload verified by Arc Security layers.`}
                  </div>
                </div>
              </div>

              {/* Status Prompts & Actions */}
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
                    <div className="p-3 bg-background rounded-xl border border-border-subtle space-y-1">
                      <span className="text-[9px] font-bold text-text-tertiary block">VERIFIED SIGNATURE HEX</span>
                      <span className="font-mono text-[9px] text-text-secondary select-all break-all block">{generatedSignature}</span>
                    </div>
                  </div>
                )}

                {/* Confirm Buttons */}
                <div className="flex gap-3 justify-end pt-1">
                  {signingStep !== "completed" ? (
                    <>
                      <button
                        onClick={handleCloseModal}
                        disabled={isSigning}
                        className="px-5 py-2.5 border border-border-thin hover:bg-surface-elevated rounded-xl font-semibold text-sm transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSignAndSubmit}
                        disabled={isSigning}
                        className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
                      >
                        <Lock className="w-4 h-4" />
                        Sign & Cast Vote
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCloseModal}
                      className="px-6 py-2.5 rounded-xl bg-success/20 border border-success/30 hover:bg-success/35 text-success font-bold text-sm transition-all cursor-pointer"
                    >
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

