"use client";

import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { usePathname } from "next/navigation";
import { ShieldAlert, Wallet, Sparkles, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { WalletConnectModal } from "@/components/ui/WalletConnectModal";

const PROTECTED_ROUTES = ['/settings'];

export function WalletGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, ready } = useAuth();
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);

  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isProtected || ready) return;
    const timer = setTimeout(() => setTimedOut(true), 6000);
    return () => clearTimeout(timer);
  }, [isProtected, ready]);

  // 🔥 THE FIX: If NOT protected, render IMMEDIATELY to avoid blocking public read-only views
  if (!isProtected) {
    return <>{children}</>;
  }

  // Prevent app render flash while Privy is computing auth cookies ONLY for protected routes
  if (!ready) {
    if (timedOut) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-sm font-semibold text-text-tertiary">
            Taking longer than expected
          </p>
          <p className="text-xs text-text-tertiary/60 max-w-[260px]">
            Your connection may be slow. Try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-1 px-5 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      );
    }
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-text-tertiary">
        <div className="w-9 h-9 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-text-tertiary/70">Just a moment…</p>
      </div>
    );
  }

  // 🔥 THE FIX: If trying to view a locked tab without being logged in, 
  // DO NOT redirect. Stop the navigation and show an inline, themed access block.
  if (isProtected && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <GlassCard className="p-8 md:p-10 max-w-lg relative overflow-hidden border border-primary/20 shadow-[0_0_50px_rgba(124,58,237,0.1)] flex flex-col items-center gap-6">
          {/* Ambient Glows */}
          <div className="absolute -right-16 -top-16 w-36 h-36 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-arc-blue/15 rounded-full blur-3xl pointer-events-none" />

          {/* Themed Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-deep to-primary/30 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(124,58,237,0.25)] relative overflow-hidden group">
            <ShieldAlert className="w-8 h-8 text-white relative z-10 animate-pulse" />
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-danger/10 border border-danger/20 text-danger-glow text-red-400">
              <Sparkles className="w-3.5 h-3.5" />
              Cryptographic Access Layer
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-heading">Protected Governance Module</h2>
            <p className="text-sm text-text-tertiary max-w-sm leading-relaxed mx-auto">
              Please link your Web3 identity framework or email asset container to view and participate in this section.
            </p>
          </div>

          <button 
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-deep via-primary to-arc-blue text-white font-bold hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-900/35"
          >
            <Wallet className="w-5 h-5" />
            Connect Wallet to Participate
          </button>
        </GlassCard>

        <WalletConnectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    );
  }

  return <>{children}</>;
}
