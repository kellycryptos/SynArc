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

export interface CampaignAIAnalysis {
  recommendation: 'FUND' | 'REJECT' | 'REVIEW';
  legitimacyScore: number;
  impactScore: number;
  arcAlignmentScore: number;
  reasoning: string;
  riskFlags: string[];
  milestoneFeedback: string;
  verdict: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  goal: number;
  raised: number;
  contributors: number;
  state: 'Active' | 'Voting' | 'Funded' | 'Failed';
  isAgent: boolean;
  badge: 'HUMAN_CAMPAIGN' | 'AUTONOMOUS_AGENT_FUND';
  creator: string;
  recipient: string;
  deadline: string;
  milestones: Milestone[];
  votes: CampaignVotes;
  aiAnalysis: CampaignAIAnalysis | null;
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
    aiAnalysis: null,
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
      { title: 'Deploy rebalancing agent', amount: 4000, status: 'pending', description: 'Compile agent logic, initialize neural nets, and deploy target execution module.' },
      { title: 'First rebalancing cycle', amount: 3000, status: 'pending', description: 'Trigger initial on-chain portfolio yield scans and execute optimal rebalancing transactions.' },
      { title: 'Performance audit', amount: 3000, status: 'pending', description: 'Audit security parameters, compile performance yields, and output real-time dashboard logs.' },
    ],
    votes: { for: 45000, against: 5000, abstain: 2000 },
    aiAnalysis: null,
  },
  {
    id: 'camp-003',
    title: 'SynArc Mobile App Development',
    description: 'Fund development of iOS and Android governance app for SynArc DAO members.',
    category: 'Product Development',
    goal: 8000,
    raised: 8000,
    contributors: 134,
    state: 'Funded',
    isAgent: false,
    badge: 'HUMAN_CAMPAIGN',
    creator: '0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53',
    recipient: '0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53',
    deadline: '2026-05-30',
    milestones: [
      { title: 'UI/UX Design', amount: 2000, status: 'completed', description: 'Figma prototypes, asset library creation, and user flow feedback cycles.' },
      { title: 'iOS Development', amount: 3000, status: 'active', description: 'SwiftUI development, Privy wallet embedded auth hooks, and push notifications server.' },
      { title: 'Android Development', amount: 3000, status: 'pending', description: 'Kotlin UI implementation, Web3 API integrations, and Google Play Store submission.' },
    ],
    votes: { for: 78000, against: 2000, abstain: 1000 },
    aiAnalysis: null,
  },
];
