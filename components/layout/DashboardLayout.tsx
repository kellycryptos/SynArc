"use client";

import { useState, useEffect, Suspense } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "../sidebar/Sidebar";
import { DashboardNavbar } from "../navbar/DashboardNavbar";
import { WalletGuard } from "../auth/WalletGuard";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { DashboardFooter } from "@/components/layout/DashboardFooter";
import { NavigationProgress } from "@/components/ui/NavigationProgress";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { useSwitchArcNetwork } from "@/hooks/useSwitchArcNetwork";
import { useAuth } from "@/hooks/auth/useAuth";
import { ARC_CHAIN } from "@/lib/arc-config";
import { cn } from "@/lib/utils";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, isCircle } = useAuth();
  const { isUnsupported: wagmiUnsupported } = useArcNetwork();
  const { switchToArc, isSwitching } = useSwitchArcNetwork();

  // Close sidebar drawer on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll on small screens when drawer is open
  useEffect(() => {
    if (mobileMenuOpen && typeof window !== "undefined" && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Circle wallet does not register with wagmi, so isConnected=false for Circle users.
  // Never show the wrong-network banner for Circle wallet users or guest browsers.
  const isUnsupported = isAuthenticated && !isCircle && wagmiUnsupported;

  return (
    <div className="flex min-h-screen bg-background text-foreground relative z-10">
      {/* 0ms Instant Navigation Indicator */}
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>

      {/* Sidebar Mobile/Tablet Drawer Overlay */}
      <div
        className={cn("sidebar-overlay", mobileMenuOpen && "visible")}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Persistent Sidebar on Desktop (>= 1024px) / Slide-in Drawer on Mobile (< 1024px) */}
      <Sidebar
        className={cn("sidebar", mobileMenuOpen && "open")}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-content flex-1 flex flex-col min-w-0 relative">
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
                  <strong>Wrong Network:</strong> You are currently connected to an unsupported chain. Please switch to {ARC_CHAIN.name} to continue.
                </span>
              </div>
              <button
                onClick={switchToArc}
                disabled={isSwitching}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-background font-bold text-xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {isSwitching ? "Switching..." : `Switch to ${ARC_CHAIN.name}`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-12">
          <WalletGuard>
            <PageWrapper>
              {children}
            </PageWrapper>
          </WalletGuard>
        </main>
        <DashboardFooter />
      </div>
    </div>
  );
}
