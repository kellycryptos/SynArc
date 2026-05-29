import { create } from "zustand";
import { Campaign, Milestone, CampaignAIAnalysis, MOCK_CAMPAIGNS } from "@/data/mock/campaigns";

interface CampaignState {
  campaigns: Campaign[];
  initialized: boolean;
  initializeStore: () => void;
  addCampaign: (campaignData: Omit<Campaign, 'id' | 'raised' | 'contributors' | 'state' | 'votes' | 'aiAnalysis'>) => string;
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
    const newCampaign: Campaign = {
      ...campaignData,
      id,
      raised: 0,
      contributors: 0,
      state: 'Active',
      votes: { for: 0, against: 0, abstain: 0 },
      aiAnalysis: null
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
        // If raised matches or exceeds goal, set state to Funded (unless active milestone is voting)
        const newContributors = c.contributors + 1;
        let newState = c.state;
        if (newRaised >= c.goal && c.state === 'Active') {
          newState = 'Voting'; // Enter voting for the first milestone on completion
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

        // Auto-complete or advance milestone status for demonstration if votes are high
        let newMilestones = [...c.milestones];
        let newState = c.state;

        // If FOR votes are highly dominant, let's execute and release milestone
        if (newVotes.for > newVotes.against + 5000) {
          // Find the active or pending milestone to progress
          const activeIndex = newMilestones.findIndex(m => m.status === 'active');
          if (activeIndex !== -1) {
            newMilestones[activeIndex].status = 'completed';
            // Move next pending to active
            const nextPending = newMilestones.findIndex(m => m.status === 'pending');
            if (nextPending !== -1) {
              newMilestones[nextPending].status = 'active';
            } else {
              // No more milestones, campaign is fully funded and complete
              newState = 'Funded';
            }
          } else {
            // Find first pending or check if we can make it active
            const firstPending = newMilestones.findIndex(m => m.status === 'pending');
            if (firstPending !== -1) {
              newMilestones[firstPending].status = 'active';
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
