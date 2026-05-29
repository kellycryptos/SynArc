"use client";

import { ReactNode, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { usePathname } from "next/navigation";
import { ShieldAlert, Wallet, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { WalletConnectModal } from "@/components/ui/WalletConnectModal";

const PROTECTED_ROUTES = ['/bridge', '/settings'];

export function WalletGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, ready } = useAuth();
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);

  // Prevent app render flash while Privy is computing auth cookies
  if (!ready) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-text-tertiary">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide uppercase text-text-tertiary">Loading layout rails...</p>
      </div>
    );
  }

  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

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
