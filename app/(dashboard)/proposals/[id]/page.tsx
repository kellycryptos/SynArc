"use client";

import { useState, useEffect, useMemo, use } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { useAuth } from "@/hooks/auth/useAuth";
import { useTreasury } from "@/hooks/useTreasury";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { useToken } from "@/hooks/useToken";
import { getResilientProvider } from "@/lib/rpc/config";
import { arcPublicClient } from "@/lib/arc/config";
import { toast } from "react-hot-toast";

import { useReadContract, useAccount, useWriteContract, useSwitchChain } from "wagmi";
import { formatUnits, createWalletClient, createPublicClient, fallback, custom, http } from "viem";
import { GovernorABI, ERC20ABI } from "@/lib/governance/contracts";
import { ARC_GAS_CONFIG } from "@/lib/constants";
import { writeWithRetry, getSigner } from "@/lib/tx-helper";
import { ARC_GAS, ARC_CHAIN, ARC_RPC_URLS, CONTRACTS } from "@/lib/arc-config";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as `0x${string}`;
const SARC_ADDRESS = "0x637cA7788aBC956832F389A7BB895D5249FE757B" as `0x${string}`;
const GOVERNOR_ABI = GovernorABI;
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallets } from "@privy-io/react-auth";
import { BrowserProvider, Contract } from "ethers";
import { RpcHealthBanner } from "@/components/ui/RpcHealthBanner";
import { useArcRpcHealth } from "@/hooks/useArcRpcHealth";
import { 
  ThumbsUp, 
  ThumbsDown, 
  CircleDot, 
  ShieldCheck, 
  AlertCircle,
  ArrowLeft,
  Calendar,
  Play,
  Bot,
  Info,
  Loader2,
  Wallet
} from "lucide-react";

