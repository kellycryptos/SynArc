"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink, Github, Twitter } from "lucide-react";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";

export function DashboardFooter() {
  const { networkName, currentChainId, contracts, explorerUrl } = useArcNetwork();
  const treasuryAddress = contracts.treasuryGovernance;

  return (
    <footer className="mt-auto border-t border-border bg-surface/80 backdrop-blur-sm px-4 sm:px-6 py-4 text-xs font-mono text-muted">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-foreground font-medium">{networkName} ({currentChainId})</span>
          </div>
          <span className="text-border">|</span>
          <span className="text-muted hidden md:inline">
            Syn DAO v0.1.0
          </span>
        </div>

        {/* Center: Quick navigation links */}
        <div className="flex flex-wrap items-center gap-4 text-muted">
          <Link href="/docs" className="hover:text-foreground transition-colors">
            Docs
          </Link>
          <Link href="/docs/sdk" className="hover:text-foreground transition-colors">
            SDK
          </Link>
          <a
            href={`${explorerUrl}/address/${treasuryAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <span>Treasury</span>
            <ExternalLink className="w-3 h-3 text-primary" />
          </a>
          <a
            href={`${explorerUrl}/address/${contracts.governor}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <span>Governor</span>
            <ExternalLink className="w-3 h-3 text-primary" />
          </a>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
        </div>

        {/* Right: Social & Explorer */}
        <div className="flex items-center gap-3">
          <a
            href="https://x.com/syndaopro"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-foreground transition-colors p-1"
            aria-label="Syn DAO on X"
          >
            <Twitter className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://github.com/kellycryptos/SynArc"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-foreground transition-colors p-1"
            aria-label="Syn DAO on GitHub"
          >
            <Github className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
