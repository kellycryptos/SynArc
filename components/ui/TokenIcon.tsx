"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
  alt?: string;
}

const TOKEN_ASSETS: Record<string, string> = {
  usdc: "/tokens/usdc.svg",
  eurc: "/tokens/eurc.svg",
  sarc: "/tokens/sarc.svg",
  arc: "/chains/arc.svg",
};

export function TokenIcon({ symbol, size = 20, className, alt }: TokenIconProps) {
  const norm = (symbol || "").trim().toLowerCase();
  const src = TOKEN_ASSETS[norm];

  if (!src) {
    return (
      <span
        style={{ width: size, height: size }}
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary",
          className
        )}
      >
        {symbol?.slice(0, 3).toUpperCase() || "$"}
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex items-center justify-center shrink-0 overflow-hidden rounded-full", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt || `${symbol} token logo`}
        width={size}
        height={size}
        className="w-full h-full object-contain"
        priority={false}
      />
    </span>
  );
}