export default function ProposalDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { isAuthenticated, walletAddress, login } = useAuth();
  const { wallets } = useWallets();
  const { currentBlock } = useArcRpcHealth();

  const { proposals, initialized, initializeStore, userVotes, castVote, executeProposal } = useGovernanceStore();
  const proposal = proposals.find(p => p.id === unwrappedParams.id);

  // Live stablecoin treasury balances
  const { usdcBalance: treasuryUSDC, eurcBalance: treasuryEURC } = useTreasury();

  const { address: userAddress } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();

  // Fetch real-time balances
  const { data: usdcBalanceRaw } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  const { data: sarcBalanceRaw } = useReadContract({
    address: SARC_ADDRESS,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  const usdcFormatted = useMemo(() => {
    return usdcBalanceRaw !== undefined ? formatUnits(usdcBalanceRaw as bigint, 6) : "0";
  }, [usdcBalanceRaw]);

  const sarcFormatted = useMemo(() => {
    return sarcBalanceRaw !== undefined ? formatUnits(sarcBalanceRaw as bigint, 18) : "0";
  }, [sarcBalanceRaw]);

  // Check voting power — either USDC > 0 OR sARC > 0
  const hasVotingPower = 
    (usdcBalanceRaw !== undefined && Number(usdcFormatted) > 0) || 
    (sarcBalanceRaw !== undefined && Number(sarcFormatted) > 0);

  // AI analysis states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDecision, setAiDecision] = useState<{
    vote: "FOR" | "AGAINST" | "ABSTAIN";
    reasoning: string;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    confidence: number;
    summary: string;
    concerns: string;
  } | null>(null);
  const [aiError, setAiError] = useState("");
  
  // Optimistic UI state for votes
  const [optimisticVotes, setOptimisticVotes] = useState<{
    forVotes: number;
    againstVotes: number;
    abstainVotes: number;
    totalVotes: number;
  } | null>(null);
  const [optimisticHasVoted, setOptimisticHasVoted] = useState<boolean | null>(null);

  const handleAIAnalysis = async () => {
    setAiLoading(true);
    setAiError("");
    setAiDecision(null);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          proposalData: {
            id: proposal?.id,
            title: proposal?.title,
            description: proposal?.description,
            category: proposal?.category,
            treasuryImpact: proposal?.treasuryImpactValue,
          },
          treasuryData: {
            usdc: treasuryUSDC || 0,
            eurc: treasuryEURC || 0,
          }
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze proposal.");
      }

      setAiDecision(data.decision);
    } catch (err: any) {
      console.error("AI Analysis error:", err);
      setAiError(err?.message || "Encountered an error fetching AI recommendation.");
    } finally {
      setAiLoading(false);
    }
  };
  
  useEffect(() => {
    if (!initialized) initializeStore();
  }, [initialized, initializeStore]);

  // 15-second background polling while proposal details page is active (Phase 7)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        initializeStore();
      }
    }, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        initializeStore();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [initializeStore]);

  // Handle redirect if not found
  useEffect(() => {
    if (initialized && !proposal) {
      router.push("/proposals");
    }
  }, [initialized, proposal, router]);

  const { votingPower: sarcPower } = useToken(walletAddress);
  const { balance: usdcBalance } = useUSDCBalance();

  const activeBalance = useMemo(() => {
    if (!walletAddress) return 0.0;
    const usdcPower = usdcBalance ? parseFloat(usdcBalance) : 0;
    return usdcPower + sarcPower;
  }, [walletAddress, usdcBalance, sarcPower]);
  const [voting, setVoting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [votingError, setVotingError] = useState<string | null>(null);
  const [hasUserVotedOnChain, setHasUserVotedOnChain] = useState(false);

  useEffect(() => {
    async function checkVoted() {
      if (!walletAddress || !proposal) return;
      try {
        const provider = await getResilientProvider();
        const governorAddress = process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS || "0x17D9d585CBB1AF6aa4a3C787116f7ba59651B702";
        const GOVERNOR_ABI = [
          "function hasVoted(uint256 proposalId, address account) external view returns (bool)"
        ];
        const governorContract = new Contract(governorAddress, GOVERNOR_ABI, provider);
        const rawId = Number(proposal.id.replace("SIP-", ""));
        const voted = await governorContract.hasVoted(rawId, walletAddress);
        setHasUserVotedOnChain(voted);
      } catch (err) {
        console.error("Error checking on-chain voted state:", err);
      }
    }
    checkVoted();
  }, [walletAddress, proposal, voting, initialized]);

  const handleCastVote = async (supportValue: number) => {
    if (!userAddress) {
      alert('Please connect your wallet to vote.');
      return;
    }

    if (!proposal) return;

    // Check voting power — anyone with USDC or sARC can vote
    const usdcBal = Number(usdcFormatted) || 0
    const sarcBal = Number(sarcFormatted) || 0

    if (usdcBal <= 0 && sarcBal <= 0) {
      toast.error('You need USDC or sARC tokens to vote')
      return
    }

    // Capture original state for rolling back
    const originalVotes = {
      forVotes: proposal.forVotes,
      againstVotes: proposal.againstVotes,
      abstainVotes: proposal.abstainVotes,
      totalVotes: proposal.totalVotes,
    };
    
    // Apply optimistic updates immediately
    const voteWeight = activeBalance || 1;
    const nextFor = supportValue === 1 ? originalVotes.forVotes + voteWeight : originalVotes.forVotes;
    const nextAgainst = supportValue === 0 ? originalVotes.againstVotes + voteWeight : originalVotes.againstVotes;
    const nextAbstain = supportValue === 2 ? originalVotes.abstainVotes + voteWeight : originalVotes.abstainVotes;
    
    setOptimisticVotes({
      forVotes: nextFor,
      againstVotes: nextAgainst,
      abstainVotes: nextAbstain,
      totalVotes: nextFor + nextAgainst + nextAbstain,
    });
    setOptimisticHasVoted(true);
    toast.success('Vote submitted optimistically! Syncing with Arc...');

    try {
      setVoting(true);
      setVotingError(null);
      setTxHash(null);
      setStatus('Confirming vote on Arc blockchain...');

      let provider
      if (wallets && wallets.length > 0) {
        const activeWallet = wallets[0];
        provider = typeof activeWallet.getEthereumProvider === 'function'
          ? await activeWallet.getEthereumProvider()
          : await (activeWallet as any).getEip1193Provider();
      } else if (typeof window !== 'undefined' && window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        provider = window.ethereum
      } else {
        throw new Error('No wallet connected')
      }

      const walletClient = createWalletClient({
        chain: ARC_CHAIN,
        transport: custom(provider)
      })

      const publicClient = createPublicClient({
        chain: ARC_CHAIN,
        transport: fallback(ARC_RPC_URLS.map(url => http(url)))
      })

      const [address] = await walletClient.getAddresses()
      const rawId = BigInt(proposal.id.replace("SIP-", ""));

      // Dynamically estimate fees
      let gasParams: any = {}
      try {
        const fees = await publicClient.estimateFeesPerGas()
        if (fees.maxFeePerGas && fees.maxPriorityFeePerGas) {
          gasParams.maxFeePerGas = (fees.maxFeePerGas * 130n) / 100n
          gasParams.maxPriorityFeePerGas = (fees.maxPriorityFeePerGas * 130n) / 100n
        } else {
          const gasPrice = await publicClient.getGasPrice()
          gasParams.gasPrice = (gasPrice * 130n) / 100n
        }
      } catch (err) {
        console.warn('Fee estimation failed, falling back to legacy gas price:', err)
        const gasPrice = await publicClient.getGasPrice().catch(() => ARC_GAS.gasPrice)
        gasParams.gasPrice = (gasPrice * 130n) / 100n
      }

      let estimatedVoteGas: bigint = ARC_GAS.vote
      try {
        estimatedVoteGas = await publicClient.estimateContractGas({
          address: CONTRACTS.governor,
          abi: GOVERNOR_ABI,
          functionName: 'castVote',
          args: [rawId, supportValue],
          account: address,
        })
        estimatedVoteGas = (estimatedVoteGas * 120n) / 100n
      } catch (e) {
        console.warn('Vote gas estimation failed:', e)
      }

      const voteTx = await walletClient.writeContract({
        address: CONTRACTS.governor,
        abi: GOVERNOR_ABI,
        functionName: 'castVote',
        args: [rawId, supportValue],
        account: address,
        gas: estimatedVoteGas,
        ...gasParams,
      })

      setTxHash(voteTx);
      setStatus('⏳ Waiting for confirmation...');

      await publicClient.waitForTransactionReceipt({ hash: voteTx })

      setStatus('✅ Vote recorded on Arc');
      toast.success('Vote recorded on-chain! ✅');
      
      // Reactive refetch without reload
      await initializeStore();

      // Clear optimistic states once store is synchronized
      setOptimisticVotes(null);
      setOptimisticHasVoted(null);

    } catch (error: any) {
      console.error('Voting execution failed:', error);
      // Revert optimistic update
      setOptimisticVotes(null);
      setOptimisticHasVoted(false);
      setStatus(null);
      const msg = error?.message || '';
      if (msg.includes('User rejected') || msg.includes('user rejected')) {
        setVotingError('Vote cancelled');
        toast.error('Vote cancelled');
      } else {
        setVotingError(error?.shortMessage || 'Vote failed — please try again');
        toast.error(error?.shortMessage || 'Vote failed — please try again');
      }
    } finally {
      setVoting(false);
    }
  };

  if (!proposal) return <div className="pt-24 min-h-screen flex items-center justify-center text-text-tertiary">Loading...</div>;

  const forVotesDisplay = optimisticVotes ? optimisticVotes.forVotes : (proposal.forVotes || 0);
  const againstVotesDisplay = optimisticVotes ? optimisticVotes.againstVotes : (proposal.againstVotes || 0);
  const abstainVotesDisplay = optimisticVotes ? optimisticVotes.abstainVotes : (proposal.abstainVotes || 0);
  const totalVotesDisplay = optimisticVotes ? optimisticVotes.totalVotes : (proposal.totalVotes || 0);
  const hasUserVotedDisplay = optimisticHasVoted !== null ? optimisticHasVoted : hasUserVotedOnChain;

  const forPercentage = totalVotesDisplay > 0 ? (forVotesDisplay / totalVotesDisplay) * 100 : 0;
  const againstPercentage = totalVotesDisplay > 0 ? (againstVotesDisplay / totalVotesDisplay) * 100 : 0;
  const abstainPercentage = totalVotesDisplay > 0 ? (abstainVotesDisplay / totalVotesDisplay) * 100 : 0;
  
  const userVoteRecord = userVotes[proposal.id];
  const isProposalActive = proposal.status === "Active";
  const isProposalPassed = (proposal.status !== "Active" && proposal.status !== "Pending" && proposal.status !== "Executed" && proposal.forVotes > proposal.againstVotes);



  const handleExecute = async () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    try {
      const activeWallet = wallets && wallets.length > 0 ? wallets[0] : null;
      if (!activeWallet) {
        throw new Error("Active wallet not found");
      }

      // Force Arc Testnet before transaction
      const currentChainId = parseInt(activeWallet.chainId.replace("eip155:", ""));
      if (currentChainId !== 5042002) {
        await activeWallet.switchChain(5042002);
      }

      const ethereumProvider = await activeWallet.getEthereumProvider();
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
        
        {/* RPC Health Banner */}
        <RpcHealthBanner hasLoadedBalance={usdcBalanceRaw !== undefined || sarcBalanceRaw !== undefined} />
        
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
                    <span className="text-text-primary">{(forVotesDisplay / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k VP ({forPercentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-surface-elevated border border-border-subtle h-2 rounded-full overflow-hidden">
                    <div className="bg-success h-full transition-all duration-500" style={{ width: `${forPercentage}%` }} />
                  </div>
                </div>

                {/* Against Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-danger flex items-center gap-1">Against</span>
                    <span className="text-text-primary">{(againstVotesDisplay / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k VP ({againstPercentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-surface-elevated border border-border-subtle h-2 rounded-full overflow-hidden">
                    <div className="bg-danger h-full transition-all duration-500" style={{ width: `${againstPercentage}%` }} />
                  </div>
                </div>

                {/* Abstain Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-muted flex items-center gap-1">Abstain</span>
                    <span className="text-text-primary">{(abstainVotesDisplay / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k VP ({abstainPercentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-surface-elevated border border-border-subtle h-2 rounded-full overflow-hidden">
                    <div className="bg-muted h-full transition-all duration-500" style={{ width: `${abstainPercentage}%` }} />
                  </div>
                </div>
              </div>

              {/* Voting Action Area */}
              <div className="mt-8 pt-6 border-t border-border-subtle space-y-4">
                {votingError && (
                  <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{votingError}</span>
                  </div>
                )}

                {!isAuthenticated ? (
                  <button
                    onClick={login}
                    className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm shadow-[0_0_15px_rgba(124,58,237,0.2)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Wallet className="w-4 h-4" />
                    Connect wallet to vote
                  </button>
                ) : isProposalActive ? (
                  hasUserVotedDisplay ? (
                    <div className="w-full py-3 rounded-xl bg-surface border border-emerald-500/25 flex flex-col items-center justify-center gap-1">
                      <div className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Cast Complete
                      </div>
                      <span className="text-xs text-text-tertiary">Your vote is registered on-chain ✅</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Show voting power */}
                      {hasVotingPower ? (
                        <p className="text-emerald-400 text-xs font-semibold text-center mb-2">
                          ✅ Voting power: {usdcFormatted} USDC + {sarcFormatted} sARC
                        </p>
                      ) : (
                        <p className="text-red-400 text-xs font-semibold text-center mb-2">
                          ⚠️ You need USDC or sARC on Arc Testnet to vote.{" "}
                          <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">
                            Get testnet USDC
                          </a>
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleCastVote(1)}
                          disabled={!hasVotingPower || voting}
                          className="py-3 rounded-xl border border-border-thin bg-surface hover:bg-success/10 hover:border-success/30 hover:text-success text-xs font-extrabold transition-all flex flex-col items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          {voting ? 'Submitting...' : '👍 For'}
                        </button>
                        <button
                          onClick={() => handleCastVote(0)}
                          disabled={!hasVotingPower || voting}
                          className="py-3 rounded-xl border border-border-thin bg-surface hover:bg-danger/10 hover:border-danger/30 hover:text-danger text-xs font-extrabold transition-all flex flex-col items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <ThumbsDown className="w-4 h-4" />
                          {voting ? 'Submitting...' : '👎 Against'}
                        </button>
                        <button
                          onClick={() => handleCastVote(2)}
                          disabled={!hasVotingPower || voting}
                          className="py-3 rounded-xl border border-border-thin bg-surface hover:bg-surface-elevated hover:text-foreground text-xs font-extrabold transition-all flex flex-col items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <CircleDot className="w-4 h-4" />
                          {voting ? 'Submitting...' : '⚪ Abstain'}
                        </button>
                      </div>

                      {voting && (
                        <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs text-purple-300 animate-pulse flex items-center gap-2 justify-center">
                          <Loader2 className="w-4.5 h-4.5 animate-spin" />
                          <span>{status || 'Submitting vote on-chain...'}</span>
                        </div>
                      )}

                      {txHash && (
                        <div className="text-center">
                          <a 
                            href={`https://testnet.arcscan.app/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-bold"
                          >
                            View on ArcScan ✅
                          </a>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <button className="w-full py-3 rounded-xl bg-surface border border-border-thin text-text-tertiary text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                    Voting Terminated
                  </button>
                )}

                <div className="p-3 bg-surface-elevated/40 border border-border-thin rounded-xl text-xs text-center space-y-1">
                  <span className="text-text-tertiary">Real on-chain voting requires gas.</span>
                  <a 
                    href="https://faucet.circle.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary hover:underline font-bold block"
                  >
                    🚰 Claim USDC Gas Faucet
                  </a>
                </div>
              </div>
            </GlassCard>

            {/* AI Agent Analysis Card */}
            <GlassCard className="p-6 space-y-4 border border-primary/20 bg-gradient-to-br from-primary/[0.01] to-transparent relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
              
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border-thin pb-3">
                <Bot className="w-4 h-4 text-primary animate-pulse" />
                AI Agent Governance
              </h3>

              {aiLoading ? (
                <div className="py-6 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  <p className="text-xs text-text-tertiary font-medium">Agent analyzing proposal...</p>
                </div>
              ) : aiError ? (
                <div className="space-y-3">
                  <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{aiError}</span>
                  </div>
                  <button
                    onClick={handleAIAnalysis}
                    className="w-full py-2 bg-primary/10 border border-primary/25 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Retry Analysis
                  </button>
                </div>
              ) : aiDecision ? (
                <div className="space-y-4 text-xs">
                  {/* Recommendation Header */}
                  <div className="flex justify-between items-center bg-surface border border-border-thin rounded-xl p-3">
                    <span className="text-text-tertiary">Recommendation</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1.5 uppercase text-[10px] tracking-wider ${
                      aiDecision.vote === "FOR" ? "bg-success/10 border-success/20 text-success" :
                      aiDecision.vote === "AGAINST" ? "bg-danger/10 border-danger/20 text-danger" :
                      "bg-surface-elevated border-border-thin text-text-primary"
                    }`}>
                      {aiDecision.vote === "FOR" ? "FOR ✅" :
                       aiDecision.vote === "AGAINST" ? "AGAINST ❌" :
                       "ABSTAIN ⚪"}
                    </span>
                  </div>

                  {/* Confidence and Risk */}
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div className="space-y-1">
                      <span className="text-[10px] text-text-tertiary block font-bold uppercase tracking-wider">Confidence</span>
                      <span className="font-bold text-white font-mono">{aiDecision.confidence}%</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-text-tertiary block font-bold uppercase tracking-wider">Risk Level</span>
                      <span className={`font-bold ${
                        aiDecision.riskLevel === "LOW" ? "text-success" :
                        aiDecision.riskLevel === "MEDIUM" ? "text-warning" :
                        "text-danger"
                      }`}>{aiDecision.riskLevel}</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-text-tertiary block font-bold uppercase tracking-wider">Summary</span>
                    <p className="text-text-secondary leading-normal">{aiDecision.summary}</p>
                  </div>

                  {/* Reasoning */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-text-tertiary block font-bold uppercase tracking-wider">Reasoning</span>
                    <p className="text-text-secondary leading-normal bg-surface/30 p-2.5 rounded-xl border border-border-thin italic">
                      &quot;{aiDecision.reasoning}&quot;
                    </p>
                  </div>

                  {/* Concerns if present */}
                  {aiDecision.concerns && aiDecision.concerns.toLowerCase() !== "none" && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-red-400 block font-bold uppercase tracking-wider">Key Concerns</span>
                      <p className="text-text-secondary font-semibold leading-normal text-red-300 bg-danger/5 border border-danger/10 p-2 rounded-xl">
                        ⚠️ {aiDecision.concerns}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-border-thin pt-3.5 text-[10px] text-text-tertiary leading-normal flex items-start gap-1.5 italic">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted" />
                    <span>Note: This is an AI recommendation. Always do your own research.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <p className="text-xs text-text-tertiary leading-normal">
                    Let SynArc's autonomous agent analyze the treasury impact and risk profile of this proposal.
                  </p>
                  <button
                    onClick={handleAIAnalysis}
                    className="w-full py-3 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/95 transition-all shadow-[0_0_15px_rgba(124,58,237,0.15)] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Bot className="w-4 h-4" />
                    Get AI Analysis
                  </button>
                </div>
              )}
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
                  <span className="text-text-primary font-mono">{totalVotesDisplay.toLocaleString()}</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Developer Debug Panel (Phase 8) */}
        {(process.env.NODE_ENV === "development" || (typeof window !== "undefined" && window.location.search.includes("debug=true"))) && (
          <GlassCard className="p-6 border border-warning/20 bg-warning/5 rounded-2xl mt-8">
            <div className="flex items-center gap-2 mb-4 text-warning font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-warning animate-pulse" />
              <span>🛠 Arc Developer Debug Panel</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1.5">
                <div><span className="text-text-tertiary">Governor Address:</span> <span className="text-white">{process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS || "0x17D9d585CBB1AF6aa4a3C787116f7ba59651B702"}</span></div>
                <div><span className="text-text-tertiary">RPC URL:</span> <span className="text-white">{process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network"}</span></div>
                <div><span className="text-text-tertiary">Current Block:</span> <span className="text-primary font-bold">{currentBlock || "Loading..."}</span></div>
              </div>
              <div className="space-y-1.5">
                <div><span className="text-text-tertiary">Wallet Address:</span> <span className="text-white">{walletAddress || "Not Connected"}</span></div>
                <div><span className="text-text-tertiary">Voting Power:</span> <span className="text-success font-bold">{activeBalance.toFixed(2)} USDC/sARC</span></div>
                <div><span className="text-text-tertiary">Proposal State:</span> <span className="text-white font-bold">{proposal.status}</span></div>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
