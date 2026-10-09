"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRpcStatus } from "@/lib/hooks/useRpcStatus";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { ChevronDown, ExternalLink, RefreshCw, AlertCircle, Check } from "lucide-react";
import { ChainIcon } from "@/components/ui/ChainIcon";

/**
 * Network Status Badge Component
 * 
 * Displays the current Arc network with a clean Web3 network switcher dropdown.
 * Supports 1-click switching between Arc Mainnet and Arc Testnet.
 */
export function NetworkStatusBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    networkName,
    explorerUrl,
    isArcTestnet,
    isUnsupported,
    switchToMainnet,
    switchToTestnet,
    isSwitching,
  } = useArcNetwork();

  const activeNet: 'mainnet' | 'testnet' = isArcTestnet ? 'testnet' : 'mainnet';
  const { isHealthy, isLoading } = useRpcStatus(activeNet);

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

  const isConnecting = isLoading && !isHealthy;
  const isOnlineAndHealthy = isHealthy;

  const statusColor = isOnlineAndHealthy
    ? "bg-surface border-border text-foreground hover:border-primary/40"
    : isConnecting
    ? "bg-surface border-amber-500/20 text-foreground hover:border-amber-500/40"
    : "bg-surface border-border text-foreground hover:border-primary/40";

  const indicatorColor = isOnlineAndHealthy
    ? "bg-[#22C55E]"
    : isConnecting
    ? "bg-amber-400"
    : "bg-emerald-500/80";

  const animationClass = isConnecting ? "animate-pulse" : "animate-none";

  const handleToggle = () => setIsOpen((prev) => !prev);

  const handleSelectNetwork = async (target: 'mainnet' | 'testnet') => {
    if ((target === 'testnet' && isArcTestnet) || (target === 'mainnet' && !isArcTestnet)) {
      setIsOpen(false);
      return;
    }
    try {
      if (target === 'testnet') {
        await switchToTestnet();
      } else {
        await switchToMainnet();
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
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono border ${statusColor} transition-all cursor-pointer select-none`}
        title={`${networkName}: ${isOnlineAndHealthy ? "Connected" : isConnecting ? "Connecting..." : "Active"}`}
      >
        <ChainIcon chain="arc" size={14} />
        <span className={`w-1.5 h-1.5 rounded-full ${indicatorColor} ${animationClass}`} />
        <span className="font-medium text-foreground">{networkName}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Clean Network Switcher Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-xl border border-border bg-surface p-3 shadow-2xl z-50 text-xs font-sans text-foreground animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border">
            <span className="font-semibold text-xs text-foreground font-space">Select Network</span>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted">
              <span className={`w-1.5 h-1.5 rounded-full ${indicatorColor} ${animationClass}`} />
              <span className={isOnlineAndHealthy ? "text-emerald-500 font-medium" : isConnecting ? "text-amber-400" : "text-muted"}>
                {isOnlineAndHealthy ? "Operational" : isConnecting ? "Connecting..." : "Connected"}
              </span>
            </div>
          </div>

          {/* Interactive Network Options */}
          <div className="space-y-1.5">
            {/* Arc Mainnet Option */}
            <button
              type="button"
              onClick={() => handleSelectNetwork('mainnet')}
              disabled={isSwitching}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all ${
                !isArcTestnet
                  ? "bg-[#2F6FFF]/10 border border-[#2F6FFF]/30 text-foreground cursor-default"
                  : "hover:bg-surface-elevated border border-transparent text-muted hover:text-foreground cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ChainIcon chain="arc" size={18} />
                <div>
                  <div className="font-medium text-xs text-foreground flex items-center gap-1.5">
                    <span>Arc Mainnet</span>
                    {!isArcTestnet && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted font-mono">Chain ID 5042</div>
                </div>
              </div>
              {isSwitching && isArcTestnet ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2F6FFF]" />
              ) : !isArcTestnet ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : null}
            </button>

            {/* Arc Testnet Option */}
            <button
              type="button"
              onClick={() => handleSelectNetwork('testnet')}
              disabled={isSwitching}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all ${
                isArcTestnet
                  ? "bg-[#2F6FFF]/10 border border-[#2F6FFF]/30 text-foreground cursor-default"
                  : "hover:bg-surface-elevated border border-transparent text-muted hover:text-foreground cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ChainIcon chain="arc" size={18} />
                <div>
                  <div className="font-medium text-xs text-foreground flex items-center gap-1.5">
                    <span>Arc Testnet</span>
                    {isArcTestnet && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted font-mono">Chain ID 5042002</div>
                </div>
              </div>
              {isSwitching && !isArcTestnet ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2F6FFF]" />
              ) : isArcTestnet ? (
                <Check className="w-4 h-4 text-amber-500" />
              ) : null}
            </button>
          </div>

          {/* Unsupported Network Warning */}
          {isUnsupported && (
            <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Wallet on unsupported network</span>
            </div>
          )}

          {/* Footer Quick Links */}
          <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-center text-[11px] font-mono text-muted">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <span>{isArcTestnet ? "ArcScan Explorer" : "Arc Explorer"}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
