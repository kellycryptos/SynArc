import { create } from "zustand";
import { Campaign, Milestone, CampaignAIAnalysis } from "@/data/mock/campaigns";
import { createPublicClient, http } from "viem";
import { arcTestnet } from "@/lib/arc-config";
import { getArcRpcUrl } from "@/lib/rpc/config";
import { SynArcCrowdfundABI } from "@/lib/governance/SynArcCrowdfund";

interface CampaignState {
  campaigns: Campaign[];
  initialized: boolean;
  initializeStore: () => Promise<void>;
  addCampaign: (campaignData: Omit<Campaign, 'id' | 'raised' | 'contributors' | 'state' | 'votes' | 'aiAnalysis' | 'agentType' | 'executionScope' | 'strategy' | 'fundingSources' | 'proposalNumber' | 'escrowAddress' | 'sybilProtection'> & { escrowAddress: string }) => Promise<string>;
  contribute: (campaignId: string, amount: number) => Promise<void>;
  castVote: (campaignId: string, choice: 'FOR' | 'AGAINST' | 'ABSTAIN', count?: number) => Promise<void>;
  setAIAnalysis: (campaignId: string, analysis: CampaignAIAnalysis) => void;
  syncOnChainCampaign: (campaignId: string) => Promise<void>;
}

// Reuse a single client instance to prevent redundant RPC connections and connection overhead
let globalPublicClient: any = null;
function getSharedPublicClient() {
  if (!globalPublicClient) {
    globalPublicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(getArcRpcUrl())
    });
  }
  return globalPublicClient;
}

// Resilient on-chain event / state fetcher for deployed campaigns
async function fetchOnChainCampaignMetrics(escrowAddress: string) {
  if (!escrowAddress || !escrowAddress.startsWith("0x") || escrowAddress.includes("Escrow") || escrowAddress.includes("Treasury") || escrowAddress.length < 42) {
    return null; // Not a real contract address, use backend database fallback
  }

  try {
    const client = getSharedPublicClient();

    const totalRaisedBigInt = await client.readContract({
      address: escrowAddress as `0x${string}`,
      abi: SynArcCrowdfundABI,
      functionName: "totalRaised"
    }) as bigint;

    const totalContributorsBigInt = await client.readContract({
      address: escrowAddress as `0x${string}`,
      abi: SynArcCrowdfundABI,
      functionName: "totalContributors"
    }) as bigint;

    const onChainMilestones = await client.readContract({
      address: escrowAddress as `0x${string}`,
      abi: SynArcCrowdfundABI,
      functionName: "getMilestones"
    }) as any[];

    const raised = Number(totalRaisedBigInt) / 1_000_000;
    const contributors = Number(totalContributorsBigInt);

    // Map milestones
    const milestones = onChainMilestones.map((m, idx) => ({
      title: m.title,
      amount: Number(m.amount) / 1_000_000,
      description: m.description || "",
      status: m.claimed ? "completed" as const : m.approved ? "active" as const : "pending" as const
    }));

    return { raised, contributors, milestones };
  } catch (err) {
    console.warn(`useCampaignStore: On-chain fetch failed for ${escrowAddress}, falling back to DB:`, err);
    return null;
  }
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  initialized: false,

  initializeStore: async () => {
    // Prevent server-side crash
    if (typeof window === "undefined") return;

    try {
      const response = await fetch("/api/campaigns");
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.campaigns)) {
          const rawCampaigns: Campaign[] = data.campaigns;

          // Hydrate real on-chain parameters for deployed campaigns
          const hydratedCampaigns = await Promise.all(
            rawCampaigns.map(async (c) => {
              const onChain = await fetchOnChainCampaignMetrics(c.escrowAddress);
              if (onChain) {
                // If goal is fully raised, advance lifecycle phase
                let state = c.state;
                if (onChain.raised >= c.goal && c.state === 'Active') {
                  state = 'Voting';
                }
                
                // If all milestones completed, mark Completed
                const allMilestonesClaimed = onChain.milestones.every(m => m.status === 'completed');
                if (allMilestonesClaimed && onChain.milestones.length > 0) {
                  state = 'Completed';
                } else if (onChain.milestones.some(m => m.status === 'active' && m.title.includes("approved"))) {
                  state = 'Voting';
                }

                return {
                  ...c,
                  raised: onChain.raised,
                  contributors: onChain.contributors,
                  milestones: onChain.milestones,
                  state
                };
              }
              return c;
            })
          );

          set({ campaigns: hydratedCampaigns, initialized: true });
        }
      }
    } catch (err) {
      console.error("useCampaignStore: Failed to initialize campaigns:", err);
    }
  },

  addCampaign: async (campaignData) => {
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.campaign) {
          // Re-initialize store to load fresh database + on-chain status
          await get().initializeStore();
          return data.campaign.id;
        }
      }
      throw new Error("Failed to register campaign in backend database");
    } catch (err: any) {
      console.error("useCampaignStore: addCampaign failed:", err);
      throw err;
    }
  },

  contribute: async (campaignId, amount) => {
    // Optimistically update the UI metrics, then refresh from chain
    set((state) => {
      const campaigns = state.campaigns.map((c) => {
        if (c.id === campaignId) {
          const newRaised = c.raised + amount;
          return {
            ...c,
            raised: newRaised,
            contributors: c.contributors + 1,
            state: newRaised >= c.goal && c.state === "Active" ? "Voting" : c.state
          };
        }
        return c;
      });
      return { campaigns };
    });

    // Refetch the on-chain data to make sure UI is synchronized perfectly
    await get().syncOnChainCampaign(campaignId);
  },

  castVote: async (campaignId, choice, count = 1000) => {
    set((state) => {
      const campaigns = state.campaigns.map((c) => {
        if (c.id === campaignId) {
          const newVotes = { ...c.votes };
          if (choice === 'FOR') newVotes.for += count;
          if (choice === 'AGAINST') newVotes.against += count;
          if (choice === 'ABSTAIN') newVotes.abstain += count;

          return {
            ...c,
            votes: newVotes
          };
        }
        return c;
      });
      return { campaigns };
    });

    await get().syncOnChainCampaign(campaignId);
  },

  setAIAnalysis: (campaignId, analysis) => {
    set((state) => {
      const campaigns = state.campaigns.map((c) => {
        if (c.id === campaignId) {
          return {
            ...c,
            aiAnalysis: analysis
          };
        }
        return c;
      });
      return { campaigns };
    });
  },

  syncOnChainCampaign: async (campaignId) => {
    const target = get().campaigns.find(c => c.id === campaignId);
    if (!target) return;

    const onChain = await fetchOnChainCampaignMetrics(target.escrowAddress);
    if (onChain) {
      set((state) => {
        const campaigns = state.campaigns.map((c) => {
          if (c.id === campaignId) {
            let newState = c.state;
            if (onChain.raised >= c.goal && c.state === 'Active') {
              newState = 'Voting';
            }
            const allClaimed = onChain.milestones.every(m => m.status === 'completed');
            if (allClaimed && onChain.milestones.length > 0) {
              newState = 'Completed';
            }

            return {
              ...c,
              raised: onChain.raised,
              contributors: onChain.contributors,
              milestones: onChain.milestones,
              state: newState
            };
          }
          return c;
        });
        return { campaigns };
      });
    }
  }
}));
