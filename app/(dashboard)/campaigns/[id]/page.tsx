"use client";

import { useEffect, useState, use } from "react";
import { useCampaignStore } from "@/hooks/useCampaignStore";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/hooks/auth/useAuth";
import { 
  ArrowLeft, 
  Coins, 
  Users, 
  Clock, 
  CheckCircle, 
  HelpCircle, 
  AlertTriangle, 
  Loader2, 
  ShieldCheck, 
  ThumbsUp, 
  ThumbsDown,
  Info,
  Calendar,
  Sparkles,
  Award,
  Lock,
  Compass,
  ArrowRight,
  TrendingUp,
  Brain,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

const LIFECYCLE_STATES = ['Draft', 'Active', 'Voting', 'Funded', 'Completed'] as const;

const STATE_CONFIG = {
  Draft: { color: 'text-gray-400', bg: 'bg-white/5 border-white/10', icon: '📝', description: 'Campaign being prepared' },
  Active: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-400/20', icon: '🚀', description: 'Accepting USDC contributions' },
  Voting: { color: 'text-purple-300', bg: 'bg-purple-500/10 border-purple-400/20', icon: '🗳️', description: 'Community voting on milestone release' },
  Funded: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-400/20', icon: '✅', description: 'Milestone approved and USDC released' },
  Failed: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-400/20', icon: '❌', description: 'Campaign did not reach goal' },
  Completed: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-400/25 shadow-[0_0_10px_rgba(245,158,11,0.15)]', icon: '🏆', description: 'All milestones successfully completed' },
};

function FundingSourceItem({ icon, title, description, status }: { icon: string; title: string; description: string; status: string }) {
  return (
    <div className="p-3.5 rounded-xl border border-border-thin bg-surface/30 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base select-none">{icon}</span>
          <h4 className="text-xs font-bold text-text-primary">{title}</h4>
        </div>
        <span className={`text-[8.5px] px-2 py-0.2 rounded font-extrabold uppercase tracking-widest ${
          status === 'Active' 
            ? 'bg-success/15 border border-success/35 text-success' 
            : 'bg-white/[0.04] border border-white/[0.08] text-muted'
        }`}>
          {status}
        </span>
      </div>
      <p className="text-[10.5px] text-muted leading-relaxed pl-6">{description}</p>
    </div>
  );
}

export default function CampaignDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const campaignId = resolvedParams.id;

  const { isAuthenticated, login, walletAddress } = useAuth();
  const { campaigns, initialized, initializeStore, contribute, castVote, setAIAnalysis } = useCampaignStore();

  const [contributionAmount, setContributionAmount] = useState<number>(0);
  const [contributing, setContributing] = useState(false);
  const [voteChoice, setVoteChoice] = useState<'FOR' | 'AGAINST' | 'ABSTAIN' | null>(null);
  const [voting, setVoting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Success notifications
  const [contributionSuccess, setContributionSuccess] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  const campaign = campaigns.find(c => c.id === campaignId);

  // AI Campaign Analysis fetcher
  const runAIAnalysis = async () => {
    if (!campaign || analyzing) return;
    setAnalyzing(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyzeCampaign",
          campaignData: campaign
        })
      });

      const data = await response.json();
      if (response.ok && data.success && data.decision) {
        setAIAnalysis(campaignId, data.decision);
      }
    } catch (e) {
      console.error("Failed to run AI campaign audit", e);
    } finally {
      setAnalyzing(false);
    }
  };

  // Run AI analysis automatically if it hasn't been fetched yet
  useEffect(() => {
    if (initialized && campaign && !campaign.aiAnalysis && !analyzing) {
      runAIAnalysis();
    }
  }, [initialized, campaign, analyzing]);

  if (!initialized) {
    return (
      <div className="pt-28 pb-16 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="pt-28 pb-16 max-w-md mx-auto text-center space-y-6 px-4">
        <AlertTriangle className="w-16 h-16 text-danger mx-auto animate-bounce" />
        <h2 className="text-2xl font-bold font-heading text-text-primary">Campaign Not Found</h2>
        <p className="text-muted text-sm">
          The requested crowdfunding campaign does not exist or has been removed from the prototype ledger.
        </p>
        <Link href="/campaigns" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/95 transition-all">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Hub
        </Link>
      </div>
    );
  }

  const raisedPercent = Math.min(100, (campaign.raised / campaign.goal) * 100);
  const totalVotes = campaign.votes.for + campaign.votes.against + campaign.votes.abstain;
  const forPercent = totalVotes > 0 ? (campaign.votes.for / totalVotes) * 100 : 0;
  const againstPercent = totalVotes > 0 ? (campaign.votes.against / totalVotes) * 100 : 0;
  const abstainPercent = totalVotes > 0 ? (campaign.votes.abstain / totalVotes) * 100 : 0;

  // Active milestone for governance votes
  const activeMilestone = campaign.milestones.find(m => m.status === 'active') || campaign.milestones[0];

  const handleContribute = async () => {
    if (contributionAmount <= 0) return;
    
    if (!isAuthenticated) {
      login();
      return;
    }

    setContributing(true);
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // TODO: Replace with SynArcFundingVault.contribute(campaignId, amount)
    // Contract: deploy contracts/SynArcFundingVault.sol
    console.log('Mock contribute transaction payload:', { campaignId, amount: contributionAmount });

    contribute(campaignId, contributionAmount);
    setContributing(false);
    setContributionSuccess(true);
    setContributionAmount(0);

    setTimeout(() => {
      setContributionSuccess(false);
    }, 4000);
  };

  const handleVote = async (choice: 'FOR' | 'AGAINST' | 'ABSTAIN') => {
    if (!isAuthenticated) {
      login();
      return;
    }

    setVoteChoice(choice);
    setVoting(true);

    // Simulate cryptographic ballot generation
    await new Promise(resolve => setTimeout(resolve, 1500));

    // TODO: Replace with SynArcFundingVault.vote(campaignId, choice)
    // Contract: deploy contracts/SynArcFundingVault.sol
    console.log('Mock milestone vote cast payload:', { campaignId, choice });

    castVote(campaignId, choice, 12000); // cast 12k mock voting power weights
    setVoting(false);
    setVoteSuccess(true);

    setTimeout(() => {
      setVoteSuccess(false);
    }, 4000);
  };

  // AI Reviewed Badge System helper
  const getAIBadge = (recommendation?: string) => {
    if (recommendation === 'FUND') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          🤖 AI Reviewed — Recommended ✅
        </span>
      );
    }
    if (recommendation === 'REVIEW') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/10 border border-amber-500/20 text-amber-400">
          🤖 AI Reviewed — Needs Review ⚠️
        </span>
      );
    }
    if (recommendation === 'REJECT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-500/10 border border-red-500/20 text-red-400">
          🤖 AI Reviewed — High Risk ❌
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-white/[0.04] border border-white/[0.08] text-muted/80">
        🤖 AI Review Pending...
      </span>
    );
  };

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      
      {/* Return Link */}
      <Link href="/campaigns" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground font-semibold transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Crowdfund Hub
      </Link>

      {/* 4. Lifecycle Progress Stepper Bar */}
      <GlassCard className="p-6 border border-border-thin flex flex-col md:flex-row items-center justify-between gap-6" hover={false}>
        <div className="space-y-1 text-center md:text-left shrink-0">
          <span className="text-[10px] uppercase font-extrabold text-muted tracking-widest block">Lifecycle Track</span>
          <span className="text-sm font-bold text-text-primary flex items-center gap-2 justify-center md:justify-start">
            <span>{STATE_CONFIG[campaign.state]?.icon}</span>
            {campaign.state} Phase
          </span>
        </div>
        
        {/* Step bars */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 w-full max-w-xl text-xs font-bold text-muted">
          {LIFECYCLE_STATES.map((st, idx) => {
            const isCurrent = campaign.state === st;
            // Finished if index is lower than current index (Completed is last)
            const currentIndex = LIFECYCLE_STATES.indexOf(campaign.state as any);
            const isCompleted = currentIndex > idx || campaign.state === 'Completed';
            
            return (
              <div key={st} className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-full transition-all border ${
                  isCurrent 
                    ? "bg-primary border-primary text-white shadow-[0_0_10px_rgba(124,58,237,0.3)]" 
                    : isCompleted 
                      ? "bg-success/15 border-success/30 text-success" 
                      : "bg-surface/50 border-border-thin text-text-tertiary"
                }`}>
                  {st}
                </span>
                {idx < LIFECYCLE_STATES.length - 1 && (
                  <span className="text-text-tertiary select-none">→</span>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats, Description, Timeline (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Card */}
          <GlassCard className="p-6 sm:p-8 space-y-4 border border-border-thin" hover={false}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {campaign.isAgent ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-purple-500/15 border border-purple-400/25 text-purple-300 animate-pulse">
                  🤖 AUTONOMOUS AGENT FUND
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-blue-500/15 border border-blue-400/25 text-blue-300">
                  👤 HUMAN CAMPAIGN
                </span>
              )}

              {getAIBadge(campaign.aiAnalysis?.recommendation)}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-text-primary leading-tight">
              {campaign.title}
            </h1>

            <div className="flex flex-wrap gap-4 items-center text-xs text-text-secondary">
              <span className="font-bold uppercase tracking-widest bg-surface border border-border-thin px-2.5 py-1 rounded">
                {campaign.category}
              </span>
              <span className="text-text-tertiary">•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Deadline: {campaign.deadline}
              </span>
              <span className="text-text-tertiary">•</span>
              <span className="font-mono text-text-tertiary bg-surface border border-border-thin px-2 py-0.5 rounded">
                Escrow: {campaign.escrowAddress.slice(0, 6)}...{campaign.escrowAddress.slice(-4)}
              </span>
            </div>

            {/* 1. Add Escrow Trust Messaging */}
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs text-purple-300 leading-normal flex items-start gap-3">
              <Lock className="w-5 h-5 shrink-0 text-primary mt-0.5" />
              <div>
                <strong className="block text-purple-200">🔒 Vault-Locked Security Guarantee</strong>
                <span className="block mt-0.5 text-muted leading-relaxed text-[11px]">
                  USDC contributed to this campaign is secured directly within decentralized milestone escrow vaults. SynArc DAO treasury cannot arbitrarily drain or redirect these funds — capital release requires cryptographic proof of deliverable approval.
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Funding Progress Card */}
          <GlassCard className="p-6 sm:p-8 space-y-6 border border-border-thin" hover={false}>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary font-medium">Campaign Funding Progress</span>
                <span className="font-bold text-text-primary">{raisedPercent.toFixed(0)}% Completed</span>
              </div>
              
              {/* Premium Progress Bar */}
              <div className="w-full h-3 bg-surface rounded-full overflow-hidden border border-border-thin/40">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500" 
                  style={{ width: `${raisedPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-xl bg-surface/30 border border-border-thin/60">
                <Coins className="w-5 h-5 text-primary mx-auto mb-1.5" />
                <span className="text-xs text-muted block">Raised</span>
                <span className="text-lg font-bold text-text-primary mt-0.5 block">{campaign.raised.toLocaleString()} USDC</span>
              </div>

              <div className="p-4 rounded-xl bg-surface/30 border border-border-thin/60">
                <Coins className="w-5 h-5 text-accent mx-auto mb-1.5" />
                <span className="text-xs text-muted block">Target Goal</span>
                <span className="text-lg font-bold text-text-primary mt-0.5 block">{campaign.goal.toLocaleString()} USDC</span>
              </div>

              <div className="p-4 rounded-xl bg-surface/30 border border-border-thin/60">
                <Users className="w-5 h-5 text-muted mx-auto mb-1.5" />
                <span className="text-xs text-muted block">Contributors</span>
                <span className="text-lg font-bold text-text-primary mt-0.5 block">{campaign.contributors}</span>
              </div>

              <div className="p-4 rounded-xl bg-surface/30 border border-border-thin/60">
                <Clock className="w-5 h-5 text-muted mx-auto mb-1.5" />
                <span className="text-xs text-muted block">End Date</span>
                <span className="text-lg font-bold text-text-primary mt-0.5 block">{campaign.deadline.slice(5)}</span>
              </div>
            </div>
          </GlassCard>

          {/* Escrow Milestone Timeline Card */}
          <GlassCard className="p-6 sm:p-8 space-y-6 border border-border-thin" hover={false}>
            <div>
              <h2 className="text-lg font-bold font-heading text-text-primary">Milestone Escrow Timeline</h2>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                USDC is held in smart contract escrow and released strictly after successful milestone release votes.
              </p>
            </div>

            {/* Vertical timeline tree */}
            <div className="space-y-6 relative border-l border-border-thin/80 ml-3.5 pl-6 pb-2">
              {campaign.milestones.map((m, index) => {
                const isCompleted = m.status === 'completed';
                const isActive = m.status === 'active';
                
                return (
                  <div key={index} className="relative group">
                    {/* Node status indicators */}
                    <div className={`absolute -left-[30px] top-1 w-5 h-5 rounded-full border-4 border-background flex items-center justify-center z-10 transition-all ${
                      isCompleted ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                      isActive ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse' :
                      'bg-surface-elevated border-border-thin text-muted'
                    }`} />

                    <div className={`p-4 rounded-xl border transition-all ${
                      isActive ? 'border-amber-500/25 bg-amber-500/[0.02]' :
                      isCompleted ? 'border-border-thin bg-surface/10' :
                      'border-border-thin/40 bg-transparent opacity-65'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                          {m.title}
                          {isCompleted && <span className="text-[10px] px-2 py-0.2 rounded-md bg-success/15 border border-success/30 text-success uppercase">Released</span>}
                          {isActive && <span className="text-[10px] px-2 py-0.2 rounded-md bg-amber-500/15 border border-amber-400/30 text-amber-400 uppercase animate-pulse">In Progress</span>}
                          {!isCompleted && !isActive && <span className="text-[10px] px-2 py-0.2 rounded-md bg-surface-elevated border border-border-thin text-muted uppercase">Pending</span>}
                        </h4>
                        <span className="text-xs font-bold text-primary">{m.amount.toLocaleString()} USDC</span>
                      </div>
                      
                      {m.description && (
                        <p className="text-xs text-muted leading-relaxed mt-2 pl-1 border-l-2 border-border-thin/40">
                          {m.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Description Card */}
          <GlassCard className="p-6 sm:p-8 space-y-4 border border-border-thin" hover={false}>
            <h2 className="text-lg font-bold font-heading text-text-primary">About this campaign</h2>
            <p className="text-muted text-sm leading-relaxed whitespace-pre-wrap">
              {campaign.description}
            </p>
          </GlassCard>
        </div>

        {/* Right Column: Escrows, Voting, AI Risk Audit & Agent Details (1/3 width) */}
        <div className="space-y-6">

          {/* Backer escrow Card (Active status) */}
          {campaign.state === 'Active' && (
            <GlassCard className="p-6 border border-primary/20 bg-primary/[0.01] space-y-4 relative" hover={false}>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-primary">Back this Campaign</h3>
              <p className="text-xs text-muted leading-relaxed">
                Contribute USDC gas-free. Funds are securely locked in milestone-based smart contract escrows.
              </p>

              {contributionSuccess ? (
                <div className="p-4 rounded-xl border border-success/35 bg-success/5 text-success text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>USDC Mock Contribution recorded!</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="USDC Amount"
                      value={contributionAmount || ""}
                      onChange={(e) => setContributionAmount(Number(e.target.value))}
                      disabled={contributing}
                      className="w-full bg-surface border border-border-thin rounded-xl pl-4 pr-16 py-3 text-sm text-white outline-none focus:border-primary/50"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-muted">USDC</span>
                  </div>

                  <button
                    onClick={handleContribute}
                    disabled={contributing || contributionAmount <= 0}
                    className="w-full py-3 rounded-xl bg-primary text-white font-extrabold text-sm hover:bg-primary/95 transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    {contributing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Signing Contribution...
                      </>
                    ) : (
                      <>
                        <Coins className="w-4 h-4" />
                        Contribute USDC
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {/* 1. Tooltip / Notice Info Block */}
              <div className="p-3 rounded-xl bg-surface/30 border border-border-thin text-[10.5px] text-muted space-y-1">
                <span className="text-purple-300 font-bold block">🔒 Escrow Vault Locks:</span>
                <span className="block leading-relaxed">
                  Your USDC is locked in a smart contract escrow vault. Funds only release when the community votes to approve each milestone. You can claim a refund if the campaign fails.
                </span>
              </div>
            </GlassCard>
          )}

          {/* 6. Community Milestone Release Voting widget (Real Governor Hook Labels) */}
          {campaign.state === 'Voting' && (
            <GlassCard className="p-6 border border-amber-500/20 bg-amber-500/[0.01] space-y-5 animate-fade-in" hover={false}>
              <div>
                <span className="text-[9px] px-2 py-0.2 rounded font-extrabold bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase tracking-widest block w-fit mb-1.5">Governor Hook Active</span>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-400">🏛 Milestone Proposal #{campaign.proposalNumber}</h3>
                <p className="text-[11px] text-muted leading-relaxed mt-1">
                  Proposal to release <strong>{activeMilestone?.amount.toLocaleString()} USDC</strong> for:
                </p>
                <p className="text-xs text-text-primary font-bold mt-1 pl-2 border-l-2 border-amber-500">
                  {activeMilestone?.title}
                </p>
              </div>

              {voteSuccess ? (
                <div className="p-4 rounded-xl border border-success/35 bg-success/5 text-success text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Mock vote successfully registered!</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Voting Progress bar stack */}
                  <div className="space-y-2.5 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-success">✅ Approve Release (FOR)</span>
                        <span className="text-text-primary">{campaign.votes.for.toLocaleString()} votes ({forPercent.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border-thin/40">
                        <div className="h-full bg-success transition-all duration-300" style={{ width: `${forPercent}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-danger">❌ Reject Release (AGAINST)</span>
                        <span className="text-text-primary">{campaign.votes.against.toLocaleString()} votes ({againstPercent.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border-thin/40">
                        <div className="h-full bg-danger transition-all duration-300" style={{ width: `${againstPercent}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-muted">⚪ Abstain</span>
                        <span className="text-text-primary">{campaign.votes.abstain.toLocaleString()} votes ({abstainPercent.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border-thin/40">
                        <div className="h-full bg-muted/50 transition-all duration-300" style={{ width: `${abstainPercent}%` }} />
                      </div>
                    </div>
                  </div>

                  <p className="text-[10.5px] text-muted leading-relaxed pl-2 border-l border-border-thin">
                    This vote is recorded on the SynArc Governor contract. Requires a majority FOR votes to release locked milestone escrows.
                  </p>

                  {/* Actions */}
                  <div className="grid grid-cols-1 gap-2 pt-2">
                    <button
                      onClick={() => handleVote('FOR')}
                      disabled={voting}
                      className="py-2.5 rounded-xl border border-success/30 hover:border-success bg-success/5 hover:bg-success/15 text-success font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {voting && voteChoice === 'FOR' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Voting...
                        </>
                      ) : (
                        <>
                          <ThumbsUp className="w-3.5 h-3.5" />
                          Approve Release
                        </>
                      )}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleVote('AGAINST')}
                        disabled={voting}
                        className="py-2.5 rounded-xl border border-danger/30 hover:border-danger bg-danger/5 hover:bg-danger/15 text-danger font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {voting && voteChoice === 'AGAINST' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Voting...
                          </>
                        ) : (
                          <>
                            <ThumbsDown className="w-3.5 h-3.5" />
                            Reject
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleVote('ABSTAIN')}
                        disabled={voting}
                        className="py-2.5 rounded-xl border border-border-thin hover:border-text-secondary bg-surface hover:bg-surface-elevated text-text-secondary font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {voting && voteChoice === 'ABSTAIN' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Voting...
                          </>
                        ) : (
                          <>
                            <HelpCircle className="w-3.5 h-3.5" />
                            Abstain
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          )}

          {/* 7. Upgraded AI Risk Analysis Card */}
          <GlassCard className="p-6 border border-purple-500/20 bg-purple-500/[0.01] space-y-4 overflow-hidden relative" hover={false}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-glow/5 rounded-full blur-lg pointer-events-none" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-glow animate-pulse shrink-0" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-purple-300">🔍 AI Risk Analysis</h3>
            </div>
            
            {analyzing ? (
              <div className="py-8 text-center space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-purple-300 mx-auto" />
                <p className="text-[10px] text-muted uppercase font-semibold tracking-wider animate-pulse">Scanning metadata logs...</p>
              </div>
            ) : campaign.aiAnalysis ? (
              <div className="space-y-4">
                
                {/* Score indicators grid */}
                <div className="space-y-3">
                  <span className="text-[10px] font-extrabold text-muted uppercase tracking-wider block">Due Diligence Indices</span>
                  
                  <div className="grid grid-cols-2 gap-3 text-left">
                    {[
                      { label: "Legitimacy", val: campaign.aiAnalysis.scores.legitimacy },
                      { label: "Impact", val: campaign.aiAnalysis.scores.impact },
                      { label: "Arc Alignment", val: campaign.aiAnalysis.scores.arcAlignment },
                      { label: "Feasibility", val: campaign.aiAnalysis.scores.executionFeasibility },
                      { label: "Milestone Realism", val: campaign.aiAnalysis.scores.milestoneRealism },
                      { label: "Gov Alignment", val: campaign.aiAnalysis.scores.governanceAlignment }
                    ].map((sc, idx) => (
                      <div key={idx} className="space-y-1.5 p-2 rounded bg-surface/30 border border-border-thin/40">
                        <div className="flex justify-between text-[10px] font-semibold text-text-secondary">
                          <span>{sc.label}</span>
                          <span className="text-text-primary font-bold">{sc.val}%</span>
                        </div>
                        <div className="w-full h-1 bg-surface-elevated rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300" style={{ width: `${sc.val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Treasury Risk classification */}
                <div className="flex items-center justify-between bg-surface-elevated/40 p-2.5 rounded-xl border border-border-thin/60">
                  <span className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Treasury Risk Level</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    campaign.aiAnalysis.treasuryRisk === 'LOW' ? 'bg-success/15 border-success/30 text-success' :
                    campaign.aiAnalysis.treasuryRisk === 'HIGH' ? 'bg-danger/15 border-danger/30 text-danger animate-pulse' :
                    'bg-amber-500/15 border-amber-400/30 text-amber-400'
                  }`}>
                    {campaign.aiAnalysis.treasuryRisk} Risk
                  </span>
                </div>

                {/* Recommendation summary */}
                <div className="space-y-1 bg-purple-glow/[0.02] p-2.5 rounded-xl border border-purple-500/10 text-center">
                  <span className="text-[9px] font-extrabold text-purple-300 uppercase tracking-wider block">AI Decision Verdict</span>
                  <p className="text-[11px] text-purple-200 italic leading-relaxed mt-1">
                    "{campaign.aiAnalysis.verdict}"
                  </p>
                </div>

                {/* Strengths Grid */}
                {campaign.aiAnalysis.strengths && campaign.aiAnalysis.strengths.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-success uppercase tracking-wider block">Positive Signals (Strengths)</span>
                    <ul className="space-y-1 pl-1">
                      {campaign.aiAnalysis.strengths.map((str, idx) => (
                        <li key={idx} className="text-[10px] text-emerald-300 leading-relaxed flex items-start gap-1">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-success" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risk Flags list */}
                {campaign.aiAnalysis.riskFlags && campaign.aiAnalysis.riskFlags.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">Identified Risks & Concerns</span>
                    <ul className="space-y-1 pl-1">
                      {campaign.aiAnalysis.riskFlags.map((risk, idx) => (
                        <li key={idx} className="text-[10px] text-amber-300 leading-normal flex items-start gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Detailed Diligence notes */}
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-muted uppercase tracking-wider block">Due Diligence Audit Log</span>
                  <p className="text-[10.5px] text-muted leading-relaxed pl-2 border-l border-border-thin whitespace-pre-wrap">
                    {campaign.aiAnalysis.dueDiligenceNotes}
                  </p>
                </div>

                <div className="pt-2 border-t border-border-thin/40 text-[9px] text-muted leading-normal italic text-center">
                  ⚠️ AI Risk Analysis is advisory only. Always perform comprehensive due diligence.
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <button
                  onClick={runAIAnalysis}
                  className="px-4 py-2 rounded-xl bg-purple-glow/10 border border-purple-glow/20 text-purple-300 font-bold text-xs hover:bg-purple-glow/20 hover:border-purple-glow/40 transition-all cursor-pointer"
                >
                  Trigger AI Audit
                </button>
              </div>
            )}
          </GlassCard>

          {/* 8. Agent Wallet Identity Card (Only visible when isAgent === true) */}
          {campaign.isAgent && (
            <GlassCard className="p-6 border border-purple-500/25 bg-purple-500/[0.02] space-y-4 animate-fade-in" hover={false}>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-300 animate-pulse" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-purple-300">🤖 Autonomous Agent Details</h3>
              </div>

              <div className="space-y-3.5 text-xs text-text-secondary">
                <div className="flex justify-between items-center pb-2 border-b border-border-thin/40">
                  <span className="text-[10.5px] text-muted font-medium">Agent Type</span>
                  <span className="font-bold text-text-primary">{campaign.agentType}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-border-thin/40">
                  <span className="text-[10.5px] text-muted font-medium">Execution Scope</span>
                  <span className="font-bold text-text-primary text-right leading-tight max-w-[150px]">{campaign.executionScope}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-border-thin/40">
                  <span className="text-[10.5px] text-muted font-medium">Automation Level</span>
                  <span className="font-bold text-purple-glow text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/10 border border-purple-400/20">Fully Autonomous</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-border-thin/40">
                  <span className="text-[10.5px] text-muted font-medium">Governance Controlled</span>
                  <span className="font-bold text-emerald-400 text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-400/20">Yes — Override Active</span>
                </div>

                <div className="space-y-1 pb-2 border-b border-border-thin/40">
                  <span className="text-[10.5px] text-muted font-medium block">On-chain Strategy Rules</span>
                  <p className="text-[11px] text-purple-200 italic leading-relaxed pt-0.5">
                    "{campaign.strategy}"
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10.5px] text-muted font-medium block">Agent Wallet Address</span>
                  <span className="font-mono text-text-primary text-[10px] break-all block bg-surface/30 p-2 rounded border border-border-thin">{campaign.creator}</span>
                </div>

                <p className="text-[10.5px] text-muted leading-relaxed bg-purple-500/5 p-3 rounded-xl border border-purple-500/10">
                  ℹ️ This campaign was autonomously compiled and launched by an AI agent based on on-chain treasury analysis. All milestone disbursements are safely gated and require community governor consensus to release.
                </p>
              </div>
            </GlassCard>
          )}

          {/* 5. Treasury Funding Sources Card */}
          <GlassCard className="p-6 border border-border-thin space-y-4" hover={false}>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                <span>💰</span> Funding Sources
              </h3>
              <p className="text-[11px] text-muted mt-1 leading-relaxed">
                This crowdfund campaign is eligible to receive deposits in USDC from multiple coordination vectors:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <FundingSourceItem
                icon="👤"
                title="Individual Contributors"
                description="Anyone on Arc Testnet can back campaigns directly using stablecoins."
                status="Active"
              />
              <FundingSourceItem
                icon="🏛"
                title="DAO Treasury Allocation"
                description="SynArc DAO can allocate matching treasury blocks via governor proposals."
                status="Active"
              />
              <FundingSourceItem
                icon="🤖"
                title="AI Treasury Agents"
                description="Autonomous liquidity agents can deposit based on yield parameters."
                status="Active"
              />
              <FundingSourceItem
                icon="🌐"
                title="Ecosystem Grants"
                description="Direct capital matches from Arc chain developer ecosystems."
                status="Soon"
              />
            </div>
          </GlassCard>

          {/* Metadata Creator Card */}
          <GlassCard className="p-6 border border-border-thin space-y-4" hover={false}>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted/80">Identity Metadata</h3>
            
            <div className="space-y-3 text-xs text-text-secondary">
              <div className="flex items-center justify-between">
                <span>Account Type</span>
                {campaign.isAgent ? (
                  <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-400/20 text-purple-300 font-bold text-[10px]">🤖 AI Agent</span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-400/20 text-blue-300 font-bold text-[10px]">👤 Human</span>
                )}
              </div>

              {/* Sybil protection indications */}
              <div className="space-y-1.5 pt-2 border-t border-border-thin/40 text-[10.5px]">
                <span className="text-[10px] uppercase font-bold text-muted block mb-1">Sybil Security Checked</span>
                <div className="flex justify-between items-center">
                  <span>AI Scanned</span>
                  <span className={campaign.sybilProtection.aiScanned ? "text-success font-bold" : "text-muted"}>
                    {campaign.sybilProtection.aiScanned ? "✅ Active" : "⏳ Pending"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Reputation Verified</span>
                  <span className={campaign.sybilProtection.reputationChecked ? "text-success font-bold" : "text-muted"}>
                    {campaign.sybilProtection.reputationChecked ? "✅ Active" : "⏳ Pending"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Stake Deposited</span>
                  <span className={campaign.sybilProtection.stakeRequired ? "text-success font-bold" : "text-muted"}>
                    {campaign.sybilProtection.stakeRequired ? "✅ Active" : "⏳ Pending"}
                  </span>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-border-thin/40">
                <span className="text-[10px] uppercase font-bold text-muted block">Escrow Creator Address</span>
                <span className="font-mono text-text-primary text-[10px] break-all block bg-surface/30 p-2 rounded border border-border-thin">{campaign.creator}</span>
              </div>

              <div className="space-y-1 pt-1.5 border-t border-border-thin/40">
                <span className="text-[10px] uppercase font-bold text-muted block">USDC Recipient Address</span>
                <span className="font-mono text-text-primary text-[10px] break-all block bg-surface/30 p-2 rounded border border-border-thin">{campaign.recipient}</span>
              </div>
            </div>
          </GlassCard>

        </div>

      </div>
    </div>
  );
}
