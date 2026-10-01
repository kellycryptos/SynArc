"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Grid,
  FileText,
  Shield,
  Users,
  BarChart3,
  Droplets,
  Settings,
  Bell,
  BookOpen,
  ArrowRightLeft,
  Bot,
  Rocket,
  Trophy,
  Zap,
  Search,
  TrendingUp,
} from "lucide-react";
import { SynArcLogo } from "@/components/ui/SynArcLogo";
import { WalletConnectButton } from "@/components/ui/WalletConnectButton";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { NetworkStatusBadge } from "@/components/layout/NetworkStatusBadge";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { BotAvatar } from "bot-avatars";
import { MetalBadge } from "metal-fx";

interface ActiveLink {
  href: string;
  label: string;
  icon: any;
  isNew?: boolean;
}

const activeLinks: ActiveLink[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/creator-daos", label: "Creator DAO", icon: Rocket },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/treasury", label: "Treasury", icon: Shield },
  { href: "/earn", label: "Earn", icon: TrendingUp, isNew: true },
  { href: "/bridge", label: "Bridge", icon: ArrowRightLeft },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/faucet", label: "Faucet", icon: Droplets },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/docs", label: "Docs", icon: BookOpen },
];

const comingSoonLinks: { label: string; icon: any }[] = [];

