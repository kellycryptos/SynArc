export interface Milestone {
  title: string;
  amount: number;
  description: string;
  status: 'completed' | 'active' | 'pending';
}

export interface CampaignVotes {
  for: number;
  against: number;
  abstain: number;
}

export interface SybilProtection {
  aiScanned: boolean;
  reputationChecked: boolean;
  stakeRequired: boolean;
}

export interface CampaignAIAnalysis {
  recommendation: 'FUND' | 'REJECT' | 'REVIEW';
  scores: {
    legitimacy: number;
    impact: number;
    arcAlignment: number;
    executionFeasibility: number;
    milestoneRealism: number;
    governanceAlignment: number;
  };
  riskFlags: string[];
  strengths: string[];
  milestoneFeedback: string;
  treasuryRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  verdict: string;
  dueDiligenceNotes: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  goal: number;
  raised: number;
  contributors: number;
  state: 'Draft' | 'Active' | 'Voting' | 'Funded' | 'Failed' | 'Completed';
  isAgent: boolean;
  badge: 'HUMAN_CAMPAIGN' | 'AUTONOMOUS_AGENT_FUND';
  creator: string;
  recipient: string;
  deadline: string;
  milestones: Milestone[];
  votes: CampaignVotes;
  aiAnalysis: CampaignAIAnalysis | null;
  agentType?: string;
  executionScope?: string;
  strategy?: string;
  fundingSources: string[];
  proposalNumber: number;
  escrowAddress: string;
  sybilProtection: SybilProtection;
  twitter?: string | null;
  image?: string;
}

export const MOCK_CAMPAIGNS: Campaign[] = [];
