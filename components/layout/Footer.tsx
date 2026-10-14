"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  ExternalLink,
  Copy,
  Check,
  Send,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  Github,
  Twitter,
  ChevronRight,
  Lock,
  Cpu,
  Globe,
  Mail,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { SynArcLogo } from "@/components/ui/SynArcLogo";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { CONTRACTS_MAINNET } from "@/lib/arc-config";
import { ContactModal } from "@/components/contact/ContactModal";

/* ─────────────────────────────────────────────────────────────
   Navigation Data
   ───────────────────────────────────────────────────────────── */

interface NavItem {
  label: string;
  href: string;
  external?: boolean;
  badge?: string;
  isNew?: boolean;
}

const ECOSYSTEM_LINKS: NavItem[] = [
  { label: "Treasury Vault", href: "/treasury", badge: "Live" },
  { label: "Proposals & Voting", href: "/proposals" },
  { label: "AI Treasury Agent", href: "/agent", badge: "AI" },
  { label: "Creator DAOs", href: "/creator-daos" },
  { label: "Cross-Chain Bridge", href: "/bridge" },
  { label: "Earn & Yield", href: "/earn" },
  { label: "DAO Directory", href: "/daos" },
  { label: "Launch a DAO", href: "/create-dao" },
];

const DEVELOPER_LINKS: NavItem[] = [
  { label: "Documentation", href: "/docs" },
  { label: "Agent SDK Guide", href: "/docs/sdk", badge: "v0.1" },
  { label: "GitHub Repository", href: "https://github.com/kellycryptos/SynArc", external: true },
  {
    label: "Treasury Contract",
    href: `https://explorer.arc.io/address/${CONTRACTS_MAINNET.treasuryGovernance}`,
    external: true,
  },
  {
    label: "Governor Contract",
    href: `https://explorer.arc.io/address/${CONTRACTS_MAINNET.governor}`,
    external: true,
  },
  { label: "Claim sARC Faucet", href: "/faucet" },
  { label: "Security & Audits", href: "#", badge: "Coming Soon" },
];

const GOVERNANCE_LINKS: NavItem[] = [
  { label: "Three-Way Match Engine", href: "/#why" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "DAO Leaderboard", href: "/leaderboard" },
  { label: "Protocol Analytics", href: "/analytics" },
  { label: "Constitution & Charter", href: "#", badge: "Coming Soon" },
  { label: "Account Settings", href: "/settings" },
];

const SOCIAL_LINKS: NavItem[] = [
  {
    label: "Contact & Feedback",
    href: "/contact",
    isNew: true,
  },
  {
    label: "Twitter / X",
    href: "https://x.com/syndaopro",
    external: true,
  },
  {
    label: "GitHub Organization",
    href: "https://github.com/kellycryptos/SynArc",
    external: true,
  },
  {
    label: "Email Team",
    href: "mailto:devsynarc@gmail.com",
    external: true,
  },
  {
    label: "Discord Community",
    href: "#",
    badge: "Coming Soon",
  },
  {
    label: "Telegram Portal",
    href: "#",
    badge: "Coming Soon",
  },
  {
    label: "Governance Forum",
    href: "#",
    badge: "Coming Soon",
  },
];

const LEGAL_LINKS: NavItem[] = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Protocol Disclaimer", href: "/terms#disclaimer" },
  { label: "Brand Assets", href: "#", badge: "Coming Soon" },
];

