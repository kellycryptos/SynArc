"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { daoSettings } from "@/lib/mockData";
import { Save, Settings2, Shield, Bell } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted mt-1">Manage DAO parameters and preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <div className="lg:col-span-1 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-elevated text-foreground font-medium text-sm transition-colors border border-border-thin">
              <Settings2 className="w-4 h-4" />
              DAO Parameters
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-elevated text-muted hover:text-foreground font-medium text-sm transition-colors border border-transparent">
              <Shield className="w-4 h-4" />
              Security Council
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-elevated text-muted hover:text-foreground font-medium text-sm transition-colors border border-transparent">
              <Bell className="w-4 h-4" />
              Notifications
            </button>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <GlassCard className="p-6 space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4">Governance Parameters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted">DAO Name</label>
                    <input 
                      type="text" 
                      defaultValue={daoSettings.name}
                      className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border-thin focus:border-primary outline-none transition-colors text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted">Voting Duration (Days)</label>
                    <input 
                      type="number" 
                      defaultValue={daoSettings.votingDuration}
                      className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border-thin focus:border-primary outline-none transition-colors text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted">Quorum Threshold (USDC)</label>
                    <input 
                      type="number" 
                      defaultValue={daoSettings.quorumThreshold}
                      className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border-thin focus:border-primary outline-none transition-colors text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted">Proposal Threshold</label>
                    <input 
                      type="number" 
                      defaultValue={daoSettings.proposalThreshold}
                      className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border-thin focus:border-primary outline-none transition-colors text-sm"
                    />
                  </div>

                </div>
              </div>

              <div className="pt-6 border-t border-border-thin flex justify-end">
                <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-sm">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </GlassCard>
            
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3">
              <Shield className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-warning mb-1">Parameter changes require a vote</h4>
                <p className="text-xs text-warning/80">
                  Saving these changes will create a new proposal that must pass quorum and receive majority support before being enacted on-chain.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
