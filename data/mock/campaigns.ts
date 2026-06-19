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

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-001',
    title: 'Arc Ecosystem Developer Grant',
    description: 'Fund 3 independent developers building open-source tooling for Arc Testnet infrastructure.',
    category: 'Ecosystem Grant',
    goal: 5000,
    raised: 3200,
    contributors: 47,
    state: 'Active',
    isAgent: false,
    badge: 'HUMAN_CAMPAIGN',
    creator: '0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53',
    recipient: '0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53',
    deadline: '2026-06-15',
    milestones: [
      { title: 'Phase 1 — Design', amount: 1000, status: 'completed', description: 'System architecture, API specifications, and technical design documents.' },
      { title: 'Phase 2 — Development', amount: 2500, status: 'active', description: 'Core RPC tooling integration, test harness implementation, and developer client CLI.' },
      { title: 'Phase 3 — Launch', amount: 1500, status: 'pending', description: 'Official deployment on testnet, developer guides, and open-source documentation.' },
    ],
    votes: { for: 12400, against: 800, abstain: 200 },
    fundingSources: ['individual', 'dao_treasury'],
    proposalNumber: 12,
    escrowAddress: '0xFE0F6bF45D363d34CD5fC1781594a7471736dC18',
    sybilProtection: {
      aiScanned: true,
      reputationChecked: true,
      stakeRequired: false
    },
    twitter: 'ArcBuilders',
    aiAnalysis: {
      recommendation: 'FUND',
      scores: {
        legitimacy: 88,
        impact: 90,
        arcAlignment: 94,
        executionFeasibility: 85,
        milestoneRealism: 82,
        governanceAlignment: 89
      },
      riskFlags: [
        'Developer wallet history is relatively young, though governance participation is strong.',
        'External delivery timeline dependencies on public testnet infrastructure updates.'
      ],
      strengths: [
        'Provides essential infrastructure tools benefitting all active developers.',
        'Well-distributed milestone budget preventing upfront treasury drain.',
        'Core proposers are highly active in Arc testnet discord coordination.'
      ],
      milestoneFeedback: 'Division of capital is progressive and highly realistic. The milestone weights correctly align with implementation difficulties.',
      treasuryRisk: 'LOW',
      verdict: 'Excellent developer grant proposal with high ecosystem utility and robust milestone locks.',
      dueDiligenceNotes: 'SynArc Risk Engine has analyzed proposer history and deliverable scope. Tooling focuses on developer productivity, which accelerates Arc mainnet readiness. Feasibility is supported by pre-existing open-source git libraries.'
    }
  },
  {
    id: 'camp-002',
    title: 'Autonomous Treasury Rebalancing Agent',
    description: 'AI agent proposes and executes optimal USDC allocation across Arc DeFi protocols based on real-time yield data.',
    category: 'AI Infrastructure',
    goal: 10000,
    raised: 10000,
    contributors: 89,
    state: 'Voting',
    isAgent: true,
    badge: 'AUTONOMOUS_AGENT_FUND',
    creator: '0xAIRebalancerAgent002dE179C128b7e2898c76',
    recipient: '0xAIRebalancerAgent002dE179C128b7e2898c76',
    deadline: '2026-06-10',
    milestones: [
      { title: 'Deploy rebalancing agent', amount: 4000, status: 'active', description: 'Compile agent logic, initialize neural nets, and deploy target execution module.' },
      { title: 'First rebalancing cycle', amount: 3000, status: 'pending', description: 'Trigger initial on-chain portfolio yield scans and execute optimal rebalancing transactions.' },
      { title: 'Performance audit', amount: 3000, status: 'pending', description: 'Audit security parameters, compile performance yields, and output real-time dashboard logs.' },
    ],
    votes: { for: 45000, against: 5000, abstain: 2000 },
    agentType: 'Treasury Optimization Agent',
    executionScope: 'Yield Rebalancing & Portfolio Allocation',
    strategy: 'On-chain yield rate scans & smart routing DeFi triggers',
    fundingSources: ['individual', 'dao_treasury', 'ai_agents'],
    proposalNumber: 14,
    escrowAddress: '0xAIRebalancerEscrowVault002',
    sybilProtection: {
      aiScanned: true,
      reputationChecked: true,
      stakeRequired: true
    },
    twitter: null,
    aiAnalysis: {
      recommendation: 'FUND',
      scores: {
        legitimacy: 96,
        impact: 95,
        arcAlignment: 98,
        executionFeasibility: 92,
        milestoneRealism: 90,
        governanceAlignment: 96
      },
      riskFlags: [
        'Agent smart contracts rely on external protocol liquidity pools and yield stability.',
        'High frequency rebalancing transactions may encounter slight gas spikes.'
      ],
      strengths: [
        'Unlocks fully autonomous, data-driven USDC treasury yields on Arc DeFi.',
        'Fully open-source agent strategy verifiable on-chain.',
        'Staked deposit holds active collateral in governor contracts.'
      ],
      milestoneFeedback: 'Milestones are logical. Capital release is progressive, releasing only after real cycle verification.',
      treasuryRisk: 'LOW',
      verdict: 'Extremely strong agentic candidate representing the standard optimization of on-chain capital coordination.',
      dueDiligenceNotes: 'Audited neural weights and strategy triggers show zero malicious parameters. Execution logic includes hardcoded slippage safety triggers and community multisig override parameters.'
    }
  },
  {
    id: 'camp-003',
    title: 'SynArc Mobile App Development',
    description: 'Fund development of iOS and Android governance app for SynArc DAO members.',
    category: 'Product Development',
    goal: 8000,
    raised: 8000,
    contributors: 134,
    state: 'Completed',
    isAgent: false,
    badge: 'HUMAN_CAMPAIGN',
    creator: '0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53',
    recipient: '0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53',
    deadline: '2026-05-30',
    milestones: [
      { title: 'UI/UX Design', amount: 2000, status: 'completed', description: 'Figma prototypes, asset library creation, and user flow feedback cycles.' },
      { title: 'iOS Development', amount: 3000, status: 'completed', description: 'SwiftUI development, Privy wallet embedded auth hooks, and push notifications server.' },
      { title: 'Android Development', amount: 3000, status: 'completed', description: 'Kotlin UI implementation, Web3 API integrations, and Google Play Store submission.' },
    ],
    votes: { for: 78000, against: 2000, abstain: 1000 },
    fundingSources: ['individual', 'dao_treasury'],
    proposalNumber: 15,
    escrowAddress: '0xSynArcMobileEscrowVault003',
    sybilProtection: {
      aiScanned: true,
      reputationChecked: false,
      stakeRequired: false
    },
    twitter: 'SynArcDAO',
    aiAnalysis: {
      recommendation: 'FUND',
      scores: {
        legitimacy: 92,
        impact: 94,
        arcAlignment: 90,
        executionFeasibility: 88,
        milestoneRealism: 86,
        governanceAlignment: 94
      },
      riskFlags: [],
      strengths: [
        'Boosts community voting engagement by 200% via mobile push alerts.',
        'Includes biometrics verification for gasless embedded vote signing.'
      ],
      milestoneFeedback: 'All milestones have been fully vetted, delivered, and released by governance.',
      treasuryRisk: 'LOW',
      verdict: 'Highly successful product delivery that significantly expands DAO user engagement.',
      dueDiligenceNotes: 'The iOS and Android branches have been merged, audited, and published. Escrow has successfully finished disbursements.'
    }
  },
  {
    id: 'synarc',
    title: 'SynArc',
    description: 'Decentralized platform aligning autonomous AI agents and creator economies on the Arc Network.',
    category: 'Builder',
    goal: 5000,
    raised: 3200,
    contributors: 47,
    state: 'Active',
    isAgent: false,
    badge: 'HUMAN_CAMPAIGN',
    creator: '0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53',
    recipient: '0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53',
    deadline: '2026-07-20',
    milestones: [
      { title: 'Milestone 1', amount: 5000, status: 'active', description: 'Initial launch of the SynArc Creator Economy dashboard.' }
    ],
    votes: { for: 15000, against: 1000, abstain: 500 },
    fundingSources: ['individual', 'dao_treasury'],
    proposalNumber: 16,
    escrowAddress: '0xFE0F6bF45D363d34CD5fC1781594a7471736dC18',
    sybilProtection: {
      aiScanned: true,
      reputationChecked: true,
      stakeRequired: false
    },
    twitter: 'SynArcDAO',
    aiAnalysis: {
      recommendation: 'FUND',
      scores: {
        legitimacy: 95,
        impact: 96,
        arcAlignment: 98,
        executionFeasibility: 92,
        milestoneRealism: 90,
        governanceAlignment: 95
      },
      riskFlags: [],
      strengths: ['Core platform infrastructure', 'High alignment with Arc Network scaling vision'],
      milestoneFeedback: 'Realistic and well-defined milestone requirements.',
      treasuryRisk: 'LOW',
      verdict: 'Highly recommended for funding as it forms the bedrock of the SynArc ecosystem.',
      dueDiligenceNotes: 'SynArc Risk Engine verified the repository and deployer wallet address.'
    }
  }
];
