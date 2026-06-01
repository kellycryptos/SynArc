"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { DAO_REGISTRY, DAOInfo } from "@/data/daos";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { useTreasury } from "@/hooks/useTreasury";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
  Building, 
  Users, 
  Shield, 
  FileText, 
  TrendingUp, 
  Coins, 
  ExternalLink, 
  Copy, 
  Check, 
  Plus, 
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Search,
  Calendar,
  Wallet,
  Play,
  Send,
  X
} from "lucide-react";
import Link from "next/link";
import { ethers, Contract, formatUnits, parseUnits, BrowserProvider } from "ethers";
import { useAuth } from "@/hooks/auth/useAuth";
import { useWallets } from "@privy-io/react-auth";
import { GOVERNANCE_CONTRACTS, ERC20ABI, GovernorABI } from "@/lib/governance/contracts";
import { getResilientProvider } from "@/lib/rpc/config";
import { enforceChain } from "@/lib/tx-helper";

interface Member {
  id: string;
  address: string;
  tokenBalance: number;
  usdcBalance: number;
  joinDate: string;
  timestamp: number;
}

export default function DAODetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const { isAuthenticated, walletAddress, login } = useAuth();
  const { wallets } = useWallets();

  // Find DAO config in registry
  const dao = useMemo(() => {
    return DAO_REGISTRY.find(d => d.id === id);
  }, [id]);

  const [activeTab, setActiveTab] = useState<"overview" | "proposals" | "treasury" | "members">("overview");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Store bindings
  const { 
    proposals, 
    metrics, 
    treasuryActivities, 
    initialized, 
    initializeStore, 
    submitProposal 
  } = useGovernanceStore();

  // Treasury bindings (dynamic hook parameter)
  const { 
    balance: treasuryVal, 
    usdcBalance, 
    eurcBalance, 
    activities, 
    loading: treasuryLoading,
    refetch: refetchTreasury
  } = useTreasury(dao?.treasuryAddress);

  // Members state
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);

  // Proposal modal state
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposalData, setProposalData] = useState({
    title: "",
    description: "",
    category: "Infrastructure",
    treasuryImpactValue: 0,
    executionTarget: "",
    votingDuration: 3,
  });
  const [submittingProposal, setSubmittingProposal] = useState(false);

  // Deposit modal state
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositToken, setDepositToken] = useState<"USDC" | "EURC">("USDC");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [depositError, setDepositError] = useState("");

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(field);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // 1. Initialize store for this specific DAO
  useEffect(() => {
    if (dao && dao.governorAddress && dao.treasuryAddress && dao.tokenAddress) {
      initializeStore({
        id: dao.id,
        governorAddress: dao.governorAddress,
        treasuryAddress: dao.treasuryAddress,
        tokenAddress: dao.tokenAddress
      });
    }
  }, [dao, initializeStore]);

  // 2. Fetch Members dynamically using this DAO's tokenAddress
  const fetchMembers = useCallback(async () => {
    if (!dao || !dao.tokenAddress) return;
    try {
      setMembersLoading(true);
      setMembersError(null);

      const provider = await getResilientProvider();
      const tokenContract = new Contract(dao.tokenAddress, ERC20ABI, provider);
      const usdcContract = new Contract("0x3600000000000000000000000000000000000000", ERC20ABI, provider);

      // Scrape token Transfers
      const filter = tokenContract.filters.Transfer();
      const latestBlock = await provider.getBlockNumber();
      const chunkSize = 5000;
      const events = [];
      
      for (let i = 0; i <= latestBlock; i += chunkSize) {
        const toBlock = Math.min(i + chunkSize - 1, latestBlock);
        const chunk = await tokenContract.queryFilter(filter, i, toBlock);
        events.push(...chunk);
      }

      const holders = new Set<string>();
      const holderFirstBlock = new Map<string, number>();

      events.forEach(event => {
        const log = event as ethers.EventLog;
        if (log.args) {
          const from = log.args[0] as string;
          const to = log.args[1] as string;
          const blockNum = event.blockNumber;
          
          if (to && to !== ethers.ZeroAddress) {
            holders.add(to);
            const current = holderFirstBlock.get(to);
            if (current === undefined || blockNum < current) {
              holderFirstBlock.set(to, blockNum);
            }
          }
          if (from && from !== ethers.ZeroAddress) {
            holders.add(from);
            const current = holderFirstBlock.get(from);
            if (current === undefined || blockNum < current) {
              holderFirstBlock.set(from, blockNum);
            }
          }
        }
      });

      // Get timestamps
      const distinctBlocks = Array.from(new Set(Array.from(holderFirstBlock.values())));
      const blockMap = new Map<number, number>();

      await Promise.all(
        distinctBlocks.slice(0, 20).map(async (blockNum) => { // Cap distinct blocks to avoid timeouts on large tables
          try {
            const block = await provider.getBlock(blockNum);
            if (block) {
              blockMap.set(blockNum, block.timestamp);
            }
          } catch (err) {
            console.error(err);
          }
        })
      );

      const memberList: Member[] = await Promise.all(
        Array.from(holders).map(async (holder, idx) => {
          const [tokenBal, usdcBal] = await Promise.all([
            tokenContract.balanceOf(holder).catch(() => 0n),
            usdcContract.balanceOf(holder).catch(() => 0n)
          ]);

          const tokenBalanceNum = Number(formatUnits(tokenBal, 18));
          const usdcBalanceNum = Number(formatUnits(usdcBal, 6));
          const firstBlock = holderFirstBlock.get(holder);
          const timestamp = firstBlock ? (blockMap.get(firstBlock) || (Date.now() / 1000)) : (Date.now() / 1000);
          const joinDate = new Date(timestamp * 1000).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric"
          });

          return {
            id: idx.toString(),
            address: holder,
            tokenBalance: tokenBalanceNum,
            usdcBalance: usdcBalanceNum,
            joinDate,
            timestamp,
          };
        })
      );

      const activeMembers = memberList
        .filter(m => m.tokenBalance > 0)
        .sort((a, b) => b.tokenBalance - a.tokenBalance);

      setMembers(activeMembers);
    } catch (err: any) {
      console.error(err);
      setMembersError(err.message || "Failed to load members.");
    } finally {
      setMembersLoading(false);
    }
  }, [dao]);

  useEffect(() => {
    if (activeTab === "members") {
      fetchMembers();
    }
  }, [activeTab, fetchMembers]);

  // Handle Proposal Submission
  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      login();
      return;
    }
    if (!proposalData.title || !proposalData.description) return;

    try {
      setSubmittingProposal(true);
      const activeWallet = wallets && wallets.length > 0 ? wallets[0] : null;
      if (!activeWallet) {
        throw new Error("Active wallet not found");
      }

      // Force Arc Testnet before transaction with robust switching
      const ethereumProvider = await enforceChain(activeWallet, 5042002);
      const provider = new BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();

      await submitProposal({
        title: proposalData.title,
        description: proposalData.description,
        category: proposalData.category,
        treasuryImpactValue: -Math.abs(proposalData.treasuryImpactValue),
        executionTarget: proposalData.executionTarget || "0x0000000000000000000000000000000000000000",
        votingDuration: proposalData.votingDuration,
        proposer: walletAddress || ""
      }, signer);

      setIsProposalModalOpen(false);
      setProposalData({
        title: "",
        description: "",
        category: "Infrastructure",
        treasuryImpactValue: 0,
        executionTarget: "",
        votingDuration: 3,
      });
    } catch (err: any) {
      alert(err.message || "Failed to submit proposal");
    } finally {
      setSubmittingProposal(false);
    }
  };

  // Handle Treasury Deposit
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      login();
      return;
    }
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;

    try {
      setDepositing(true);
      setDepositError("");
      const activeWallet = wallets && wallets.length > 0 ? wallets[0] : null;
      if (!activeWallet) {
        throw new Error("Active wallet not found");
      }

      // Force Arc Testnet before transaction with robust switching
      const ethereumProvider = await enforceChain(activeWallet, 5042002);
      const provider = new BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();

      // Deployed dynamic treasury contract instance
      const treasuryAddress = dao?.treasuryAddress || "";
      const treasuryContract = new Contract(treasuryAddress, [
        "function depositUSDC(uint256 amount) external",
        "function depositEURC(uint256 amount) external"
      ], signer);

      const tokenAddress = depositToken === "USDC" 
        ? "0x3600000000000000000000000000000000000000" // USDC stablecoin
        : "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a"; // EURC stablecoin

      const tokenContract = new Contract(tokenAddress, ERC20ABI, signer);
      const amountWei = parseUnits(depositAmount, 6);

      // 1. Approve allowance
      const approveTx = await tokenContract.approve(treasuryAddress, amountWei);
      await approveTx.wait();

      // 2. Deposit
      const depositTx = depositToken === "USDC"
        ? await treasuryContract.depositUSDC(amountWei)
        : await treasuryContract.depositEURC(amountWei);
      await depositTx.wait();

      setDepositAmount("");
      setIsDepositModalOpen(false);
      refetchTreasury();
    } catch (err: any) {
      console.error(err);
      setDepositError(err.message || "Failed to process deposit");
    } finally {
      setDepositing(false);
    }
  };

  if (!dao || !dao.governorAddress) {
    return (
      <div className="pt-24 min-h-screen text-center flex flex-col justify-center items-center gap-6 px-4">
        <div className="max-w-md space-y-4 bg-surface-elevated/40 border border-border-thin p-8 rounded-2xl backdrop-blur-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-extrabold text-white bg-gradient-to-br from-purple-deep via-primary/30 to-arc-blue border border-primary/20 shadow-md mx-auto mb-4">
            {dao?.name.slice(0, 2).toUpperCase()}
          </div>
          <h3 className="font-extrabold text-white text-2xl">Ecosystem Partner Profile</h3>
          <p className="text-muted text-sm leading-relaxed">
            {dao?.name} is a featured ecosystem partner. On-chain governance dashboard and operations are managed directly on their native platform.
          </p>
          {dao?.website && (
            <a
              href={dao.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] cursor-pointer mt-4"
            >
              Visit {dao.name} Website <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
        <Link href="/daos" className="flex items-center gap-2 text-xs font-bold text-primary hover:underline mt-4">
          <ArrowLeft className="w-4 h-4" />
          Back to DAO Registry
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border-thin">
        <div className="space-y-4">
          <Link href="/daos" className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Registry
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-extrabold text-white bg-gradient-to-br from-purple-deep via-primary/30 to-arc-blue border border-primary/20 shadow-md">
              {dao.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">{dao.name}</h1>
                <span className="px-2.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                  {dao.category}
                </span>
              </div>
              <p className="text-muted text-sm mt-1">{dao.description}</p>
            </div>
          </div>
        </div>

        {/* Addresses Box */}
        <div className="p-4 bg-surface-elevated/40 border border-border-thin rounded-2xl space-y-2.5 max-w-sm w-full font-mono text-[10px] text-muted self-start lg:self-center">
          <div className="flex items-center justify-between gap-4">
            <span>Governor:</span>
            <div className="flex items-center gap-1.5 text-white font-bold">
              <span>{dao.governorAddress ? `${dao.governorAddress.slice(0, 8)}...${dao.governorAddress.slice(-6)}` : "None"}</span>
              <button 
                onClick={() => copyToClipboard(dao.governorAddress || "", "gov")} 
                className="hover:text-primary transition-colors cursor-pointer"
              >
                {copiedAddress === "gov" ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Treasury:</span>
            <div className="flex items-center gap-1.5 text-white font-bold">
              <span>{dao.treasuryAddress ? `${dao.treasuryAddress.slice(0, 8)}...${dao.treasuryAddress.slice(-6)}` : "None"}</span>
              <button 
                onClick={() => copyToClipboard(dao.treasuryAddress || "", "treas")} 
                className="hover:text-primary transition-colors cursor-pointer"
              >
                {copiedAddress === "treas" ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Treasury Capital</span>
            <h3 className="text-2xl font-extrabold text-white mt-1.5">
              ${treasuryVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Coins className="w-5 h-5" />
          </div>
        </GlassCard>
        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Active Proposals</span>
            <h3 className="text-2xl font-extrabold text-white mt-1.5">
              {proposals.filter(p => p.status === "Active").length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-success shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </GlassCard>
        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Voters / Members</span>
            <h3 className="text-2xl font-extrabold text-white mt-1.5">
              {metrics.daoMembers}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-arc-blue/10 border border-arc-blue/20 flex items-center justify-center text-arc-blue shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </GlassCard>
        <GlassCard className="p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Participation</span>
            <h3 className="text-2xl font-extrabold text-white mt-1.5">{metrics.governanceParticipation}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-glow/10 border border-purple-glow/20 flex items-center justify-center text-purple-300 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </GlassCard>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 overflow-x-auto border-b border-border-thin pb-px hide-scrollbar">
        {[
          { id: "overview", label: "Overview", icon: Building },
          { id: "proposals", label: "Proposals", icon: FileText },
          { id: "treasury", label: "Treasury Activities", icon: Coins },
          { id: "members", label: "DAO Members", icon: Users }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
                isActive 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted hover:text-white"
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        
        {/* OVERVIEW PANEL */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: General proposals summary */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-extrabold text-white">Recent Proposals</h3>
                <button onClick={() => setActiveTab("proposals")} className="text-xs text-primary hover:underline font-bold flex items-center gap-1">
                  View Feed <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-4">
                {proposals.slice(0, 3).length === 0 ? (
                  <GlassCard className="p-8 text-center text-muted">
                    No proposals created yet. Be the first to build a proposal.
                  </GlassCard>
                ) : (
                  proposals.slice(0, 3).map((proposal) => (
                    <Link href={`/proposals/${proposal.id}`} key={proposal.id} className="block group">
                      <GlassCard className="p-5 flex justify-between items-center border border-border-thin hover:border-primary/20 transition-all duration-300">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold border ${
                              proposal.status === "Active" ? "bg-success/15 border-success/30 text-success" : "bg-white/5 border-white/10 text-muted"
                            }`}>
                              {proposal.status}
                            </span>
                            <span className="text-[10px] font-bold text-muted bg-white/5 px-2 py-0.5 rounded-full">
                              {proposal.category}
                            </span>
                          </div>
                          <h4 className="font-bold text-white group-hover:text-primary transition-colors">{proposal.title}</h4>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors group-hover:translate-x-1" />
                      </GlassCard>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Right: Quick actions panel */}
            <div className="space-y-6">
              <h3 className="text-lg font-extrabold text-white font-heading">On-Chain Actions</h3>
              <GlassCard className="p-6 space-y-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">Submit New Proposal</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    Authorize a new governance proposal targeting this DAO's custom deployed contracts.
                  </p>
                  <button
                    onClick={() => setIsProposalModalOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/95 transition-colors cursor-pointer mt-2"
                  >
                    Draft Proposal
                  </button>
                </div>

                <div className="h-px bg-border-thin" />

                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">Treasury Deposit</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    Approve stablecoins and send deposits to support this DAO's vault.
                  </p>
                  <button
                    onClick={() => setIsDepositModalOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-surface border border-border-thin hover:border-white/10 text-white font-bold text-xs transition-colors cursor-pointer mt-2"
                  >
                    Deposit Capital
                  </button>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* PROPOSALS PANEL */}
        {activeTab === "proposals" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">DAO Governance Proposals</h3>
                <p className="text-xs text-muted mt-0.5">Submit and vote on proposals executing on this DAO's specific governor contract.</p>
              </div>
              <button
                onClick={() => setIsProposalModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Proposal
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {proposals.length === 0 ? (
                <div className="text-center py-12 bg-surface-elevated rounded-2xl border border-border-thin text-muted text-sm">
                  No active or past proposals found for this DAO.
                </div>
              ) : (
                proposals.map((proposal, i) => {
                  const total = proposal.totalVotes;
                  const forPct = total > 0 ? (proposal.forVotes / total) * 100 : 0;
                  const againstPct = total > 0 ? (proposal.againstVotes / total) * 100 : 0;
                  
                  return (
                    <Link href={`/proposals/${proposal.id}`} key={proposal.id} className="block group">
                      <GlassCard className="p-6 border border-border-thin hover:border-primary/20 transition-all duration-300">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-3 py-0.5 rounded-full font-bold border ${
                                proposal.status === "Active" ? "bg-success/15 border-success/30 text-success" : "bg-white/5 border-white/10 text-muted"
                              }`}>
                                {proposal.status}
                              </span>
                              <span className="text-[10px] font-bold text-muted bg-white/5 px-2.5 py-0.5 rounded-full">
                                {proposal.category}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-extrabold text-white text-lg group-hover:text-primary transition-colors">{proposal.title}</h4>
                              <p className="text-muted text-xs leading-relaxed mt-2 line-clamp-2">{proposal.description}</p>
                            </div>

                            <div className="flex items-center gap-4 text-[10px] text-muted font-semibold">
                              <span>Proposer: <span className="font-mono text-white">{proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}</span></span>
                              <span>•</span>
                              <span>Ends {new Date(proposal.votingEnds).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Voting bars */}
                          <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-border-thin pt-4 md:pt-0 md:pl-6 space-y-3 shrink-0 flex flex-col justify-center">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-success">For</span>
                                <span className="text-white">{(proposal.forVotes / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k VP ({forPct.toFixed(1)}%)</span>
                              </div>
                              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-success h-full transition-all duration-500" style={{ width: `${forPct}%` }} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-danger">Against</span>
                                <span className="text-white">{(proposal.againstVotes / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k VP ({againstPct.toFixed(1)}%)</span>
                              </div>
                              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-danger h-full transition-all duration-500" style={{ width: `${againstPct}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TREASURY PANEL */}
        {activeTab === "treasury" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Transaction activities */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-extrabold text-white">Historical Activities</h3>
                  <p className="text-xs text-muted mt-0.5">Real-time ledger events scraped directly from the vault.</p>
                </div>
                <button
                  onClick={refetchTreasury}
                  className="p-2 rounded-lg bg-surface hover:bg-white/5 text-muted hover:text-white border border-border-thin transition-colors cursor-pointer"
                  title="Refetch Activities"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-hover" />
                </button>
              </div>

              <div className="space-y-4">
                {treasuryLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <GlassCard key={i} className="p-5 h-20 bg-surface-elevated animate-pulse rounded-2xl">
                      <div />
                    </GlassCard>
                  ))
                ) : activities.length === 0 ? (
                  <GlassCard className="p-8 text-center text-muted">
                    No transactions recorded on this Treasury contract vault.
                  </GlassCard>
                ) : (
                  activities.map((act) => (
                    <GlassCard key={act.id} className="p-5 border border-border-thin flex justify-between items-center gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold border ${
                            act.type === "Inflow" ? "bg-success/15 border-success/30 text-success" : "bg-danger/15 border-danger/30 text-danger"
                          }`}>
                            {act.type}
                          </span>
                          <span className="text-[10px] text-muted font-mono">{act.txHash}</span>
                        </div>
                        <h4 className="font-bold text-white text-sm">{act.description}</h4>
                        <span className="text-[10px] text-muted block">{new Date(act.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`font-mono font-extrabold text-lg ${act.type === "Inflow" ? "text-success" : "text-danger"}`}>
                          {act.type === "Inflow" ? "+" : "-"}{act.amount.toLocaleString()} {act.token}
                        </span>
                      </div>
                    </GlassCard>
                  ))
                )}
              </div>
            </div>

            {/* Right: Portfolio breakdown & deposit actions */}
            <div className="space-y-6">
              <h3 className="text-lg font-extrabold text-white">Vault Reserves</h3>
              <GlassCard className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      USDC Balance
                    </span>
                    <span className="font-mono font-bold text-white">{usdcBalance.toLocaleString()} USDC</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                      EURC Balance
                    </span>
                    <span className="font-mono font-bold text-white">{eurcBalance.toLocaleString()} EURC</span>
                  </div>
                </div>

                <div className="h-px bg-border-thin" />

                <button
                  onClick={() => setIsDepositModalOpen(true)}
                  className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 shadow-[0_0_20px_rgba(124,58,237,0.25)] transition-all cursor-pointer text-xs"
                >
                  Deposit to Treasury
                </button>
              </GlassCard>
            </div>
          </div>
        )}

        {/* MEMBERS PANEL */}
        {activeTab === "members" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-extrabold text-white">DAO Token Holders</h3>
                <p className="text-xs text-muted mt-0.5">Scraped directly from unique ERC20 transfer histories on the RPC.</p>
              </div>
              <button
                onClick={fetchMembers}
                disabled={membersLoading}
                className="p-2 rounded-lg bg-surface hover:bg-white/5 text-muted hover:text-white border border-border-thin transition-colors cursor-pointer"
                title="Refresh Holders"
              >
                <RefreshCw className={`w-4 h-4 ${membersLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {membersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <GlassCard key={i} className="p-6 h-40 bg-surface-elevated animate-pulse rounded-2xl">
                    <div />
                  </GlassCard>
                ))}
              </div>
            ) : membersError ? (
              <GlassCard className="p-8 text-center text-danger border border-danger/10 bg-danger/5">
                {membersError}
              </GlassCard>
            ) : members.length === 0 ? (
              <GlassCard className="p-8 text-center text-muted">
                No active token holders found for this DAO on the RPC.
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member, i) => (
                  <GlassCard key={member.address} className="p-5 flex flex-col justify-between border border-border-thin hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xs text-white bg-gradient-to-tr from-purple-deep via-primary/30 to-arc-blue">
                        {member.address.slice(2, 4).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-mono text-sm text-white font-bold">{member.address.slice(0, 6)}...{member.address.slice(-4)}</h4>
                        <span className="text-[10px] text-muted block">Joined {member.joinDate}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border-thin space-y-2 text-xs font-semibold">
                      <div className="flex justify-between items-center">
                        <span className="text-muted flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-primary" />
                          Governance Weight
                        </span>
                        <span className="font-mono text-white">{member.tokenBalance.toLocaleString()} sARC</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5 text-arc-blue" />
                          USDC Holding
                        </span>
                        <span className="font-mono text-white">{member.usdcBalance.toLocaleString()} USDC</span>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* 1. New Proposal Modal */}
      {isProposalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => { if(!submittingProposal) setIsProposalModalOpen(false); }} />
          <div className="relative z-10 w-full max-w-lg bg-surface-elevated border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-border-thin">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary animate-pulse" />
                Draft New Proposal
              </h3>
              <button disabled={submittingProposal} onClick={() => setIsProposalModalOpen(false)} className="text-muted hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProposalSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase">Proposal Title <span className="text-danger">*</span></label>
                <input
                  type="text"
                  required
                  disabled={submittingProposal}
                  placeholder="e.g. Expand Ecosystem Grants"
                  value={proposalData.title}
                  onChange={(e) => setProposalData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase">Description <span className="text-danger">*</span></label>
                <textarea
                  required
                  disabled={submittingProposal}
                  rows={4}
                  placeholder="Elaborate details of the proposal, execution targets, and outcomes..."
                  value={proposalData.description}
                  onChange={(e) => setProposalData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white resize-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Category</label>
                  <select
                    disabled={submittingProposal}
                    value={proposalData.category}
                    onChange={(e) => setProposalData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white transition-colors"
                  >
                    {["Infrastructure", "DeFi", "Ecosystem", "Security", "Marketing"].map(cat => (
                      <option key={cat} value={cat} className="bg-surface-elevated text-white">{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Voting Duration (Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    disabled={submittingProposal}
                    value={proposalData.votingDuration}
                    onChange={(e) => setProposalData(prev => ({ ...prev, votingDuration: parseInt(e.target.value) || 3 }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase">Treasury Disbursement (USDC)</label>
                <input
                  type="number"
                  min={0}
                  disabled={submittingProposal}
                  placeholder="0"
                  value={proposalData.treasuryImpactValue}
                  onChange={(e) => setProposalData(prev => ({ ...prev, treasuryImpactValue: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase">Execution Target Address</label>
                <input
                  type="text"
                  disabled={submittingProposal}
                  placeholder="0x..."
                  value={proposalData.executionTarget}
                  onChange={(e) => setProposalData(prev => ({ ...prev, executionTarget: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white font-mono transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={submittingProposal}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.2)] disabled:opacity-50 cursor-pointer text-sm"
              >
                <Send className="w-4 h-4" />
                {submittingProposal ? "Publishing on-chain..." : "Submit Proposal"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Treasury Deposit Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => { if(!depositing) setIsDepositModalOpen(false); }} />
          <div className="relative z-10 w-full max-w-sm bg-surface-elevated border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-border-thin">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary animate-pulse" />
                Deposit to Treasury
              </h3>
              <button disabled={depositing} onClick={() => setIsDepositModalOpen(false)} className="text-muted hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {depositError && (
              <div className="p-3 bg-danger/5 border border-danger/10 text-danger rounded-xl text-xs font-semibold">
                {depositError}
              </div>
            )}

            <form onSubmit={handleDepositSubmit} className="space-y-5">
              <div className="flex gap-2">
                {["USDC", "EURC"].map(tok => (
                  <button
                    key={tok}
                    type="button"
                    onClick={() => setDepositToken(tok as any)}
                    className={`flex-1 py-2 rounded-xl font-extrabold text-xs border transition-all cursor-pointer ${
                      depositToken === tok
                        ? "bg-primary border-primary text-white"
                        : "bg-surface border-border-thin text-muted hover:text-white"
                    }`}
                  >
                    {tok}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase">Amount</label>
                <input
                  type="number"
                  step="any"
                  min="0.000001"
                  required
                  disabled={depositing}
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white font-mono transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={depositing}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.2)] disabled:opacity-50 cursor-pointer text-sm"
              >
                <Coins className="w-4 h-4" />
                {depositing ? "Approving & Depositing..." : "Confirm Deposit"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
