"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/ThemeProvider";

interface GlowOrbProps {
  className?: string;
  color?: "purple" | "cyan" | "blue" | "mixed";
  size?: number;
  blur?: number;
  animate?: boolean;
}

export function GlowOrb({
  className,
  color = "mixed",
  size = 240,
  blur = 80,
  animate = true,
}: GlowOrbProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const colorMap = {
    purple: isLight ? "rgba(99, 102, 241, 0.02)" : "rgba(99, 102, 241, 0.12)",
    cyan: isLight ? "rgba(59, 130, 246, 0.02)" : "rgba(59, 130, 246, 0.12)",
    blue: isLight ? "rgba(59, 130, 246, 0.02)" : "rgba(59, 130, 246, 0.12)",
    mixed: isLight ? "rgba(99, 102, 241, 0.02)" : "rgba(99, 102, 241, 0.1)",
  };

  const secondaryColorMap = {
    purple: isLight ? "rgba(79, 70, 229, 0.01)" : "rgba(79, 70, 229, 0.06)",
    cyan: isLight ? "rgba(37, 99, 235, 0.01)" : "rgba(37, 99, 235, 0.06)",
    blue: isLight ? "rgba(29, 78, 216, 0.01)" : "rgba(29, 78, 216, 0.06)",
    mixed: isLight ? "rgba(59, 130, 246, 0.01)" : "rgba(59, 130, 246, 0.05)",
  };

  return (
    <motion.div
      className={cn("pointer-events-none absolute rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${colorMap[color]} 0%, ${secondaryColorMap[color]} 40%, transparent 70%)`,
        filter: `blur(${blur}px)`,
      }}
      animate={
        animate
          ? {
              scale: [1, 1.08, 1],
              opacity: [0.6, 0.9, 0.6],
            }
          : undefined
      }
      transition={
        animate
          ? {
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : undefined
      }
    />
  );
}
