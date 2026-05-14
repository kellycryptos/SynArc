"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SynArcLogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export function SynArcLogo({
  className,
  size = 40,
  animated = true,
}: SynArcLogoProps) {
  const Wrapper = animated ? motion.div : "div";
  const wrapperProps = animated
    ? {
        whileHover: { rotate: 180, scale: 1.05 },
        transition: { duration: 0.6, ease: "easeInOut" },
      }
    : {};

  return (
    <Wrapper
      className={cn("relative flex items-center justify-center", className)}
      {...wrapperProps}
    >
      {/* Outer glow ring */}
      <div
        className="absolute rounded-full opacity-40"
        style={{
          width: size * 1.4,
          height: size * 1.4,
          background:
            "radial-gradient(circle, rgba(168,85,247,0.25) 0%, rgba(34,211,238,0.15) 50%, transparent 70%)",
          filter: "blur(12px)",
        }}
      />

      {/* SVG Logo Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        <defs>
          <linearGradient
            id="logoGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient
            id="logoGradientInner"
            x1="100%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>

        {/* Outer hexagon */}
        <path
          d="M20 2L36.5 11.5V28.5L20 38L3.5 28.5V11.5L20 2Z"
          stroke="url(#logoGradient)"
          strokeWidth="1.2"
          fill="none"
          opacity="0.9"
        />

        {/* Inner hexagon */}
        <path
          d="M20 10L29 15.5V24.5L20 30L11 24.5V15.5L20 10Z"
          stroke="url(#logoGradientInner)"
          strokeWidth="1"
          fill="rgba(168,85,247,0.08)"
          opacity="0.8"
        />

        {/* Center node */}
        <circle cx="20" cy="20" r="2.5" fill="url(#logoGradient)" opacity="0.95" />

        {/* Connection lines from center to vertices */}
        <line x1="20" y1="20" x2="20" y2="10" stroke="url(#logoGradient)" strokeWidth="0.6" opacity="0.5" />
        <line x1="20" y1="20" x2="29" y2="24.5" stroke="url(#logoGradient)" strokeWidth="0.6" opacity="0.5" />
        <line x1="20" y1="20" x2="11" y2="24.5" stroke="url(#logoGradient)" strokeWidth="0.6" opacity="0.5" />
      </svg>
    </Wrapper>
  );
}
