"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { SynArcLogo } from "@/components/ui/SynArcLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useEffect, useState, useRef } from "react";

export function MarketingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const navContainerRef = useRef<HTMLDivElement>(null);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        navContainerRef.current &&
        !navContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Lock body scroll on mobile when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-md border-b border-border shadow-xs" : "bg-transparent py-4"
      }`}
    >
      <div 
        ref={navContainerRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between"
      >
        <Link href="/" className="flex items-center gap-3 group relative z-50">
          <div className="absolute -inset-2 bg-primary/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <SynArcLogo />
          <span className="text-xl font-bold font-heading tracking-tight relative text-foreground">
            Syn <span className="text-primary">DAO</span>
          </span>
        </Link>
        
        {/* Nav Links — Desktop flex, Mobile drawer toggled by .open */}
        <nav className={`nav-links ${isOpen ? "open" : ""}`}>
          {/* Mobile drawer header */}
          <div className="md:hidden flex items-center justify-between pb-4 border-b border-border mb-2">
            <span className="text-xs font-mono uppercase tracking-widest text-muted">
              Navigation
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-muted hover:text-foreground rounded-lg"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <Link 
            href="/#how-it-works" 
            onClick={() => setIsOpen(false)}
            className="nav-link text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            How It Works
          </Link>
          <Link 
            href="/#why" 
            onClick={() => setIsOpen(false)}
            className="nav-link text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Architecture
          </Link>
          <Link 
            href="/treasury" 
            onClick={() => setIsOpen(false)}
            className="nav-link text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Treasury
          </Link>
          <Link 
            href="/docs" 
            onClick={() => setIsOpen(false)}
            className="nav-link text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Docs
          </Link>
          <Link 
            href="/docs/sdk" 
            onClick={() => setIsOpen(false)}
            className="nav-link text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            SDK
          </Link>
          <Link 
            href="/agent" 
            onClick={() => setIsOpen(false)}
            className="nav-link text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            AI Agent
          </Link>
          <Link 
            href="/contact" 
            onClick={() => setIsOpen(false)}
            className="nav-link text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Contact
          </Link>

          {/* Mobile CTA inside open drawer */}
          <div className="md:hidden pt-4 mt-auto border-t border-border flex flex-col gap-3">
            <Link 
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="btn w-full px-6 py-3 rounded-xl bg-accent-purple text-white-keep text-sm font-medium text-center flex items-center justify-center gap-2 shadow-md"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 z-50">
          <ThemeToggle />

          <Link 
            href="/dashboard"
            className="btn hidden sm:inline-flex group relative px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-accent-purple text-white-keep text-xs sm:text-sm font-medium hover:bg-accent-purple/90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] overflow-hidden items-center gap-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent-purple via-accent-blue to-accent-purple opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient" />
            <span className="relative text-white-keep">Launch Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 relative group-hover:translate-x-1 transition-transform text-white-keep" />
          </Link>

          {/* Hamburger button (visible on mobile < 768px via .hamburger CSS) */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="hamburger p-2 text-muted hover:text-foreground rounded-lg hover:bg-surface transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </header>
  );
}
