"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Wallet, AlertTriangle, RefreshCw } from "lucide-react";
import { ReactNode, useState, useEffect } from "react";

const ARC_TESTNET_CHAIN_ID = 5042002;

export function WalletGuard({ children }: { children: ReactNode }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatches by ensuring client-only rendering for guarded content
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="w-10 h-10 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin mb-4" />
        <p className="text-muted text-sm">Synchronizing governance access gate...</p>
      </div>
    );
  }

  const handleConnect = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  const handleSwitchNetwork = () => {
    try {
      switchChain({ chainId: ARC_TESTNET_CHAIN_ID });
    } catch (error) {
      console.error("Failed to switch network", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fade-in-up px-4">
        <div className="w-20 h-20 rounded-2xl bg-surface-elevated border border-border-thin flex items-center justify-center mb-6 shadow-xl shadow-primary/5">
          <Wallet className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold font-heading tracking-tight mb-3">Connect Your Wallet</h2>
        <p className="text-muted max-w-md mx-auto mb-8">
          Please connect your Web3 wallet to access the SynArc Governance Dashboard and interact with the Arc Ecosystem.
        </p>
        <button 
          onClick={handleConnect}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] cursor-pointer"
        >
          <Wallet className="w-5 h-5" />
          Connect Wallet
        </button>
      </div>
    );
  }

  if (chainId !== ARC_TESTNET_CHAIN_ID) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fade-in-up px-4">
        <div className="w-20 h-20 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center mb-6 shadow-xl shadow-warning/5">
          <AlertTriangle className="w-10 h-10 text-warning" />
        </div>
        <h2 className="text-3xl font-bold font-heading tracking-tight mb-3 text-warning">Wrong Network</h2>
        <p className="text-muted max-w-md mx-auto mb-8">
          ⚠️ Please switch to the Arc Testnet to access the dashboard.
        </p>
        <button 
          onClick={handleSwitchNetwork}
          disabled={isSwitching}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-warning text-[#0A0A0F] font-medium hover:bg-warning/90 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSwitching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
          Switch to Arc Testnet
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
