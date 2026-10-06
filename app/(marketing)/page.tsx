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

/* ─────────────────────────────────────────────────────────────
   Sub-components — pure presentational, no hooks
   ───────────────────────────────────────────────────────────── */

/** A single "How it works" step card */
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
      className="relative p-6 border border-border flex flex-col gap-4"
    >
      {/* Step number */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs font-semibold text-primary border border-primary/30 bg-primary/10 rounded px-2 py-0.5 select-none">
          {String(step).padStart(2, "0")}
        </span>
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <h3 className="font-mono text-base font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-muted leading-relaxed">{body}</p>
    </GlassCard>
  );
}

/** A single "Why Syn DAO" differentiator card */
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
      className="p-6 border border-border flex flex-col gap-4"
    >
      <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h3 className="font-mono text-sm font-semibold text-foreground mb-2">
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
    <div className="flex flex-col min-h-screen">

      {/* ══════════════════════════════════════════════════════
          §1  HERO
          ══════════════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-20 md:pt-40 md:pb-28 overflow-hidden px-4">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] opacity-[0.15] dark:opacity-[0.15] opacity-[0.06] bg-[#2F6FFF] blur-[130px] rounded-full" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10 text-center">

          {/* Network badge — no fake stats */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full border border-border bg-surface/80 text-xs font-mono text-muted shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
            Live on Arc Mainnet
          </div>

          {/* Headline — monospace, per brief */}
          <h1 className="font-mono text-4xl sm:text-5xl md:text-[56px] font-bold tracking-tight leading-[1.1] text-foreground mb-6">
            Funding and governance{" "}
            <span
              className="text-primary"
              style={{ WebkitTextStroke: "0px" }}
            >
              for humans and agents
            </span>
            ,{" "}
            <span className="text-foreground">built on Arc.</span>
          </h1>

          {/* Sub-headline — the core loop sentence, verbatim from brief */}
          <p className="font-mono text-base sm:text-lg text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Fund USDC into the DAO treasury → vote on a proposal → release to a
            human or agent once the three-way match clears.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-mono font-semibold text-sm transition-colors shadow-[0_0_24px_rgba(47,111,255,0.25)] flex items-center justify-center gap-2"
            >
              Launch App
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/docs"
              className="w-full sm:w-auto px-7 py-3.5 rounded-lg border border-border bg-surface hover:border-primary/40 text-foreground font-mono font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              Read the docs
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §2  HOW IT WORKS
          ══════════════════════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="py-24 px-4 border-t border-border"
      >
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs font-mono font-medium text-muted uppercase tracking-wider mb-4">
              Mechanism
            </div>
            <h2 className="font-mono text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              How it works
            </h2>
            <p className="mt-3 text-sm text-muted max-w-xl mx-auto">
              Four concrete steps from USDC deposit to release — no intermediaries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

      {/* ══════════════════════════════════════════════════════
          §3  WHY SYN DAO — differentiators
          ══════════════════════════════════════════════════════ */}
      <section
        id="why"
        className="py-24 px-4 border-t border-border"
      >
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs font-mono font-medium text-muted uppercase tracking-wider mb-4">
              Differentiators
            </div>
            <h2 className="font-mono text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Why Syn DAO
            </h2>
            <p className="mt-3 text-sm text-muted max-w-xl mx-auto">
              Each mechanism named the way you would explain it to an engineer.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

      {/* ══════════════════════════════════════════════════════
          §4  REAL ACTIVITY — client island (honest empty state)
          ══════════════════════════════════════════════════════ */}
      <LandingActivitySectionLazy />

      {/* ══════════════════════════════════════════════════════
          §5  FINAL CTA
          ══════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-mono text-2xl sm:text-3xl font-semibold text-foreground mb-4 tracking-tight">
            Ready to participate?
          </h2>
          <p className="text-sm text-muted mb-10 max-w-lg mx-auto leading-relaxed">
            Connect your wallet, fund USDC into the treasury, and vote on the
            first proposals — or submit one yourself.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-mono font-semibold text-sm transition-colors shadow-[0_0_24px_rgba(47,111,255,0.2)] flex items-center justify-center gap-2"
            >
              Launch App
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/docs"
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg border border-border bg-surface hover:border-primary/40 text-foreground font-mono font-medium text-sm transition-colors shadow-xs"
            >
              Docs
            </Link>
            <a
              href="https://github.com/kellycryptos/SynArc"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg border border-border bg-surface hover:border-primary/40 text-foreground font-mono font-medium text-sm transition-colors shadow-xs"
            >
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Floating AI assistant — client island */}
      <FloatingAIChatLazy />
    </div>
  );
}
