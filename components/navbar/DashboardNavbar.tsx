"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { NetworkStatusBadge } from "@/components/layout/NetworkStatusBadge";
import { Menu, LogOut, Wallet } from "lucide-react";
import { useMemo } from "react";
import { SynArcLogo } from "@/components/ui/SynArcLogo";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useDeferredWeb3 } from "@/providers/DeferredWeb3Provider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/**
 * DashboardNavbar Component
 * 
 * Main navigation header for authenticated users.
 * Displays:
 * - Arc Network connection status with RPC latency
 * - USDC balance from connected wallet
 * - User profile with shorthand address
 * - Theme toggle and logout button
 */
export function DashboardNavbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const deferred = useDeferredWeb3();
  const { isAuthenticated, walletAddress, email, user, logout, login, isCircle } = useAuth();
  const activeWalletAddress = walletAddress;
  const { balance, loading, error } = useUSDCBalance(activeWalletAddress);

  // Create a shortened representation of the wallet address (e.g. 0x12...abcd)
  const shortAddress = useMemo(() => {
    if (!walletAddress) return "";
    return `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`;
  }, [walletAddress]);

  return (
    <header className="sticky top-0 z-30 glass border-b border-border-thin h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Syn DAO Logo & Name (Mobile Only) */}
        <div className="flex items-center gap-2.5 md:hidden">
          {onMenuClick && (
            <button onClick={onMenuClick} className="p-1 text-muted hover:text-foreground">
              <Menu className="w-5 h-5" />
            </button>
          )}
          <SynArcLogo size={24} animated />
          <span className="text-lg font-bold tracking-tight">
            <span className="gradient-text">Syn DAO</span>
          </span>
        </div>

        {/* Desktop Breadcrumb */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm font-medium font-space text-muted">Dashboard</span>
        </div>
      </div>
      
      {/* Right side (Desktop Only) */}
      <div className="hidden md:flex items-center gap-3 sm:gap-4 font-mono text-xs">
        {/* Arc Network Status Badge with RPC Health */}
        <NetworkStatusBadge />

        {isAuthenticated ? (
          <div className="flex items-center gap-2 sm:gap-3">

            {/* USDC Balance Display */}
            {loading && (!balance || balance === "0.00") ? (
              <div className="h-8 w-24 bg-surface animate-pulse rounded-lg border border-border shrink-0" />
            ) : error && (!balance || balance === "0.00") ? (
              <span className="hidden xs:inline-flex items-center px-3 py-2 rounded-lg text-xs font-mono bg-negative/10 border border-negative/20 text-negative shrink-0">
                -- USDC
              </span>
            ) : balance !== null ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono bg-surface border border-border text-foreground shrink-0">
                <TokenIcon symbol="USDC" size={14} />
                {parseFloat(balance || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
              </span>
            ) : null}

            {/* User Profile Card */}
            <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 text-primary font-mono">
              <span className="text-xs font-mono flex items-center gap-1.5">
                {isCircle ? (
                  <>
                    <span>⭕ Circle Wallet ({shortAddress})</span>
                  </>
                ) : (
                  <>
                    <span>Arc Wallet ({shortAddress})</span>
                  </>
                )}
              </span>
            </div>

            {/* Logout Button */}
            <button 
              onClick={logout}
              title="Logout from Syn DAO"
              className="p-2 text-muted hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/25 transition-all rounded-full cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {deferred?.isMounted ? (
              <ConnectButton.Custom>
                {({ openConnectModal, connectModalOpen }) => (
                  <button
                    onClick={openConnectModal}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#2F6FFF] to-[#4F8BFF] text-white font-space font-semibold text-xs tracking-wide shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5 shrink-0" />
                    <span>{connectModalOpen ? "Connecting..." : "Connect Wallet"}</span>
                  </button>
                )}
              </ConnectButton.Custom>
            ) : (
              <button
                onClick={login}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#2F6FFF] to-[#4F8BFF] text-white font-space font-semibold text-xs tracking-wide shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5 shrink-0" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        )}

        {/* Theme Toggle (Light / Dark mode) */}
        <ThemeToggle />
      </div>

      {/* Mobile Controls (Mobile Only) */}
      <div className="flex items-center gap-1 md:hidden">
        <ThemeToggle />
        <button 
          className="p-2 text-muted hover:text-foreground transition-colors cursor-pointer" 
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}
