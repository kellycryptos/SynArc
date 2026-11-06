import Link from "next/link";
import {
  ArrowRight,
  Wallet,
  Vote,
  SendHorizonal,
  ScanSearch,
  FileText,
  GitCompareArrows,
  Clock,
  Bot,
  Building2,
  Store,
  Users,
  Cpu,
  ShieldCheck,
  EyeOff,
  KeyRound,
  Lock,
  Scale,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FloatingAIChatLazy } from "@/components/marketing/FloatingAIChatLazy";
import { LandingActivitySectionLazy } from "@/components/marketing/LandingActivitySectionLazy";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";

/* ─────────────────────────────────────────────────────────────
   Sub-components — pure presentational, no hooks
   ───────────────────────────────────────────────────────────── */

/** A single "How it works" step card with Syn DAO hexagon accents */
function StepCard({
  step,
  icon: Icon,
  title,
  body,
  delay,
}: {
  step: number;
  icon: React.ElementType;
  title: string;
  body: string;
  delay?: number;
}) {
  return (
    <GlassCard
      delay={delay}
      className="relative p-6 border border-border hover:border-cyan-500/40 flex flex-col gap-4 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(0,242,254,0.06)] rounded-2xl bg-surface/70"
    >
      {/* Step number & Hexagon Icon Container */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs font-semibold text-cyan-400 border border-cyan-500/30 bg-cyan-950/40 rounded px-2 py-0.5 select-none">
          {String(step).padStart(2, "0")}
        </span>
        <div
          className="w-9 h-9 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400 group-hover:scale-105 group-hover:bg-cyan-500/20 transition-all duration-300"
          style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }}
        >
          <Icon className="w-4 h-4 text-cyan-300" />
        </div>
      </div>
      <h3 className="font-heading font-semibold text-base text-foreground tracking-tight group-hover:text-cyan-400 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted leading-relaxed">{body}</p>
    </GlassCard>
  );
}

/** Architecture differentiator card with Purple/Cyan accents */
function DiffCard({
  icon: Icon,
  title,
  body,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  delay?: number;
}) {
  return (
    <GlassCard
      delay={delay}
      className="p-6 border border-border hover:border-purple-500/40 flex flex-col gap-4 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(127,0,255,0.08)] rounded-2xl bg-surface/70"
    >
      <div
        className="w-10 h-10 bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-400 group-hover:scale-105 group-hover:bg-purple-500/20 transition-all duration-300"
        style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }}
      >
        <Icon className="w-5 h-5 text-purple-300" />
      </div>
      <div>
        <h3 className="font-heading font-semibold text-sm text-foreground mb-2 group-hover:text-purple-300 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted leading-relaxed">{body}</p>
      </div>
    </GlassCard>
  );
}

