"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, AlertCircle, Loader2 } from "lucide-react";
import { useWallets } from "@privy-io/react-auth";
import { BrowserProvider } from "ethers";

export default function CreateProposalPage() {
  const router = useRouter();
  const { walletAddress, isAuthenticated, login } = useAuth();
  const { wallets } = useWallets();
  const { submitProposal } = useGovernanceStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "Governance Parameter",
    description: "",
    treasuryImpactValue: 0,
    executionTarget: "",
    votingDuration: 7,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !walletAddress) {
      login();
      return;
    }

    if (!formData.title || !formData.description) {
      setError("Title and description are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const privy = wallets.find(w => w.walletClientType === "privy");
      if (!privy) {
        throw new Error("Privy wallet not found");
      }

      // Force Arc Testnet before transaction
      const currentChainId = parseInt(privy.chainId.replace("eip155:", ""));
      if (currentChainId !== 5042002) {
        await privy.switchChain(5042002);
      }

      const ethereumProvider = await privy.getEthereumProvider();
      const browserProvider = new BrowserProvider(ethereumProvider);
      const signer = await browserProvider.getSigner();

      const proposalId = await submitProposal({
        ...formData,
        proposer: walletAddress
      }, signer);

      router.push(`/proposals/${proposalId}`);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to create proposal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="space-y-4">
          <Link href="/proposals" className="inline-flex items-center gap-2 text-text-tertiary hover:text-primary transition-colors text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" />
            Back to Proposals
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Proposal</h1>
            <p className="text-muted mt-1">Submit a binding governance proposal to the SynArc DAO.</p>
          </div>
        </div>

        <GlassCard className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-sm text-danger">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-bold text-text-secondary mb-1">Proposal Title *</label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Update Governance Quorum Parameter"
                  className="w-full bg-surface border border-border-thin rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-text-tertiary transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-bold text-text-secondary mb-1">Category</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-surface border border-border-thin rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary transition-colors"
                >
                  <option value="Governance Parameter">Governance Parameter</option>
                  <option value="Treasury Allocation">Treasury Allocation</option>
                  <option value="Ecosystem Grant">Ecosystem Grant</option>
                  <option value="Delegate Onboarding">Delegate Onboarding</option>
                  <option value="Protocol Upgrade">Protocol Upgrade</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-bold text-text-secondary mb-1">Description *</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed context, rationale, and execution steps in Markdown..."
                  rows={8}
                  className="w-full bg-surface border border-border-thin rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-text-tertiary transition-colors resize-y"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="treasuryImpact" className="block text-sm font-bold text-text-secondary mb-1">Treasury Impact (USDC)</label>
                  <input
                    id="treasuryImpact"
                    type="number"
                    value={formData.treasuryImpactValue}
                    onChange={(e) => setFormData({ ...formData, treasuryImpactValue: parseInt(e.target.value) || 0 })}
                    placeholder="-50000"
                    className="w-full bg-surface border border-border-thin rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-text-tertiary transition-colors"
                  />
                  <p className="text-xs text-text-tertiary mt-1.5">Use negative values for outflows (e.g., grants).</p>
                </div>
                
                <div>
                  <label htmlFor="votingDuration" className="block text-sm font-bold text-text-secondary mb-1">Voting Duration (Days)</label>
                  <input
                    id="votingDuration"
                    type="number"
                    min="1"
                    max="14"
                    value={formData.votingDuration}
                    onChange={(e) => setFormData({ ...formData, votingDuration: parseInt(e.target.value) || 7 })}
                    className="w-full bg-surface border border-border-thin rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-text-tertiary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="executionTarget" className="block text-sm font-bold text-text-secondary mb-1">Execution Target Contract (Optional)</label>
                <input
                  id="executionTarget"
                  type="text"
                  value={formData.executionTarget}
                  onChange={(e) => setFormData({ ...formData, executionTarget: e.target.value })}
                  placeholder="0x..."
                  className="w-full bg-surface border border-border-thin rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-text-tertiary transition-colors"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-border-subtle flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deploying Proposal...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Proposal
                  </>
                )}
              </button>
            </div>
            
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
