"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRpcStatus } from "@/lib/hooks/useRpcStatus";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { ChevronDown, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";

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

  const { isHealthy, latency, message } = useRpcStatus();
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
    ? "bg-[#0B111C] border-[#1B2536] text-[#F5F7FA] hover:border-[#2F6FFF]/40"
    : "bg-[#0B111C] border-negative/30 text-negative hover:border-negative/50";

  const indicatorColor = isHealthy ? "bg-[#22C55E]" : "bg-[#EF4444]";
  const animationClass = isHealthy ? "animate-pulse" : "animate-none";

  const handleToggle = () => setIsOpen((prev) => !prev);

  const handleSwitch = async () => {
    if (isArcTestnet) {
      await switchToMainnet();
    } else {
      await switchToTestnet();
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
        <span className={`w-1.5 h-1.5 rounded-full ${indicatorColor} ${animationClass}`} />
        <span className="font-medium">{networkName}</span>
        <span className="text-white/30">·</span>
        <span className="hidden sm:inline">{isHealthy ? `${latency}ms` : "Reconnecting"}</span>
        <span className="sm:hidden">{isHealthy ? "OK" : "ERR"}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#8A948E] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expandable Network Details Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-xl border border-[#1B2536] bg-[#0B111C] p-4 shadow-2xl z-50 text-xs font-mono text-[#F5F7FA]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1B2536]">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${indicatorColor} ${animationClass}`} />
              <span className="font-semibold text-sm text-white">Network Details</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                isArcTestnet
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {contractSetLabel}
            </span>
          </div>

          {/* Details List */}
          <div className="py-3 space-y-2.5">
            {/* Network Name */}
            <div className="flex items-center justify-between">
              <span className="text-[#8A948E]">Network</span>
              <span className="text-white font-medium">{networkName}</span>
            </div>

            {/* Chain ID */}
            <div className="flex items-center justify-between">
              <span className="text-[#8A948E]">Chain ID</span>
              <span className="text-white font-medium">{currentChainId}</span>
            </div>

            {/* Contract Set */}
            <div className="flex items-center justify-between">
              <span className="text-[#8A948E]">Contracts</span>
              <span className="capitalize text-white font-medium">{contractSetLabel}</span>
            </div>

            {/* Block Explorer Link */}
            <div className="flex items-center justify-between">
              <span className="text-[#8A948E]">Explorer</span>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#2F6FFF] hover:text-[#4F8BFF] transition-colors"
              >
                <span>{isArcTestnet ? "testnet.arcscan.app" : "explorer.arc.io"}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Faucet Link (Testnet only) */}
            {isArcTestnet && faucetUrl && (
              <div className="flex items-center justify-between pt-1 border-t border-[#1B2536]/60">
                <span className="text-[#8A948E]">Faucet</span>
                <a
                  href={faucetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <span>Circle Faucet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Seamless Native Wallet Switching Action */}
          <div className="pt-3 border-t border-[#1B2536]">
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
