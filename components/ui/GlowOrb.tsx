"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowOrbProps {
  className?: string;
  color?: "purple" | "cyan" | "blue" | "mixed";
  size?: number;
  blur?: number;
  animate?: boolean;
}

const colorMap = {
  purple: "rgba(168, 85, 247, 0.35)",
  cyan: "rgba(34, 211, 238, 0.35)",
  blue: "rgba(59, 130, 246, 0.35)",
  mixed: "rgba(168, 85, 247, 0.25)",
};

const secondaryColorMap = {
  purple: "rgba(124, 58, 237, 0.2)",
  cyan: "rgba(6, 182, 212, 0.2)",
  blue: "rgba(37, 99, 235, 0.2)",
  mixed: "rgba(34, 211, 238, 0.2)",
};

export function GlowOrb({
  className,
  color = "mixed",
  size = 240,
  blur = 80,
  animate = true,
}: GlowOrbProps) {
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