function FooterNavLink({ item }: { item: NavItem }) {
  if (item.badge === "Coming Soon") {
    return (
      <div className="inline-flex items-center gap-1.5 text-muted cursor-default select-none">
        <span>{item.label}</span>
        <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-surface border border-border text-muted">
          Coming Soon
        </span>
      </div>
    );
  }

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1.5 text-muted hover:text-foreground transition-colors"
      >
        <ChevronRight className="w-2.5 h-2.5 text-primary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        <span>{item.label}</span>
        <ExternalLink className="w-2.5 h-2.5 text-muted/60 group-hover:text-primary transition-colors" />
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      className="group inline-flex items-center gap-1.5 text-muted hover:text-foreground transition-colors"
    >
      <ChevronRight className="w-2.5 h-2.5 text-primary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      <span>{item.label}</span>
      {item.isNew && (
        <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          New
        </span>
      )}
      {item.badge && (
        <span
          className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
            item.badge === "Live"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-primary/10 text-primary border border-primary/20"
          }`}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Pro Footer Component
   ───────────────────────────────────────────────────────────── */

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const treasuryAddress = CONTRACTS_MAINNET.treasuryGovernance;
  const shortTreasury = `${treasuryAddress.slice(0, 6)}...${treasuryAddress.slice(-4)}`;

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(treasuryAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyEmail = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText("devsynarc@gmail.com");
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setIsSubmitting(true);
    setSubscribeError(null);
    try {
      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          source: "Footer Pro Dispatches",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to subscribe to updates.");
      }

      setSubscribed(true);
      setEmail("");
    } catch (err: any) {
      console.error("Subscription error:", err);
      setSubscribeError(
        err.message || "Failed to subscribe. You can email devsynarc@gmail.com directly."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <footer className="relative overflow-hidden border-t border-border bg-background text-muted transition-colors duration-200">
        {/* ── Glowing Top Border Accent Beam ── */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#2F6FFF]/60 to-transparent" />
        <div className="absolute top-0 inset-x-1/4 h-[2px] bg-gradient-to-r from-transparent via-[#4F8BFF]/40 to-transparent blur-sm" />

        {/* ── Ambient Background Lighting & Grid ── */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-surface/80 to-background dark:from-[#05080F] dark:via-[#070D18] dark:to-[#04060B] pointer-events-none" />
        <div className="absolute inset-0 grid-overlay opacity-15 dark:opacity-25 pointer-events-none" />

        {/* Dynamic Glow Orbs */}
        <GlowOrb
          className="-top-32 left-1/4 opacity-15 dark:opacity-100"
          color="purple"
          size={360}
          blur={120}
          animate
        />
        <GlowOrb
          className="bottom-10 right-10 opacity-15 dark:opacity-100"
          color="cyan"
          size={300}
          blur={110}
          animate
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ══════════════════════════════════════════════════════
              §1 PRO DISPATCH / NEWSLETTER CARD
              ══════════════════════════════════════════════════════ */}
          <div className="pt-16 pb-12 border-b border-border">
            <div className="relative rounded-2xl border border-border bg-surface/90 p-6 sm:p-8 lg:p-10 backdrop-blur-xl overflow-hidden shadow-lg shadow-slate-900/5 dark:shadow-2xl">
              {/* Subtle inner card accent gradients */}
              <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-primary/5 blur-[70px] pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left text */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs font-mono text-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Autonomous Governance Dispatches</span>
                  </div>
                  <h3 className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    Stay ahead of on-chain intelligence.
                  </h3>
                  <p className="text-sm text-muted max-w-xl leading-relaxed">
                    Weekly intelligence on AI verifier milestones, Circle CCTP rebalances, and verified deliverable payouts across the Arc ecosystem.
                  </p>
                </div>

                {/* Right form & perks */}
                <div className="lg:col-span-6 flex flex-col justify-center">
                  {subscribed ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center gap-3 text-sm font-mono"
                    >
                      <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">
                          You are subscribed to Syn DAO Dispatches.
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          Notification sent to <code className="font-semibold text-foreground">devsynarc@gmail.com</code>. Check your inbox for briefings.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubscribe} className="space-y-3">
                      {subscribeError && (
                        <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 dark:text-red-400 text-xs font-mono flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{subscribeError}</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <div className="relative flex-1">
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your developer or DAO email..."
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-white-keep font-mono font-semibold text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(47,111,255,0.3)] hover:shadow-[0_0_28px_rgba(47,111,255,0.5)] flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <span>Subscribing...</span>
                          ) : (
                            <>
                              <span className="text-white-keep">Subscribe</span>
                              <Send className="w-3.5 h-3.5 text-white-keep" />
                            </>
                          )}
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted">
                        <span className="flex items-center gap-1.5">
                          <Lock className="w-3 h-3 text-primary" />
                          Zero spam • One-click unsubscribe
                        </span>
                        <span>•</span>
                        <span>Verified Arc updates only</span>
                      </div>
                    </form>
                  )}

                  {/* Micro Protocol Metrics Bar */}
                  <div className="mt-6 pt-5 border-t border-border/70 grid grid-cols-3 gap-2 text-center sm:text-left">
                    <div>
                      <span className="block font-mono text-base font-bold text-foreground">48h</span>
                      <span className="text-[11px] font-mono text-muted">Cooldown Guard</span>
                    </div>
                    <div>
                      <span className="block font-mono text-base font-bold text-primary">100%</span>
                      <span className="text-[11px] font-mono text-muted">On-Chain Match</span>
                    </div>
                    <div>
                      <span className="block font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">USDC</span>
                      <span className="text-[11px] font-mono text-muted">Native Settlement</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Direct Feedback & Inquiries Banner ── */}
              <div className="mt-8 pt-6 border-t border-border/80 flex flex-col md:flex-row items-center justify-between gap-4 bg-background/50 rounded-xl p-4 sm:p-5 border border-border/70">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-mono text-sm font-bold text-foreground">
                        Have Feedback or Questions?
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        devsynarc@gmail.com
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      Send your ideas, feature requests, or queries directly to our core developer inbox.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="px-3.5 py-2 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-xs font-mono text-muted hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Copy email to clipboard"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Email</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-white-keep font-mono text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(47,111,255,0.3)] cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-white-keep" />
                    <span className="text-white-keep">Send Message</span>
                  </button>

                  <Link
                    href="/contact"
                    className="hidden sm:inline-flex px-3.5 py-2 rounded-xl border border-border bg-surface hover:border-primary/40 text-xs font-mono text-muted hover:text-foreground transition-colors"
                  >
                    Contact Page
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              §2 TELEMETRY & LIVE NETWORK STATUS BAR
              ══════════════════════════════════════════════════════ */}
          <div className="py-6 border-b border-border flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            {/* Left: Network Status Pill */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-foreground font-medium">Arc Mainnet</span>
                <span className="text-muted">ID: 5042</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">• Operational</span>
              </div>

              {/* Quick Copy Treasury Address */}
              <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface">
                <span className="text-muted">Treasury:</span>
                <code className="wallet-address text-foreground">{shortTreasury}</code>
                <button
                  onClick={handleCopy}
                  aria-label="Copy Treasury Contract Address"
                  className="p-1 hover:text-primary text-muted transition-colors rounded cursor-pointer"
                  title="Copy full Treasury address"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Right: Security & Explorer Badges */}
            <div className="flex items-center gap-3">
              <a
                href={`https://explorer.arc.io/address/${treasuryAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:border-primary/40 text-muted hover:text-foreground transition-all shadow-xs"
              >
                <span>Arc Explorer</span>
                <ExternalLink className="w-3 h-3 text-primary" />
              </a>

              <button
                onClick={scrollToTop}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:border-primary/40 text-muted hover:text-foreground transition-all cursor-pointer group shadow-xs"
                title="Back to top of page"
              >
                <span>Back to Top</span>
                <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform text-primary" />
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              §3 MAIN NAVIGATION & BRANDING COLUMNS
              ══════════════════════════════════════════════════════ */}
          <div className="pt-16 pb-16">
            <div className="footer-grid">
              {/* ── Brand Section ── */}
              <div className="footer-brand space-y-6">
                <Link href="/" className="inline-flex items-center gap-3 group">
                  <div className="relative">
                    <SynArcLogo size={42} animated />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-2xl font-bold font-space tracking-tight text-foreground group-hover:text-primary transition-colors">
                      Syn <span className="text-primary">DAO</span>
                    </span>
                    <span className="text-[10px] font-mono tracking-widest text-muted uppercase">
                      Institutional Governance Engine
                    </span>
                  </div>
                </Link>

                <p className="text-sm text-muted leading-relaxed max-w-sm">
                  The institutional coordination layer for humans and autonomous AI agents. Safe multi-sig treasuries, deliverable-hash verification, and automated settlement built natively on Arc.
                </p>

                {/* Social Icon Row + Contact Trigger */}
                <div className="socials pt-2 flex flex-wrap items-center gap-3">
                  <a
                    href="https://x.com/syndaopro"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg border border-border bg-surface flex items-center justify-center text-muted hover:text-foreground hover:border-primary/40 transition-colors shrink-0 shadow-xs"
                    aria-label="Syn DAO on X"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a
                    href="https://github.com/kellycryptos/SynArc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg border border-border bg-surface flex items-center justify-center text-muted hover:text-foreground hover:border-primary/40 transition-colors shrink-0 shadow-xs"
                    aria-label="Syn DAO on GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(true)}
                    className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg border border-border bg-surface hover:border-primary/40 text-xs font-mono text-muted hover:text-foreground transition-colors shrink-0 cursor-pointer shadow-xs"
                    title="Send message to devsynarc@gmail.com"
                  >
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    <span>Contact</span>
                  </button>
                  <Link
                    href="/dashboard"
                    className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-lg border border-primary/30 bg-primary/10 text-xs font-mono font-medium text-primary hover:bg-primary/20 transition-colors shrink-0"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Launch App</span>
                  </Link>
                </div>
              </div>

              {/* Col 1: Ecosystem */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono font-semibold tracking-wider uppercase text-foreground flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  Ecosystem
                </h4>
                <ul className="space-y-2.5 text-xs font-mono">
                  {ECOSYSTEM_LINKS.map((item) => (
                    <li key={item.label}>
                      <FooterNavLink item={item} />
                    </li>
                  ))}
                </ul>
              </div>

              {/* Col 2: Developers */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono font-semibold tracking-wider uppercase text-foreground flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-primary" />
                  Developers
                </h4>
                <ul className="space-y-2.5 text-xs font-mono">
                  {DEVELOPER_LINKS.map((item) => (
                    <li key={item.label}>
                      <FooterNavLink item={item} />
                    </li>
                  ))}
                </ul>
              </div>

              {/* Col 3: Governance */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono font-semibold tracking-wider uppercase text-foreground flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  Governance
                </h4>
                <ul className="space-y-2.5 text-xs font-mono">
                  {GOVERNANCE_LINKS.map((item) => (
                    <li key={item.label}>
                      <FooterNavLink item={item} />
                    </li>
                  ))}
                </ul>
              </div>

              {/* Col 4: Community & Legal */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono font-semibold tracking-wider uppercase text-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-primary" />
                  Community
                </h4>
                <ul className="space-y-2.5 text-xs font-mono">
                  {SOCIAL_LINKS.map((item) => (
                    <li key={item.label}>
                      <FooterNavLink item={item} />
                    </li>
                  ))}
                </ul>

                {/* Sub-section: Legal */}
                <div className="pt-4 border-t border-border/60">
                  <h5 className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted mb-2.5">
                    Legal & Trust
                  </h5>
                  <ul className="space-y-2.5 text-xs font-mono">
                    {LEGAL_LINKS.map((item) => (
                      <li key={item.label}>
                        {item.badge === "Coming Soon" ? (
                          <div className="inline-flex items-center gap-1.5 text-muted cursor-default select-none">
                            <span>{item.label}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-surface border border-border text-muted">
                              Coming Soon
                            </span>
                          </div>
                        ) : (
                          <Link
                            href={item.href}
                            className="text-muted hover:text-foreground transition-colors"
                          >
                            {item.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              §4 BOTTOM BAR & DISCLAIMER
              ══════════════════════════════════════════════════════ */}
          <div className="py-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-muted">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
              <span>&copy; {new Date().getFullYear()} Syn DAO. All rights reserved.</span>
              <span className="hidden sm:inline text-border">|</span>
              <span>Built on Arc</span>
            </div>

            <p className="text-[11px] text-muted text-center md:text-right max-w-xl">
              Syn DAO is an autonomous, open-source governance protocol. Code is law; on-chain contracts enforce treasury safety rules and 48-hour timelocks.
            </p>
          </div>
        </div>
      </footer>

      {/* Interactive Contact & Feedback Modal */}
      {isContactModalOpen && (
        <ContactModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
        />
      )}
    </>
  );
}
