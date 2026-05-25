"use client";

import Link from "next/link";
import { ArrowLeft, Shield, EyeOff, Key, Database } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

export default function PrivacyPolicy() {
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
            <Shield className="w-3.5 h-3.5" /> User Confidentiality
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-heading tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted">
            Privacy Policy
          </h1>
          <p className="text-muted">Last updated: May 25, 2026</p>
        </div>

        {/* Main Privacy Container */}
        <GlassCard hover={false} className="p-8 md:p-12 space-y-8 leading-relaxed text-muted-foreground">
          
          <section className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-primary" /> 1. Overview of Governance Privacy
            </h2>
            <p>
              SynArc is committed to preserving the privacy of members participating in the governance of programmable organizations on Arc. Our platform uses client-side cryptography, embedded wallet clients, and peer-to-peer RPC interfaces to ensure you interact with the network with minimal exposure of off-chain metadata.
            </p>
            <p>
              The official URL for our platform is{" "}
              <Link href="https://www.synarcdao.xyz" className="text-primary hover:underline font-semibold">
                https://www.synarcdao.xyz/
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <Key className="w-5 h-5 text-arc-blue" /> 2. Non-Custodial Key Storage
            </h2>
            <p>
              Under no circumstances does SynArc capture, store, or transmit your private keys, wallet seed phrases, or login passwords. Embedded wallets are managed securely through Privy&apos;s authentication service, which generates split keys client-side to enforce secure, user-authorized actions only.
            </p>
            <p>
              Your public wallet address, voting history, and token balances are retrieved directly from the public Arc testnet blockchain using remote RPC servers. This information is publicly available on the ledger and cannot be hidden or deleted.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
              <Database className="w-5 h-5 text-accent" /> 3. Data Collection and Usage
            </h2>
            <p>
              Our application does not employ persistent tracking databases or sell personal information to third parties. We collect minimal telemetry strictly to run the web interface, which includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Authentication Tokens:</strong> Temporary cookies (like `privy-token`) stored locally in your browser to maintain your login session across route changes.
              </li>
              <li>
                <strong>Web Analytics:</strong> Basic anonymous site usage metrics to optimize rendering efficiency and identify system errors.
              </li>
              <li>
                <strong>RPC Logs:</strong> Basic server request data received during nodes coordination, subject to the privacy statements of the public RPC providers.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-foreground">
              4. External Integrations
            </h2>
            <p>
              We integrate third-party services including Privy, WAGMI libraries, and Arc scan indexers. These services may collect basic networking identifiers (like your IP address) necessary to initiate Web3 sessions. We encourage you to review their individual privacy statements to verify how they process your request information.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-foreground">
              5. Policy Changes
            </h2>
            <p>
              This Privacy Policy may be updated to reflect updates in the underlaying Arc blockchain networks, smart contract upgrades, or feature changes. We will indicate the most recent update date at the top of this document.
            </p>
            <p>
              For additional questions or to contribute to the open-source platform code, visit our github repository or our website at{" "}
              <Link href="https://www.synarcdao.xyz" className="text-primary hover:underline font-semibold">
                https://www.synarcdao.xyz/
              </Link>
              .
            </p>
          </section>

        </GlassCard>
      </div>
    </div>
  );
}
