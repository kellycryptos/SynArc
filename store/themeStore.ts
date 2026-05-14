import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light" | "system";

interface ThemeState {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;
  setResolvedTheme: (resolved: "dark" | "light") => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      resolvedTheme: "dark",

      setTheme: (theme) => set({ theme }),
      setResolvedTheme: (resolved) => set({ resolvedTheme: resolved }),

      toggle: () => {
        const { resolvedTheme } = get();
        set({ theme: resolvedTheme === "dark" ? "light" : "dark" });
      },
    }),
    {
      name: "synarc-theme",
      partialize: (s) => ({ theme: s.theme }),
    }
  )
);
