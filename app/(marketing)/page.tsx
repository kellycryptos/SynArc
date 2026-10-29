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

/** A single "Why Syn DAO" differentiator card with Purple/Cyan accents */
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
      <section className="hero relative pt-24 pb-16 sm:pt-28 sm:pb-20 md:pt-40 md:pb-28 overflow-hidden px-4 w-full">
        {/* Background glow — Dual Cyan & Purple ambient halos */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[400px] opacity-[0.08] dark:opacity-[0.20] bg-gradient-to-r from-[#00F2FE] via-[#2F6FFF] to-[#7F00FF] blur-[140px] rounded-full" />
        </div>

        <div className="w-full max-w-4xl mx-auto relative z-10 text-center">

          {/* Network badge — no fake stats */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-8 rounded-full border border-cyan-500/30 bg-surface/80 text-xs font-mono text-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.12)]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0 shadow-[0_0_8px_#00F2FE]" />
            Live on Arc Mainnet
          </div>

          {/* Headline — responsive typography */}
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

          {/* Sub-headline — responsive typography */}
          <p className="hero-subtitle font-mono text-muted max-w-2xl mx-auto mb-10 leading-relaxed break-words text-base sm:text-lg">
            Fund USDC into the DAO treasury → vote on a proposal → release to a
            human or agent once the three-way match clears.
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
              href="/docs"
              className="btn w-full sm:w-auto px-7 py-3.5 rounded-xl border border-border bg-surface/80 hover:border-cyan-500/40 text-foreground font-mono font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-xs hover:text-white"
            >
              Read the docs
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          §2  HOW IT WORKS
          ════════════════════════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="relative py-16 sm:py-24 px-4 border-t border-border w-full overflow-hidden"
      >
        <div id="governance" className="absolute -top-16 left-0" />
        <div className="max-w-5xl mx-auto w-full">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-950/20 text-xs font-mono font-medium text-cyan-400 uppercase tracking-wider mb-4">
              Mechanism
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              How it works
            </h2>
            <p className="mt-3 text-sm text-muted max-w-xl mx-auto">
              Four concrete steps from USDC deposit to release — no intermediaries.
            </p>
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
          §3  WHY SYN DAO — differentiators
          ════════════════════════════════════════════════════════ */}
      <section
        id="why"
        className="relative py-16 sm:py-24 px-4 border-t border-border w-full overflow-hidden"
      >
        <div id="features" className="absolute -top-16 left-0" />
        <div className="max-w-5xl mx-auto w-full">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-950/20 text-xs font-mono font-medium text-purple-400 uppercase tracking-wider mb-4">
              Differentiators
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Why Syn DAO
            </h2>
            <p className="mt-3 text-sm text-muted max-w-xl mx-auto">
              Each mechanism named the way you would explain it to an engineer.
            </p>
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
          §4  REAL ACTIVITY — client island (honest empty state)
          ════════════════════════════════════════════════════════ */}
      <div id="treasury" className="relative">
        <SectionErrorBoundary sectionName="Proposals and Activity">
          <LandingActivitySectionLazy />
        </SectionErrorBoundary>
      </div>

      {/* ════════════════════════════════════════════════════════
          §5  FINAL CTA
          ════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-4 border-t border-border w-full overflow-hidden">
        <div className="max-w-2xl mx-auto text-center w-full">
          <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground mb-4 tracking-tight">
            Ready to participate?
          </h2>
          <p className="text-sm text-muted mb-10 max-w-lg mx-auto leading-relaxed">
            Connect your wallet, fund USDC into the treasury, and vote on the
            first proposals — or submit one yourself.
          </p>
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
              Docs
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
