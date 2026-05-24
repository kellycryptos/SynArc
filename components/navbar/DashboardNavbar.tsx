"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { NetworkStatusBadge } from "@/components/layout/NetworkStatusBadge";
import { Bell, Search, Menu, LogOut, Wallet } from "lucide-react";
import { useMemo } from "react";

/**
 * DashboardNavbar Component
 * 
 * Main navigation header for authenticated users.
 * Displays:
 * - Arc Network connection status with RPC latency
 * - USDC balance from connected wallet
 * - User profile with shorthand address
 * - Notification bell and logout button
 */
export function DashboardNavbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { isAuthenticated, walletAddress, email, user, login, logout } = useAuth();
  const { balance, isLoading, isError } = useUSDCBalance();

  // Create a shortened representation of the wallet address (e.g. 0x12...abcd)
  const shortAddress = useMemo(() => {
    if (!walletAddress) return "";
    return `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`;
  }, [walletAddress]);

  // Generate unique initials depending on the user's social or email login details
  const initials = useMemo(() => {
    if (user?.google?.name) return user.google.name.substring(0, 2).toUpperCase();
    if (user?.twitter?.name) return user.twitter.name.substring(0, 2).toUpperCase();
    if (user?.discord?.username) return user.discord.username.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    if (walletAddress) return walletAddress.substring(2, 4).toUpperCase();
    return "SA";
  }, [user, email, walletAddress]);

  // Generate a premium generative background gradient from the user's address/details to wow the user
  const avatarGradient = useMemo(() => {
    const seed = walletAddress ? walletAddress.charCodeAt(5) + walletAddress.charCodeAt(8) : 0;
    const gradients = [
      "bg-gradient-to-tr from-purple-deep to-arc-blue",
      "bg-gradient-to-tr from-primary to-accent",
      "bg-gradient-to-tr from-cyan-soft to-purple-glow",
      "bg-gradient-to-tr from-arc-blue-soft to-purple-deep",
    ];
    return gradients[seed % gradients.length];
  }, [walletAddress]);

  return (
    <header className="sticky top-0 z-30 glass border-b border-border-thin h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <button 
          className="md:hidden p-2 -ml-2 text-muted hover:text-foreground transition-colors cursor-pointer" 
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center bg-surface-elevated border border-border-thin rounded-full px-3 py-1.5 w-64 lg:w-80 focus-within:border-primary/50 focus-within:shadow-[0_0_10px_rgba(124,58,237,0.1)] transition-all">
          <Search className="w-4 h-4 text-muted mr-2" />
          <input 
            type="text" 
            placeholder="Search proposals, addresses..." 
            className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-4">
        {isAuthenticated ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Arc Network Status Badge with RPC Health */}
            <NetworkStatusBadge />

            {/* USDC Balance Display */}
            {isLoading ? (
              <div className="h-7 w-24 bg-surface-elevated animate-pulse rounded-full border border-border-thin shrink-0" />
            ) : isError ? (
              <span className="hidden xs:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-danger/10 border border-danger/20 text-danger shrink-0" title="Failed to fetch balance from Arc RPC">
                Error USDC
              </span>
            ) : balance !== null ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 border border-primary/20 text-primary-glow text-purple-300 shrink-0">
                {parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
              </span>
            ) : null}

            {/* User Profile Card */}
            <div className="flex items-center gap-2 bg-surface-elevated border border-border-thin rounded-full pl-2 pr-3 py-1 hover:border-primary/20 transition-all duration-300">
              {/* Premium Generative Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shadow-md ${avatarGradient}`}>
                {initials}
              </div>
              <span className="text-xs font-semibold tracking-tight text-text-secondary">
                {shortAddress}
              </span>
            </div>

            {/* Logout Button */}
            <button 
              onClick={logout}
              title="Logout from SynArc"
              className="p-2 text-muted hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/25 transition-all rounded-full cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="group px-4 py-1.5 rounded-full bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] flex items-center gap-2 cursor-pointer"
          >
            <Wallet className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Connect
          </button>
        )}

        <button className="relative p-2 text-muted hover:text-foreground transition-colors rounded-full hover:bg-surface-elevated border border-transparent hover:border-border-thin cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
        </button>
      </div>
    </header>
  );
}
