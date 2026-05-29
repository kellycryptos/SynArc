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
} from "lucide-react";
import { SynArcLogo } from "@/components/ui/SynArcLogo";
import { WalletConnectButton } from "@/components/ui/WalletConnectButton";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { NetworkStatusBadge } from "@/components/layout/NetworkStatusBadge";

const activeLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/daos", label: "DAOs", icon: Grid },
  { href: "/agents", label: "AI Agents", icon: Bot, isNew: true },
  { href: "/campaigns", label: "Crowdfund Hub", icon: Rocket, isNew: true },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/treasury", label: "Treasury", icon: Shield },
  { href: "/bridge", label: "Bridge", icon: ArrowRightLeft },
  { href: "/members", label: "Members", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/faucet", label: "Faucet", icon: Droplets },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "https://docs.synarcdao.xyz", label: "Docs", icon: BookOpen },
];

const comingSoonLinks: { label: string; icon: any }[] = [];

export function Sidebar({ className, onClick }: { className?: string; onClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, walletAddress, isCircle } = useAuth();
  const { balance, isLoading, isError } = useUSDCBalance(walletAddress);

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
    <aside className={cn("w-64 bg-background-surface border-r border-border flex flex-col h-full", className)}>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border-thin shrink-0">
        <button
          onClick={() => handleNavClick("/")}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <SynArcLogo size={28} animated />
          <span className="text-xl font-bold tracking-tight">
            <span className="gradient-text">SynArc</span>
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {/* Section label */}
        <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.15em] font-semibold text-muted/50">
          Governance
        </p>

        {/* Active navigation links */}
        {activeLinks.map((link) => {
          // Mark active if exact match, or if current path starts with link href
          // (handles sub-routes like /proposals/[id], /daos/[id])
          // Special case: /dashboard only matches exactly to avoid matching all paths
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
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer text-left",
                active
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_18px_rgba(124,58,237,0.12)]"
                  : "text-muted hover:text-foreground hover:bg-surface-elevated border border-transparent hover:border-border-thin hover:shadow-[0_0_10px_rgba(124,58,237,0.05)]"
              )}
            >
              <Icon
                className={cn(
                  "w-4.5 h-4.5 shrink-0 transition-colors duration-200",
                  active ? "text-primary" : "text-muted group-hover:text-foreground"
                )}
              />
              <span>{link.label}</span>
              {link.isNew && !active && (
                <span className="ml-auto inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-primary/15 border border-primary/25 text-primary tracking-wider animate-pulse">
                  NEW
                </span>
              )}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(124,58,237,0.8)]" />
              )}
            </button>
          );
        })}

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
                <span className="px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-400 font-bold flex items-center gap-1">
                  <span>{parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</span>
                  <span className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-pink-500/30 text-pink-300 animate-pulse">⚡</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-purple-300 font-bold">
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
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full border-2 border-background" />
            </button>
          </div>
        </div>
      )}

      {/* Connect Button */}
      <div className="p-4 border-t border-border-thin mt-auto">
        <WalletConnectButton />
      </div>
    </aside>
  );
}
