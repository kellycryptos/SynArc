"use client";

import { useState, useEffect, useMemo, use } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { useAuth } from "@/hooks/auth/useAuth";
import { useTreasury } from "@/hooks/useTreasury";
import { useToken } from "@/hooks/useToken";
import { getResilientProvider } from "@/lib/rpc/config";
import { arcPublicClient } from "@/lib/arc/config";
import { toast } from "react-hot-toast";
import { parseArcError } from "@/lib/utils";

import { useWriteContract, useSwitchChain } from "wagmi";
import { formatUnits, createWalletClient, createPublicClient, fallback, custom, http } from "viem";
import { GovernorABI, ERC20ABI } from "@/lib/governance/contracts";
import { ARC_GAS_CONFIG } from "@/lib/constants";
import { writeWithRetry, getSigner, enforceChain, getAuthenticatedClient, waitForTransaction, getAggressiveGasParams, selectActiveWallet } from "@/lib/tx-helper";
import { ARC_GAS, ARC_CHAIN, ARC_RPC_URLS, CONTRACTS } from "@/lib/arc-config";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as `0x${string}`;
const SARC_ADDRESS = (process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e") as `0x${string}`;
const GOVERNOR_ABI = GovernorABI;
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallets as usePrivyWallets } from "@privy-io/react-auth";
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
  Wallet,
  Zap
} from "lucide-react";

