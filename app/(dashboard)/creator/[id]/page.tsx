"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCreatorStore, Supporter } from "@/hooks/useCreatorStore";
import { useCampaignStore } from "@/hooks/useCampaignStore";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { GlassCard } from "@/components/ui/GlassCard";
import { getAuthenticatedClient, getAggressiveGasParams, waitForTransaction } from "@/lib/tx-helper";
import { useWallets } from "@privy-io/react-auth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Share2, 
  Twitter, 
  ExternalLink, 
  Sparkles, 
  Check, 
  Bot, 
  ShieldCheck, 
  Coins, 
  AlertTriangle,
  RefreshCw,
  User,
  Clock,
  ChevronRight,
  Info
} from "lucide-react";
import { toast } from "react-hot-toast";
import { parseAbi } from "viem";
import { SynArcCrowdfundABI } from "@/lib/governance/SynArcCrowdfund";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CreatorProfilePage({ params }: PageProps) {
  const { id } = use(params);
  const { isAuthenticated, walletAddress, isCircle, login } = useAuth();
  const { wallets } = useWallets();
  const { balance: walletUSDC, refetch: refetchUSDC } = useUSDCBalance(walletAddress);

  const { creators, supporters, supportCreator, initializeStore, initialized } = useCreatorStore();
  const { campaigns, contribute, initializeStore: initializeCampaignStore } = useCampaignStore();

  const [supportAmount, setSupportAmount] = useState<string>("");
  const [supporting, setSupporting] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [latestTxHash, setLatestTxHash] = useState("");

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    initializeStore();
    initializeCampaignStore();
  }, [initializeStore, initializeCampaignStore]);

  // Find creator details
  const creator = creators.find((c) => c.id === id || c.slug === id);

  if (!initialized) {
    return (
      <div className="max-w-5xl mx-auto py-6 px-4 space-y-8 animate-pulse">
        {/* Banner Skeleton */}
        <div className="w-full h-48 md:h-64 rounded-2xl bg-white/[0.02] border border-border-thin" />
        
        {/* Profile Card Skeleton */}
        <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4 w-full">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] shrink-0" />
            <div className="space-y-2 w-full">
              <div className="h-6 bg-white/[0.04] rounded w-1/3" />
              <div className="h-4 bg-white/[0.02] rounded w-1/4" />
            </div>
          </div>
          <div className="w-28 h-10 bg-white/[0.04] rounded-xl self-stretch md:self-auto" />
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Funding Progress Skeleton */}
            <div className="glass-card p-6 space-y-5">
              <div className="flex justify-between">
                <div className="h-4 bg-white/[0.04] rounded w-1/4" />
                <div className="h-4 bg-white/[0.04] rounded w-1/6" />
              </div>
              <div className="h-2.5 bg-white/[0.02] rounded-full w-full" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 bg-white/[0.02] rounded w-2/3" />
                    <div className="h-5 bg-white/[0.04] rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>

            {/* About Skeleton */}
            <div className="glass-card p-6 space-y-4">
              <div className="h-5 bg-white/[0.04] rounded w-1/4" />
              <div className="space-y-2">
                <div className="h-4 bg-white/[0.02] rounded w-full" />
                <div className="h-4 bg-white/[0.02] rounded w-5/6" />
                <div className="h-4 bg-white/[0.02] rounded w-4/5" />
              </div>
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="space-y-6">
            <div className="glass-card p-6 space-y-4">
              <div className="h-5 bg-white/[0.04] rounded w-1/2" />
              <div className="h-3 bg-white/[0.02] rounded w-full" />
              <div className="space-y-2 pt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-white/[0.04] rounded-xl w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 animate-pulse" />
        <h2 className="text-xl font-bold text-white">Creator DAO Not Found</h2>
        <p className="text-sm text-text-tertiary">This creator organization does not exist or has not been deployed yet.</p>
        <Link href="/leaderboard">
          <button className="px-6 py-2.5 rounded-xl bg-accent-purple text-white-keep text-xs font-bold hover:bg-accent-purple/90 transition-colors cursor-pointer">
            Explore Creators
          </button>
        </Link>
      </div>
    );
  }

  const creatorSupporters = supporters[creator.id] || [];
  const progressPercent = Math.min(100, (creator.raised / creator.goal) * 100);

  // Quick donation helpers
  const presets = [
    { amount: 0.01, label: "☕ $0.01", desc: "USDC Nanopayment" },
    { amount: 0.10, label: "🎯 $0.10", desc: "Micro Support" },
    { amount: 1.00, label: "⭐ $1.00", desc: "Super Backer" },
    { amount: 5.00, label: "🔥 $5.00", desc: "Ecosystem Builder" },
    { amount: 10.00, label: "💎 $10.00", desc: "Executive Patron" },
  ];

  const handleShare = async () => {
    const shareUrl = `https://synarcdao.xyz/creator/${creator.slug || creator.id}`;
    const shareText = `Support ${creator.name} on SynArc! They are raising ${creator.goal} USDC on Arc.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: creator.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Link copied!");
          } catch (clipErr) {
            toast.error("Failed to copy link.");
          }
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied!");
      } catch (err) {
        toast.error("Failed to copy link.");
      }
    }
  };

  const handleSupport = async (amountVal: number) => {
    if (amountVal <= 0) return;
    
    if (!isAuthenticated) {
      login();
      return;
    }

    const userUSDCNum = parseFloat(walletUSDC || "0.00");
    if (amountVal > userUSDCNum) {
      toast.error(`Insufficient USDC. You have ${userUSDCNum.toFixed(2)} USDC, but tried to support with ${amountVal.toFixed(2)} USDC.`);
      return;
    }

    setSupporting(true);
    setLatestTxHash("");

    // Find matching campaign in campaigns store to check if it has a real escrow contract deployed
    const matchingCampaign = campaigns.find(
      (c) => c.id === creator.id || c.title.toLowerCase() === creator.name.toLowerCase()
    );

    const hasRealEscrow = matchingCampaign && 
      matchingCampaign.escrowAddress && 
      matchingCampaign.escrowAddress.startsWith("0x") && 
      matchingCampaign.escrowAddress.length === 42 &&
      !matchingCampaign.escrowAddress.toLowerCase().includes("escrow");

    // Only simulate if using a Circle Wallet, or if there's no real escrow and the creator wallet is not a valid 0x address
    const isSimulated = isCircle || (!hasRealEscrow && (!creator.wallet || !creator.wallet.startsWith("0x")));

    if (isSimulated) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        // Generate mock transaction hash
        const mockHash = "0x" + Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join("");

        // Update stores
        supportCreator(creator.id, amountVal, walletAddress || "0xConnectedUser", mockHash);
        
        // Map back to global campaigns list too
        try {
          await contribute(creator.id, amountVal);
        } catch {}

        setLatestTxHash(mockHash);
        setSupportSuccess(true);
        setSupportAmount("");
        refetchUSDC();
        toast.success(`Sent ${amountVal} USDC simulated nanopayment!`);

        setTimeout(() => {
          setSupportSuccess(false);
        }, 4000);
      } catch (err) {
        console.error(err);
      } finally {
        setSupporting(false);
      }
      return;
    }

    // 2. Real on-chain transaction on Arc Testnet
    try {
      const { walletClient, publicClient, address } = await getAuthenticatedClient(wallets, 5042002, walletAddress);
      
      const usdcAddress = "0x3600000000000000000000000000000000000000";
      const amountBigInt = BigInt(Math.round(amountVal * 1_000_000)); // USDC has 6 decimals

      const gasParams = await getAggressiveGasParams(publicClient);
      let txHash = "";

      if (hasRealEscrow) {
        // Contribute to campaign escrow contract
        const erc20Abi = parseAbi([
          "function approve(address spender, uint256 amount) returns (bool)"
        ]);

        console.log(`Approving ${amountVal} USDC for Creator DAO escrow contract: ${matchingCampaign.escrowAddress}`);
        toast.loading("Approving USDC spending...", { id: "support-toast" });

        const approveHash = await walletClient.writeContract({
          address: usdcAddress,
          abi: erc20Abi,
          functionName: "approve",
          chain: walletClient.chain,
          args: [matchingCampaign.escrowAddress as `0x${string}`, amountBigInt],
          gas: 250000n,
          ...gasParams,
        });

        await waitForTransaction(publicClient, approveHash);

        console.log(`Depositing ${amountVal} USDC into Creator DAO milestone escrow vault on-chain...`);
        toast.loading("Depositing USDC to Creator DAO escrow contract on-chain...", { id: "support-toast" });

        const contributeHash = await walletClient.writeContract({
          address: matchingCampaign.escrowAddress as `0x${string}`,
          abi: SynArcCrowdfundABI,
          functionName: "contribute",
          chain: walletClient.chain,
          args: [amountBigInt],
          gas: 300000n,
          ...gasParams,
        });

        await waitForTransaction(publicClient, contributeHash);
        txHash = contributeHash;
        toast.success(`🎉 Deposited ${amountVal} USDC into Creator DAO milestone escrow!`, { id: "support-toast" });
      } else {
        // Direct USDC transfer fallback
        const usdcAbi = parseAbi([
          "function transfer(address recipient, uint256 amount) returns (bool)"
        ]);

        console.log(`Sending ${amountVal} USDC directly to recipient wallet: ${creator.wallet}`);
        toast.loading("Sending direct USDC transfer...", { id: "support-toast" });
        
        const transferHash = await walletClient.writeContract({
          address: usdcAddress,
          abi: usdcAbi,
          functionName: "transfer",
          chain: walletClient.chain,
          args: [creator.wallet as `0x${string}`, amountBigInt],
          gas: 120000n,
          ...gasParams
        });

        await waitForTransaction(publicClient, transferHash);
        txHash = transferHash;
        toast.success(`Sent direct USDC payment to creator!`, { id: "support-toast" });
      }

      console.log("On-chain transaction completed. Hash:", txHash);

      // Update local storage / state
      supportCreator(creator.id, amountVal, address, txHash);
      
      // Sync to campaign store
      try {
        await contribute(matchingCampaign ? matchingCampaign.id : creator.id, amountVal);
      } catch {}

      setLatestTxHash(txHash);
      setSupportSuccess(true);
      setSupportAmount("");
      refetchUSDC();

      setTimeout(() => {
        setSupportSuccess(false);
      }, 4000);
    } catch (err: any) {
      console.error("USDC transfer/contribution failed:", err);
      toast.error(err?.message || "On-chain transaction failed.", { id: "support-toast" });
    } finally {
      setSupporting(false);
    }
  };

  const analyzeCampaign = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyzeCampaign",
          campaignData: {
            title: creator.name,
            isAgent: creator.isAgent || false,
            description: creator.description,
            goal: creator.goal,
            category: creator.category,
            milestones: [
              { title: "Escrow release milestone", amount: creator.goal, description: "Milestone release" }
            ],
            creator: creator.wallet
          }
        })
      });
      const data = await response.json();
      if (response.ok && data.success && data.decision) {
        setAiAnalysis(data.decision);
      } else {
        toast.error("Failed to fetch AI assessment.");
      }
    } catch (err) {
      console.error(err);
      toast.error("AI Analysis connection failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-8 animate-fade-in-up">
      {/* Cover Image banner */}
      {creator.image && (
        <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden border border-border-thin relative group/banner shadow-xl">
          <Image 
            src={creator.image} 
            alt={`${creator.name} Cover`} 
            fill
            sizes="100vw"
            priority
            className="object-cover transition-transform duration-500 group-hover/banner:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent z-10" />
        </div>
      )}

      {/* Header Profile card */}
      <GlassCard className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group" hover={false}>
        <div className="absolute -right-20 -top-20 w-44 h-44 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent border border-white/10 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg overflow-hidden shrink-0 relative">
            {creator.image ? (
              <Image src={creator.image} alt={creator.name} fill sizes="64px" className="object-cover" />
            ) : (
              creator.name[0]
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold font-heading text-white tracking-tight">{creator.name}</h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold uppercase tracking-wider">
                {creator.category}
              </span>
              {creator.isAgent && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 font-bold flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" />
                  AI Agent
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3.5 text-xs text-text-tertiary">
              {creator.twitter && (
                <a 
                  href={`https://twitter.com/${creator.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <Twitter className="w-3.5 h-3.5 text-sky-400" />
                  @{creator.twitter}
                </a>
              )}
              <span className="font-mono text-text-tertiary select-all">
                {creator.wallet ? `${creator.wallet.slice(0, 6)}...${creator.wallet.slice(-4)}` : ""}
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleShare}
          className="px-4.5 py-2.5 rounded-xl bg-surface border border-border-thin hover:border-white/10 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all self-stretch md:self-auto justify-center"
        >
          <Share2 className="w-4 h-4 text-primary" />
          Share DAO Profile
        </button>
      </GlassCard>

      {/* Main content columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns - Funding Stats, About, Supporters */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Funding Card */}
          <GlassCard className="p-6 space-y-5" hover={false}>
            <div className="flex justify-between items-center text-xs font-bold text-text-tertiary uppercase tracking-wider">
              <span>Funding Progress</span>
              <span className="text-success">{progressPercent.toFixed(1)}% Funded</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden border border-border-thin">
              <div 
                className="h-full bg-gradient-to-r from-primary via-accent to-success transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">USDC Raised</span>
                <span className="text-lg font-extrabold text-success block">
                  {creator.raised.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Goal Target</span>
                <span className="text-lg font-extrabold text-white block">
                  {creator.goal.toLocaleString()} USDC
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Supporters</span>
                <span className="text-lg font-extrabold text-purple-300 block">
                  {creator.supporters}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Days Left</span>
                <span className="text-lg font-extrabold text-white block">
                  {creator.daysLeft} days
                </span>
              </div>
            </div>
          </GlassCard>

          {/* About section */}
          <GlassCard className="p-6 space-y-3" hover={false}>
            <h3 className="text-lg font-extrabold font-heading text-white">About this Creator</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{creator.description}</p>
          </GlassCard>

          {/* Recent Supporters Feed */}
          <GlassCard className="p-6 space-y-4" hover={false}>
            <h3 className="text-lg font-extrabold font-heading text-white">Recent Supporters</h3>
            {creatorSupporters.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border-thin rounded-2xl bg-surface/20 space-y-2">
                <Coins className="w-8 h-8 opacity-30 text-primary animate-pulse" />
                <p className="text-xs text-text-tertiary">Be the first to support {creator.name}!</p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle/40 border border-border-thin rounded-2xl bg-surface/10 overflow-hidden text-xs">
                {creatorSupporters.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 hover:bg-surface-elevated/25 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-surface-elevated border border-border-thin flex items-center justify-center text-text-secondary">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-text-primary select-all">
                          {s.address.slice(0, 6)}...{s.address.slice(-4)}
                        </span>
                        <div className="flex items-center gap-1.5 text-[9px] text-text-tertiary mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{s.timeAgo}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-success">+{s.amount.toFixed(2)} USDC</span>
                      <a 
                        href={`https://testnet.arcscan.app/tx/${s.txHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1 rounded bg-surface-elevated hover:bg-primary/20 border border-border-thin hover:border-primary/30 text-text-tertiary hover:text-primary transition-all"
                        title="View Transaction"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Columns - Nanopayment support, AI analysis */}
        <div className="space-y-6">
          
          {/* Nanopayment Support Card */}
          <GlassCard className="p-6 space-y-5 border border-primary/25 bg-gradient-to-br from-primary/[0.01] to-transparent" hover={false}>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold font-heading text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary animate-pulse" />
                Support with USDC
              </h3>
              <p className="text-xs text-text-secondary">
                Send instant USDC nanopayments to this Creator DAO. Triggers a real transaction when your wallet is connected.
              </p>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 gap-2.5">
              {presets.map((preset) => (
                <button
                  key={preset.amount}
                  onClick={() => handleSupport(preset.amount)}
                  disabled={supporting}
                  className="w-full p-3 rounded-xl border border-border hover:border-primary/30 bg-surface/20 hover:bg-primary/[0.02] flex items-center justify-between text-left transition-all duration-300 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div>
                    <span className="font-extrabold text-xs text-white group-hover:text-primary transition-colors block">
                      {preset.label}
                    </span>
                    <span className="text-[9px] text-text-tertiary block mt-0.5">{preset.desc}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Custom USDC amount</span>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  disabled={supporting}
                  placeholder="0.00"
                  value={supportAmount}
                  onChange={(e) => setSupportAmount(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-xs text-white transition-colors"
                />
                <button
                  onClick={() => handleSupport(parseFloat(supportAmount))}
                  disabled={supporting || !supportAmount || parseFloat(supportAmount) <= 0}
                  className="px-5 py-2.5 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white-keep font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {supporting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Support</span>
                  )}
                </button>
              </div>
            </div>

            {/* Success popup logs */}
            <AnimatePresence>
              {supportSuccess && latestTxHash && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3.5 rounded-xl bg-success/10 border border-success/20 space-y-1.5 text-xs text-success"
                >
                  <span className="font-bold flex items-center gap-1">
                    <Check className="w-4 h-4 animate-bounce" />
                    Transaction Confirmed!
                  </span>
                  <div className="flex justify-between items-center gap-2 pt-0.5">
                    <span className="font-mono text-[9px] opacity-80 block truncate select-all">{latestTxHash}</span>
                    <a 
                      href={`https://testnet.arcscan.app/tx/${latestTxHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-bold shrink-0 flex items-center gap-0.5"
                    >
                      Scan ↗
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Escrow Explanation Info Box */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex gap-2.5 text-[11px] leading-relaxed text-text-secondary">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-text-primary">💰 How it works:</span>{" "}
                Your USDC is sent to a secure <span className="font-semibold text-text-primary">on-chain escrow contract</span>. Funds are locked and released to the creator <span className="font-semibold text-text-primary">only after</span> community/governance approves the milestones. This protects both supporters and creators.
              </div>
            </div>

            <div className="pt-2 border-t border-border-thin text-[10px] text-text-tertiary/60 flex items-center justify-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              <span>USDC Native · Powered by Arc Testnet</span>
            </div>
          </GlassCard>

          {/* AI Analysis Card */}
          <GlassCard className="p-6 space-y-4" hover={false}>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary animate-pulse" />
              <h3 className="text-base font-extrabold font-heading text-white">🤖 AI Agent Analysis</h3>
            </div>
            
            <p className="text-xs text-text-tertiary leading-relaxed">
              Get an AI-powered assessment of this creator campaign's validity and ecosystem impact.
            </p>

            {!aiAnalysis ? (
              <button
                onClick={analyzeCampaign}
                disabled={analyzing}
                className="w-full py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-thin hover:border-primary/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                    Analyzing Campaign...
                  </>
                ) : (
                  <span>Analyze Campaign</span>
                )}
              </button>
            ) : (
              <div className="space-y-4 pt-2 border-t border-border-subtle text-xs">
                {/* Scores */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-surface/30 border border-border-thin flex justify-between items-center">
                    <span className="font-semibold text-text-secondary">Legitimacy</span>
                    <span className={`font-extrabold text-sm ${
                      aiAnalysis.scores.legitimacy >= 80 ? "text-success" : aiAnalysis.scores.legitimacy >= 50 ? "text-warning" : "text-danger"
                    }`}>
                      {aiAnalysis.scores.legitimacy}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface/30 border border-border-thin flex justify-between items-center">
                    <span className="font-semibold text-text-secondary">Impact</span>
                    <span className={`font-extrabold text-sm ${
                      aiAnalysis.scores.impact >= 80 ? "text-success" : aiAnalysis.scores.impact >= 50 ? "text-warning" : "text-danger"
                    }`}>
                      {aiAnalysis.scores.impact}%
                    </span>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="p-3.5 rounded-xl bg-surface/20 border border-border-thin space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-muted uppercase tracking-wider text-[10px]">AI recommendation</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wider ${
                      aiAnalysis.recommendation === "FUND" 
                        ? "bg-success/15 border border-success/35 text-success" 
                        : aiAnalysis.recommendation === "REVIEW" 
                        ? "bg-warning/15 border border-warning/35 text-warning" 
                        : "bg-danger/15 border border-danger/35 text-danger"
                    }`}>
                      {aiAnalysis.recommendation}
                    </span>
                  </div>
                  
                  <p className="text-text-secondary leading-relaxed font-semibold italic">
                    "{aiAnalysis.verdict}"
                  </p>
                </div>

                {/* Due Diligence */}
                <div className="space-y-1 bg-surface-elevated/20 p-3.5 rounded-xl border border-border-thin">
                  <span className="font-bold text-muted uppercase tracking-wider text-[10px]">Due Diligence Notes</span>
                  <p className="text-[11px] text-text-secondary leading-relaxed mt-1">{aiAnalysis.dueDiligenceNotes}</p>
                </div>

                <button
                  onClick={analyzeCampaign}
                  disabled={analyzing}
                  className="w-full py-2 border border-dashed border-border-thin hover:border-primary/20 text-[10px] font-bold text-text-tertiary hover:text-white transition-colors cursor-pointer"
                >
                  Refresh Audit
                </button>
              </div>
            )}
          </GlassCard>

        </div>
      </div>
    </div>
  );
}
