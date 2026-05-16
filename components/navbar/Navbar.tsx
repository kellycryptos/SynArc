"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Hexagon, Users, BarChart3, Settings, Shield, FileText } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SynArcLogo } from "@/components/ui/SynArcLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { PlaceholderConnect } from "@/components/ui/PlaceholderConnect";

const navLinks = [
  { href: "/", label: "Dashboard", icon: Hexagon },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/members", label: "Members", icon: Users },
  { href: "/treasury", label: "Treasury", icon: Shield },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/docs", label: "Docs", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-border-thin"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <SynArcLogo size={32} animated />
            <span className="text-xl font-bold tracking-tight">
              <span className="gradient-text">SynArc</span>
            </span>
          </Link>

          {/* Center: Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                    active
                      ? "text-foreground"
                      : "text-muted hover:text-foreground hover:bg-surface-elevated"
                  )}
                >
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 bg-surface rounded-lg border border-border-thin"
                      style={{ zIndex: -1 }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <PlaceholderConnect />
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-muted hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-border-thin bg-surface backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-surface-elevated text-foreground border border-border-thin"
                        : "text-muted hover:text-foreground hover:bg-surface-elevated"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-4 mt-4 border-t border-border-thin flex flex-col gap-3">
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm font-medium text-text-secondary">Theme</span>
                  <ThemeToggle />
                </div>
                <PlaceholderConnect />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