/** Blueprint card for SDK use cases */
function BlueprintCard({
  icon: Icon,
  role,
  title,
  features,
  accent = "cyan",
  delay,
}: {
  icon: React.ElementType;
  role: string;
  title: string;
  features: string[];
  accent?: "cyan" | "purple";
  delay?: number;
}) {
  const isCyan = accent === "cyan";
  return (
    <GlassCard
      delay={delay}
      className={`p-6 border border-border flex flex-col justify-between transition-all duration-300 group rounded-2xl bg-surface/70 ${
        isCyan
          ? "hover:border-cyan-500/40 hover:shadow-[0_0_24px_rgba(0,242,254,0.06)]"
          : "hover:border-purple-500/40 hover:shadow-[0_0_24px_rgba(127,0,255,0.08)]"
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-10 h-10 flex items-center justify-center shrink-0 transition-all duration-300 ${
              isCyan
                ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:bg-cyan-500/20"
                : "bg-purple-500/10 border border-purple-500/30 text-purple-400 group-hover:bg-purple-500/20"
            }`}
            style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }}
          >
            <Icon className={`w-5 h-5 ${isCyan ? "text-cyan-300" : "text-purple-300"}`} />
          </div>
          <span className="font-mono text-xs font-medium text-muted uppercase tracking-wider">
            {role}
          </span>
        </div>

        <h3 className="font-heading font-semibold text-lg text-foreground mb-3 tracking-tight">
          {title}
        </h3>

        <ul className="space-y-2 mb-6">
          {features.map((feature, i) => (
            <li key={i} className="text-xs sm:text-sm text-muted flex items-start gap-2 leading-relaxed">
              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isCyan ? "bg-cyan-400" : "bg-purple-400"}`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/docs/sdk"
        className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium transition-colors ${
          isCyan ? "text-cyan-400 hover:text-cyan-300" : "text-purple-400 hover:text-purple-300"
        }`}
      >
        View SDK blueprint
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </GlassCard>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden relative">

      {/* Subtle Hexagonal Grid Background Overlay */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 opacity-30"
        style={{
          backgroundImage: "radial-gradient(rgba(0, 242, 254, 0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ════════════════════════════════════════════════════════
          §1  HERO
          ════════════════════════════════════════════════════════ */}
      <section 
        data-section="hero"
        aria-label="Syn DAO Overview"
        className="hero relative pt-24 pb-16 sm:pt-28 sm:pb-20 md:pt-40 md:pb-28 overflow-hidden px-4 w-full"
      >
        {/* Background glow — subtle ambient halo */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[400px] opacity-[0.08] dark:opacity-[0.16] bg-gradient-to-r from-[#00F2FE] via-[#2F6FFF] to-[#7F00FF] blur-[140px] rounded-full" />
        </div>

        <div className="w-full max-w-4xl mx-auto relative z-10 text-center">

          {/* Operational network status pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full border border-border bg-surface/80 text-xs font-mono text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            Arc Mainnet Operational
          </div>

          {/* Headline — focused, confident */}
          <h1 className="hero-title font-heading font-bold tracking-tight text-foreground mb-6 break-words text-4xl sm:text-5xl md:text-6xl leading-[1.15]">
            Funding and governance{" "}
            <span
              className="bg-gradient-to-r from-[#00F2FE] via-[#4F8BFF] to-[#7F00FF] bg-clip-text text-transparent font-extrabold"
              style={{ WebkitTextStroke: "0px" }}
            >
              for humans and agents
            </span>
            ,{" "}
            <span className="text-foreground">built on Arc.</span>
          </h1>

          {/* Sub-headline */}
          <p className="hero-subtitle font-mono text-muted max-w-2xl mx-auto mb-10 leading-relaxed break-words text-base sm:text-lg">
            Fund USDC into the treasury, vote on proposals, and execute releases through contract-verified rules.
          </p>

          {/* CTAs */}
          <div className="hero-buttons flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              href="/dashboard"
              className="btn w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#00F2FE] via-[#2F6FFF] to-[#7F00FF] hover:opacity-95 text-white font-heading font-semibold text-sm transition-all shadow-[0_0_25px_rgba(0,242,254,0.3)] hover:shadow-[0_0_35px_rgba(127,0,255,0.4)] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Launch App
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard?demo=true"
              className="btn w-full sm:w-auto px-6 py-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-mono font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:text-white"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              ⚡ 90s Judge Demo
            </Link>
            <Link
              href="/docs"
              className="btn w-full sm:w-auto px-7 py-3.5 rounded-xl border border-border bg-surface/80 hover:border-cyan-500/40 text-foreground font-mono font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-xs hover:text-white"
            >
              Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          §2  HOW IT WORKS
          ════════════════════════════════════════════════════════ */}
      <section
        id="how-it-works"
        data-section="how-it-works"
        aria-labelledby="heading-how-it-works"
        className="relative py-16 sm:py-24 px-4 border-t border-border w-full overflow-hidden"
      >
        <div id="governance" className="absolute -top-16 left-0" />
        <div className="max-w-5xl mx-auto w-full">
          <div className="mb-12 text-center">
            <h2 id="heading-how-it-works" className="font-heading text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              How it works
            </h2>
          </div>

          <div className="steps-grid">
            <StepCard
              step={1}
              icon={Wallet}
              title="Fund treasury"
              body="Deposit USDC into the on-chain governance treasury. The balance is publicly readable at any time from the Arc explorer."
              delay={0}
            />
            <StepCard
              step={2}
              icon={Vote}
              title="Vote on a proposal"
              body="Members vote For, Against, or Abstain on a proposal that specifies a payee, amount, and deliverable document pinned to IPFS."
              delay={0.07}
            />
            <StepCard
              step={3}
              icon={ScanSearch}
              title="AI verifier scores it"
              body="An AI agent scores the deliverable against the proposal document. The score is an input to the discussion — the vote is the only trigger for release."
              delay={0.14}
            />
            <StepCard
              step={4}
              icon={SendHorizonal}
              title="Release to payee"
              body="Once the contract confirms the three-way match (vote passed, deliverable hash matches, cooldown elapsed), funds transfer to the payee address."
              delay={0.21}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          §3  ARCHITECTURE
          ════════════════════════════════════════════════════════ */}
      <section
        id="why"
        data-section="architecture"
        aria-labelledby="heading-architecture"
        className="relative py-16 sm:py-24 px-4 border-t border-border w-full overflow-hidden"
      >
        <div id="features" className="absolute -top-16 left-0" />
        <div className="max-w-5xl mx-auto w-full">
          <div className="mb-12 text-center">
            <h2 id="heading-architecture" className="font-heading text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Architecture
            </h2>
          </div>

          <div className="features-grid">
            <DiffCard
              icon={FileText}
              title="Document-anchored treasury entries"
              body="Every treasury outflow must reference a pinned IPFS document. The contract stores the CID on-chain — no document hash, no release."
              delay={0}
            />
            <DiffCard
              icon={GitCompareArrows}
              title="Contract-level three-way match"
              body="Release requires three things to agree at the contract level: the vote result, the deliverable CID, and the payee address recorded in the proposal."
              delay={0.07}
            />
            <DiffCard
              icon={Clock}
              title="48-hour payee-change cooldown"
              body="After a payee address is set or changed, a 48-hour delay is enforced before that address can receive funds — closing the last-minute address-swap attack."
              delay={0.14}
            />
            <DiffCard
              icon={Bot}
              title="AI verifier as input, not trigger"
              body="The AI agent reads the deliverable and scores it against the proposal. That score appears in the proposal thread. It has no write-access to the release function."
              delay={0.21}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          §4  USE CASES — One SDK, Four Architectures
          ════════════════════════════════════════════════════════ */}
      <section
        id="solutions"
        data-section="use-cases"
        aria-labelledby="heading-use-cases"
        className="relative py-16 sm:py-24 px-4 border-t border-border w-full overflow-hidden"
      >
        <div className="max-w-5xl mx-auto w-full">
          <div className="mb-12 text-center">
            <h2 id="heading-use-cases" className="font-heading text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              One SDK. Four Architectures.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BlueprintCard
              icon={Building2}
              role="Enterprise"
              title="Organizations"
              features={[
                "Dual-treasury architecture: timelocked reserves & operating accounts",
                "Contract-enforced Three-Way Match for programmatic vendor payouts",
                "48-hour payee-change cooldown to prevent address substitution attacks",
                "Automatic human multi-sig review gate on disbursements above 50 USDC",
              ]}
              accent="cyan"
              delay={0}
            />

            <BlueprintCard
              icon={Store}
              role="Commercial"
              title="Businesses"
              features={[
                "Milestone-gated customer escrows with verified deliverable checks",
                "Instant cross-chain customer invoicing via native Circle CCTP",
                "Automated working capital yield via curated Morpho vaults on Arc",
                "Sub-cent native USDC gas settlement with zero synthetic asset risk",
              ]}
              accent="purple"
              delay={0.07}
            />

            <BlueprintCard
              icon={Users}
              role="Governance"
              title="Communities & DAOs"
              features={[
                "Checkpointed OpenZeppelin ERC20Votes with delegated balance snapshots",
                "Custom voting strategies: Quadratic, Staked Duration, or Multi-Asset",
                "Milestone crowdfunds and creator launchpads with transparent tracking",
                "Public grant disbursements verified on-chain against IPFS deliverables",
              ]}
              accent="cyan"
              delay={0.14}
            />

            <BlueprintCard
              icon={Cpu}
              role="Autonomous"
              title="AI Agents"
              features={[
                "Autonomous sub-cap execution (under 50 USDC) with zero human latency",
                "Canonical on-chain agent identity registered via ERC-8004",
                "Treasury Guard: automated health monitoring and cross-chain rebalancing",
                "Hardware-style bit-flip guards for deterministic idempotency protection",
              ]}
              accent="purple"
              delay={0.21}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          §5  GOVERNANCE CUSTOMIZATION & VOTING WEIGHT
          ════════════════════════════════════════════════════════ */}
      <section
        id="governance-customization"
        data-section="governance-customization"
        aria-labelledby="heading-governance"
        className="relative py-16 sm:py-24 px-4 border-t border-border w-full overflow-hidden"
      >
        <div className="max-w-5xl mx-auto w-full">
          <div className="mb-12 text-center">
            <h2 id="heading-governance" className="font-heading text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Pluggable Governance & Voting Weight
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: How Voting Weight is Determined */}
            <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-8 rounded-2xl border border-border bg-surface/70">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400"
                    style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }}
                  >
                    <Scale className="w-4 h-4 text-cyan-300" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-foreground">
                    Determining Voting Weight
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-border bg-surface-elevated/40">
                    <div className="font-mono text-xs font-semibold text-cyan-400 mb-1">Checkpointed Tokens (sARC)</div>
                    <p className="text-xs text-muted leading-relaxed">
                      1 sARC = 1 vote. Balances are check-pointed by block height via ERC20Votes, eliminating flash-loan manipulation.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-surface-elevated/40">
                    <div className="font-mono text-xs font-semibold text-purple-400 mb-1">USDC & Multi-Asset Weighting</div>
                    <p className="text-xs text-muted leading-relaxed">
                      Stable asset holdings (USDC, EURC, cirBTC) provide economic multipliers to prevent purely speculative volatility.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-surface-elevated/40">
                    <div className="font-mono text-xs font-semibold text-cyan-400 mb-1">Quadratic Voting & Reputation</div>
                    <p className="text-xs text-muted leading-relaxed">
                      Pluggable algorithms dampen whale dominance (weight = square root of tokens) and integrate ERC-8004 agent credentials.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border mt-6">
                <Link
                  href="/docs/governance"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Explore governance parameters
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right: Code Sample Terminal */}
            <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-8 rounded-2xl border border-border bg-[#080C14] font-mono text-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[11px] text-muted">custom-voting-weight.ts</span>
                </div>

                <div className="space-y-1 text-slate-300 leading-relaxed overflow-x-auto py-2">
                  <p><span className="text-purple-400">import</span> &#123; SynArc, SYNARC_MAINNET &#125; <span className="text-purple-400">from</span> <span className="text-emerald-400">&apos;synarc-agent-sdk&apos;</span>;</p>
                  <p className="text-muted">{"// 1. Initialize client"}</p>
                  <p><span className="text-blue-400">const</span> synarc = <span className="text-purple-400">new</span> <span className="text-cyan-400">SynArc</span>(SYNARC_MAINNET);</p>
                  <p>&nbsp;</p>
                  <p className="text-muted">{"// 2. Compute quadratic voting power"}</p>
                  <p><span className="text-blue-400">function</span> <span className="text-amber-300">getQuadraticWeight</span>(rawTokens: <span className="text-cyan-300">bigint</span>) &#123;</p>
                  <p className="pl-4"><span className="text-purple-400">return</span> BigInt(Math.floor(Math.sqrt(Number(rawTokens))));</p>
                  <p>&#125;</p>
                  <p>&nbsp;</p>
                  <p className="text-muted">{"// 3. Verify on-chain snapshot balance"}</p>
                  <p><span className="text-blue-400">const</span> votes = <span className="text-purple-400">await</span> synarc.<span className="text-amber-300">getPastVotes</span>(user, block);</p>
                  <p><span className="text-blue-400">const</span> weight = <span className="text-amber-300">getQuadraticWeight</span>(votes);</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/80 flex items-center justify-between text-[11px] text-muted">
                <span>EVM & TypeScript 5+</span>
                <span className="text-cyan-400">synarc-agent-sdk</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          §6  PRIVACY — Zero-Knowledge Roadmap (Coming Soon)
          ════════════════════════════════════════════════════════ */}
      <section
        id="privacy"
        data-section="privacy"
        aria-labelledby="heading-privacy"
        className="relative py-16 sm:py-24 px-4 border-t border-border w-full overflow-hidden"
      >
        <div className="max-w-5xl mx-auto w-full">
          <div className="mb-12 text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full border border-purple-500/30 bg-purple-950/30 text-xs font-mono text-purple-300">
              <Lock className="w-3.5 h-3.5" />
              <span>Coming Soon</span>
            </div>
            <h2 id="heading-privacy" className="font-heading text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Zero-Knowledge Privacy
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard
              delay={0}
              className="p-6 border border-border hover:border-purple-500/40 rounded-2xl bg-surface/70 flex flex-col justify-between"
            >
              <div>
                <div
                  className="w-10 h-10 bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4"
                  style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }}
                >
                  <ShieldCheck className="w-5 h-5 text-purple-300" />
                </div>
                <h3 className="font-heading font-semibold text-base text-foreground mb-2">
                  ZK Confidential Ballots
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  Voters prove voting eligibility and voting power via client-side ZK-SNARK proofs without revealing their address or token balances.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border text-xs font-mono text-muted">
                Shielded Governance
              </div>
            </GlassCard>

            <GlassCard
              delay={0.07}
              className="p-6 border border-border hover:border-cyan-500/40 rounded-2xl bg-surface/70 flex flex-col justify-between"
            >
              <div>
                <div
                  className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4"
                  style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }}
                >
                  <EyeOff className="w-5 h-5 text-cyan-300" />
                </div>
                <h3 className="font-heading font-semibold text-base text-foreground mb-2">
                  Shielded Disbursements
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  Stealth address generation and private USDC transfers allow enterprise payroll and contractor retainers to remain confidential.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border text-xs font-mono text-muted">
                Private Payroll
              </div>
            </GlassCard>

            <GlassCard
              delay={0.14}
              className="p-6 border border-border hover:border-purple-500/40 rounded-2xl bg-surface/70 flex flex-col justify-between"
            >
              <div>
                <div
                  className="w-10 h-10 bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4"
                  style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }}
                >
                  <KeyRound className="w-5 h-5 text-purple-300" />
                </div>
                <h3 className="font-heading font-semibold text-base text-foreground mb-2">
                  Selective Viewing Keys
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  Exportable cryptographic viewing keys allow authorized compliance auditors and tax authorities to inspect transaction records on demand.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border text-xs font-mono text-muted">
                Compliance Auditing
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          §7  REAL ACTIVITY — client island (honest empty state)
          ════════════════════════════════════════════════════════ */}
      <div id="treasury" className="relative">
        <SectionErrorBoundary sectionName="Proposals and Activity">
          <LandingActivitySectionLazy />
        </SectionErrorBoundary>
      </div>

      {/* ════════════════════════════════════════════════════════
          §8  FINAL CTA
          ════════════════════════════════════════════════════════ */}
      <section 
        data-section="get-started"
        aria-label="Get Started"
        className="py-16 sm:py-24 px-4 border-t border-border w-full overflow-hidden"
      >
        <div className="max-w-2xl mx-auto text-center w-full">
          <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground mb-8 tracking-tight">
            Start building with Syn DAO
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#00F2FE] via-[#2F6FFF] to-[#7F00FF] hover:opacity-95 text-white font-heading font-semibold text-sm transition-all shadow-[0_0_24px_rgba(0,242,254,0.25)] hover:shadow-[0_0_35px_rgba(127,0,255,0.35)] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Launch App
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/docs"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-border bg-surface hover:border-cyan-500/40 text-foreground font-mono font-medium text-sm transition-all shadow-xs hover:text-white"
            >
              Documentation
            </Link>
            <a
              href="https://github.com/kellycryptos/SynArc"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-border bg-surface hover:border-purple-500/40 text-foreground font-mono font-medium text-sm transition-all shadow-xs hover:text-white"
            >
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Floating AI assistant — client island */}
      <SectionErrorBoundary sectionName="AI Companion">
        <FloatingAIChatLazy />
      </SectionErrorBoundary>
    </div>
  );
}
