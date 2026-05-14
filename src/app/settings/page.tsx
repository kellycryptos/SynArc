"use client";

import { motion } from "framer-motion";
import {
  Settings,
  Wallet,
  Globe,
  Shield,
  Save,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { daoSettings } from "@/lib/mockData";
import { arcTestnet } from "@/lib/network";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    votingDuration: daoSettings.votingDuration,
    quorumThreshold: daoSettings.quorumThreshold,
    proposalThreshold: daoSettings.proposalThreshold,
    executionDelay: daoSettings.executionDelay,
    treasuryAddress: daoSettings.treasuryAddress,
    name: daoSettings.name,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-bold">DAO Settings</h1>
          <p className="text-muted">
            Configure governance parameters, voting rules, and network preferences
          </p>
        </motion.div>

        {/* Network Info */}
        <GlassCard hover={false}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold">Network Configuration</h2>
              <p className="text-xs text-muted">Connected to Arc Testnet</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted uppercase tracking-wider font-medium">
                Network Name
              </label>
              <div className="px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm font-mono">
                {arcTestnet.name}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted uppercase tracking-wider font-medium">
                Chain ID
              </label>
              <div className="px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm font-mono">
                {arcTestnet.chainId}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted uppercase tracking-wider font-medium">
                RPC Endpoint
              </label>
              <div className="px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm font-mono truncate">
                {arcTestnet.rpcUrl}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted uppercase tracking-wider font-medium">
                Currency Symbol
              </label>
              <div className="px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm font-mono">
                {arcTestnet.currencySymbol}
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs text-muted uppercase tracking-wider font-medium">
                Block Explorer
              </label>
              <div className="px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm font-mono">
                {arcTestnet.blockExplorer}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Governance Settings */}
        <GlassCard hover={false}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold">Governance Parameters</h2>
              <p className="text-xs text-muted">Core DAO configuration</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs text-muted uppercase tracking-wider font-medium">
                DAO Name
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted uppercase tracking-wider font-medium">
                Voting Duration (days)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={settings.votingDuration}
                  onChange={(e) =>
                    setSettings({ ...settings, votingDuration: parseInt(e.target.value) })
                  }
                  className="flex-1 h-2 rounded-full bg-white/[0.06] accent-accent"
                />
                <span className="text-sm font-mono w-8 text-right">
                  {settings.votingDuration}
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted uppercase tracking-wider font-medium">
                Quorum Threshold (tokens)
              </label>
              <input
                type="number"
                value={settings.quorumThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, quorumThreshold: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted uppercase tracking-wider font-medium">
                Proposal Threshold (tokens)
              </label>
              <input
                type="number"
                value={settings.proposalThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, proposalThreshold: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted uppercase tracking-wider font-medium">
                Execution Delay (days)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="7"
                  value={settings.executionDelay}
                  onChange={(e) =>
                    setSettings({ ...settings, executionDelay: parseInt(e.target.value) })
                  }
                  className="flex-1 h-2 rounded-full bg-white/[0.06] accent-accent"
                />
                <span className="text-sm font-mono w-8 text-right">
                  {settings.executionDelay}
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted uppercase tracking-wider font-medium">
                Treasury Address
              </label>
              <input
                type="text"
                value={settings.treasuryAddress}
                onChange={(e) =>
                  setSettings({ ...settings, treasuryAddress: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-foreground font-mono focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
          </div>
        </GlassCard>

        {/* Treasury Permissions */}
        <GlassCard hover={false}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold">Treasury Permissions</h2>
              <p className="text-xs text-muted">Spending limits and approval rules</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: "Require multisig for > $50K", enabled: true },
              { label: "Timelock for > $100K", enabled: true },
              { label: "Auto-approve grants < $10K", enabled: false },
              { label: "Emergency pause enabled", enabled: true },
            ].map((perm) => (
              <div
                key={perm.label}
                className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0"
              >
                <span className="text-sm">{perm.label}</span>
                <button
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative",
                    perm.enabled ? "bg-accent" : "bg-white/[0.08]"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                      perm.enabled ? "left-6" : "left-1"
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Security */}
        <GlassCard hover={false}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold">Security Settings</h2>
              <p className="text-xs text-muted">Protect your governance actions</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: "Sign all votes with hardware wallet", enabled: true },
              { label: "Email notifications for proposals", enabled: false },
              { label: "2FA for proposal creation", enabled: true },
              { label: "Session timeout (30 min)", enabled: true },
            ].map((setting) => (
              <div
                key={setting.label}
                className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0"
              >
                <span className="text-sm">{setting.label}</span>
                <button
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative",
                    setting.enabled ? "bg-accent" : "bg-white/[0.08]"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                      setting.enabled ? "left-6" : "left-1"
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Save */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <AlertTriangle className="w-4 h-4" />
            Changes require a governance proposal to take effect on-chain
          </div>
          <button
            onClick={handleSave}
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
              saved
                ? "bg-success text-white"
                : "bg-accent text-white hover:bg-accent/90"
            )}
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
