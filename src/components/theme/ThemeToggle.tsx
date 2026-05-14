"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useThemeStore } from "@/store/themeStore";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const setStoreTheme = useThemeStore((state) => state.setTheme);
  const setStoreResolvedTheme = useThemeStore((state) => state.setResolvedTheme);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (resolvedTheme) {
      setStoreResolvedTheme(resolvedTheme as "dark" | "light");
    }
  }, [resolvedTheme, setStoreResolvedTheme]);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-lg bg-surface animate-pulse" />;
  }

  const isDark = resolvedTheme === "dark";

  const handleToggle = () => {
    const newTheme = isDark ? "light" : "dark";
    setTheme(newTheme);
    setStoreTheme(newTheme);
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-lg bg-glass border border-glass-border text-muted hover:text-foreground hover:bg-surface-elevated transition-all"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
