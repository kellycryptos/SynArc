"use client";

import { useState, useEffect } from "react";
import { useCampaignStore } from "@/hooks/useCampaignStore";
import { GlassCard } from "@/components/ui/GlassCard";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { 
  ArrowLeft, 
  Rocket, 
  Sparkles, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Loader2, 
  Wallet,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  Coins
} from "lucide-react";
import Link from "next/link";

interface MilestoneInput {
  title: string;
  amount: number;
  description: string;
}

function ProtectionItem({ icon, title, description, status }: { icon: string; title: string; description: string; status: string }) {
  return (
    <div className="p-3.5 rounded-xl border border-border-thin bg-surface/30 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-lg select-none">{icon}</span>
        <span className={`text-[8.5px] px-2 py-0.2 rounded font-extrabold uppercase tracking-widest ${
          status === 'Active' 
            ? 'bg-success/15 border border-success/35 text-success' 
            : 'bg-white/[0.04] border border-white/[0.08] text-muted'
        }`}>
          {status}
        </span>
      </div>
      <h4 className="text-xs font-bold text-text-primary pt-0.5">{title}</h4>
      <p className="text-[10.5px] text-muted leading-relaxed">{description}</p>
    </div>
  );
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const { isAuthenticated, login, walletAddress } = useAuth();
  const { addCampaign, initializeStore } = useCampaignStore();

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  // Form states
  const [isAgent, setIsAgent] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Ecosystem Grant");
  const [goal, setGoal] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30);
  const [recipient, setRecipient] = useState("");

  // Milestones state
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: "Milestone 1 — Alpha Spec", amount: 0, description: "Detailed design specifications and smart contract flows." }
  ]);

  // AI Generator state
  const [aiIdea, setAiIdea] = useState("");
  const [generatingWithAi, setGeneratingWithAi] = useState(false);
  const [aiError, setAiError] = useState("");

  // Validation / Feedback states
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successId, setSuccessId] = useState<string | null>(null);

  // Set recipient to user's connected wallet address on load
  useEffect(() => {
    if (walletAddress && !recipient) {
      setRecipient(walletAddress);
    }
  }, [walletAddress, recipient]);

  // Calculate sum of milestones
  const totalMilestoneAmount = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  const milestoneGoalMismatch = totalMilestoneAmount !== Number(goal);

  const addMilestone = () => {
    setMilestones([
      ...milestones,
      { title: `Milestone ${milestones.length + 1}`, amount: 0, description: "" }
    ]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (index: number, field: keyof MilestoneInput, value: string | number) => {
    const updated = milestones.map((m, i) => {
      if (i === index) {
        return { ...m, [field]: value };
      }
      return m;
    });
    setMilestones(updated);
  };

  // AI Campaign Generation
  const generateWithAI = async () => {
    if (!aiIdea.trim()) {
      setAiError("Please type in a brief idea for the AI to generate.");
      return;
    }

    setGeneratingWithAi(true);
    setAiError("");

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateCampaign",
          idea: aiIdea,
          isAgent
        })
      });

      const data = await response.json();

      if (response.ok && data.success && data.campaign) {
        const c = data.campaign;
        setTitle(c.title || "");
        setDescription(c.description || "");
        setCategory(c.category || "Ecosystem Grant");
        setGoal(c.goal || 8000);
        setDuration(c.duration || 30);
        if (c.recipient) setRecipient(c.recipient);
        
        if (c.milestones && Array.isArray(c.milestones)) {
          setMilestones(c.milestones.map((m: any) => ({
            title: m.title || "",
            amount: Number(m.amount) || 0,
            description: m.description || ""
          })));
        }
      } else {
        setAiError(data.error || "Failed to generate campaign. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setAiError("API error generating campaign. falling back to mock templates.");
      
      // Local premium mock generator fallback if fetch fails completely
      const goalVal = aiIdea.toLowerCase().includes("large") ? 20000 : 8000;
      setTitle(`✨ AI: ${aiIdea.substring(0, 1).toUpperCase() + aiIdea.substring(1)}`);
      setDescription(`This campaign focuses on building a high-performance solution for "${aiIdea}". It utilizes Arc's gas-optimized smart contracts and confidential state logs to coordinate delegates. USDC funds will be held in escrow until milestones are audited and passed.`);
      setGoal(goalVal);
      setDuration(30);
      setMilestones([
        { title: "Milestone 1 — Architecture Spec", amount: goalVal * 0.25, description: "Detailed structural diagrams and smart contract drafts." },
        { title: "Milestone 2 — Devnet Implementation", amount: goalVal * 0.5, description: "Deployment of initial contracts, RPC test suite integrations." },
        { title: "Milestone 3 — Production Launch", amount: goalVal * 0.25, description: "Official testnet launch, audit compilations, open-source guide releases." }
      ]);
    } finally {
      setGeneratingWithAi(false);
    }
  };

  // Launch campaign submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim() || !description.trim() || !recipient.trim()) {
      setFormError("Title, description, and recipient wallet address are required.");
      return;
    }

    if (Number(goal) <= 0) {
      setFormError("Goal must be greater than 0 USDC.");
      return;
    }

    if (milestoneGoalMismatch) {
      setFormError(`Milestone budgets sum to ${totalMilestoneAmount} USDC, but your goal is ${goal} USDC. They must equal exactly.`);
      return;
    }

    // Verify milestones are populated
    for (let i = 0; i < milestones.length; i++) {
      if (!milestones[i].title.trim() || milestones[i].amount <= 0) {
        setFormError(`Milestone ${i + 1} must have a valid title and budget amount.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const parsedMilestones = milestones.map((m, index) => ({
        title: m.title.trim(),
        amount: Number(m.amount),
        description: m.description.trim(),
        status: (index === 0 ? "active" : "pending") as 'completed' | 'active' | 'pending'
      }));

      // Add to store
      const campaignId = addCampaign({
        title: title.trim(),
        description: description.trim(),
        category,
        goal: Number(goal),
        isAgent,
        badge: isAgent ? 'AUTONOMOUS_AGENT_FUND' : 'HUMAN_CAMPAIGN',
        creator: walletAddress || "0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53",
        recipient: recipient.trim(),
        deadline: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        milestones: parsedMilestones,
      });

      setSuccessId(campaignId);
      
      // Auto redirect after a brief moment
      setTimeout(() => {
        router.push("/campaigns");
      }, 2000);

    } catch (e: any) {
      console.error(e);
      setFormError(e?.message || "Failed to create campaign. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="pt-28 pb-16 flex items-center justify-center min-h-[70vh] px-4">
        <GlassCard className="max-w-md p-8 text-center space-y-6 border border-border-thin">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary animate-pulse">
            <Wallet className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-heading text-text-primary">Connect Your Wallet</h2>
            <p className="text-muted text-sm leading-relaxed">
              You must connect your Privy wallet to launch a permitless crowdfunding campaign and define milestone escrows.
            </p>
          </div>
          <button
            onClick={login}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/95 transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Return Link */}
      <Link href="/campaigns" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground font-semibold transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Crowdfund Hub
      </Link>

      {/* Success Modal overlay */}
      {successId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <GlassCard className="max-w-md p-8 text-center space-y-6 border border-success/30 shadow-[0_0_50px_rgba(34,197,94,0.15)] animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto text-success shadow-[0_0_20px_rgba(34,197,94,0.2)] animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-heading text-white">Campaign Launched!</h2>
              <p className="text-muted text-sm">
                Your campaign was successfully created and milestone escrows were deployed on the mock ledger. Redirecting to hub...
              </p>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Launch a Campaign</span>
        </h1>
        <p className="text-muted text-sm mt-1">
          Deploy milestone-locked crowdfunding escrows in USDC. Funds are released based on community voting.
        </p>
      </div>

      {/* Two-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form & Milestones (2/3 width) */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <GlassCard className="p-8 space-y-6 border border-border-thin" hover={false}>
              {formError && (
                <div className="p-4 rounded-xl border border-danger/20 bg-danger/5 text-danger text-xs font-semibold flex items-start gap-2 animate-pulse">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Campaign Type Selector */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-muted/80">Campaign Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setIsAgent(false)}
                    className={`py-3.5 px-4 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      !isAgent 
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                        : "bg-surface border-border-thin text-text-secondary hover:text-foreground hover:bg-surface-elevated"
                    }`}
                  >
                    👤 Human Campaign
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAgent(true)}
                    className={`py-3.5 px-4 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      isAgent 
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.1)] animate-pulse" 
                        : "bg-surface border-border-thin text-text-secondary hover:text-foreground hover:bg-surface-elevated"
                    }`}
                  >
                    🤖 Autonomous Agent Fund
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-muted/80">Campaign Title</label>
                <input
                  type="text"
                  placeholder="e.g. Arc Ecosystem Developer Grant"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white transition-colors"
                />
              </div>

              {/* Category and Goal/Duration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-muted/80">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white select-custom transition-colors"
                  >
                    <option>Ecosystem Grant</option>
                    <option>AI Infrastructure</option>
                    <option>Product Development</option>
                    <option>Protocol Upgrade</option>
                    <option>Community Initiative</option>
                    <option>Research</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-muted/80 flex items-center gap-1">
                    Funding Goal <span className="text-primary font-bold">(USDC)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="5000"
                    value={goal || ""}
                    onChange={(e) => setGoal(Number(e.target.value))}
                    required
                    min={1}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-muted/80">Duration <span className="text-muted font-bold">(Days)</span></label>
                  <input
                    type="number"
                    placeholder="30"
                    value={duration || ""}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    required
                    min={1}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white transition-colors"
                  />
                </div>
              </div>

              {/* Recipient Wallet Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-muted/80 flex items-center gap-1.5">
                  Recipient Wallet Address 
                  <span className="text-[10px] text-muted font-normal uppercase tracking-normal">(USDC Destination on approval)</span>
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white font-mono transition-colors"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-muted/80">Description</label>
                <textarea
                  placeholder="Describe your campaign goals, milestones, and how it aligns with the Arc Network..."
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white resize-none transition-colors"
                />
              </div>

              {/* Milestone escrow builder */}
              <div className="border-t border-border-thin/40 pt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-bold font-heading text-text-primary flex items-center gap-1.5">
                    Campaign Milestones
                  </h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Break your campaign into funded deliverables. USDC is locked in smart contract escrow and released only after community milestone votes pass.
                  </p>
                </div>

                <div className="space-y-4">
                  {milestones.map((m, index) => (
                    <div key={index} className="p-4 rounded-xl border border-border-thin/60 bg-surface/30 space-y-3 relative group/row">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-primary uppercase">Milestone {index + 1}</span>
                        {milestones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMilestone(index)}
                            className="p-1 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-3 space-y-1">
                          <input
                            type="text"
                            placeholder="Milestone title (e.g. Design & Alpha Specs)"
                            value={m.title}
                            onChange={(e) => handleMilestoneChange(index, "title", e.target.value)}
                            className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <input
                            type="number"
                            placeholder="USDC Amount"
                            value={m.amount || ""}
                            onChange={(e) => handleMilestoneChange(index, "amount", Number(e.target.value))}
                            className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="What gets delivered? (e.g. Technical layout doc, Figma mockup link)"
                          value={m.description}
                          onChange={(e) => handleMilestoneChange(index, "description", e.target.value)}
                          className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action buttons inside builder */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <button
                    type="button"
                    onClick={addMilestone}
                    className="px-4 py-2 rounded-xl bg-surface border border-border-thin hover:border-white/10 hover:bg-surface-elevated text-text-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add Milestone
                  </button>

                  {/* Total indicators with mismatch checks */}
                  <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                    milestoneGoalMismatch 
                      ? "bg-danger/10 border-danger/20 text-danger" 
                      : "bg-success/15 border-success/35 text-success"
                  }`}>
                    {milestoneGoalMismatch ? (
                      <AlertTriangle className="w-4 h-4 animate-bounce" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>
                      Total: {totalMilestoneAmount.toLocaleString()} of {goal.toLocaleString()} USDC
                      {milestoneGoalMismatch && " (Must equal campaign goal)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Launch button */}
              <div className="pt-6 border-t border-border-thin flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || milestoneGoalMismatch}
                  className="px-6 py-3.5 rounded-xl bg-primary text-white font-extrabold text-sm hover:bg-primary/95 transition-all shadow-[0_0_20px_rgba(124,58,237,0.35)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deploying Escrows...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      🚀 Launch Campaign
                    </>
                  )}
                </button>
              </div>

            </GlassCard>
          </form>
        </div>

        {/* Right Column: AI Prompt & Sybil Protection (1/3 width) */}
        <div className="space-y-6">
          
          {/* AI proposal creation banner */}
          <GlassCard className="p-6 border border-primary/20 bg-primary/[0.01] overflow-hidden relative" hover={false}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse shrink-0" />
                <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-wide">✨ AI Campaign Draft</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Describe your project idea in plain English (e.g. "Build a USDC yield harvester aggregator agent"). Our AI risk auditor will draft a complete, professional proposal outline for you in seconds!
              </p>
              
              <textarea
                placeholder="Describe your idea briefly (e.g. USDC Yield rebalancing agent)..."
                value={aiIdea}
                onChange={(e) => setAiIdea(e.target.value)}
                disabled={generatingWithAi}
                rows={3}
                className="w-full bg-surface border border-border-thin focus:border-primary/50 text-xs rounded-xl px-4 py-3 outline-none text-white resize-none transition-colors"
              />

              <button
                type="button"
                onClick={generateWithAI}
                disabled={generatingWithAi}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)]"
              >
                {generatingWithAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating Draft...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Generate Outline
                  </>
                )}
              </button>

              {aiError && (
                <span className="text-[11px] font-semibold text-danger block">{aiError}</span>
              )}
            </div>
          </GlassCard>

          {/* 3. Anti-Spam / Sybil Protection Placeholder Section */}
          <GlassCard className="p-6 border border-border-thin space-y-4" hover={false}>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                <span>🛡️</span> Campaign Protection
              </h3>
              <p className="text-[11px] text-muted leading-relaxed">
                SynArc uses layered cryptographic anti-spam controls to enforce quality and block malicious proposals.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <ProtectionItem
                icon="💰"
                title="Staking Requirements"
                description="Requires a temporary USDC stake to deploy milestone escrow vaults."
                status="Soon"
              />
              <ProtectionItem
                icon="⭐"
                title="Reputation Scores"
                description="Checks proposer governance record and on-chain vote participation scores."
                status="Soon"
              />
              <ProtectionItem
                icon="🤖"
                title="AI Fraud Detection"
                description="Autonomous risk engine scans description metadata for exploit patterns."
                status="Active"
              />
              <ProtectionItem
                icon="🏛"
                title="Governance Moderation"
                description="DAO delegates hold priority veto override consensus powers."
                status="Active"
              />
            </div>
          </GlassCard>

        </div>

      </div>

    </div>
  );
}
