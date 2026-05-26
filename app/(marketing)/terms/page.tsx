"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { SynArcLogo } from "@/components/ui/SynArcLogo";
import { ArrowLeft, Scale, Shield, Landmark, AlertTriangle, AlertCircle, HelpCircle } from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      title: "1. Introduction",
      icon: SynArcLogo,
      content: "SynArc is a decentralized governance infrastructure platform built on the Arc Testnet. It provides DAOs and decentralized protocols with USDC and EURC native treasury capabilities, secure delegator-voter structures, and real-time governance metrics. By accessing or using SynArc, you acknowledge that you are interacting with testnet smart contracts and a decentralized frontend interface."
    },
    {
      title: "2. Eligibility",
      icon: Scale,
      content: "To access or use SynArc, you must be at least 18 years of age and hold the full capacity to enter into a binding agreement. You represent and warrant that your access and use of the platform comply with all applicable local, national, and international laws, regulations, and economic sanctions."
    },
    {
      title: "3. Wallet Connection",
      icon: Shield,
      content: "Accessing governance activities requires connecting a non-custodial Web3 wallet (e.g. via Privy). SynArc is a purely decentralized interface. SynArc never holds, accesses, or controls your private keys, seed phrases, or digital assets. You are solely responsible for securing your wallet and authorizing all transactions."
    },
    {
      title: "4. Governance Participation",
      icon: Landmark,
      content: "All actions performed on SynArc, including submitting proposals, delegating voting power, and casting votes, are recorded directly on the Arc blockchain network. These on-chain transactions are completely public, permanent, and mathematically irreversible. Ensure all parameters are reviewed carefully prior to transaction signing."
    },
    {
      title: "5. Treasury Management",
      icon: CoinsIcon,
      content: "USDC and EURC stablecoin deposits, stakings, and DAO-approved allocations are managed programmatically by autonomous, open-source smart contracts deployed on the Arc Testnet. The SynArc team, developers, and contributors have no control over treasury funds, custody of deposits, or transactional interventions."
    },
    {
      title: "6. Risks & Limitations",
      icon: AlertTriangle,
      content: "You explicitly acknowledge and accept the inherent risks of smart contracts, cryptographic tokens, and experimental blockchain protocols. SynArc operates on the Arc Testnet; all tokens are for testing purposes only and hold no real-world economic value. No content on the platform constitutes financial, legal, or investment advice."
    },
    {
      title: "7. Prohibited Use",
      icon: AlertCircle,
      content: "You agree not to engage in any activity that violates laws, manipulates governance metrics (e.g., sybil attacks, voting coordination bribery), disrupts smart contract systems, exploits frontends, or introduces malicious code. Any form of illegal activity will lead to the restricted access of the interface."
    },
    {
      title: "8. Limitation of Liability",
      icon: Scale,
      content: "SynArc is provided on an 'as-is' and 'as-available' basis, without warranties or guarantees of any kind, either express or implied. Under no circumstances shall the SynArc team, contributors, or developers be liable for any direct, indirect, incidental, or consequential losses, including lost profits or wallet exploits."
    },
    {
      title: "9. Changes to Terms",
      icon: HelpCircle,
      content: "These Terms of Service may be updated or amended at any time. Significant parameter updates or operational policy revisions are recommended to be resolved via DAO governance voting proposals by sARC holders on-chain."
    },
    {
      title: "10. Contact & Community",
      icon: HelpCircle,
      content: "For inquiries, feedback, technical support, or to engage with our active developer community, you can inspect our open-source repositories on GitHub or join our official community Discord. All resources and documentation are publicly available."
    }
  ];

  return (
    <div className="relative min-h-screen pt-12 pb-24 overflow-hidden px-4 md:px-6">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] opacity-20 bg-gradient-to-r from-primary via-arc-blue to-accent blur-[100px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        {/* Back Link */}
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded bg-surface border border-border-thin text-muted">
            Last Updated: May 2026
          </span>
        </div>

        {/* Title & Header */}
        <div className="text-center md:text-left space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-border-thin text-xs font-semibold uppercase tracking-wider text-primary">
            <Scale className="w-3.5 h-3.5" /> Legal Framework
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-heading tracking-tight text-white">
            Terms of Service
          </h1>
          <p className="text-muted text-sm leading-relaxed max-w-xl">
            Please read these terms carefully before interacting with SynArc smart contracts and decentralized systems.
          </p>
        </div>

        {/* Sections list */}
        <div className="space-y-6">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <GlassCard key={idx} delay={idx * 0.03} className="p-6 sm:p-8 border border-border-thin">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white font-heading">{section.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed font-body">{section.content}</p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Coins icon helper
function CoinsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="8" cy="8" r="6" />
      <circle cx="18" cy="18" r="4" />
      <path d="M12 18a6 6 0 0 0-6-6" />
    </svg>
  );
}
