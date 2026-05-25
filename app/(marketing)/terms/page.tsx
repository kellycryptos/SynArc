"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Scale, AlertTriangle, FileText } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

export default function TermsOfService() {
  return (
    <div className="relative min-h-screen pt-12 pb-24 overflow-hidden px-4 md:px-6">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] opacity-20 bg-gradient-to-r from-primary via-arc-blue to-accent blur-[100px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        {/* Title & Header */}
        <div className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-border-thin text-xs font-semibold uppercase tracking-wider text-primary mb-4">
            <Scale className="w-3.5 h-3.5" /> Legal Framework
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-heading tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted">
            Terms of Service
          </h1>
          <p className="text-muted">Last updated: May 25, 2026</p>
        </div>

        {/* Main Terms Container */}
        <GlassCard hover={false} className="p-8 md:p-12 space-y-8 leading-relaxed text-muted-foreground">
          
          <section className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> 1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, or using the SynArc DAO platform accessible at{" "}
              <Link href="https://www.synarcdao.xyz" className="text-primary hover:underline font-semibold">
                https://www.synarcdao.xyz/
              </Link>{" "}
              (the &quot;Platform&quot; or &quot;Site&quot;), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service (the &quot;Terms&quot;) and our Privacy Policy.
            </p>
            <p>
              If you do not agree to these Terms, you must immediately cease all access to the Platform. SynArc is a decentralized governance infrastructure protocol built on the Arc network; any interaction with the on-chain components is subject to blockchain network fees, latency, and conditions outside our control.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-arc-blue" /> 2. Description of the Platform
            </h2>
            <p>
              SynArc coordinates and exposes governance infrastructure enabling decentralized programmable organizations, custom timelock configurations, and USDC-native treasury execution. The Platform utilizes Privy for embedded wallets and authentication, along with WAGMI and Viem for RPC node communication with the Arc Network.
            </p>
            <p>
              The Platform is provided strictly on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. SynArc operates as a non-custodial decentralized application, meaning we do not store, access, or control your cryptographic keys or assets.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <Scale className="w-5 h-5 text-accent" /> 3. Governance Voting and Token Usage
            </h2>
            <p>
              Participation in the SynArc ecosystem requires holders to execute transactions using tokens natively recognized on the Arc Network. Under no circumstances does the Platform guarantee financial return, utility stability, or continuous operation. 
            </p>
            <p>
              Voters and delegates are solely responsible for verifying the code, timelocks, and specific parameters of proposals they participate in. Executed proposals are permanent, immutable, and irreversible.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" /> 4. Disclaimers & Risk Assessment
            </h2>
            <div className="p-4 rounded-xl bg-warning/5 border border-warning/10 text-sm space-y-2">
              <p className="font-bold text-warning uppercase tracking-wide">
                Warning: High-Risk Activity
              </p>
              <p>
                Smart contracts, blockchain protocols, and decentralized applications are experimental technologies. By interacting with the Platform, you acknowledge that you are fully aware of risks including protocol security vulnerabilities, software exploits, regulator changes, network congestion, and volatile blockchain operations.
              </p>
            </div>
            <p>
              SynArc disclaims all liability for losses arising from token price fluctuation, incorrect transaction construction, unauthorized wallet access, or software malfunction.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-foreground">
              5. Governing Law
            </h2>
            <p>
              These Terms and any dispute or claim arising out of or in connection with them or their subject matter shall be governed by, and construed in accordance with, the laws of the jurisdiction in which the core coordination teams reside, without giving effect to any choice of law principles.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-foreground">
              6. Contact and Operations
            </h2>
            <p>
              For governance updates, documentation, and roadmap schedules, please check the official site at{" "}
              <Link href="https://www.synarcdao.xyz" className="text-primary hover:underline font-semibold">
                https://www.synarcdao.xyz/
              </Link>{" "}
              or participate via our official GitHub repository.
            </p>
          </section>

        </GlassCard>
      </div>
    </div>
  );
}
