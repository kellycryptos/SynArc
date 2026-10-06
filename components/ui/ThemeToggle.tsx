"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  variant?: "icon" | "pill";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className = "" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render skeleton placeholder with same dimensions to avoid layout shift
    if (variant === "pill") {
      return (
        <div className={`h-8 w-28 rounded-xl bg-surface border border-border-thin animate-pulse ${className}`} />
      );
    }
    return (
      <div className={`w-9 h-9 rounded-full bg-surface-elevated/40 border border-transparent ${className}`} />
    );
  }

  const isDark = theme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  if (variant === "pill") {
    return (
      <div
        className={`inline-flex items-center gap-1 p-1 rounded-xl bg-surface-elevated border border-border-thin text-xs font-mono ${className}`}
        role="group"
        aria-label="Theme toggle"
      >
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
            isDark
              ? "bg-primary text-white shadow-xs font-semibold"
              : "text-muted hover:text-foreground hover:bg-surface"
          }`}
          title="Enable dark mode"
          aria-pressed={isDark}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Dark</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
            !isDark
              ? "bg-primary text-white shadow-xs font-semibold"
              : "text-muted hover:text-foreground hover:bg-surface"
          }`}
          title="Enable light mode"
          aria-pressed={!isDark}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Light</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`group relative p-2 text-muted hover:text-foreground transition-all duration-200 rounded-full hover:bg-surface-elevated border border-transparent hover:border-border-thin cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95 ${className}`}
    >
      {isDark ? (
        <Sun className="w-4.5 h-4.5 text-amber-400 group-hover:text-amber-300 transition-transform duration-300 group-hover:rotate-45" />
      ) : (
        <Moon className="w-4.5 h-4.5 text-indigo-600 group-hover:text-indigo-500 transition-transform duration-300 group-hover:-rotate-12" />
      )}
    </button>
  );
}
