export type ProposalStatus = "Active" | "Pending" | "Executed" | "Defeated";

export interface Proposal {
  id: string;
  title: string;
  category: string;
  status: ProposalStatus;
  forVotes: number;
  againstVotes: number;
  totalVotes: number;
  participationPercentage: number;
  treasuryImpact: string;
  timeRemaining: string;
  createdAt: string;
}

export interface GovernanceMetrics {
  treasuryValue: string;
  activeProposals: number;
  governanceParticipation: string;
  daoMembers: number;
  treasuryTransactions: number;
  proposalExecutionRate: string;
}
