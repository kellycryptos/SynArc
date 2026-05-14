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
