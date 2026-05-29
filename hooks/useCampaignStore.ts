import { create } from "zustand";
import { Campaign, Milestone, CampaignAIAnalysis, MOCK_CAMPAIGNS } from "@/data/mock/campaigns";

interface CampaignState {
  campaigns: Campaign[];
  initialized: boolean;
  initializeStore: () => void;
  addCampaign: (campaignData: Omit<Campaign, 'id' | 'raised' | 'contributors' | 'state' | 'votes' | 'aiAnalysis' | 'agentType' | 'executionScope' | 'strategy' | 'fundingSources' | 'proposalNumber' | 'escrowAddress' | 'sybilProtection'>) => string;
  contribute: (campaignId: string, amount: number) => void;
  castVote: (campaignId: string, choice: 'FOR' | 'AGAINST' | 'ABSTAIN', count?: number) => void;
  setAIAnalysis: (campaignId: string, analysis: CampaignAIAnalysis) => void;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  initialized: false,

  initializeStore: () => {
    if (get().initialized) return;
    
    // Server-side check
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("synarc_crowdfund_campaigns");
    if (stored) {
      try {
        set({ campaigns: JSON.parse(stored), initialized: true });
        return;
      } catch (e) {
        console.error("Failed to parse stored campaigns, resetting...", e);
      }
    }

    // Default pre-population
    set({ campaigns: MOCK_CAMPAIGNS, initialized: true });
    localStorage.setItem("synarc_crowdfund_campaigns", JSON.stringify(MOCK_CAMPAIGNS));
  },

  addCampaign: (campaignData) => {
    const id = `camp-${String(get().campaigns.length + 1).padStart(3, '0')}`;
    
    // Create new campaign with all required upgraded mock parameters
    const newCampaign: Campaign = {
      ...campaignData,
      id,
      raised: 0,
      contributors: 0,
      state: 'Active',
      votes: { for: 0, against: 0, abstain: 0 },
      aiAnalysis: null,
      
      // Upgrade metadata
      agentType: campaignData.isAgent ? 'Treasury Optimization Agent' : undefined,
      executionScope: campaignData.isAgent ? 'Ecosystem Grant Allocation' : undefined,
      strategy: campaignData.isAgent ? 'On-chain yield scans & DeFi automation' : undefined,
      fundingSources: campaignData.isAgent 
        ? ['individual', 'dao_treasury', 'ai_agents'] 
        : ['individual', 'dao_treasury'],
      proposalNumber: Math.floor(Math.random() * 50) + 16,
      escrowAddress: `0xEscrow${Math.floor(Math.random() * 899) + 100}VaultAddress`,
      sybilProtection: {
        aiScanned: true,
        reputationChecked: false,
        stakeRequired: false
      }
    };

    const updated = [...get().campaigns, newCampaign];
    set({ campaigns: updated });
    localStorage.setItem("synarc_crowdfund_campaigns", JSON.stringify(updated));
    return id;
  },

  contribute: (campaignId, amount) => {
    const updated = get().campaigns.map((c) => {
      if (c.id === campaignId) {
        const newRaised = c.raised + amount;
        const newContributors = c.contributors + 1;
        let newState = c.state;
        
        // Advance to Voting (milestone release review phase) if goal is completed
        if (newRaised >= c.goal && c.state === 'Active') {
          newState = 'Voting';
        }
        
        return {
          ...c,
          raised: newRaised,
          contributors: newContributors,
          state: newState
        };
      }
      return c;
    });

    set({ campaigns: updated });
    localStorage.setItem("synarc_crowdfund_campaigns", JSON.stringify(updated));
  },

  castVote: (campaignId, choice, count = 1000) => {
    const updated = get().campaigns.map((c) => {
      if (c.id === campaignId) {
        const newVotes = { ...c.votes };
        if (choice === 'FOR') newVotes.for += count;
        if (choice === 'AGAINST') newVotes.against += count;
        if (choice === 'ABSTAIN') newVotes.abstain += count;

        let newMilestones = [...c.milestones];
        let newState = c.state;

        // Progress milestone statuses if FOR votes are highly dominant
        if (newVotes.for > newVotes.against + 5000) {
          const activeIndex = newMilestones.findIndex(m => m.status === 'active');
          if (activeIndex !== -1) {
            newMilestones[activeIndex].status = 'completed';
            
            // Move next pending milestone to active
            const nextPending = newMilestones.findIndex(m => m.status === 'pending');
            if (nextPending !== -1) {
              newMilestones[nextPending].status = 'active';
              newState = 'Voting'; // remains in Voting since next milestone needs release approval
            } else {
              // No more milestones left - campaign is fully Completed!
              newState = 'Completed';
            }
          } else {
            // No currently active, try to trigger the first pending milestone
            const firstPending = newMilestones.findIndex(m => m.status === 'pending');
            if (firstPending !== -1) {
              newMilestones[firstPending].status = 'active';
            } else {
              newState = 'Completed';
            }
          }
        }

        return {
          ...c,
          votes: newVotes,
          milestones: newMilestones,
          state: newState
        };
      }
      return c;
    });

    set({ campaigns: updated });
    localStorage.setItem("synarc_crowdfund_campaigns", JSON.stringify(updated));
  },

  setAIAnalysis: (campaignId, analysis) => {
    const updated = get().campaigns.map((c) => {
      if (c.id === campaignId) {
        return {
          ...c,
          aiAnalysis: analysis
        };
      }
      return c;
    });

    set({ campaigns: updated });
    localStorage.setItem("synarc_crowdfund_campaigns", JSON.stringify(updated));
  }
}));
