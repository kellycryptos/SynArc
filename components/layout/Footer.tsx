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
  ShieldCheck,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  Github,
  Twitter,
  ChevronRight,
  Database,
  Lock,
  Cpu,
  Globe,
} from "lucide-react";
import { SynArcLogo } from "@/components/ui/SynArcLogo";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { CONTRACTS_MAINNET } from "@/lib/arc-config";

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
  { label: "Testnet Faucet", href: "/faucet" },
  { label: "Security & Audits", href: "/docs" },
];

const GOVERNANCE_LINKS: NavItem[] = [
  { label: "Three-Way Match Engine", href: "/#why" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "DAO Leaderboard", href: "/leaderboard" },
  { label: "Protocol Analytics", href: "/analytics" },
  { label: "Constitution & Charter", href: "/docs" },
  { label: "Account Settings", href: "/settings" },
];

const SOCIAL_LINKS: NavItem[] = [
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
  { label: "Brand Assets", href: "/docs" },
];

/* ─────────────────────────────────────────────────────────────
   Main Pro Footer Component
   ───────────────────────────────────────────────────────────── */

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const treasuryAddress = CONTRACTS_MAINNET.treasuryGovernance;
  const shortTreasury = `${treasuryAddress.slice(0, 6)}...${treasuryAddress.slice(-4)}`;

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(treasuryAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubscribed(true);
      setEmail("");
    }, 600);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="relative overflow-hidden border-t border-[#151C29] bg-[#05080F] text-[#9CA6B8] transition-colors duration-200">
      {/* ── Glowing Top Border Accent Beam ── */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#2F6FFF]/60 to-transparent" />
      <div className="absolute top-0 inset-x-1/4 h-[2px] bg-gradient-to-r from-transparent via-[#4F8BFF]/40 to-transparent blur-sm" />

      {/* ── Ambient Background Lighting & Grid ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#05080F] via-[#070D18] to-[#04060B] pointer-events-none" />
      <div className="absolute inset-0 grid-overlay opacity-25 pointer-events-none" />

      {/* Dynamic Glow Orbs */}
      <GlowOrb
        className="-top-32 left-1/4"
        color="purple"
        size={360}
        blur={120}
        animate
      />
      <GlowOrb
        className="bottom-10 right-10"
        color="cyan"
        size={300}
        blur={110}
        animate
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ══════════════════════════════════════════════════════
            §1 PRO DISPATCH / NEWSLETTER CARD
            ══════════════════════════════════════════════════════ */}
        <div className="pt-16 pb-12 border-b border-[#1B2536]">
          <div className="relative rounded-2xl border border-[#1B2536] bg-[#0B111C]/90 p-6 sm:p-8 lg:p-10 backdrop-blur-xl overflow-hidden shadow-2xl">
            {/* Subtle inner card accent gradients */}
            <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-[#2F6FFF]/10 blur-[80px] pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-[#4F8BFF]/5 blur-[70px] pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left text */}
              <div className="lg:col-span-6 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#2F6FFF]/30 bg-[#2F6FFF]/10 text-xs font-mono text-[#4F8BFF]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Autonomous Governance Dispatches</span>
                </div>
                <h3 className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F7FA]">
                  Stay ahead of on-chain intelligence.
                </h3>
                <p className="text-sm text-[#9CA6B8] max-w-xl leading-relaxed">
                  Weekly intelligence on AI verifier milestones, Circle CCTP rebalances, and verified deliverable payouts across the Arc ecosystem.
                </p>
              </div>

              {/* Right form & perks */}
              <div className="lg:col-span-6 flex flex-col justify-center">
                {subscribed ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 flex items-center gap-3 text-sm font-mono"
                  >
                    <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-[#F5F7FA]">You are subscribed to Syn DAO Dispatches.</p>
                      <p className="text-xs text-emerald-300/80">Check your inbox for the next governance briefing.</p>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubscribe} className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <div className="relative flex-1">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your developer or DAO email..."
                          className="w-full px-4 py-3 rounded-xl border border-[#1B2536] bg-[#05080F]/90 text-sm font-mono text-[#F5F7FA] placeholder-[#6B7385] focus:outline-none focus:border-[#2F6FFF] focus:ring-1 focus:ring-[#2F6FFF] transition-all shadow-inner"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 rounded-xl bg-[#2F6FFF] hover:bg-[#4F8BFF] disabled:opacity-50 text-white font-mono font-semibold text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(47,111,255,0.3)] hover:shadow-[0_0_28px_rgba(47,111,255,0.5)] flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <span>Subscribing...</span>
                        ) : (
                          <>
                            <span>Subscribe</span>
                            <Send className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#6B7385]">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-[#2F6FFF]" />
                        Zero spam • One-click unsubscribe
                      </span>
                      <span>•</span>
                      <span>Verified Arc updates only</span>
                    </div>
                  </form>
                )}

                {/* Micro Protocol Metrics Bar */}
                <div className="mt-6 pt-5 border-t border-[#1B2536]/70 grid grid-cols-3 gap-2 text-center sm:text-left">
                  <div>
                    <span className="block font-mono text-base font-bold text-[#F5F7FA]">48h</span>
                    <span className="text-[11px] font-mono text-[#6B7385]">Cooldown Guard</span>
                  </div>
                  <div>
                    <span className="block font-mono text-base font-bold text-[#2F6FFF]">100%</span>
                    <span className="text-[11px] font-mono text-[#6B7385]">On-Chain Match</span>
                  </div>
                  <div>
                    <span className="block font-mono text-base font-bold text-emerald-400">USDC</span>
                    <span className="text-[11px] font-mono text-[#6B7385]">Native Settlement</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            §2 TELEMETRY & LIVE NETWORK STATUS BAR
            ══════════════════════════════════════════════════════ */}
        <div className="py-6 border-b border-[#1B2536] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          {/* Left: Network Status Pill */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1B2536] bg-[#0B111C]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[#F5F7FA] font-medium">Arc Mainnet</span>
              <span className="text-[#6B7385]">ID: 5042</span>
              <span className="text-emerald-400 font-semibold">• Operational</span>
            </div>

            {/* Quick Copy Treasury Address */}
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1B2536] bg-[#0B111C]">
              <span className="text-[#6B7385]">Treasury:</span>
              <code className="text-[#F5F7FA]">{shortTreasury}</code>
              <button
                onClick={handleCopy}
                aria-label="Copy Treasury Contract Address"
                className="p-1 hover:text-[#4F8BFF] text-[#9CA6B8] transition-colors rounded"
                title="Copy full Treasury address"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1B2536] bg-[#0B111C] hover:border-[#2F6FFF]/40 text-[#9CA6B8] hover:text-[#F5F7FA] transition-all"
            >
              <span>Arc Explorer</span>
              <ExternalLink className="w-3 h-3 text-[#2F6FFF]" />
            </a>

            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1B2536] bg-[#0B111C] hover:border-[#2F6FFF]/40 text-[#9CA6B8] hover:text-[#F5F7FA] transition-all cursor-pointer group"
              title="Back to top of page"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform text-[#2F6FFF]" />
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            §3 MAIN NAVIGATION & BRANDING COLUMNS
            ══════════════════════════════════════════════════════ */}
        <div className="pt-16 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
            {/* ── Brand Section (4 cols on large) ── */}
            <div className="lg:col-span-4 space-y-6">
              <Link href="/" className="inline-flex items-center gap-3 group">
                <div className="relative">
                  <SynArcLogo size={42} animated />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold font-space tracking-tight text-[#F5F7FA] group-hover:text-[#4F8BFF] transition-colors">
                    Syn <span className="text-[#2F6FFF]">DAO</span>
                  </span>
                  <span className="text-[10px] font-mono tracking-widest text-[#6B7385] uppercase">
                    Institutional Governance Engine
                  </span>
                </div>
              </Link>

              <p className="text-sm text-[#9CA6B8] leading-relaxed max-w-sm">
                The institutional coordination layer for humans and autonomous AI agents. Safe multi-sig treasuries, deliverable-hash verification, and automated settlement built natively on Arc.
              </p>

              {/* Protocol Specs Badges */}
              <div className="space-y-2 pt-2">
                <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0B111C] border border-[#1B2536] text-[#9CA6B8]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2F6FFF]" />
                    OpenZeppelin v5
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0B111C] border border-[#1B2536] text-[#9CA6B8]">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    Circle CCTP v2
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0B111C] border border-[#1B2536] text-[#9CA6B8]">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    IPFS Anchored
                  </span>
                </div>
              </div>

              {/* Social Icon Row */}
              <div className="pt-2 flex items-center gap-3">
                <a
                  href="https://x.com/syndaopro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg border border-[#1B2536] bg-[#0B111C] flex items-center justify-center text-[#9CA6B8] hover:text-[#F5F7FA] hover:border-[#2F6FFF]/40 transition-colors"
                  aria-label="Syn DAO on X"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://github.com/kellycryptos/SynArc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg border border-[#1B2536] bg-[#0B111C] flex items-center justify-center text-[#9CA6B8] hover:text-[#F5F7FA] hover:border-[#2F6FFF]/40 transition-colors"
                  aria-label="Syn DAO on GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2F6FFF]/30 bg-[#2F6FFF]/10 text-xs font-mono font-medium text-[#4F8BFF] hover:bg-[#2F6FFF]/20 transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Launch App
                </Link>
              </div>
            </div>

            {/* ── Navigation Columns (8 cols on large, 4-column grid) ── */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
              {/* Col 1: Ecosystem */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono font-semibold tracking-wider uppercase text-[#F5F7FA] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#2F6FFF]" />
                  Ecosystem
                </h4>
                <ul className="space-y-2.5 text-xs font-mono">
                  {ECOSYSTEM_LINKS.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="group inline-flex items-center gap-1.5 text-[#9CA6B8] hover:text-[#F5F7FA] transition-colors"
                      >
                        <ChevronRight className="w-2.5 h-2.5 text-[#2F6FFF] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        <span>{item.label}</span>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold tracking-wider ${
                              item.badge === "Live"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-[#2F6FFF]/10 text-[#4F8BFF] border border-[#2F6FFF]/20"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Col 2: Developers */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono font-semibold tracking-wider uppercase text-[#F5F7FA] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#2F6FFF]" />
                  Developers
                </h4>
                <ul className="space-y-2.5 text-xs font-mono">
                  {DEVELOPER_LINKS.map((item) => (
                    <li key={item.label}>
                      {item.external ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-1.5 text-[#9CA6B8] hover:text-[#F5F7FA] transition-colors"
                        >
                          <ChevronRight className="w-2.5 h-2.5 text-[#2F6FFF] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          <span>{item.label}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-[#6B7385] group-hover:text-[#4F8BFF]" />
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          className="group inline-flex items-center gap-1.5 text-[#9CA6B8] hover:text-[#F5F7FA] transition-colors"
                        >
                          <ChevronRight className="w-2.5 h-2.5 text-[#2F6FFF] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold tracking-wider bg-[#2F6FFF]/10 text-[#4F8BFF] border border-[#2F6FFF]/20">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Col 3: Governance */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono font-semibold tracking-wider uppercase text-[#F5F7FA] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#2F6FFF]" />
                  Governance
                </h4>
                <ul className="space-y-2.5 text-xs font-mono">
                  {GOVERNANCE_LINKS.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="group inline-flex items-center gap-1.5 text-[#9CA6B8] hover:text-[#F5F7FA] transition-colors"
                      >
                        <ChevronRight className="w-2.5 h-2.5 text-[#2F6FFF] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Col 4: Community & Legal */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono font-semibold tracking-wider uppercase text-[#F5F7FA] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#2F6FFF]" />
                  Community
                </h4>
                <ul className="space-y-2.5 text-xs font-mono">
                  {SOCIAL_LINKS.map((item) => (
                    <li key={item.label}>
                      {item.badge ? (
                        <div className="inline-flex items-center gap-1.5 text-[#6B7385] cursor-default">
                          <span>{item.label}</span>
                          <span className="px-1 py-0.2 rounded text-[9px] uppercase font-bold tracking-wider bg-[#0B111C] border border-[#1B2536] text-[#6B7385]">
                            {item.badge}
                          </span>
                        </div>
                      ) : (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-1.5 text-[#9CA6B8] hover:text-[#F5F7FA] transition-colors"
                        >
                          <ChevronRight className="w-2.5 h-2.5 text-[#2F6FFF] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          <span>{item.label}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-[#6B7385] group-hover:text-[#4F8BFF]" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>

                {/* Sub-section: Legal */}
                <div className="pt-4 border-t border-[#1B2536]/60">
                  <h5 className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[#6B7385] mb-2.5">
                    Legal & Trust
                  </h5>
                  <ul className="space-y-2 text-xs font-mono">
                    {LEGAL_LINKS.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className="text-[#6B7385] hover:text-[#9CA6B8] transition-colors"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            §4 BOTTOM BAR & DISCLAIMER
            ══════════════════════════════════════════════════════ */}
        <div className="py-8 border-t border-[#1B2536] flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-[#6B7385]">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span>&copy; {new Date().getFullYear()} Syn DAO. All rights reserved.</span>
            <span className="hidden sm:inline text-[#1B2536]">|</span>
            <span>Built on Arc • Powered by Circle CCTP</span>
          </div>

          <p className="text-[11px] text-[#6B7385] text-center md:text-right max-w-xl">
            Syn DAO is an autonomous, open-source governance protocol. Code is law; on-chain contracts enforce treasury safety rules and 48-hour timelocks.
          </p>
        </div>
      </div>
    </footer>
  );
}
