"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export interface ChainIconProps {
  chain: string;
  size?: number;
  className?: string;
  alt?: string;
}

const CHAIN_ASSETS: Record<string, string> = {
  // Ethereum
  eth: "/chains/ethereum.svg",
  ethereum: "/chains/ethereum.svg",
  eth_sepolia: "/chains/ethereum.svg",
  eth_mainnet: "/chains/ethereum.svg",
  "ethereum sepolia": "/chains/ethereum.svg",
  "ethereum mainnet": "/chains/ethereum.svg",
  "eth sepolia": "/chains/ethereum.svg",
  sepolia: "/chains/ethereum.svg",
  mainnet: "/chains/ethereum.svg",

  // Arc
  arc: "/chains/arc.svg",
  arc_mainnet: "/chains/arc.svg",
  arc_testnet: "/chains/arc.svg",
  "arc testnet": "/chains/arc.svg",
  "arc mainnet": "/chains/arc.svg",

  // Base
  base: "/chains/base.svg",
  base_sepolia: "/chains/base.svg",
  base_mainnet: "/chains/base.svg",
  "base sepolia": "/chains/base.svg",
  "base mainnet": "/chains/base.svg",

  // Avalanche
  avax: "/chains/avalanche.svg",
  avalanche: "/chains/avalanche.svg",
  avax_fuji: "/chains/avalanche.svg",
  avax_mainnet: "/chains/avalanche.svg",
  "avalanche fuji": "/chains/avalanche.svg",
  "avalanche mainnet": "/chains/avalanche.svg",
  fuji: "/chains/avalanche.svg",

  // Solana
  sol: "/chains/solana.svg",
  solana: "/chains/solana.svg",
  sol_devnet: "/chains/solana.svg",
  sol_mainnet: "/chains/solana.svg",
  "solana devnet": "/chains/solana.svg",
  "solana mainnet": "/chains/solana.svg",
  devnet: "/chains/solana.svg",

  // Arbitrum
  arb: "/chains/arbitrum.svg",
  arbitrum: "/chains/arbitrum.svg",
  "arbitrum one": "/chains/arbitrum.svg",
};

export function ChainIcon({ chain, size = 20, className, alt }: ChainIconProps) {
  const norm = (chain || "").trim().toLowerCase();
  const src = CHAIN_ASSETS[norm];

  if (!src) {
    return (
      <span
        style={{ width: size, height: size }}
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-surface-elevated text-[10px] font-bold text-muted",
          className
        )}
      >
        {chain?.slice(0, 3).toUpperCase() || "?"}
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
        alt={alt || `${chain} chain logo`}
        width={size}
        height={size}
        className="w-full h-full object-contain"
        priority={false}
      />
    </span>
  );
}
