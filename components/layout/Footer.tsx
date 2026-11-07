"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  ExternalLink,
  Copy,
  Check,
  Activity,
  Layers,
  Github,
  Twitter,
  ChevronRight,
  Cpu,
  Globe,
  Mail,
  Youtube,
} from "lucide-react";
import { SynArcLogo } from "@/components/ui/SynArcLogo";
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
  { label: "Track Verification Matrix", href: "#receipt-box", badge: "Receipts" },
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
];

const GOVERNANCE_LINKS: NavItem[] = [
  { label: "Three-Way Match Engine", href: "/#why" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Protocol Analytics", href: "/analytics" },
  { label: "Account Settings", href: "/settings" },
];

const SOCIAL_LINKS: NavItem[] = [
  {
    label: "Contact & Feedback",
    href: "/contact",
    isNew: true,
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@syndaopro",
    external: true,
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
    href: "mailto:hello@syndaopro.xyz",
    external: true,
  },
];

const LEGAL_LINKS: NavItem[] = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Protocol Disclaimer", href: "/terms#disclaimer" },
];

function FooterNavLink({ item, onOpenReceipt }: { item: NavItem; onOpenReceipt?: () => void }) {
  if (item.href === "#receipt-box") {
    return (
      <button
        type="button"
        onClick={onOpenReceipt}
        className="group inline-flex items-center gap-1.5 text-muted hover:text-foreground transition-colors cursor-pointer text-left"
      >
        <ChevronRight className="w-2.5 h-2.5 text-primary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        <span>{item.label}</span>
        {item.badge && (
          <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
            {item.badge}
          </span>
        )}
      </button>
    );
  }

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
  const [copied, setCopied] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

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
      navigator.clipboard.writeText("hello@syndaopro.xyz");
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
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
      <footer 
        data-component="footer"
        aria-label="Footer"
        className="relative overflow-hidden border-t border-border bg-background text-muted transition-colors duration-200"
      >
        {/* Subtle Top Border Highlight */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Navigation & Brand Columns */}
          <div className="pt-16 pb-12">
            <div className="footer-grid">
              {/* Brand Section */}
              <div className="footer-brand space-y-4">
                <Link href="/" className="inline-flex items-center gap-3 group">
                  <SynArcLogo size={36} animated={false} />
                  <span className="text-xl font-bold font-heading tracking-tight text-foreground group-hover:text-primary transition-colors">
                    Syn <span className="text-primary">DAO</span>
                  </span>
                </Link>

                <p className="text-sm text-muted leading-relaxed max-w-sm">
                  Autonomous governance and treasury execution on Arc.
                </p>

                {/* Social Icon Row + Contact Trigger */}
                <div className="socials pt-2 flex flex-wrap items-center gap-2.5">
                  <a
                    href="https://x.com/syndaopro"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg border border-border bg-surface flex items-center justify-center text-muted hover:text-foreground hover:border-primary/40 transition-colors shrink-0"
                    aria-label="Syn DAO on X"
                  >
                    <Twitter className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://github.com/kellycryptos/SynArc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg border border-border bg-surface flex items-center justify-center text-muted hover:text-foreground hover:border-primary/40 transition-colors shrink-0"
                    aria-label="Syn DAO on GitHub"
                  >
                    <Github className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://youtube.com/@syndaopro"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg border border-border bg-surface flex items-center justify-center text-muted hover:text-red-500 hover:border-red-500/40 transition-colors shrink-0"
                    aria-label="Syn DAO on YouTube"
                  >
                    <Youtube className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(true)}
                    className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg border border-border bg-surface hover:border-primary/40 text-xs font-mono text-muted hover:text-foreground transition-colors shrink-0 cursor-pointer"
                    title="Send message to team"
                  >
                    <Mail className="w-3 h-3 text-primary" />
                    <span>Contact</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-xs font-mono text-muted hover:text-foreground transition-colors cursor-pointer"
                    title="Copy email to clipboard"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Email</span>
                      </>
                    )}
                  </button>
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
                      <FooterNavLink item={item} onOpenReceipt={() => setIsReceiptModalOpen(true)} />
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

          {/* Bottom Bar: Operational Status, Explorer & Legal */}
          <div className="py-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-muted">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-border bg-surface text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-foreground font-medium">Arc Mainnet</span>
                <span className="text-emerald-500">• Operational</span>
              </div>
              <div className="hidden sm:inline-flex items-center gap-1.5 text-xs">
                <span>Treasury:</span>
                <code className="text-foreground">{shortTreasury}</code>
                <button
                  onClick={handleCopy}
                  aria-label="Copy Treasury Contract Address"
                  className="p-1 hover:text-primary transition-colors cursor-pointer"
                  title="Copy full Treasury address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <a
                href={`https://explorer.arc.io/address/${treasuryAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <span>Explorer</span>
                <ExternalLink className="w-3 h-3 text-primary" />
              </a>
              <button
                onClick={scrollToTop}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer group"
                title="Back to top"
              >
                <span>Top</span>
                <ArrowUp className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform text-primary" />
              </button>
              <span>&copy; {new Date().getFullYear()} Syn DAO</span>
            </div>
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
