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
import { ArrowLeft, Send, AlertCircle, Loader2, Bot, Sparkles, Wand2, ChevronDown, Wallet, Check, ExternalLink, Coins, Zap, RefreshCw } from "lucide-react";
import { useWallets as usePrivyWallets } from "@/hooks/useWallets";
import { BrowserProvider, Interface } from "ethers";
import { parseArcError } from "@/lib/utils";
import { RpcHealthBanner } from "@/components/ui/RpcHealthBanner";
import { toast } from "react-hot-toast";
import { writeWithRetry, enforceChain, getAuthenticatedClient, getAggressiveGasParams, waitForTransaction } from "@/lib/tx-helper";
import { CONTRACTS, ARC_CHAIN } from "@/lib/arc-config";
import { GovernorABI } from "@/lib/governance/contracts";
import { createWalletClient, createPublicClient, custom, fallback, http } from "viem";
import { validateAttestationURI } from "@/lib/attestation";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";

export default function CreateProposalPage() {
  const router = useRouter();
  const { walletAddress, isAuthenticated, login, isCircle } = useAuth();
  const { activeNetwork, isArcMainnet, explorerUrl } = useArcNetwork();
  // Safe: Circle wallet does not register with Privy wallets list
  const { wallets: privyWallets } = usePrivyWallets();
  const wallets = privyWallets ?? [];
  const { submitProposal } = useGovernanceStore();
  const { votingPower, sarcBalance, needsDelegation, loading: tokenLoading, refetch: refetchToken } = useToken(walletAddress);
  const { balance: usdcBalance } = useUSDCBalance();

  const [isClaimingSarc, setIsClaimingSarc] = useState(false);
  const [isQuickDelegating, setIsQuickDelegating] = useState(false);

  type SubmitStage = "idle" | "wallet_prompt" | "confirming_chain" | "success";
  const [submitStage, setSubmitStage] = useState<SubmitStage>("idle");
  const [broadcastTxHash, setBroadcastTxHash] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successProposalId, setSuccessProposalId] = useState<string | null>(null);
  const [error, setError] = useState<React.ReactNode | null>(null);

  const handleQuickClaimSarc = async () => {
    if (!walletAddress) {
      login();
      return;
    }
    setIsClaimingSarc(true);
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          wallet: walletAddress,
          network: isArcMainnet ? "mainnet" : "testnet",
        }),
      });
      const data = await res.json();
      if (res.status === 429) {
        toast.error(data.cooldown ? `Already claimed today. Next claim in ${data.cooldown}` : "Already claimed today.");
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || "Claim failed");
      }
      toast.success(data.message || (isArcMainnet ? "10 sARC claimed successfully!" : "1000 sARC claimed successfully!"));
      await refetchToken();
    } catch (err: any) {
      console.error("Quick claim failed:", err);
      toast.error(err.message || "Failed to claim sARC");
    } finally {
      setIsClaimingSarc(false);
    }
  };

  const handleQuickDelegate = async () => {
    if (!walletAddress) return;
    setIsQuickDelegating(true);
    try {
      const { walletClient, publicClient, address } = await getAuthenticatedClient(wallets, ARC_CHAIN.id, walletAddress);
      const SARC_DELEGATE_ABI = [{
        name: "delegate",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "delegatee", type: "address" }],
        outputs: []
      }] as const;

      const gasParams = await getAggressiveGasParams(publicClient);
      toast.loading("Activating voting power (self-delegating)...");
      const tx = await walletClient.writeContract({
        address: CONTRACTS.token,
        abi: SARC_DELEGATE_ABI,
        functionName: "delegate",
        args: [address],
        gas: 150000n,
        ...gasParams
      });

      await waitForTransaction(publicClient, tx);
      toast.dismiss();
      toast.success("Voting power activated! You can now submit proposals and vote.");
      await refetchToken();
    } catch (err: any) {
      console.error("Delegation failed:", err);
      toast.dismiss();
      toast.error(err.message || "Failed to delegate voting power");
    } finally {
      setIsQuickDelegating(false);
    }
  };

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
        votingDuration: generated.votingDuration || 7,
        deliverableURI: formData.deliverableURI,
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
    deliverableURI: "",
  });

  const [proposalType, setProposalType] = useState<"standard" | "fund_agent">("standard");
  const [fundingAmount, setFundingAmount] = useState<string>("");
  const [isPinningAttestation, setIsPinningAttestation] = useState(false);

  const handleAutoPinSpec = async () => {
    if (!formData.title) {
      toast.error("Please enter a proposal title first.");
      return;
    }
    setIsPinningAttestation(true);
    try {
      const res = await fetch("/api/attestation/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          description: formData.description,
          amount: Math.abs(formData.treasuryImpactValue),
          target: formData.executionTarget,
          details: {
            votingDurationDays: formData.votingDuration,
            creator: walletAddress,
          }
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to pin specification.");
      }
      setFormData(prev => ({ ...prev, deliverableURI: data.ipfsUri }));
      toast.success("Proposal specification pinned to IPFS!");
    } catch (err: any) {
      console.error("Auto pin error:", err);
      toast.error(err?.message || "Failed to pin specification to IPFS.");
    } finally {
      setIsPinningAttestation(false);
    }
  };

  React.useEffect(() => {
    if (proposalType === "fund_agent") {
      const amountNum = parseFloat(fundingAmount) || 0;
      setFormData(prev => ({
        ...prev,
        title: `Fund Agent Treasury - ${amountNum} USDC`,
        category: "Treasury Allocation",
        executionTarget: CONTRACTS.treasuryAgent,
        treasuryImpactValue: -amountNum,
        deliverableURI: "ipfs://QmPgvwkpDNgHSTx3V7NrLwCrQbppN39Zpji6o3TwbtVuiU",
        description: `This governance proposal approves the transfer of ${amountNum} USDC from the primary community-controlled treasury (treasuryGovernance) to the dedicated agent operating treasury (treasuryAgent) to fund autonomous CCTP rebalances. This proposal will go through the standard 24-hour timelock upon approval.`
      }));
    }
  }, [proposalType, fundingAmount]);

  const handleTypeChange = (type: "standard" | "fund_agent") => {
    setProposalType(type);
    if (type === "standard") {
      setFormData({
        title: "",
        category: "Governance Parameter",
        description: "",
        treasuryImpactValue: 0,
        executionTarget: "",
        votingDuration: 7,
        deliverableURI: "",
      });
      setFundingAmount("");
    }
  };

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
      if (sarcBalance >= proposalThreshold) {
        setError(
          <span>
            You hold {sarcBalance.toLocaleString()} sARC, but haven&apos;t activated your voting power yet. Please click &quot;Activate Voting Power&quot; above to self-delegate before submitting.
          </span>
        );
      } else {
        setError(
          <span>
            You require a minimum of {proposalThreshold.toLocaleString()} tokens to submit a proposal.{" "}
            <Link href="/faucet" className="underline font-bold text-primary hover:text-purple-300">
              Claim 10 sARC here
            </Link>{" "}
            first.
          </span>
        );
      }
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

    if (formData.treasuryImpactValue !== 0) {
      const uri = formData.deliverableURI.trim();
      if (!uri) {
        setError("Treasury payout proposals strictly require a Deliverable Attestation (IPFS CID or receipt URL) to satisfy document matching controls.");
        return;
      }
      const validation = validateAttestationURI(uri);
      if (!validation.valid) {
        setError(`Invalid Deliverable Attestation: ${validation.reason}. Must be a valid IPFS CIDv0 (ipfs://Qm...), CIDv1 (ipfs://baf...), or verified https:// document URL.`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get provider and client — Privy wallet, Circle wallet OR external wallet
      const { walletClient, publicClient, address } = await getAuthenticatedClient(wallets, ARC_CHAIN.id, walletAddress);
      const targetAddress = (formData.executionTarget && formData.executionTarget.startsWith('0x'))
        ? (formData.executionTarget as `0x${string}`)
        : '0x0000000000000000000000000000000000000000';

      const votingDurationSecs = BigInt(formData.votingDuration) * 86400n;
      const absoluteImpactValue = BigInt(Math.abs(formData.treasuryImpactValue)) * 1000000n;
      const governorAddress = CONTRACTS.governor as `0x${string}`;
      const deliverableDoc = formData.deliverableURI.trim();

      // Dynamically estimate fees using low-latency and aggressive parameters
      const gasParams = await getAggressiveGasParams(publicClient);

      const proposeArgs = [
        formData.title,
        formData.description,
        formData.category,
        votingDurationSecs,
        absoluteImpactValue,
        targetAddress,
        deliverableDoc
      ] as const;

      let estimatedProposeGas = 600000n; // Slightly higher gas limit floor
      try {
        const est = await publicClient.estimateContractGas({
          address: governorAddress,
          abi: GovernorABI,
          functionName: 'propose',
          args: proposeArgs,
          account: address,
        })
        estimatedProposeGas = (est * 150n) / 100n;
        if (estimatedProposeGas < 600000n) estimatedProposeGas = 600000n;
      } catch (e) {
        console.warn('Propose gas estimation failed:', e)
      }

      setSubmitStage("wallet_prompt");
      const txHash = await walletClient.writeContract({
        address: governorAddress,
        abi: GovernorABI,
        functionName: 'propose',
        args: proposeArgs,
        account: address,
        gas: estimatedProposeGas,
        ...gasParams,
      });

      setBroadcastTxHash(txHash);
      setSubmitStage("confirming_chain");

      // Wait for on-chain confirmation and parse the actual proposalId from logs
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 });
      setSubmitStage("success");

      let finalProposalId = `SIP-${txHash.slice(0, 6)}`; // fallback
      try {
        if (receipt && receipt.logs) {
          const iface = new Interface(GovernorABI);
          for (const log of receipt.logs) {
            try {
              const parsed = iface.parseLog({ topics: [...(log.topics as string[])], data: log.data });
              if (parsed && parsed.name === 'ProposalCreated') {
                const rawId = parsed.args.proposalId?.toString() || parsed.args[0]?.toString();
                if (rawId) {
                  finalProposalId = `SIP-${rawId}`;
                  break;
                }
              }
            } catch {
              // skip logs that don't match
            }
          }
        }
      } catch (logErr) {
        console.error('Failed to parse ProposalCreated log:', logErr);
      }

      // Save created proposal to localStorage as immediate backup
      try {
        const newProposalObj = {
          id: finalProposalId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          proposer: address,
          category: formData.category,
          status: "Active" as const,
          forVotes: 0,
          againstVotes: 0,
          abstainVotes: 0,
          totalVotes: 0,
          participationPercentage: 0,
          treasuryImpactValue: -Math.abs(formData.treasuryImpactValue),
          treasuryImpact: formData.treasuryImpactValue !== 0 ? `-${Math.abs(formData.treasuryImpactValue)} USDC` : "None",
          timeRemaining: `${formData.votingDuration} days left`,
          createdAt: new Date().toISOString(),
          votingStarts: new Date().toISOString(),
          votingEnds: new Date(Date.now() + formData.votingDuration * 86400 * 1000).toISOString(),
          executionTarget: targetAddress,
          votingDuration: formData.votingDuration,
          timeline: [
            { title: "Proposal Created", timestamp: new Date().toISOString(), status: "Proposed" },
            { title: "Voting Phase Active", timestamp: new Date().toISOString(), status: "Active" }
          ]
        };

        if (typeof window !== "undefined") {
          const netKey = activeNetwork === "mainnet" ? "mainnet" : "testnet";
          const storageKey = `synarc_simulated_proposals_${netKey}`;
          const stored = localStorage.getItem(storageKey);
          const list = stored ? JSON.parse(stored) : [];
          const updated = [newProposalObj, ...list.filter((p: any) => p.id !== finalProposalId)];
          localStorage.setItem(storageKey, JSON.stringify(updated));
        }
      } catch (backupErr) {
        console.warn("Could not save proposal to local backup:", backupErr);
      }

      // Force-refetch proposal list from chain (bypasses 3-minute staleness cache)
      await useGovernanceStore.getState().initializeStore(undefined, true);

      toast.success('Proposal submitted!');
      setSuccessProposalId(finalProposalId);

      setTimeout(() => {
        router.push(`/proposals/${finalProposalId}`);
      }, 3000);
    } catch (err: any) {
      setSubmitStage("idle");
      setBroadcastTxHash(null);
      const parsedMsg = parseArcError(err);
      setError(
        <div className="flex flex-col gap-2">
          <span>{parsedMsg}</span>
          {parsedMsg.toLowerCase().includes("faucet") && !isArcMainnet && (
            <Link 
              href="/faucet" 
              className="self-start text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-1"
            >
              Claim testnet gas tokens from Faucet →
            </Link>
          )}
        </div>
      );
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
              <h2 className="text-2xl font-bold text-white">Proposal created successfully</h2>
              <p className="text-muted text-sm">Your governance action has been broadcast and confirmed on {isArcMainnet ? "Arc Mainnet" : "Arc Testnet"}.</p>
            </div>
            <div className="bg-surface-elevated/40 border border-border-thin rounded-xl p-4 font-mono text-sm text-text-primary">
              <span className="text-text-tertiary">Proposal ID: </span>
              <span className="text-primary font-bold">{successProposalId}</span>
            </div>
            <p className="text-xs text-text-tertiary">Redirecting to proposal details in a few seconds...</p>
            <Link 
              href={`/proposals/${successProposalId}`} 
              className="inline-flex items-center justify-center w-full py-3 px-5 bg-accent-purple hover:bg-accent-purple/90 text-white-keep font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] cursor-pointer"
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
            <p className="text-muted mt-1">Submit a binding governance proposal to Syn DAO.</p>
          </div>
        </div>

        <GlassCard className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Proposal Type Tabs */}
            <div className="flex gap-2 p-1.5 bg-surface-elevated/40 border border-border-thin rounded-xl mb-6">
              <button
                type="button"
                onClick={() => handleTypeChange("standard")}
                className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  proposalType === "standard"
                    ? "bg-accent-purple text-white shadow-[0_0_15px_rgba(124,58,237,0.25)]"
                    : "text-muted hover:text-text-primary"
                }`}
              >
                Standard Proposal
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("fund_agent")}
                className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  proposalType === "fund_agent"
                    ? "bg-accent-purple text-white shadow-[0_0_15px_rgba(124,58,237,0.25)]"
                    : "text-muted hover:text-text-primary"
                }`}
              >
                Fund Agent Operating Treasury
              </button>
            </div>

            {error && (
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-sm text-danger">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {!tokenLoading && !hasEnoughBalance && (
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-warning animate-fade-in-up">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-warning" />
                  <div>
                    {sarcBalance >= proposalThreshold && needsDelegation ? (
                      <>
                        <span className="font-bold text-amber-300">
                          Activate Voting Power to Submit Proposal
                        </span>
                        <p className="text-xs text-muted/80 mt-0.5">
                          You hold {sarcBalance.toLocaleString()} sARC, but haven&apos;t self-delegated yet. Run 1-click activation so the Governor contract can count your votes.
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-amber-300">
                          Proposal Threshold: 1 sARC Token Required
                        </span>
                        <p className="text-xs text-muted/80 mt-0.5">
                          You currently have {votingPower.toLocaleString()} voting tokens. {isArcMainnet ? "Claim 10 sARC on Arc Mainnet to start proposing and voting." : "Claim free testnet sARC to get started."}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  {sarcBalance >= proposalThreshold && needsDelegation ? (
                    <button
                      type="button"
                      onClick={handleQuickDelegate}
                      disabled={isQuickDelegating}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {isQuickDelegating ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Activating...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          Activate Voting Power
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleQuickClaimSarc}
                      disabled={isClaimingSarc}
                      className="px-4 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {isClaimingSarc ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Claiming 10 sARC...
                        </>
                      ) : (
                        <>
                          <Coins className="w-3.5 h-3.5" />
                          Claim 10 sARC
                        </>
                      )}
                    </button>
                  )}
                  <Link
                    href="/faucet"
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted hover:text-white text-xs font-semibold transition-colors"
                  >
                    Faucet Page →
                  </Link>
                </div>
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
                        <p className="text-xs text-muted/80 mt-0.5 font-semibold">You need at least 0.05 USDC to pay for gas fees on {isArcMainnet ? "Arc Mainnet" : "Arc Testnet"}.</p>
                      </div>
                    </div>
                    {!isArcMainnet && (
                      <Link 
                        href="/faucet" 
                        className="px-3.5 py-1.5 rounded-lg bg-danger/20 border border-danger/30 hover:bg-danger/30 text-xs font-bold text-danger transition-colors text-center cursor-pointer shrink-0"
                      >
                        Claim Faucet USDC →
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-success/10 border border-success/20 rounded-xl flex items-center gap-3 text-sm text-success animate-fade-in-up">
                    <Check className="w-5 h-5 shrink-0 text-success" />
                    <div>
                      <span className="font-bold">Wallet Gas Ready</span>
                      <p className="text-xs text-muted/80 mt-0.5 font-semibold">{usdcBalance} USDC is available in your wallet for transaction fees.</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {proposalType === "standard" && (
              /* AI Proposal Assistant Box */
              <div className="bg-surface-elevated/40 border border-primary/20 rounded-2xl p-4 overflow-hidden mb-6">
                <button
                  type="button"
                  onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                  className="w-full flex items-center justify-between text-left font-bold text-white text-sm cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    <span>AI Proposal Assistant</span>
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
                      <p className="text-xs text-text-tertiary leading-relaxed">
                        Rough idea? Write it down in plain English (e.g. &quot;Allocate 2,500 USDC for community marketing materials next month&quot;), and our AI assistant will draft the titles, categories, voting parameters, and descriptions!
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
                          className="py-3 px-5 bg-accent-purple hover:bg-accent-purple/90 text-white-keep font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(124,58,237,0.15)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
            )}

            <div className="space-y-4">
              {proposalType === "standard" ? (
                <>
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

                  {formData.treasuryImpactValue !== 0 && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor="deliverableURI" className="block text-sm font-bold text-text-primary">
                          Deliverable Attestation (IPFS CID / Document Proof) *
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleAutoPinSpec}
                            disabled={isPinningAttestation}
                            className="text-xs px-2.5 py-1 rounded-md bg-accent-purple/20 border border-accent-purple/30 text-accent-purple hover:bg-accent-purple/30 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {isPinningAttestation ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Pinning...
                              </>
                            ) : (
                              <>
                                Pin Spec to IPFS
                              </>
                            )}
                          </button>
                          <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                            Escrow Control
                          </span>
                        </div>
                      </div>
                      <input
                        id="deliverableURI"
                        type="text"
                        value={formData.deliverableURI}
                        onChange={(e) => setFormData({ ...formData, deliverableURI: e.target.value })}
                        placeholder="ipfs://Qm... or ipfs://bafy... or https://... (Invoice, receipt, or deliverable)"
                        className="w-full bg-surface border border-border-thin rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-text-tertiary transition-colors"
                        required
                      />
                      <p className="text-xs text-text-tertiary leading-relaxed">
                        To protect the treasury against unbacked agent disbursements, proposals with financial payouts strictly require an immutable deliverable reference before the Governor will allow creation or execution.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="fundingAmount" className="block text-sm font-bold text-text-secondary mb-1">Funding Amount (USDC) *</label>
                    <input
                      id="fundingAmount"
                      type="number"
                      min="1"
                      value={fundingAmount}
                      onChange={(e) => setFundingAmount(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full bg-surface border border-border-thin rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-text-tertiary transition-colors"
                      required
                    />
                    <p className="text-xs text-text-tertiary mt-1.5">
                      Enter the amount of USDC to transfer from the governance treasury to the agent operating treasury.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-text-secondary mb-1">Proposal Title (Generated)</label>
                    <input
                      type="text"
                      value={formData.title}
                      className="w-full bg-surface-elevated/40 border border-border-thin rounded-xl px-4 py-3 text-sm text-text-tertiary font-medium cursor-not-allowed"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-text-secondary mb-1">Category (Generated)</label>
                    <input
                      type="text"
                      value={formData.category}
                      className="w-full bg-surface-elevated/40 border border-border-thin rounded-xl px-4 py-3 text-sm text-text-tertiary font-medium cursor-not-allowed"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-text-secondary mb-1">Description (Generated)</label>
                    <textarea
                      value={formData.description}
                      rows={5}
                      className="w-full bg-surface-elevated/40 border border-border-thin rounded-xl px-4 py-3 text-sm text-text-tertiary font-medium cursor-not-allowed resize-none"
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-text-secondary mb-1">Execution Target (Generated)</label>
                      <input
                        type="text"
                        value={formData.executionTarget}
                        className="w-full bg-surface-elevated/40 border border-border-thin rounded-xl px-4 py-3 text-sm font-mono text-text-tertiary font-medium cursor-not-allowed"
                        disabled
                      />
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

                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">Deliverable Attestation Reference</span>
                      <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                        Auto-Attached
                      </span>
                    </div>
                    <p className="text-xs font-mono text-muted break-all">{formData.deliverableURI}</p>
                  </div>
                </>
              )}
            </div>

            {submitStage === "wallet_prompt" && (
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl flex items-center gap-3 text-xs text-text-primary mb-4 animate-fade-in">
                <Loader2 className="w-4.5 h-4.5 text-primary animate-spin shrink-0" />
                <div>
                  <span className="font-bold text-primary">Awaiting Wallet Signature: </span>
                  Please review and approve the proposal creation transaction in your connected wallet.
                </div>
              </div>
            )}

            {submitStage === "confirming_chain" && (
              <div className="p-4 bg-accent-purple/10 border border-accent-purple/30 rounded-xl flex items-center justify-between gap-3 text-xs text-text-primary mb-4 animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <Loader2 className="w-4.5 h-4.5 text-accent-purple animate-spin shrink-0" />
                  <div>
                    <span className="font-bold text-purple-400">Confirming on Arc: </span>
                    Transaction broadcast! Waiting for block inclusion...
                  </div>
                </div>
                {broadcastTxHash && (
                  <a
                    href={`${explorerUrl}/tx/${broadcastTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px] shrink-0 font-bold"
                  >
                    View Tx <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            <div className="pt-6 border-t border-border-subtle flex justify-end">
              {!isAuthenticated ? (
                <button
                  type="button"
                  onClick={login}
                  className="px-6 py-3 rounded-xl bg-accent-purple text-white-keep font-bold text-sm hover:bg-accent-purple/90 transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] flex items-center gap-2 cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  Connect wallet to continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || (!tokenLoading && !hasEnoughBalance)}
                  className="px-6 py-3 rounded-xl bg-accent-purple text-white-keep font-bold text-sm hover:bg-accent-purple/90 transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitStage === "wallet_prompt" ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      Confirm in Wallet...
                    </>
                  ) : submitStage === "confirming_chain" ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      Mining on Arc...
                    </>
                  ) : isSubmitting ? (
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
