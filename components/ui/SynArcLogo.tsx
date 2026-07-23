"use client";

import Image from "next/image";
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
        whileHover: { scale: 1.08 },
        transition: { duration: 0.3, ease: "easeOut" },
      }
    : {};

  return (
    <Wrapper
      className={cn("relative flex items-center justify-center", className)}
      {...wrapperProps}
    >
      {/* Outer glow aura matching logo gradient */}
      <div
        className="absolute rounded-full opacity-60"
        style={{
          width: size * 1.3,
          height: size * 1.3,
          background:
            "radial-gradient(circle, rgba(34,211,238,0.3) 0%, rgba(168,85,247,0.2) 60%, transparent 80%)",
          filter: "blur(10px)",
        }}
      />

      {/* Official SynArc Logo Image */}
      <Image
        src="/official-logo.png"
        alt="SynArc Logo"
        width={size}
        height={size}
        className="relative z-10 object-contain drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]"
        priority
      />
    </Wrapper>
  );
}
