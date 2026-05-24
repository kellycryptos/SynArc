export type ProposalStatus = "Active" | "Pending" | "Executed" | "Defeated";

export interface TimelineEvent {
  title: string;
  timestamp: string;
  status: string;
  txHash?: string;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  category: string;
  status: ProposalStatus;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  totalVotes: number;
  participationPercentage: number;
  treasuryImpactValue: number; // numeric USDC impact (negative for outflows, 0 for none)
  treasuryImpact: string; // formatted string e.g. "-500,000 USDC"
  timeRemaining: string;
  createdAt: string;
  votingStarts: string;
  votingEnds: string;
  executionTarget?: string;
  votingDuration?: number; // in days
  timeline: TimelineEvent[];
}

export interface GovernanceMetrics {
  treasuryValue: string;
  activeProposals: number;
  governanceParticipation: string;
  daoMembers: number;
  treasuryTransactions: number;
  proposalExecutionRate: string;
}
