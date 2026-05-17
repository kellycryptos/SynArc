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
  Settings 
} from "lucide-react";
import { SynArcLogo } from "@/components/ui/SynArcLogo";

const sidebarLinks = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/treasury", label: "Treasury", icon: Shield },
  { href: "/members", label: "Members", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ className, onClick }: { className?: string; onClick?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className={cn("w-64 glass border-r border-border-thin flex flex-col h-full", className)}>
      <div className="h-16 flex items-center px-6 border-b border-border-thin shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group" onClick={onClick}>
          <SynArcLogo size={28} animated />
          <span className="text-xl font-bold tracking-tight">
            <span className="gradient-text">SynArc</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {sidebarLinks.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                active
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(124,58,237,0.1)]"
                  : "text-muted hover:text-foreground hover:bg-surface-elevated border border-transparent"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-colors", active ? "text-primary" : "text-muted group-hover:text-foreground")} />
              {link.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
