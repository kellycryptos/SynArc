"use client";

import { useEffect } from "react";
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
import { TokenIcon } from "@/components/ui/TokenIcon";
import { WalletConnectButton } from "@/components/ui/WalletConnectButton";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { NetworkStatusBadge } from "@/components/layout/NetworkStatusBadge";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { BotAvatar } from "bot-avatars";
import dynamic from "next/dynamic";

const MetalBadge = dynamic(() => import("metal-fx").then((m) => m.MetalBadge), {
  ssr: false,
  loading: () => <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#2F6FFF]/20 text-[#4F8BFF]">LIVE</span>,
});

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

  // On mainnet, show Claim 10 sARC; hide settings/docs if testnet-only.
  const visibleLinks = activeLinks
    .map((link) => {
      if (link.href === "/faucet") {
        return {
          ...link,
          label: isArcTestnet ? "Faucet" : "Claim sARC",
        };
      }
      return link;
    })
    .filter((link) => {
      if (link.href === "/settings" || link.href === "/docs") {
        return isArcTestnet;
      }
      return true;
    });

  // Proactively prefetch all primary routes on mount and whenever
  // the tab regains focus or visibility (e.g. user returns after leaving the site).
  useEffect(() => {
    const warmRoutes = () => {
      visibleLinks.forEach((link) => {
        if (!link.href.startsWith("http")) {
          router.prefetch(link.href);
        }
      });
      router.prefetch("/agent");
      router.prefetch("/dashboard");
    };

    warmRoutes();

    const handleFocus = () => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        warmRoutes();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [visibleLinks, router]);

  const handleLinkClick = () => {
    if (onClick) {
      setTimeout(onClick, 50);
    }
  };

  return (
    <aside className={cn("w-64 bg-background border-r border-border flex flex-col h-full", className)}>
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border shrink-0">
        <Link
          href="/"
          prefetch={true}
          onClick={handleLinkClick}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <SynArcLogo size={28} animated={false} />
          <span className="text-[16px] font-bold font-space tracking-tight text-foreground">
            Syn DAO
          </span>
        </Link>
      </div>

      {/* Quick Search Pill */}
      <div className="px-3.5 pt-3 pb-1">
        <div className="flex h-9 w-full items-center gap-2 rounded-xl border border-border bg-surface text-xs text-muted transition-colors hover:border-primary/40 hover:text-foreground px-2.5">
          <Search className="w-3.5 h-3.5 text-muted" />
          <input
            type="text"
            placeholder="Search…"
            className="flex-1 bg-transparent border-none outline-none text-xs font-space text-foreground placeholder:text-muted"
          />
          <kbd className="font-mono rounded border border-border bg-background px-1.5 py-0.5 text-[9px] text-muted">⌘K</kbd>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3.5 space-y-1">
        {/* AGENT — Primary Feature Card */}
        {(() => {
          const href = "/agent";
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              href={href}
              prefetch={true}
              onClick={handleLinkClick}
              className={cn(
                "w-full flex items-center justify-between border border-border bg-surface rounded-lg px-3 py-2.5 text-xs font-medium transition-all group cursor-pointer text-left mb-4 hover:border-primary/40",
                active && "border-primary/40 bg-surface-elevated"
              )}
            >
              <span className="text-[13px] font-medium text-foreground flex items-center gap-2.5 font-space">
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <BotAvatar type="ghost" size={24} state="working" />
                </div>
                Treasury Agent
              </span>
              <div className="shrink-0 flex items-center">
                <MetalBadge>LIVE</MetalBadge>
              </div>
            </Link>
          );
        })()}

        {/* Section label */}
        <p className="px-1.5 pb-2 text-[11px] uppercase tracking-[0.1em] font-mono text-muted">
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
            <Link
              key={link.href}
              href={link.href}
              prefetch={true}
              onClick={handleLinkClick}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-space transition-all group cursor-pointer text-left border",
                active
                  ? "bg-primary/10 border-primary/25 text-foreground font-medium shadow-[0_0_12px_rgba(47,111,255,0.06)]"
                  : "border-transparent text-muted hover:text-foreground hover:bg-surface"
              )}
            >
              <Icon
                className={cn(
                  "w-[17px] h-[17px] shrink-0 transition-colors",
                  active ? "stroke-primary" : "stroke-muted group-hover:stroke-foreground"
                )}
              />
              <span>{link.label}</span>
              {link.isNew && !active && (
                <span className="ml-auto inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono bg-background border border-border text-primary">
                  NEW
                </span>
              )}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
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
            <span className="text-muted flex items-center gap-1.5">
              <TokenIcon symbol="USDC" size={14} />
              USDC Balance
            </span>
            {isLoading && (!balance || balance === "0.00") ? (
              <div className="h-6 w-20 bg-surface-elevated animate-pulse rounded-full border border-border-thin" />
            ) : isError && (!balance || balance === "0.00") ? (
              <span className="px-2 py-0.5 rounded-full bg-danger/10 border border-danger/20 text-danger font-semibold">
                Error
              </span>
            ) : balance !== null ? (
              isCircle ? (
                <span className="px-2 py-0.5 rounded-full bg-[#2F6FFF]/10 border border-[#2F6FFF]/20 text-[#4F8BFF] font-bold flex items-center gap-1">
                  <span>{parseFloat(balance || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</span>
                  <span className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-[#2F6FFF]/20 text-[#4F8BFF]">AI</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-[#2F6FFF]/10 border border-[#2F6FFF]/20 text-[#4F8BFF] font-bold">
                  {parseFloat(balance || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
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
      <div className="p-4 border-t border-border mt-auto">
        <WalletConnectButton />
      </div>
    </aside>
  );
}
