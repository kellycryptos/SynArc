"use client";

import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";
import { WalletDropdown } from "./WalletDropdown";
import { Wallet } from "lucide-react";
import { motion } from "framer-motion";

export function ConnectButton() {
  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        if (!ready) {
          return (
            <div
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all border bg-accent/5 border-accent/10 text-accent/50 flex items-center gap-2"
              aria-hidden="true"
            >
              <Wallet className="w-4 h-4 animate-pulse" />
              Loading...
            </div>
          );
        }

        if (!connected) {
          return (
            <button
              onClick={openConnectModal}
              type="button"
              className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all border bg-accent/10 border-accent/20 text-accent hover:bg-accent/20 overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              onClick={openChainModal}
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border bg-danger/10 border-danger/20 text-danger hover:bg-danger/20"
            >
              Wrong network
            </button>
          );
        }

        return <WalletDropdown />;
      }}
    </RainbowConnectButton.Custom>
  );
}
