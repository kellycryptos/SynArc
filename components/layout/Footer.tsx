"use client";

import { motion } from "framer-motion";
import { SynArcLogo } from "@/components/ui/SynArcLogo";
import { GlowOrb } from "@/components/ui/GlowOrb";

/* ───────────────────────────────────────────────
   Link Data
   ─────────────────────────────────────────────── */

const productLinks = [
  { label: "Proposals", href: "/proposals" },
  { label: "Treasury", href: "/treasury" },
  { label: "Treasury Agent", href: "/agent" },
  { label: "Creator DAO", href: "/creator-daos" },
  { label: "Bridge", href: "/bridge" },
  { label: "Roadmap", href: "/#roadmap" },
];

const developerLinks = [
  { label: "Docs", href: "/docs" },
  { label: "Agent SDK", href: "/docs/sdk" },
  { label: "GitHub", href: "https://github.com/kellycryptos/SynArc", external: true },
];

const socialLinks = [
  { label: "Twitter / X", href: "https://x.com/synarc_", external: true },
  { label: "Discord", href: "#", comingSoon: true },
];

const legalLinks = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

/* ───────────────────────────────────────────────
   Animation Variants
   ─────────────────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const linkHoverVariants = {
  rest: { x: 0 },
  hover: { x: 3, transition: { duration: 0.25, ease: "easeOut" } },
};

/* ───────────────────────────────────────────────
   Sub-Components
   ─────────────────────────────────────────────── */

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{
    label: string;
    href: string;
    external?: boolean;
    comingSoon?: boolean;
  }>;
}) {
  return (
    <motion.div variants={itemVariants} className="space-y-5">
      <h4 className="text-xs font-semibold tracking-[0.12em] uppercase text-text-secondary/70 select-none">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <motion.li
            key={link.label}
            variants={linkHoverVariants}
            initial="rest"
            whileHover="hover"
          >
            {link.comingSoon ? (
              <span className="group inline-flex items-center gap-2 text-sm text-text-secondary/60 cursor-default">
                <span className="relative">
                  {link.label}
                  <span className="absolute bottom-[-2px] left-0 w-0 h-px bg-gradient-to-r from-purple-glow to-cyan-glow group-hover:w-full transition-all duration-300" />
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase rounded bg-background-primary border border-border text-text-secondary/80">
                  Coming Soon
                </span>
              </span>
            ) : link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent-blue transition-colors duration-300 relative"
              >
                <span className="relative">
                  {link.label}
                  <span className="absolute bottom-[-2px] left-0 w-0 h-px bg-gradient-to-r from-purple-glow to-cyan-glow group-hover:w-full transition-all duration-300" />
                </span>
                <svg
                  className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-50 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            ) : (
              <a
                href={link.href}
                className="group inline-flex items-center text-sm text-text-secondary hover:text-accent-blue transition-colors duration-300 relative"
              >
                <span className="relative">
                  {link.label}
                  <span className="absolute bottom-[-2px] left-0 w-0 h-px bg-gradient-to-r from-purple-glow to-cyan-glow group-hover:w-full transition-all duration-300" />
                </span>
              </a>
            )}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ───────────────────────────────────────────────
   Main Footer
   ─────────────────────────────────────────────── */

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-background-primary text-text-secondary transition-colors duration-200">
      {/* ── Ambient Background ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background-surface to-background-primary" />
      <div className="absolute inset-0 grid-overlay opacity-40" />

      {/* ── Glow Orbs ── */}
      <GlowOrb
        className="top-[-60px] left-[10%]"
        color="purple"
        size={300}
        blur={100}
      />
      <GlowOrb
        className="bottom-[20%] right-[5%]"
        color="cyan"
        size={200}
        blur={90}
      />
      <GlowOrb
        className="top-[40%] left-[45%]"
        color="blue"
        size={160}
        blur={70}
        animate={false}
      />

      {/* ── Main Content ── */}
      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        {/* Upper Footer */}
        <div className="pt-20 pb-16 lg:pt-28 lg:pb-20">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-16 lg:gap-20">
            {/* ── Left: Branding ── */}
            <motion.div
              variants={itemVariants}
              className="lg:max-w-md xl:max-w-lg flex-shrink-0"
            >
              <div className="relative inline-flex items-center gap-3 mb-7">
                {/* Glow behind logo */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <GlowOrb color="mixed" size={160} blur={50} animate />
                </div>

                <SynArcLogo size={44} animated />

                <span className="text-2xl font-bold tracking-tight text-foreground">
                  SynArc
                </span>
              </div>

              <p className="text-[15px] leading-[1.7] text-muted/80 max-w-sm">
                Leveraging Arc&apos;s high-performance infrastructure to power
                secure governance, delegation, DAO analytics, and treasury
                coordination.
              </p>

              {/* Tagline */}
              <div className="mt-6 inline-flex items-center gap-2 bg-background-primary border border-border text-text-secondary px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-glow animate-pulse" />
                <span className="text-[11px] font-medium tracking-wide uppercase">
                  Built for Creator DAOs on Arc.
                </span>
              </div>
            </motion.div>

            {/* ── Right: Navigation Columns ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 sm:gap-12 lg:gap-16 lg:flex-shrink-0">
              <FooterColumn title="Product" links={productLinks} />
              <FooterColumn title="Developers" links={developerLinks} />
              <FooterColumn title="Socials" links={socialLinks} />
            </div>
          </div>
        </div>

        {/* ── Bottom Bar ── */}
        <motion.div
          variants={itemVariants}
          className="relative py-8 border-t border-border"
        >
          <div className="flex flex-col items-center justify-center text-center gap-4">
            {/* Badges Row */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {/* Canteen Builder Badge */}
              <a
                href="https://thecanteenapp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-background-primary border border-border text-text-secondary px-3 py-1 rounded-full hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300 text-xs font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow animate-pulse" />
                <span>Built on Arc • Powered by Canteen</span>
              </a>

              {/* ArcLens Badge */}
              <a
                href="https://arclenz.xyz/ecosystem/synarc-dao"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-background-primary border border-border text-text-secondary px-3 py-1 rounded-full hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300 text-xs font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-glow animate-pulse" />
                <span>SynArc on ArcLens</span>
              </a>
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-6">
              {legalLinks.map((link, i) => (
                <span key={link.label} className="flex items-center gap-6">
                  <a
                    href={link.href}
                    className="group relative text-xs text-text-secondary/50 hover:text-text-primary/70 transition-colors duration-300"
                  >
                    {link.label}
                    <span className="absolute bottom-[-2px] left-0 w-0 h-px bg-gradient-to-r from-purple-glow to-cyan-glow group-hover:w-full transition-all duration-300" />
                  </a>
                  {i < legalLinks.length - 1 && (
                    <span className="w-px h-3 bg-border" />
                  )}
                </span>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-xs text-text-secondary/50 tracking-wide mt-1">
              &copy; 2026 SynArc. All Rights Reserved.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}
