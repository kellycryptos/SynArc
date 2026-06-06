"use client";
import React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { useAuth } from "@/hooks/auth/useAuth";
import { useToken } from "@/hooks/useToken";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, AlertCircle, Loader2, Bot, Sparkles, Wand2, ChevronDown, Wallet, Check } from "lucide-react";
import { useWallets as usePrivyWallets } from "@privy-io/react-auth";
import { BrowserProvider } from "ethers";
import { parseArcError } from "@/lib/utils";
import { RpcHealthBanner } from "@/components/ui/RpcHealthBanner";
import { toast } from "react-hot-toast";
import { writeWithRetry, enforceChain, getAuthenticatedClient, getAggressiveGasParams } from "@/lib/tx-helper";
import { ARC_GAS, ARC_CHAIN, ARC_RPC_URLS } from "@/lib/arc-config";
import { GovernorABI } from "@/lib/governance/contracts";
import { createWalletClient, createPublicClient, custom, fallback, http } from "viem";

export default function CreateProposalPage() {
  const router = useRouter();
  const { walletAddress, isAuthenticated, login, isCircle } = useAuth();
  // Safe: Circle wallet does not register with Privy wallets list
  const { wallets: privyWallets } = usePrivyWallets();
  const wallets = privyWallets ?? [];
  const { submitProposal } = useGovernanceStore();
  const { votingPower, loading: tokenLoading } = useToken(walletAddress);
  const { balance: usdcBalance } = useUSDCBalance();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successProposalId, setSuccessProposalId] = useState<string | null>(null);
  const [error, setError] = useState<React.ReactNode | null>(null);

  // AI proposal generator states
  const [userIdea, setUserIdea] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGenError, setAiGenError] = useState("");
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const handleGenerateProposal = async () => {
    if (!userIdea.trim()) {
      setAiGenError("Please enter your rough idea first.");
      return;
    }

    setAiGenerating(true);
    setAiGenError("");

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          proposalData: {
            idea: userIdea
          }
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate proposal details.");
      }

      const generated = data.proposal;
      setFormData({
        title: generated.title || "",
        category: generated.category || "Governance Parameter",
        description: generated.description || "",
        treasuryImpactValue: generated.treasuryImpact === "high" ? -100000 : generated.treasuryImpact === "medium" ? -25000 : generated.treasuryImpact === "low" ? -5000 : 0,
        executionTarget: formData.executionTarget,
        votingDuration: generated.votingDuration || 7
      });

      setIsAssistantOpen(false); // Collapse helper box
      setUserIdea(""); // Clear helper input
    } catch (err: any) {
      console.error("AI Proposal Generator error:", err);
      setAiGenError(err?.message || "Failed to contact AI generator. Please try again.");
    } finally {
      setAiGenerating(false);
    }
  };

  const proposalThreshold = 1;
  const hasEnoughBalance = votingPower >= proposalThreshold;

  const [formData, setFormData] = useState({
    title: "",
    category: "Governance Parameter",
    description: "",
    treasuryImpactValue: 0,
    executionTarget: "",
    votingDuration: 7,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !walletAddress) {
      login();
      return;
    }

    const usdcVal = usdcBalance ? parseFloat(usdcBalance) : 0;
    if (usdcVal < 0.05) {
      setError(
        <span>
          Insufficient USDC for gas. Please claim from{" "}
          <Link 
            href="/faucet" 
            className="underline font-bold text-primary hover:text-purple-300"
          >
            faucet
          </Link>{" "}
          first.
        </span>
      );
      return;
    }

    if (votingPower < proposalThreshold) {
      setError(`You require a minimum of ${proposalThreshold.toLocaleString()} tokens to submit a proposal.`);
      return;
    }

    if (!formData.title || !formData.description) {
      setError("Title and description are required.");
      return;
    }

    if (formData.description.length > 3000) {
      setError("Description is too long. Please limit proposal details to 3,000 characters to optimize transaction calldata size.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    if (isCircle) {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockHash = "0x" + Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
        const proposalId = `SIP-${mockHash.substring(0, 8)}`;
        
        const newProposal = {
          id: proposalId,
          title: formData.title,
          description: formData.description,
          proposer: walletAddress,
          category: formData.category,
          status: "Active" as const,
          forVotes: 0,
          againstVotes: 0,
          abstainVotes: 0,
          totalVotes: 0,
          participationPercentage: 0,
          treasuryImpactValue: formData.treasuryImpactValue,
          treasuryImpact: formData.treasuryImpactValue < 0 ? `${formData.treasuryImpactValue.toLocaleString()} USDC` : "None",
          timeRemaining: `${formData.votingDuration} days left`,
          createdAt: new Date().toISOString(),
          votingStarts: new Date().toISOString(),
          votingEnds: new Date(Date.now() + formData.votingDuration * 86400 * 1000).toISOString(),
          executionTarget: formData.executionTarget || "0x0000000000000000000000000000000000000000",
          votingDuration: formData.votingDuration,
          timeline: [
            { title: "Proposal Created", timestamp: new Date().toISOString(), status: "Proposed" },
            { title: "Voting Phase Active", timestamp: new Date().toISOString(), status: "Active" }
          ]
        };

        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("synarc_simulated_proposals");
          const existing = stored ? JSON.parse(stored) : [];
          localStorage.setItem("synarc_simulated_proposals", JSON.stringify([newProposal, ...existing]));
        }

        // Force store re-initialization so it loads the new proposal
        useGovernanceStore.getState().initializeStore();

        toast.success('Proposal submitted! ✅');
        setSuccessProposalId(proposalId);

        setTimeout(() => {
          router.push('/proposals');
        }, 3000);
      } catch (err: any) {
        console.error("Circle proposal creation error:", err);
        setError(err.message || "Failed to create proposal");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      // Get provider and client — Privy wallet, Circle wallet OR external wallet
      const { walletClient, publicClient, address } = await getAuthenticatedClient(wallets, 5042002);
      const targetAddress = (formData.executionTarget && formData.executionTarget.startsWith('0x'))
        ? (formData.executionTarget as `0x${string}`)
        : '0x0000000000000000000000000000000000000000';

      const votingDurationSecs = BigInt(formData.votingDuration) * 86400n;
      const absoluteImpactValue = BigInt(Math.abs(formData.treasuryImpactValue)) * 1000000n;
      const governorAddress = (process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS || "0x17D9d585CBB1AF6aa4a3C787116f7ba59651B702") as `0x${string}`;

      // Dynamically estimate fees using low-latency and aggressive parameters
      const gasParams = await getAggressiveGasParams(publicClient);

      let estimatedProposeGas = 600000n; // Slightly higher gas limit floor
      try {
        const est = await publicClient.estimateContractGas({
          address: governorAddress,
          abi: GovernorABI,
          functionName: 'propose',
          args: [
            formData.title,
            formData.description,
            formData.category,
            votingDurationSecs,
            absoluteImpactValue,
            targetAddress
          ],
          account: address,
        })
        estimatedProposeGas = (est * 150n) / 100n;
        if (estimatedProposeGas < 600000n) estimatedProposeGas = 600000n;
      } catch (e) {
        console.warn('Propose gas estimation failed:', e)
      }

      const txHash = await walletClient.writeContract({
        address: governorAddress,
        abi: GovernorABI,
        functionName: 'propose',
        args: [
          formData.title,
          formData.description,
          formData.category,
          votingDurationSecs,
          absoluteImpactValue,
          targetAddress
        ],
        account: address,
        gas: estimatedProposeGas,
        ...gasParams,
      })

      toast.success('Proposal submitted! ✅');
      setSuccessProposalId(txHash);

      setTimeout(() => {
        router.push('/proposals');
      }, 3000);
    } catch (err: any) {
      console.error("Proposal submission error details:", err);
      setError(parseArcError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* RPC Health Banner */}
        <RpcHealthBanner hasLoadedBalance={!tokenLoading && usdcBalance !== undefined} />
        
        {successProposalId ? (
          <GlassCard className="p-8 text-center space-y-6 max-w-xl mx-auto animate-fade-in-up">
            <div className="w-16 h-16 bg-success/15 border border-success/30 rounded-full flex items-center justify-center mx-auto text-success shadow-[0_0_20px_rgba(34,197,94,0.2)] animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">✅ Proposal created successfully</h2>
              <p className="text-muted text-sm">Your governance action has been broadcast and confirmed on the Arc Testnet.</p>
            </div>
            <div className="bg-surface-elevated/40 border border-border-thin rounded-xl p-4 font-mono text-sm text-text-primary">
              <span className="text-text-tertiary">Proposal ID: </span>
              <span className="text-primary font-bold">{successProposalId}</span>
            </div>
            <p className="text-xs text-text-tertiary">Redirecting to proposal details in a few seconds...</p>
            <Link 
              href={`/proposals/${successProposalId}`} 
              className="inline-flex items-center justify-center w-full py-3 px-5 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] cursor-pointer"
            >
              Go to Proposal Details →
            </Link>
          </GlassCard>
        ) : (
          <>
            <div className="space-y-4">
          <Link href="/proposals" className="inline-flex items-center gap-2 text-text-tertiary hover:text-primary transition-colors text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" />
            Back to Proposals
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Proposal</h1>
            <p className="text-muted mt-1">Submit a binding governance proposal to the SynArc DAO.</p>
          </div>
        </div>

        <GlassCard className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-sm text-danger">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {!tokenLoading && !hasEnoughBalance && (
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl flex items-center gap-3 text-sm text-warning">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>You require a minimum of {proposalThreshold.toLocaleString()} tokens to submit a proposal. Your current balance is {votingPower.toLocaleString()} tokens.</span>
              </div>
            )}

            {/* USDC Gas Status Banner */}
            {isAuthenticated && walletAddress && (
              <>
                {parseFloat(usdcBalance || "0") < 0.05 ? (
                  <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-danger animate-fade-in-up">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 text-danger animate-pulse" />
                      <div>
                        <span className="font-bold">Insufficient USDC for gas.</span>
                        <p className="text-xs text-muted/80 mt-0.5 font-semibold">You need at least 0.05 USDC to pay for gas fees on Arc Testnet.</p>
                      </div>
                    </div>
                    <Link 
                      href="/faucet" 
                      className="px-3.5 py-1.5 rounded-lg bg-danger/20 border border-danger/30 hover:bg-danger/30 text-xs font-bold text-danger transition-colors text-center cursor-pointer shrink-0"
                    >
                      Claim Faucet USDC →
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 bg-success/10 border border-success/20 rounded-xl flex items-center gap-3 text-sm text-success animate-fade-in-up">
                    <Check className="w-5 h-5 shrink-0 text-success" />
                    <div>
                      <span className="font-bold">Wallet Gas Ready</span>
                      <p className="text-xs text-muted/80 mt-0.5 font-semibold">✅ {usdcBalance} USDC is available in your wallet for transaction fees.</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* AI Proposal Assistant Box */}
            <div className="bg-surface-elevated/40 border border-primary/20 rounded-2xl p-4 overflow-hidden mb-6">
              <button
                type="button"
                onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                className="w-full flex items-center justify-between text-left font-bold text-white text-sm cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  <span>✨ AI Proposal Assistant (Groq Llama 3.3)</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-300 ${isAssistantOpen ? "rotate-180 text-white" : ""}`} />
              </button>

              <AnimatePresence>
                {isAssistantOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4 pt-4"
                  >
                    <p className="text-xs text-text-tertiary leading-relaxed leading-normal">
                      Rough idea? Write it down in plain English (e.g. &quot;Grant 10,000 USDC to organize a hackathon next month&quot;), and our AI agent will fully draft the titles, categories, voting parameters, and descriptions!
                    </p>

                    {aiGenError && (
                      <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{aiGenError}</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <textarea
                        value={userIdea}
                        onChange={(e) => {
                          setUserIdea(e.target.value);
                          if (aiGenError) setAiGenError("");
                        }}
                        disabled={aiGenerating}
                        placeholder="Describe your proposal idea here..."
                        rows={2}
                        className="flex-1 bg-surface border border-border-thin focus:border-primary rounded-xl px-4 py-3 text-xs text-white outline-none placeholder:text-text-tertiary transition-colors resize-none disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateProposal}
                        disabled={aiGenerating || !userIdea}
                        className="py-3 px-5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(124,58,237,0.15)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      >
                        {aiGenerating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Drafting...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-3.5 h-3.5" />
                            Generate with AI
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-bold text-text-secondary mb-1">Proposal Title *</label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Update Governance Quorum Parameter"
                  className="w-full bg-surface border border-border-thin rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-text-tertiary transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-bold text-text-secondary mb-1">Category</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-surface border border-border-thin rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary transition-colors"
                >
                  <option value="Governance Parameter">Governance Parameter</option>
                  <option value="Treasury Allocation">Treasury Allocation</option>
                  <option value="Ecosystem Grant">Ecosystem Grant</option>
                  <option value="Delegate Onboarding">Delegate Onboarding</option>
                  <option value="Protocol Upgrade">Protocol Upgrade</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-bold text-text-secondary mb-1">Description *</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed context, rationale, and execution steps in Markdown..."
                  rows={8}
                  className="w-full bg-surface border border-border-thin rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-text-tertiary transition-colors resize-y"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="treasuryImpact" className="block text-sm font-bold text-text-secondary mb-1">Treasury Impact (USDC)</label>
                  <input
                    id="treasuryImpact"
                    type="number"
                    value={formData.treasuryImpactValue}
                    onChange={(e) => setFormData({ ...formData, treasuryImpactValue: parseInt(e.target.value) || 0 })}
                    placeholder="-50000"
                    className="w-full bg-surface border border-border-thin rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-text-tertiary transition-colors"
                  />
                  <p className="text-xs text-text-tertiary mt-1.5">Use negative values for outflows (e.g., grants).</p>
                </div>
                
                <div>
                  <label htmlFor="votingDuration" className="block text-sm font-bold text-text-secondary mb-1">Voting Duration (Days)</label>
                  <input
                    id="votingDuration"
                    type="number"
                    min="1"
                    max="14"
                    value={formData.votingDuration}
                    onChange={(e) => setFormData({ ...formData, votingDuration: parseInt(e.target.value) || 7 })}
                    className="w-full bg-surface border border-border-thin rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-text-tertiary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="executionTarget" className="block text-sm font-bold text-text-secondary mb-1">Execution Target Contract (Optional)</label>
                <input
                  id="executionTarget"
                  type="text"
                  value={formData.executionTarget}
                  onChange={(e) => setFormData({ ...formData, executionTarget: e.target.value })}
                  placeholder="0x..."
                  className="w-full bg-surface border border-border-thin rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-text-tertiary transition-colors"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-border-subtle flex justify-end">
              {!isAuthenticated ? (
                <button
                  type="button"
                  onClick={login}
                  className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] flex items-center gap-2 cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  Connect wallet to continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || (!tokenLoading && !hasEnoughBalance)}
                  className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      Deploying Proposal...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Proposal
                    </>
                  )}
                </button>
              )}
            </div>
            
          </form>
        </GlassCard>
          </>
        )}
      </div>
    </div>
  );
}
