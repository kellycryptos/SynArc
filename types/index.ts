export interface DAOMember {
  id: string;
  address: string;
  ensName?: string;
  avatar?: string;
  reputationLevel: 'Novice' | 'Contributor' | 'Steward' | 'Guardian' | 'Architect';
  reputationScore: number;
  delegatedPower: number;
  proposalsCreated: number;
  proposalsVoted: number;
  votingPower: number;
  votingParticipationRate: number;
  isDelegate: boolean;
  delegatorsCount: number;
  joinedAt: string;
  lastActivity: string;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'Active' | 'Passed' | 'Rejected' | 'Executed' | 'Canceled';
  proposer: string;
  createdAt: string;
  votingStarts: string;
  votingEnds: string;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  quorum: number;
  category: string;
}

export interface TreasuryActivity {
  id: string;
  type: 'Inflow' | 'Outflow' | 'Swap' | 'Stake' | 'Unstake';
  amount: number;
  token: string;
  timestamp: string;
  description: string;
  txHash: string;
  party?: string;
}

export interface GovernanceMetric {
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
}

export interface VotingTrend {
  period: string;
  participation: number;
  proposals: number;
  averageTurnout: number;
}

export interface DelegationAnalytics {
  totalDelegations: number;
  activeDelegates: number;
  averageDelegationSize: number;
  topDelegates: { address: string; power: number }[];
}

export interface DAOSettings {
  name: string;
  votingDuration: number;
  quorumThreshold: number;
  proposalThreshold: number;
  executionDelay: number;
  treasuryAddress: string;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  currencySymbol: string;
  blockExplorer: string;
}

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

export interface Creator {
  id: string;
  name: string;
  category: string;
  description: string;
  goal: number;
  raised: number;
  supporters: number;
  daysLeft: number;
  twitter: string | null;
  wallet: string;
  slug: string;
  isAgent?: boolean;
  escrowAddress?: string;
  image?: string;
}
