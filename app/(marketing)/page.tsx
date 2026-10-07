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

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative pt-28 pb-20 md:pt-40 md:pb-28 overflow-hidden px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] opacity-[0.15] dark:opacity-[0.15] opacity-[0.06] bg-[#2F6FFF] blur-[130px] rounded-full" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full border border-border bg-surface/80 text-xs font-mono text-muted shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
            Live on Arc Mainnet
          </div>

          <h1 className="font-mono text-4xl sm:text-5xl md:text-[56px] font-bold tracking-tight leading-[1.1] text-foreground mb-6">
            A business funds USDC.{" "}
            <span className="text-primary">An agent pays the contractor.</span>{" "}
            The contract checks the invoice.
          </h1>

          <p className="font-mono text-base sm:text-lg text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Deposit USDC on Arc. Release only when the vote, the deliverable hash, and the payee match. Under 50 USDC the agent pays. Above that, a human approves.
          </p>

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

      <section id="how-it-works" className="py-24 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs font-mono font-medium text-muted uppercase tracking-wider mb-4">
              Mechanism
            </div>
            <h2 className="font-mono text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              How a payout clears
            </h2>
            <p className="mt-3 text-sm text-muted max-w-xl mx-auto">
              Four steps from a USDC deposit to a contractor payment. No custodian in the middle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StepCard
              step={1}
              icon={Wallet}
              title="Fund the treasury"
              body="The business deposits USDC into the on-chain treasury. The balance is public on the Arc explorer."
              delay={0}
            />
            <StepCard
              step={2}
              icon={Vote}
              title="Attach the invoice"
              body="A proposal names the contractor, the amount, and the deliverable pinned to IPFS. The contract stores that hash."
              delay={0.07}
            />
            <StepCard
              step={3}
              icon={ScanSearch}
              title="Agent scores the work"
              body="The agent scores the deliverable against the invoice. The score is an input. It cannot call release."
              delay={0.14}
            />
            <StepCard
              step={4}
              icon={SendHorizonal}
              title="Release the USDC"
              body="Funds move only when the vote, the document hash, and the payee match. Under 50 USDC the agent pays. Above that, a human approves."
              delay={0.21}
            />
          </div>
        </div>
      </section>

      <section id="why" className="py-24 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs font-mono font-medium text-muted uppercase tracking-wider mb-4">
              Differentiators
            </div>
            <h2 className="font-mono text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Why the contract, not the agent, signs
            </h2>
            <p className="mt-3 text-sm text-muted max-w-xl mx-auto">
              Each rule is enforced on Arc, not in a prompt.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <DiffCard
              icon={FileText}
              title="Invoice anchored on-chain"
              body="Every outflow must reference a pinned document. The contract stores the CID. No invoice hash, no release."
              delay={0}
            />
            <DiffCard
              icon={GitCompareArrows}
              title="Three-way match"
              body="Release needs the vote, the deliverable CID, and the payee in the proposal to agree. One mismatch reverts."
              delay={0.07}
            />
            <DiffCard
              icon={Clock}
              title="48-hour payee cooldown"
              body="A changed contractor address waits 48 hours before it can receive funds. That closes the last-minute swap."
              delay={0.14}
            />
            <DiffCard
              icon={Bot}
              title="Agent cap, human ceiling"
              body="The agent can pay at or under 50 USDC. Above that the contract stops for a human. The same payment cannot run twice."
              delay={0.21}
            />
          </div>
        </div>
      </section>

      <LandingActivitySectionLazy />

      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-mono text-2xl sm:text-3xl font-semibold text-foreground mb-4 tracking-tight">
            Put one payout on it
          </h2>
          <p className="text-sm text-muted mb-10 max-w-lg mx-auto leading-relaxed">
            Connect a wallet, fund USDC, and release the first contractor payment. The governor is live. The first release is not.
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

      <FloatingAIChatLazy />
    </div>
  );
}
