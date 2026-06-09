"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../sidebar/Sidebar";
import { DashboardNavbar } from "../navbar/DashboardNavbar";
import { WalletGuard } from "../auth/WalletGuard";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AnimatePresence, motion } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { useSwitchArcNetwork } from "@/hooks/useSwitchArcNetwork";
import { useAccount } from "wagmi";
import { useAuth } from "@/hooks/auth/useAuth";
import { useWallets } from "@privy-io/react-auth";
import { checkAndDelegate } from "@/lib/tx-helper";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isConnected } = useAccount();
  const { isAuthenticated, isCircle, walletAddress } = useAuth();
  const { isArcTestnet, isUnsupported: wagmiUnsupported } = useArcNetwork();
  const { switchToArc, isSwitching } = useSwitchArcNetwork();
  const { wallets } = useWallets();

  // Circle wallet does not register with wagmi, so isConnected=false for Circle users.
  // Never show the wrong-network banner for Circle wallet users.
  const isUnsupported = isAuthenticated && !isCircle && wagmiUnsupported;

  // Run the self-delegation check on wallet connection
  useEffect(() => {
    if (wallets && wallets.length > 0 && walletAddress && !isCircle) {
      checkAndDelegate(wallets, walletAddress).catch(console.error);
    }
  }, [wallets, walletAddress, isCircle]);


  // Network switch is handled at transaction time (vote, deposit, create proposal).
  // We no longer auto-switch on page load to avoid disrupting public browsing.

  return (
    <div className="flex min-h-screen bg-background text-foreground relative z-10">
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-40">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 w-64 md:hidden"
            >
              <Sidebar className="w-full" onClick={() => setMobileMenuOpen(false)} />
              <button 
                onClick={() => setMobileMenuOpen(false)} 
                className="absolute right-4 top-4 p-2 text-muted hover:text-foreground rounded-full hover:bg-surface-elevated transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 relative">
        <DashboardNavbar onMenuClick={() => setMobileMenuOpen(true)} />
        
        {/* Network Warning Banner */}
        <AnimatePresence>
          {isUnsupported && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex items-center justify-between gap-4 text-sm text-amber-400 z-20 shrink-0"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
                <span>
                  <strong>Wrong Network:</strong> You are currently connected to an unsupported chain. Please switch to Arc Testnet to continue.
                </span>
              </div>
              <button
                onClick={switchToArc}
                disabled={isSwitching}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-background font-bold text-xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {isSwitching ? "Switching..." : "Switch to Arc Testnet"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-20">
          <WalletGuard>
            <PageWrapper>
              {children}
            </PageWrapper>
          </WalletGuard>
        </main>
      </div>
    </div>
  );
}
