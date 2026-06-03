"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SynArcLogo } from "@/components/ui/SynArcLogo";
import { useEffect, useState } from "react";

export function MarketingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-md border-b border-white/5 shadow-lg" : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group relative">
          <div className="absolute -inset-2 bg-primary/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <SynArcLogo />
          <span className="text-xl font-bold font-heading tracking-tight relative text-foreground">
            Syn<span className="text-primary">Arc</span>
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="/#governance" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
            Governance
          </Link>
          <Link href="/#treasury" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
            Treasury
          </Link>
          <Link href="/docs" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
            Docs
          </Link>
          <Link href="/faucet" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
            Faucet
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="group relative px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] overflow-hidden flex items-center gap-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-arc-blue to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient" />
            <span className="relative">Launch Dashboard</span>
            <ArrowRight className="w-4 h-4 relative group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </header>
  );
}
