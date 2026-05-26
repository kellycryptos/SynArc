"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { SynArcLogo } from "@/components/ui/SynArcLogo";
import { ArrowLeft, Shield, Key, Eye, EyeOff, Server, Trash2, Heart, HelpCircle } from "lucide-react";

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. Data Collected",
      icon: Shield,
      content: "SynArc is a privacy-first governance platform. We do not require or collect personal data such as names, email addresses, phone numbers, or IP addresses. The only data processed is public, on-chain data (your wallet address, proposal creations, delegations, and votes cast) which is necessary to interact with the Arc blockchain."
    },
    {
      title: "2. Wallet Data",
      icon: Key,
      content: "All interactions with the SynArc DAO require connecting a compatible Web3 wallet. SynArc never holds, reads, or gains access to your wallet's private keys or seed phrases. Any data associated with your wallet is publicly queryable from the distributed blockchain ledger."
    },
    {
      title: "3. Privy Authentication",
      icon: Eye,
      content: "SynArc uses Privy for wallet authentication and social login integration. Any credentials, social accounts, or embedded wallets created through Privy are managed and secured by Privy in accordance with their official Privacy Policy. SynArc does not store these credentials."
    },
    {
      title: "4. Cookies Policy",
      icon: EyeOff,
      content: "We use only minimal, strictly functional cookies or browser local storage parameters (e.g. storing your theme toggle preference or notification alert flag). We do not use third-party analytics cookies or tracking pixels to target advertising."
    },
    {
      title: "5. Third Party Services",
      icon: Server,
      content: "To maintain frontend hosting, wallet connection triggers, and node interaction channels, SynArc communicates with external infrastructure services including Vercel (hosting), Privy (connection), and Arc Testnet RPC nodes (blockchain state). Each service maintains its own privacy regulations."
    },
    {
      title: "6. Data Retention",
      icon: Trash2,
      content: "Data submitted through on-chain transactions (such as cast votes, proposals, or treasury deposits) is permanently recorded onto the Arc distributed blockchain ledger. By its decentralized nature, this historical ledger data is immutable and cannot be edited, erased, or deleted by any party."
    },
    {
      title: "7. Your Rights",
      icon: Heart,
      content: "Under standard digital privacy regulations (including GDPR/CCPA), you retain the right to manage your data. Because SynArc never stores or has custody of your personal data on any server, there are no databases containing your personal records to update, restrict, or delete."
    },
    {
      title: "8. Support & Community Contact",
      icon: HelpCircle,
      content: "If you have questions about this Privacy Policy or wish to inspect the transparent open-source code of the frontend, you can join our active community Discord or view our codebase and file audit logs on our public GitHub repository."
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
            <Shield className="w-3.5 h-3.5" /> Privacy & Security
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-heading tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="text-muted text-sm leading-relaxed max-w-xl">
            We value your digital sovereignty. SynArc does not collect, record, or track your personal information.
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
