"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDisconnect } from "wagmi";
import { 
  ChevronDown, 
  User, 
  History, 
  ShieldAlert, 
  Settings, 
  LogOut,
  Wallet
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { arcTestnet } from "@/lib/network";
import { cn } from "@/lib/utils";

export function WalletDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { address, shortAddress, isCorrectNetwork } = useWallet();
  const { disconnect } = useDisconnect();

  // Mocked stats
  const governancePower = "1,240";
  const votingPower = "850";
  const delegateReputation = "98/100";

  if (!address) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border hover:opacity-80",
          isCorrectNetwork
            ? "bg-success/10 border-success/20 text-success"
            : "bg-warning/10 border-warning/20 text-warning"
        )}
      >
        <Wallet className="w-4 h-4" />
        {shortAddress}
        <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="absolute right-0 mt-2 w-72 glass-card overflow-hidden shadow-2xl z-50 border border-border-thin"
          >
            <div className="p-4 border-b border-border-thin bg-surface/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Network</span>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-elevated border border-border-thin">
                  <div className={cn("w-2 h-2 rounded-full", isCorrectNetwork ? "bg-success animate-pulse" : "bg-warning")} />
                  <span className="text-xs font-medium text-text-primary">
                    {isCorrectNetwork ? arcTestnet.name : "Wrong Network"}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Governance Power</span>
                  <span className="font-semibold text-text-primary">{governancePower}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Voting Power</span>
                  <span className="font-semibold text-text-primary">{votingPower}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Delegate Rep.</span>
                  <span className="font-semibold text-success">{delegateReputation}</span>
                </div>
              </div>
            </div>

            <div className="p-2 space-y-1">
              <DropdownItem icon={User} label="View Profile" />
              <DropdownItem icon={History} label="Voting History" />
              <DropdownItem icon={ShieldAlert} label="Treasury Permissions" />
              <DropdownItem icon={Settings} label="Settings" />
              <div className="h-px bg-border-thin my-1" />
              <button
                onClick={() => {
                  disconnect();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DropdownItem({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors">
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
