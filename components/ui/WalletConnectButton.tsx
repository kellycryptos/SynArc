"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { ARC_CHAIN } from "@/lib/arc-config";
import { Wallet, LogOut, Copy, ExternalLink, ChevronUp, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useDeferredWeb3 } from "@/providers/DeferredWeb3Provider";

export function WalletConnectButton() {
  const deferred = useDeferredWeb3();
  const { isAuthenticated, walletAddress, logout, ready, login } = useAuth();
  const { chainId } = useArcNetwork();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setIsOpen(false), 600);
    }
  };

  const openExplorer = () => {
    if (walletAddress) {
      const explorerBase = chainId === 5042 ? "https://explorer.arc.io" : (ARC_CHAIN.blockExplorers?.default.url || "https://testnet.arcscan.app");
      window.open(`${explorerBase}/address/${walletAddress}`, "_blank");
      setIsOpen(false);
    }
  };

  // Prevent hydration mismatches by rendering a placeholder before the client mounts
  if (!mounted || !ready) {
    return (
      <button 
        disabled
        className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg bg-[#0B111C] border border-[#1B2536] text-[#6B7385] text-xs font-medium cursor-not-allowed"
      >
        <Wallet className="w-4 h-4 animate-pulse text-[#6B7385]" />
        <span className="truncate font-space">Connecting...</span>
      </button>
    );
  }

  // If disconnected, render blended custom button with RainbowKit modal trigger
  if (!isAuthenticated || !walletAddress) {
    return (
      <div className="space-y-2.5 w-full flex flex-col items-center">
        {deferred?.isMounted ? (
          <ConnectButton.Custom>
            {({ openConnectModal, connectModalOpen }) => (
              <button
                onClick={openConnectModal}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-lg bg-gradient-to-r from-[#2F6FFF] to-[#4F8BFF] text-white font-space font-semibold text-xs tracking-wide shadow-md shadow-[#2F6FFF]/20 hover:opacity-95 hover:shadow-lg hover:shadow-[#2F6FFF]/30 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Wallet className="w-4 h-4 shrink-0" />
                <span>{connectModalOpen ? "Connecting..." : "Connect Wallet"}</span>
              </button>
            )}
          </ConnectButton.Custom>
        ) : (
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-lg bg-gradient-to-r from-[#2F6FFF] to-[#4F8BFF] text-white font-space font-semibold text-xs tracking-wide shadow-md shadow-[#2F6FFF]/20 hover:opacity-95 hover:shadow-lg hover:shadow-[#2F6FFF]/30 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Wallet className="w-4 h-4 shrink-0" />
            <span>Connect Wallet</span>
          </button>
        )}
        <p className="text-[10px] text-center text-[#6B7385] px-1 leading-relaxed font-mono">
          <a href="/terms" className="text-[#4F8BFF] hover:underline transition-all">Terms</a>
          {" "}&amp;{" "}
          <a href="/privacy" className="text-[#4F8BFF] hover:underline transition-all">Privacy</a>
        </p>
      </div>
    );
  }

  const truncatedAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-2.5 rounded-lg bg-surface border border-border hover:border-primary/40 hover:bg-surface-elevated transition-all cursor-pointer group shadow-xs"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2F6FFF] to-[#4F8BFF] flex items-center justify-center relative overflow-hidden shrink-0">
            <span className="text-[10px] font-bold text-white font-mono">
              {walletAddress.slice(2, 4).toUpperCase()}
            </span>
            <div className="w-2 h-2 rounded-full bg-[#22C55E] absolute bottom-0 right-0 border border-surface" />
          </div>
          <div className="flex flex-col text-left truncate">
            <span className="font-mono text-xs font-medium text-foreground truncate">{truncatedAddress}</span>
            <span className="text-[10px] text-primary font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> Connected
            </span>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted group-hover:text-foreground" />}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 w-full mb-2 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in-up origin-bottom z-50 p-1.5 backdrop-blur-md">
          <button 
            onClick={copyAddress}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono text-foreground hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                <span className="text-[#22C55E]">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-muted" />
                <span>Copy Address</span>
              </>
            )}
          </button>
          <button 
            onClick={openExplorer}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono text-foreground hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-muted" /> View on Explorer
          </button>
          <div className="h-px bg-border my-1 mx-1.5" />
          <button 
            onClick={() => { logout(); setIsOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono text-[#ef4444] hover:bg-[#ef4444]/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
