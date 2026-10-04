"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink, Github, Twitter } from "lucide-react";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";

export function DashboardFooter() {
  const { networkName, currentChainId, contracts, explorerUrl } = useArcNetwork();
  const treasuryAddress = contracts.treasuryGovernance;

  return (
    <footer className="mt-auto border-t border-[#151C29] bg-[#05080F]/60 backdrop-blur-sm px-4 sm:px-6 py-4 text-xs font-mono text-[#6B7385]">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[#9CA6B8] font-medium">{networkName} ({currentChainId})</span>
          </div>
          <span className="text-[#1B2536]">|</span>
          <span className="text-[#6B7385] hidden md:inline">
            Syn DAO v0.1.0
          </span>
        </div>

        {/* Center: Quick navigation links */}
        <div className="flex flex-wrap items-center gap-4 text-[#9CA6B8]">
          <Link href="/docs" className="hover:text-[#F5F7FA] transition-colors">
            Docs
          </Link>
          <Link href="/docs/sdk" className="hover:text-[#F5F7FA] transition-colors">
            SDK
          </Link>
          <a
            href={`${explorerUrl}/address/${treasuryAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#F5F7FA] inline-flex items-center gap-1 transition-colors"
          >
            <span>Treasury</span>
            <ExternalLink className="w-3 h-3 text-[#2F6FFF]" />
          </a>
          <a
            href={`${explorerUrl}/address/${contracts.governor}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#F5F7FA] inline-flex items-center gap-1 transition-colors"
          >
            <span>Governor</span>
            <ExternalLink className="w-3 h-3 text-[#2F6FFF]" />
          </a>
          <Link href="/terms" className="hover:text-[#F5F7FA] transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-[#F5F7FA] transition-colors">
            Privacy
          </Link>
        </div>

        {/* Right: Social & Explorer */}
        <div className="flex items-center gap-3">
          <a
            href="https://x.com/syndaopro"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6B7385] hover:text-[#9CA6B8] transition-colors p-1"
            aria-label="Syn DAO on X"
          >
            <Twitter className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://github.com/kellycryptos/SynArc"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6B7385] hover:text-[#9CA6B8] transition-colors p-1"
            aria-label="Syn DAO on GitHub"
          >
            <Github className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