export function Sidebar({ className, onClick }: { className?: string; onClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, walletAddress, isCircle } = useAuth();
  const { balance, isLoading, isError } = useUSDCBalance(walletAddress);
  const { isArcTestnet, networkName } = useArcNetwork();

  // On mainnet, hide testnet-only nav items (Faucet, Docs). Settings stays per exception.
  const visibleLinks = activeLinks.filter((link) => {
    if (link.href === "/faucet" || link.href === "/docs") {
      return isArcTestnet;
    }
    return true;
  });

  // Navigate first, then close the mobile drawer so the drawer unmount
  // doesn't cancel the in-flight route change.
  const handleNavClick = (href: string) => {
    if (href.startsWith("http")) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      router.push(href);
    }
    // Small defer allows Next.js to start the navigation before the sidebar
    // overlay is removed from the DOM, preventing the route change from
    // being swallowed on mobile browsers.
    if (onClick) {
      setTimeout(onClick, 50);
    }
  };

  return (
    <aside className={cn("w-64 bg-[#05080F] border-r border-[#151C29] flex flex-col h-full", className)}>
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-[#151C29] shrink-0">
        <button
          onClick={() => handleNavClick("/")}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-[30px] h-[30px] rounded-[7px] bg-gradient-to-br from-[#2F6FFF] to-[#4F8BFF] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5z"/></svg>
          </div>
          <span className="text-[16px] font-bold font-space tracking-tight text-[#F5F7FA]">
            Syn DAO
          </span>
        </button>
      </div>

      {/* Quick Search Pill */}
      <div className="px-3.5 pt-3 pb-1">
        <div className="flex h-9 w-full items-center gap-2 rounded-xl border border-[#1B2536] bg-[#0B111C] text-xs text-[#8A948E] transition-colors hover:border-[#2F6FFF]/40 hover:text-[#F5F7FA] px-2.5">
          <Search className="w-3.5 h-3.5 text-[#6B7385]" />
          <input
            type="text"
            placeholder="Search…"
            className="flex-1 bg-transparent border-none outline-none text-xs font-space text-[#F5F7FA] placeholder:text-[#6B7385]"
          />
          <kbd className="font-mono rounded border border-[#1B2536] bg-[#05080F] px-1.5 py-0.5 text-[9px] text-[#6B7385]">⌘K</kbd>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3.5 space-y-1">
        {/* AGENT — Primary Feature Card */}
        {(() => {
          const href = "/agent";
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <button
              onClick={() => handleNavClick(href)}
              className={cn(
                "w-full flex items-center justify-between border border-[#1B2536] bg-[#0B111C] rounded-lg px-3 py-2.5 text-xs font-medium transition-all group cursor-pointer text-left mb-4 hover:border-[#2F6FFF]/40",
                active && "border-[#2F6FFF]/40 bg-[#0F1620]"
              )}
            >
              <span className="text-[13px] font-medium text-[#F5F7FA] flex items-center gap-2.5 font-space">
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <BotAvatar type="ghost" size={24} state="working" />
                </div>
                Treasury Agent
              </span>
              <div className="shrink-0 flex items-center">
                <MetalBadge>LIVE</MetalBadge>
              </div>
            </button>
          );
        })()}

        {/* Section label */}
        <p className="px-1.5 pb-2 text-[11px] uppercase tracking-[0.1em] font-mono text-[#4E566A]">
          Governance
        </p>

        {/* Active navigation links */}
        {visibleLinks.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(link.href + "/")) ||
            (link.href === "/dashboard" && pathname === "/");

          const Icon = link.icon;
          return (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-space transition-all group cursor-pointer text-left border",
                active
                  ? "bg-[#2F6FFF]/10 border-[#2F6FFF]/25 text-[#F5F7FA] font-medium shadow-[0_0_12px_rgba(47,111,255,0.06)]"
                  : "border-transparent text-[#8A948E] hover:text-[#F5F7FA] hover:bg-[#0B111C]"
              )}
            >
              <Icon
                className={cn(
                  "w-[17px] h-[17px] shrink-0 transition-colors",
                  active ? "stroke-[#4F8BFF]" : "stroke-[#6B7385] group-hover:stroke-[#9CA6B8]"
                )}
              />
              <span>{link.label}</span>
              {link.isNew && !active && (
                <span className="ml-auto inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#05080F] border border-[#1B2536] text-[#4F8BFF]">
                  NEW
                </span>
              )}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#4F8BFF]" />
              )}
            </button>
          );
        })}

        {/* TEMPORARILY HIDDEN — Creator economy links
        <p className="px-3 pt-5 pb-2 text-[10px] uppercase tracking-[0.15em] font-semibold text-muted/50">
          Creators
        </p>

        {(() => {
          const href = "/leaderboard";
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <button
              onClick={() => handleNavClick(href)}
              className={...}
            >
              <Trophy ... />
              <span>Leaderboard</span>
            </button>
          );
        })()}

        {(() => {
          const href = "/create-dao";
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <button
              onClick={() => handleNavClick(href)}
              className={...}
            >
              <Rocket ... />
              <span>Launch Creator DAO</span>
            </button>
          );
        })()}
        END TEMPORARILY HIDDEN */}


        {/* Divider & Roadmap if any coming soon */}
        {comingSoonLinks.length > 0 && (
          <>
            <div className="pt-3 pb-1">
              <div className="h-px bg-border-thin mx-1" />
            </div>

            {/* Section label */}
            <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.15em] font-semibold text-muted/50">
              Roadmap
            </p>

            {/* Disabled / Coming Soon links */}
            {comingSoonLinks.map((link) => {
              const Icon = link.icon;
              return (
                <div
                  key={link.label}
                  title="Coming Soon"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border border-transparent cursor-not-allowed opacity-45 select-none"
                >
                  <Icon className="w-4.5 h-4.5 shrink-0 text-muted" />
                  <span className="text-muted">{link.label}</span>
                  <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest bg-primary/8 border border-primary/15 text-primary/60 backdrop-blur-sm">
                    Soon
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Mobile-only governance stats & status (USDC, Network, Notifications) */}
      {isAuthenticated && (
        <div className="md:hidden px-6 py-4 border-t border-border-thin space-y-4 bg-surface/30 shrink-0">
          {/* Network Status Badge */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Network</span>
            <NetworkStatusBadge />
          </div>

          {/* USDC Balance Display */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">USDC Balance</span>
            {isLoading ? (
              <div className="h-6 w-20 bg-surface-elevated animate-pulse rounded-full border border-border-thin" />
            ) : isError ? (
              <span className="px-2 py-0.5 rounded-full bg-danger/10 border border-danger/20 text-danger font-semibold">
                Error
              </span>
            ) : balance !== null ? (
              isCircle ? (
                <span className="px-2 py-0.5 rounded-full bg-[#2F6FFF]/10 border border-[#2F6FFF]/20 text-[#4F8BFF] font-bold flex items-center gap-1">
                  <span>{parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</span>
                  <span className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-[#2F6FFF]/20 text-[#4F8BFF]">AI</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-[#2F6FFF]/10 border border-[#2F6FFF]/20 text-[#4F8BFF] font-bold">
                  {parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                </span>
              )
            ) : null}
          </div>

          {/* Notifications Bell Option */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Notifications</span>
            <button className="relative p-1.5 text-muted hover:text-foreground transition-colors rounded-full bg-surface-elevated border border-border-thin cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#4F8BFF] rounded-full border-2 border-background" />
            </button>
          </div>
        </div>
      )}


      {/* Connect Button */}
      <div className="p-4 border-t border-[#151C29] mt-auto">
        <WalletConnectButton />
      </div>
    </aside>
  );
}
