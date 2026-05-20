"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { ShieldCheck, Lock, Mail, Chrome, Twitter, MessageSquare, AlertTriangle, RefreshCw, Wallet, ArrowRight } from "lucide-react";
import { ReactNode, useState, useEffect } from "react";

export function WalletGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, login, ready } = useAuth();
  const { isUnsupported, isSwitching, switchNetwork } = useArcNetwork();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show a premium glassmorphic loading screen during initial SDK synchronization
  if (!mounted || !ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <Lock className="w-6 h-6 text-primary/70 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="text-muted text-sm tracking-wide font-medium animate-pulse">
          Synchronizing secure governance access gate...
        </p>
      </div>
    );
  }

  // If user is not authenticated, render the premium governance access gate
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 relative z-10 animate-fade-in-up">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[80px] pointer-events-none -z-10 animate-pulse-glow" />

        <div className="w-full max-w-lg glass-card p-8 sm:p-10 border border-card-border relative overflow-hidden group shadow-2xl">
          {/* Subtle decorative glow line on top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

          {/* Arc Network Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary uppercase tracking-wider animate-pulse-glow">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              Arc Testnet Enabled
            </span>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-elevated border border-border-thin mb-4 shadow-inner text-primary group-hover:scale-105 transition-transform duration-300">
              <ShieldCheck className="w-8 h-8 animate-pulse" />
            </div>
            <h2 className="text-3xl font-extrabold font-heading tracking-tight mb-3 bg-gradient-to-r from-white via-text-secondary to-muted bg-clip-text text-transparent">
              Access SynArc Governance
            </h2>
            <p className="text-muted text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
              Authenticate to access confidential governance infrastructure on Arc.
            </p>
          </div>

          {/* Interactive Login Option */}
          <div className="space-y-4">
            <button
              onClick={login}
              className="w-full group/btn relative flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary via-purple-deep to-primary text-white font-semibold hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all duration-300 overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
              <Lock className="w-5 h-5 text-white/90" />
              <span>Authenticate and Launch</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
            </button>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-thin" />
              </div>
              <span className="relative px-3 bg-background text-xs uppercase tracking-wider text-muted font-semibold">
                Available Protocols
              </span>
            </div>

            {/* Social logins indicator */}
            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface border border-border-subtle hover:border-primary/30 transition-all duration-300 group/item cursor-pointer animate-pulse-glow" onClick={login}>
                <Chrome className="w-5 h-5 text-muted group-hover/item:text-primary transition-colors duration-300" />
                <span className="text-[10px] text-muted mt-1 font-semibold group-hover/item:text-foreground">Google</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface border border-border-subtle hover:border-primary/30 transition-all duration-300 group/item cursor-pointer animate-pulse-glow" onClick={login}>
                <Twitter className="w-5 h-5 text-muted group-hover/item:text-primary transition-colors duration-300" />
                <span className="text-[10px] text-muted mt-1 font-semibold group-hover/item:text-foreground">X / Twitter</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface border border-border-subtle hover:border-primary/30 transition-all duration-300 group/item cursor-pointer animate-pulse-glow" onClick={login}>
                <MessageSquare className="w-5 h-5 text-muted group-hover/item:text-primary transition-colors duration-300" />
                <span className="text-[10px] text-muted mt-1 font-semibold group-hover/item:text-foreground">Discord</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface border border-border-subtle hover:border-primary/30 transition-all duration-300 group/item cursor-pointer animate-pulse-glow" onClick={login}>
                <Mail className="w-5 h-5 text-muted group-hover/item:text-primary transition-colors duration-300" />
                <span className="text-[10px] text-muted mt-1 font-semibold group-hover/item:text-foreground">Email</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center border-t border-border-thin pt-6">
            <p className="text-xs text-muted leading-normal">
              By authenticating, you initialize an encrypted embedded wallet native to the Arc ecosystem. No gas or browser extensions required.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If connected to unsupported network, enforce network switcher UI
  if (isUnsupported) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fade-in-up px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-warning/5 blur-[70px] pointer-events-none -z-10 animate-pulse-glow" />

        <div className="w-full max-w-md glass-card p-8 sm:p-10 border border-warning/20 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-warning to-transparent opacity-80" />

          <div className="w-20 h-20 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center mb-6 mx-auto shadow-xl shadow-warning/5 text-warning group-hover:scale-105 transition-transform duration-300">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-extrabold font-heading tracking-tight mb-3 text-warning">
            Wrong Network
          </h2>
          <p className="text-muted text-sm sm:text-base max-w-sm mx-auto leading-relaxed mb-8">
            SynArc operates exclusively on the secure **Arc Testnet**. Please switch networks to access the dashboard and contracts.
          </p>
          <button 
            onClick={switchNetwork}
            disabled={isSwitching}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-warning text-[#0A0A0F] font-semibold hover:bg-warning/90 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSwitching ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Switching Networks...</span>
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                <span>Switch to Arc Testnet</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Render children only when fully authenticated and synced to Arc Testnet
  return <>{children}</>;
}
