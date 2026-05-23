"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Shield,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";
import { SynArcLogo } from "@/components/ui/SynArcLogo";
import { WalletConnectButton } from "@/components/ui/WalletConnectButton";

const activeLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/treasury", label: "Treasury", icon: Shield },
];

const comingSoonLinks = [
  { label: "Members", icon: Users },
  { label: "Analytics", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

export function Sidebar({ className, onClick }: { className?: string; onClick?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className={cn("w-64 glass border-r border-border-thin flex flex-col h-full", className)}>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border-thin shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group" onClick={onClick}>
          <SynArcLogo size={28} animated />
          <span className="text-xl font-bold tracking-tight">
            <span className="gradient-text">SynArc</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {/* Section label */}
        <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.15em] font-semibold text-muted/50">
          Governance
        </p>

        {/* Active navigation links */}
        {activeLinks.map((link) => {
          const active =
            pathname === link.href ||
            (link.href === "/dashboard" && pathname === "/");
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
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
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(124,58,237,0.8)]" />
              )}
            </Link>
          );
        })}

        {/* Divider */}
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
      </div>

      {/* Connect Button */}
      <div className="p-4 border-t border-border-thin mt-auto">
        <WalletConnectButton />
      </div>
    </aside>
  );
}