export default function ProposalDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { isAuthenticated, walletAddress, login, isCircle } = useAuth();
  // Safe: Circle wallet does not register with Privy wallets list
  const { wallets: privyWallets } = usePrivyWallets();
  const wallets = privyWallets ?? [];
  const { currentBlock } = useArcRpcHealth();

  const { proposals, initialized, initializeStore, userVotes, castVote, executeProposal } = useGovernanceStore();
  const proposal = proposals.find(p => p.id === unwrappedParams.id);

  // Live stablecoin treasury balances
  const { usdcBalance: treasuryUSDC, eurcBalance: treasuryEURC } = useTreasury();

  const userAddress = walletAddress ? (walletAddress as `0x${string}`) : undefined;
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();

  // Fetch real-time balances — useToken now provides both sARC and USDC
  const {
    votingPower: sarcPower,
    sarcBalance,
    usdcBalance: usdcFromToken,
    totalDisplayPower,
    needsDelegation,
    refetch: refetchToken
  } = useToken(walletAddress);

  // USDC formatted for display (comes from useToken, 6-decimal aware)
  const usdcFormatted = usdcFromToken > 0 ? usdcFromToken.toFixed(2) : "0";
  const sarcFormatted = sarcPower > 0
    ? sarcPower.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : "0";

  // Check voting power — USDC or delegated sARC
  const hasVotingPower = usdcFromToken > 0 || sarcPower > 0;

  // Delegation state
  const [delegating, setDelegating] = useState(false);
  const [delegateSuccess, setDelegateSuccess] = useState(false);

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

  const activeBalance = useMemo(() => {
    if (!walletAddress) return 0.0;
    return totalDisplayPower;
  }, [walletAddress, totalDisplayPower]);
  const [voting, setVoting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [votingError, setVotingError] = useState<string | null>(null);
  const [hasUserVotedOnChain, setHasUserVotedOnChain] = useState(false);

  interface VoterRecord {
    voter: string;
    support: number; // 0=Against, 1=For, 2=Abstain
    weight: number;
    reason: string;
  }
  const [voters, setVoters] = useState<VoterRecord[]>([]);
  const [loadingVoters, setLoadingVoters] = useState(true);

  useEffect(() => {
    async function fetchVoters() {
      if (!proposal) return;
      const rawId = Number(proposal.id.replace("SIP-", ""));
      if (isNaN(rawId)) {
        setLoadingVoters(false);
        return;
      }
      try {
        const provider = await getResilientProvider();
        const governorContract = new Contract(
          process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS || "0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e",
          GovernorABI,
          provider
        );
        const filter = governorContract.filters.VoteCast(null, rawId);
        const events = await governorContract.queryFilter(filter);
        
        const list: VoterRecord[] = events.map((event: any) => {
          const parsed = governorContract.interface.parseLog({
            topics: [...event.topics],
            data: event.data
          });
          return {
            voter: parsed?.args.voter || "",
            support: Number(parsed?.args.support),
            weight: Number(formatUnits(parsed?.args.weight || 0n, 18)),
            reason: parsed?.args.reason || ""
          };
        });
        
        list.sort((a, b) => b.weight - a.weight);
        setVoters(list);
      } catch (err) {
        console.error("Failed to fetch voters", err);
      } finally {
        setLoadingVoters(false);
      }
    }
    fetchVoters();
  }, [proposal, voting, initialized]);

  useEffect(() => {
    async function checkVoted() {
      if (!walletAddress || !proposal) return;

      const isSimulated = proposal.id.includes("-") && isNaN(Number(proposal.id.replace("SIP-", "")));
      if (isSimulated) {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("synarc_simulated_votes");
          const votes = stored ? JSON.parse(stored) : {};
          if (votes[proposal.id]) {
            setHasUserVotedOnChain(true);
            return;
          }
        }
        if (isSimulated) {
          setHasUserVotedOnChain(false);
          return;
        }
      }

      try {
        const provider = await getResilientProvider();
        const governorAddress = process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS || "0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e";
        const GOVERNOR_ABI = [
          "function hasVoted(uint256 proposalId, address account) external view returns (bool)"
        ];
        const governorContract = new Contract(governorAddress, GOVERNOR_ABI, provider);
        const rawId = Number(proposal.id.replace("SIP-", ""));
        if (!isNaN(rawId)) {
          const voted = await governorContract.hasVoted(rawId, walletAddress);
          setHasUserVotedOnChain(voted);
        } else {
          setHasUserVotedOnChain(false);
        }
      } catch (err) {
        console.error("Error checking on-chain voted state:", err);
      }
    }
    checkVoted();
  }, [walletAddress, proposal, voting, initialized, isCircle]);

  const handleDelegate = async () => {
    if (!userAddress) return;
    setDelegating(true);
    try {
      const { walletClient, publicClient, address } = await getAuthenticatedClient(wallets, 5042002, walletAddress);
      const SARC_DELEGATE_ABI = [{
        name: "delegate",
        type: "function",
        inputs: [{ name: "delegatee", type: "address" }],
        outputs: [],
        stateMutability: "nonpayable",
      }] as const;

      const gasParams = await getAggressiveGasParams(publicClient);
      const hash = await walletClient.writeContract({
        address: SARC_ADDRESS,
        abi: SARC_DELEGATE_ABI,
        functionName: "delegate",
        args: [address],
        account: address,
        gas: 120000n,
        ...gasParams,
      });
      await waitForTransaction(publicClient, hash);
      setDelegateSuccess(true);
      toast.success("✅ sARC delegated! You now have voting power.");
      // Refetch voting power immediately after delegation
      await refetchToken();
    } catch (err: any) {
      toast.error(err?.message || "Delegation failed. Please try again.");
    } finally {
      setDelegating(false);
    }
  };

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

    const isSimulated = proposal.id.includes("-") && isNaN(Number(proposal.id.replace("SIP-", "")));
    if (isSimulated) {
      try {
        setVoting(true);
        setVotingError(null);
        setTxHash(null);
        setStatus('Confirming vote on Arc blockchain (Circle Simulation)...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockHash = "0x" + Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
        
        if (typeof window !== "undefined") {
          const storedVotes = localStorage.getItem("synarc_simulated_votes");
          const votes = storedVotes ? JSON.parse(storedVotes) : {};
          votes[proposal.id] = { supportValue, timestamp: new Date().toISOString() };
          localStorage.setItem("synarc_simulated_votes", JSON.stringify(votes));

          const storedProposals = localStorage.getItem("synarc_simulated_proposals");
          if (storedProposals) {
            const proposals = JSON.parse(storedProposals);
            const foundIdx = proposals.findIndex((p: any) => p.id === proposal.id);
            if (foundIdx !== -1) {
              if (supportValue === 1) proposals[foundIdx].forVotes += voteWeight;
              else if (supportValue === 0) proposals[foundIdx].againstVotes += voteWeight;
              else if (supportValue === 2) proposals[foundIdx].abstainVotes += voteWeight;
              proposals[foundIdx].totalVotes += voteWeight;
              localStorage.setItem("synarc_simulated_proposals", JSON.stringify(proposals));
            }
          }
        }

        // Force store re-initialization (bypasses 3-minute staleness cache)
        useGovernanceStore.getState().initializeStore(undefined, true);

        setTxHash(mockHash);
        setStatus('Vote registered!');
        toast.success('Vote cast successfully (Circle Simulation)');
        
        setHasUserVotedOnChain(true);
        setOptimisticHasVoted(true);
        setVoting(false);
        return;
      } catch (err: any) {
        setVoting(false);
        setVotingError(err);
        toast.error(err.message || 'Failed to cast vote');
        return;
      }
    }

    try {
      setVoting(true);
      setVotingError(null);
      setTxHash(null);
      setStatus('Confirming vote on Arc blockchain...');

      // Get provider and client — Privy wallet, Circle wallet OR external wallet
      const { walletClient, publicClient, address } = await getAuthenticatedClient(wallets, 5042002, walletAddress);

      // Dynamically estimate fees using low-latency and aggressive parameters
      const gasParams = await getAggressiveGasParams(publicClient);

      // Check if user has sARC but has not self-delegated
      const SARC_DELEGATE_ABI = [{
        name: "delegates",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "address" }]
      }, {
        name: "delegate",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "delegatee", type: "address" }],
        outputs: []
      }, {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }]
      }] as const;

      const currentDelegate = await publicClient.readContract({
        address: SARC_ADDRESS,
        abi: SARC_DELEGATE_ABI,
        functionName: "delegates",
        args: [address]
      });

      const balance = await publicClient.readContract({
        address: SARC_ADDRESS,
        abi: SARC_DELEGATE_ABI,
        functionName: "balanceOf",
        args: [address]
      });

      if (balance > 0n && currentDelegate === "0x0000000000000000000000000000000000000000") {
        setStatus('Activating voting power (one-time delegation)...');
        toast.loading('Activating voting power (one-time delegation)...');
        
        const delegateTx = await walletClient.writeContract({
          address: SARC_ADDRESS,
          abi: SARC_DELEGATE_ABI,
          functionName: "delegate",
          args: [address],
          gas: 150000n,
          ...gasParams
        });
        
        await waitForTransaction(publicClient, delegateTx);
        toast.dismiss();
        toast.success('Voting power activated successfully!');
        await refetchToken().catch(() => {});
      }

      const rawId = BigInt(proposal.id.replace("SIP-", ""));


      let estimatedVoteGas = 350000n; // Slightly higher gas limit floor
      try {
        const est = await publicClient.estimateContractGas({
          address: CONTRACTS.governor,
          abi: GOVERNOR_ABI,
          functionName: 'castVote',
          args: [rawId, supportValue],
          account: address,
        })
        estimatedVoteGas = (est * 150n) / 100n;
        if (estimatedVoteGas < 350000n) estimatedVoteGas = 350000n;
      } catch (e) {
        console.warn('Vote gas estimation failed:', e)
      }

      setStatus('Sending transaction...');
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

      await waitForTransaction(publicClient, voteTx);

      setStatus('✅ Vote recorded on Arc');
      toast.success('Vote recorded on-chain! ✅');
      
      // Reactive force-refetch — bypasses 3-minute staleness cache so UI updates immediately
      await initializeStore(undefined, true);

      // Clear optimistic states once store is synchronized
      setOptimisticVotes(null);
      setOptimisticHasVoted(null);

    } catch (error: any) {
      console.error('Voting execution failed:', error);
      // Revert optimistic update
      setOptimisticVotes(null);
      setOptimisticHasVoted(false);
      setStatus(null);
      
      const parsedMsg = parseArcError(error);
      setVotingError(parsedMsg);
      toast.error(parsedMsg);
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

    const isSimulated = proposal.id.includes("-") && isNaN(Number(proposal.id.replace("SIP-", "")));
    if (isSimulated) {
      try {
        toast.success("Initiating proposal execution simulation...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("synarc_simulated_proposals");
          if (stored) {
            const proposalsList = JSON.parse(stored);
            const foundIdx = proposalsList.findIndex((p: any) => p.id === proposal.id);
            if (foundIdx !== -1) {
              proposalsList[foundIdx].status = "Executed";
              if (!proposalsList[foundIdx].timeline) {
                proposalsList[foundIdx].timeline = [];
              }
              proposalsList[foundIdx].timeline.push({
                title: "Transaction Executed",
                timestamp: new Date().toISOString(),
                status: "Executed"
              });
              localStorage.setItem("synarc_simulated_proposals", JSON.stringify(proposalsList));
            }
          }
        }

        // Force store re-initialization (bypasses staleness cache)
        useGovernanceStore.getState().initializeStore(undefined, true);
        toast.success("Proposal executed successfully (Circle Simulation)!");
      } catch (err: any) {
        toast.error(err.message || "Failed to execute proposal");
      }
      return;
    }

    try {
      const activeWallet = selectActiveWallet(wallets, walletAddress);
      if (!activeWallet) {
        throw new Error("Active wallet not found");
      }

      // Force Arc Testnet before transaction with robust switching
      const ethereumProvider = await enforceChain(activeWallet, 5042002);
      const browserProvider = new BrowserProvider(ethereumProvider, {
        chainId: 5042002,
        name: "Arc Testnet"
      });
      const signer = await browserProvider.getSigner(activeWallet.address);

      await executeProposal(proposal.id, signer);
    } catch (err) {
      console.error("Proposal execution failed", err);
    }
  };

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* RPC Health Banner */}
        <RpcHealthBanner hasLoadedBalance={usdcFormatted !== "0" || sarcPower > 0} />
        
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

        {/* Large Withdrawal Warning Banner */}
        {Math.abs(proposal.treasuryImpactValue) > 50 && (
          <div className="p-4 bg-warning/15 border border-warning/30 rounded-2xl text-xs text-warning flex items-start gap-3 shadow-[0_0_20px_rgba(245,158,11,0.05)]">
            <AlertCircle className="w-5 h-5 shrink-0 text-warning mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-amber-300">Large Treasury Withdrawal Safeguard Active</p>
              <p className="text-text-secondary leading-normal">
                This proposal requests a withdrawal of <span className="font-bold text-white font-mono">{Math.abs(proposal.treasuryImpactValue).toLocaleString()} USDC</span>, which exceeds the secure threshold of <span className="font-bold text-white">50 USDC</span>. 
                Accordingly, this proposal requires a <span className="font-bold text-white">66% supermajority</span> of voting power to pass, and will undergo a mandatory <span className="font-bold text-white">24-hour execution timelock</span> in the Treasury if approved.
              </p>
            </div>
          </div>
        )}

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
                      <span className="text-text-secondary">
                        {proposal.treasuryImpactValue !== 0 ? "Recipient Address" : "Target Contract"}
                      </span>
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
            {/* Voters List */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                <span>Voters Transparency</span>
                <span className="text-xs text-text-tertiary bg-surface-elevated px-2.5 py-0.5 rounded-full border border-border-thin font-bold">
                  {voters.length} {voters.length === 1 ? 'voter' : 'voters'}
                </span>
              </h3>
              
              {loadingVoters ? (
                <div className="py-4 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                </div>
              ) : voters.length > 0 ? (
                <div className="space-y-3.5 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {voters.map((v, i) => (
                    <div key={i} className="flex justify-between items-center text-xs border-b border-border-thin/40 pb-3 last:border-b-0 last:pb-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link href={`https://testnet.arcscan.app/address/${v.voter}`} target="_blank" className="font-mono text-primary hover:underline">
                            {v.voter.slice(0, 6)}...{v.voter.slice(-4)}
                          </Link>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            v.support === 1 ? "bg-success/15 text-success border border-success/20" :
                            v.support === 0 ? "bg-danger/15 text-danger border border-danger/20" :
                            "bg-surface-elevated text-text-tertiary border border-border-thin"
                          }`}>
                            {v.support === 1 ? "FOR" : v.support === 0 ? "AGAINST" : "ABSTAIN"}
                          </span>
                        </div>
                        {v.reason && (
                          <p className="text-text-tertiary italic text-[11px] leading-relaxed">&quot;{v.reason}&quot;</p>
                        )}
                      </div>
                      <span className="font-mono font-bold text-white text-[11px]">{v.weight.toLocaleString(undefined, { maximumFractionDigits: 0 })} VP</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-tertiary text-center py-4">No votes cast yet.</p>
              )}
            </GlassCard>
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
                    className="w-full py-3.5 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white-keep font-bold text-sm shadow-[0_0_15px_rgba(124,58,237,0.2)] flex items-center justify-center gap-2 cursor-pointer"
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
                      {/* Delegation Banner — shown when user has sARC but hasn't delegated */}
                      {needsDelegation && !isCircle && !delegateSuccess && (
                        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs space-y-2">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Zap className="w-3.5 h-3.5" />
                            Activate your {sarcBalance.toLocaleString()} sARC voting power
                          </div>
                          <p className="text-amber-400/80 leading-snug">sARC uses on-chain checkpoints (ERC20Votes). You must delegate to yourself once to activate your votes.</p>
                          <button
                            onClick={handleDelegate}
                            disabled={delegating}
                            className="w-full py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                          >
                            {delegating ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Delegating...</>
                            ) : (
                              <><Zap className="w-3.5 h-3.5" /> Delegate to Self (1-time)</>  
                            )}
                          </button>
                        </div>
                      )}

                      {/* Show voting power */}
                      {hasVotingPower ? (
                        <div className="mb-2 space-y-1">
                          <p className="text-emerald-400 text-xs font-semibold text-center">
                            ✅ {usdcFormatted} USDC + {sarcFormatted} sARC
                          </p>
                          <p className="text-text-tertiary text-[10px] text-center leading-tight">
                            On-chain vote weight: <span className="text-purple-400 font-bold">{sarcFormatted} sARC</span>
                          </p>
                        </div>
                      ) : sarcBalance > 0 && !delegateSuccess ? null : (
                        <p className="text-red-400 text-xs font-semibold text-center mb-2">
                          ⚠️ You need USDC or sARC on Arc Testnet to vote.{" "}
                          <a href="/faucet" className="text-primary hover:underline font-bold">
                            Get sARC from faucet
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
                    className="w-full py-3 bg-accent-purple text-white-keep font-bold text-xs rounded-xl hover:bg-accent-purple/90 transition-all shadow-[0_0_15px_rgba(124,58,237,0.15)] flex items-center justify-center gap-1.5 cursor-pointer"
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
                <div><span className="text-text-tertiary">Governor Address:</span> <span className="text-white">{process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS || "0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e"}</span></div>
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
