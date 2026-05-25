"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { daoSettings } from "@/lib/mockData";
import { Save, Settings2, Shield, Bell, AlertCircle, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // TODO: replace with contract call to fetch live DAO parameters
    // For now, using mock data as fallback while contract integration is developed
    setIsLoading(false);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: replace with contract call to create governance proposal
      // This should call createProposal from useGovernor hook
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Proposal created! Awaiting quorum and vote.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  if (error) {
    return (
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg border border-warning/20 bg-warning/5 p-6 flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Failed to load settings</h3>
              <p className="text-sm text-muted mt-1">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-md bg-warning/10 hover:bg-warning/15 text-warning text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-12 bg-surface-elevated rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted">DAO Name</label>
                      <input 
                        type="text" 
                        defaultValue={daoSettings.name}
                        className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border-thin focus:border-primary outline-none transition-colors text-sm disabled:opacity-50"
                        disabled
                      />
                      <p className="text-xs text-muted">Read-only from contract</p>
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
                )}
              </div>

              <div className="pt-6 border-t border-border-thin flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Creating proposal..." : "Save Changes"}
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
