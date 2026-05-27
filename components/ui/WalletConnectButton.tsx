"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { Wallet, LogOut, Copy, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";

export function WalletConnectButton() {
  const { isAuthenticated, walletAddress, login, logout, ready } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
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
      setIsOpen(false);
    }
  };

  const openExplorer = () => {
    if (walletAddress) {
      window.open(`https://testnet.arcscan.app/address/${walletAddress}`, "_blank");
      setIsOpen(false);
    }
  };

  // Prevent hydration mismatches by rendering a placeholder before the client mounts
  if (!mounted || !ready) {
    return (
      <button 
        disabled
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary/20 text-white/50 font-medium cursor-not-allowed border border-primary/10"
      >
        <Wallet className="w-5 h-5 animate-pulse" />
        Initializing...
      </button>
    );
  }

  // If disconnected, trigger the Privy auth modal on click
  if (!isAuthenticated || !walletAddress) {
    return (
      <div className="space-y-3 w-full">
        <button 
          onClick={login}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] cursor-pointer"
        >
          <Wallet className="w-5 h-5" />
          Connect to Participate
        </button>
        <p className="text-[10px] text-center text-muted px-2 leading-relaxed">
          Wallet required for governance actions.{" "}
          <a href="/terms" className="text-primary hover:underline transition-all">Terms</a>
          {" "}&amp;{" "}
          <a href="/privacy" className="text-primary hover:underline transition-all">Privacy</a>
        </p>
      </div>
    );
  }

  const truncatedAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-3 rounded-xl bg-surface border border-border-thin hover:bg-surface-elevated transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border-thin flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-arc-blue/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-success absolute bottom-1 right-1 border-2 border-surface" />
          </div>
          <span className="font-medium text-sm text-foreground">{truncatedAddress}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 w-full mb-2 bg-surface-elevated border border-border-thin rounded-xl shadow-xl overflow-hidden animate-fade-in-up origin-bottom z-50 p-1">
          <button 
            onClick={copyAddress}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          >
            <Copy className="w-4 h-4 text-muted" /> Copy Address
          </button>
          <button 
            onClick={openExplorer}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-muted" /> View on Explorer
          </button>
          <div className="h-px bg-border-thin my-1 mx-2" />
          <button 
            onClick={() => { logout(); setIsOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
