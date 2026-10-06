"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRpcStatus } from "@/lib/hooks/useRpcStatus";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { ChevronDown, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { ChainIcon } from "@/components/ui/ChainIcon";

/**
 * Network Status Badge Component
 * 
 * Displays the current Arc RPC connection status with an expandable details dropdown showing:
 * - Active Arc network name ("Arc" or "Arc Testnet")
 * - Chain ID (5042 or 5042002)
 * - Block explorer link (opens in new tab)
 * - Active contract set label (mainnet / testnet)
 * - Faucet link (testnet only)
 * - Seamless native wallet-driven switching between Mainnet and Testnet
 */
export function NetworkStatusBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    networkName,
    currentChainId,
    explorerUrl,
    contractSetLabel,
    faucetUrl,
    isArcTestnet,
    isUnsupported,
    switchToMainnet,
    switchToTestnet,
    isSwitching,
  } = useArcNetwork();

  const activeNet: 'mainnet' | 'testnet' = isArcTestnet ? 'testnet' : 'mainnet';
  const { isHealthy, latency, message, isLoading } = useRpcStatus(activeNet);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const statusColor = isHealthy
    ? "bg-surface border-border text-foreground hover:border-primary/40"
    : isLoading
    ? "bg-surface border-amber-500/20 text-amber-500 dark:text-amber-400"
    : "bg-surface border-negative/30 text-negative hover:border-negative/50";

  const indicatorColor = isHealthy
    ? "bg-[#22C55E]"
    : isLoading
    ? "bg-amber-400"
    : "bg-[#EF4444]";
  const animationClass = isHealthy || isLoading ? "animate-pulse" : "animate-none";

  const handleToggle = () => setIsOpen((prev) => !prev);

  const handleSwitch = async () => {
    try {
      if (isArcTestnet) {
        await switchToMainnet();
      } else {
        await switchToTestnet();
      }
    } finally {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Network Badge Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono border ${statusColor} transition-all cursor-pointer select-none`}
        title={`${networkName}: ${message} (Click for network details)`}
      >
        <ChainIcon chain="arc" size={14} />
        <span className={`w-1.5 h-1.5 rounded-full ${indicatorColor} ${animationClass}`} />
        <span className="font-medium">{networkName}</span>
        <span className="opacity-30">·</span>
        <span className="hidden sm:inline">
          {isHealthy ? `${latency}ms` : isLoading ? "Connecting..." : "Reconnecting"}
        </span>
        <span className="sm:hidden">
          {isHealthy ? "OK" : isLoading ? "..." : "ERR"}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expandable Network Details Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-xl border border-border bg-surface p-4 shadow-2xl z-50 text-xs font-mono text-foreground animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${indicatorColor} ${animationClass}`} />
              <span className="font-semibold text-sm text-foreground">Network Details</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                isArcTestnet
                  ? "bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {contractSetLabel}
            </span>
          </div>

          {/* Details List */}
          <div className="py-3 space-y-2.5">
            {/* Network Name */}
            <div className="flex items-center justify-between">
              <span className="text-muted">Network</span>
              <span className="text-foreground font-medium flex items-center gap-1.5">
                <ChainIcon chain="arc" size={14} />
                {networkName}
              </span>
            </div>

            {/* RPC Endpoint Node */}
            <div className="flex items-center justify-between">
              <span className="text-muted">RPC Node</span>
              <span className="text-foreground font-medium flex items-center gap-1">
                <span>{isArcTestnet ? "Canteen (Main)" : "Official Arc"}</span>
                {isHealthy && <span className="text-[10px] text-emerald-500 font-mono">({latency}ms)</span>}
              </span>
            </div>

            {/* Chain ID */}
            <div className="flex items-center justify-between">
              <span className="text-muted">Chain ID</span>
              <span className="text-foreground font-medium">{currentChainId}</span>
            </div>

            {/* Contract Set */}
            <div className="flex items-center justify-between">
              <span className="text-muted">Contracts</span>
              <span className="capitalize text-foreground font-medium">{contractSetLabel}</span>
            </div>

            {/* Block Explorer Link */}
            <div className="flex items-center justify-between">
              <span className="text-muted">Explorer</span>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline transition-colors"
              >
                <span>{isArcTestnet ? "testnet.arcscan.app" : "explorer.arc.io"}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Faucet Link (Testnet only) */}
            {isArcTestnet && faucetUrl && (
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className="text-muted">Faucet</span>
                <a
                  href={faucetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-amber-500 dark:text-amber-400 hover:underline transition-colors"
                >
                  <span>Circle Faucet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Seamless Native Wallet Switching Action */}
          <div className="pt-3 border-t border-border">
            {isUnsupported && (
              <div className="mb-2 flex items-center gap-1.5 text-xs text-amber-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Wallet on unsupported network</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSwitch}
              disabled={isSwitching}
              className="w-full py-2 px-3 rounded-lg text-xs font-sans font-medium bg-[#2F6FFF] hover:bg-[#2F6FFF]/90 disabled:opacity-50 text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-[#2F6FFF]/20"
            >
              {isSwitching ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Switching Network...</span>
                </>
              ) : isArcTestnet ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Switch to Mainnet</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Switch to Testnet</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
