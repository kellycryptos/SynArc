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
  Sparkles
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignDetailPage({ params }: PageProps) {
  // Resolve params asynchronously for Next.js 15 compatibility
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

    castVote(campaignId, choice, 10000); // cast 10k mock voting power weights
    setVoting(false);
    setVoteSuccess(true);

    setTimeout(() => {
      setVoteSuccess(false);
    }, 4000);
  };

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      
      {/* Return Link */}
      <Link href="/campaigns" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground font-semibold transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Crowdfund Hub
      </Link>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Actions */}
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

              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                campaign.state === 'Active' ? 'bg-success/15 border border-success/30 text-success' :
                campaign.state === 'Voting' ? 'bg-amber-500/15 border border-amber-400/30 text-amber-400' :
                campaign.state === 'Funded' ? 'bg-arc-blue/15 border border-arc-blue/30 text-arc-blue' :
                'bg-surface-elevated border border-border-thin text-muted'
              }`}>
                {campaign.state}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-text-primary leading-tight">
              {campaign.title}
            </h1>

            <div className="flex flex-wrap gap-4 items-center text-xs text-text-secondary">
              <span className="font-bold uppercase tracking-widest bg-surface border border-border-thin px-2 py-0.5 rounded">
                {campaign.category}
              </span>
              <span className="text-text-tertiary">•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Deadline: {campaign.deadline}
              </span>
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

        {/* Right Column: Interaction Cards & AI Governance */}
        <div className="space-y-6">

          {/* Backer escrow Card (Active status) */}
          {campaign.state === 'Active' && (
            <GlassCard className="p-6 border border-primary/20 bg-primary/[0.01] space-y-4" hover={false}>
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
                    className="w-full py-3 rounded-xl bg-primary text-white font-extrabold text-sm hover:bg-primary/95 transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
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
              <div className="flex items-start gap-1.5 text-[10px] text-muted leading-relaxed">
                <Info className="w-3.5 h-3.5 shrink-0 text-text-tertiary" />
                <span>Escrow mechanism locks funds: releases are strictly governed by delegate milestone votes.</span>
              </div>
            </GlassCard>
          )}

          {/* Community Milestone Release Voting widget */}
          {campaign.state === 'Voting' && (
            <GlassCard className="p-6 border border-amber-500/20 bg-amber-500/[0.01] space-y-5" hover={false}>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-400">Community Milestone Vote</h3>
                <p className="text-[11px] text-muted leading-relaxed mt-1">
                  Active vote to release locked escrow funds for the current in-progress milestone.
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

          {/* AI Governance Audit Analysis */}
          <GlassCard className="p-6 border border-purple-500/20 bg-purple-500/[0.01] space-y-4 overflow-hidden relative" hover={false}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-glow/5 rounded-full blur-lg pointer-events-none" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-glow animate-pulse shrink-0" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-purple-300">AI Governance Audit</h3>
            </div>
            
            {analyzing ? (
              <div className="py-8 text-center space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-purple-300 mx-auto" />
                <p className="text-[10px] text-muted uppercase font-semibold tracking-wider">AI Agent auditing campaign logs...</p>
              </div>
            ) : campaign.aiAnalysis ? (
              <div className="space-y-4">
                {/* Recommendation badge */}
                <div className="flex items-center justify-between bg-surface-elevated/40 p-2.5 rounded-xl border border-border-thin/60">
                  <span className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Verdict</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    campaign.aiAnalysis.recommendation === 'FUND' ? 'bg-success/15 border border-success/30 text-success' :
                    campaign.aiAnalysis.recommendation === 'REJECT' ? 'bg-danger/15 border border-danger/30 text-danger' :
                    'bg-amber-500/15 border border-amber-400/30 text-amber-400'
                  }`}>
                    {campaign.aiAnalysis.recommendation}
                  </span>
                </div>

                {/* Score Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-surface/30 border border-border-thin/50">
                    <span className="text-[9px] text-muted block uppercase tracking-wide">Legitimacy</span>
                    <span className="text-sm font-extrabold text-white mt-0.5 block">{campaign.aiAnalysis.legitimacyScore}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface/30 border border-border-thin/50">
                    <span className="text-[9px] text-muted block uppercase tracking-wide">Impact</span>
                    <span className="text-sm font-extrabold text-white mt-0.5 block">{campaign.aiAnalysis.impactScore}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface/30 border border-border-thin/50">
                    <span className="text-[9px] text-muted block uppercase tracking-wide">Arc Align</span>
                    <span className="text-sm font-extrabold text-purple-300 mt-0.5 block">{campaign.aiAnalysis.arcAlignmentScore}%</span>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-muted uppercase tracking-wider block">AI Evaluation</span>
                  <p className="text-xs text-muted leading-relaxed pl-2 border-l border-border-thin">
                    {campaign.aiAnalysis.reasoning}
                  </p>
                </div>

                {/* Verdict Summary */}
                <div className="space-y-1 bg-purple-glow/[0.02] p-2.5 rounded-xl border border-purple-500/10">
                  <span className="text-[9px] font-extrabold text-purple-300 uppercase tracking-wider block">Summarized Verdict</span>
                  <p className="text-[11px] text-purple-200 italic leading-relaxed">
                    "{campaign.aiAnalysis.verdict}"
                  </p>
                </div>

                {/* Risk Flags list */}
                {campaign.aiAnalysis.riskFlags && campaign.aiAnalysis.riskFlags.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-muted uppercase tracking-wider block">Risk Logs</span>
                    <ul className="space-y-1 pl-1">
                      {campaign.aiAnalysis.riskFlags.map((risk, idx) => (
                        <li key={idx} className="text-[10px] text-amber-300 leading-normal flex items-start gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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

          {/* Identity Creator Card */}
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

              <div className="space-y-1 pt-1.5 border-t border-border-thin/40">
                <span className="text-[10px] uppercase font-bold text-muted block">Escrow Creator Address</span>
                <span className="font-mono text-text-primary text-[10px] break-all block">{campaign.creator}</span>
              </div>

              <div className="space-y-1 pt-1.5 border-t border-border-thin/40">
                <span className="text-[10px] uppercase font-bold text-muted block">USDC Recipient Address</span>
                <span className="font-mono text-text-primary text-[10px] break-all block">{campaign.recipient}</span>
              </div>
            </div>
          </GlassCard>

        </div>

      </div>
    </div>
  );
}
