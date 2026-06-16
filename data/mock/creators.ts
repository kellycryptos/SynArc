// TODO: Replace with live on-chain data from Crowdfund Hub contracts

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
}

export const MOCK_CREATORS: Creator[] = [
  {
    id: 'kelly-music',
    name: 'Kelly Music',
    category: 'music',
    description: 'Funding my debut album on Arc. All supporters get exclusive access.',
    goal: 500,
    raised: 127.50,
    supporters: 23,
    daysLeft: 18,
    twitter: 'Kellycryptos',
    wallet: '0x1BDAC8e537c3558c4D8217B798089cE77C18422A', // Filled out full mock address
    slug: 'kelly-music',
  },
  {
    id: 'arc-art-collective',
    name: 'Arc Art Collective',
    category: 'art',
    description: 'Digital art gallery on Arc. Community governed exhibitions.',
    goal: 1000,
    raised: 340.00,
    supporters: 47,
    daysLeft: 22,
    twitter: 'ArcArtDAO',
    wallet: '0x2ABC00000000000000000000000000000000d4F5',
    slug: 'arc-art-collective',
  },
  {
    id: 'arc-builder-grants',
    name: 'Arc Builder Grants',
    category: 'builder',
    description: 'Community-governed micro-grants for Arc ecosystem developers.',
    goal: 2000,
    raised: 890.00,
    supporters: 112,
    daysLeft: 14,
    twitter: 'ArcBuilders',
    wallet: '0x3DEF00000000000000000000000000000000e6G7',
    slug: 'arc-builder-grants',
  },
  {
    id: 'web3-writer-dao',
    name: 'Web3 Writer DAO',
    category: 'writing',
    description: 'Funding independent Web3 journalism and research on Arc.',
    goal: 750,
    raised: 210.75,
    supporters: 38,
    daysLeft: 25,
    twitter: 'Web3Writers',
    wallet: '0x4GHI00000000000000000000000000000000h8J9',
    slug: 'web3-writer-dao',
  },
  {
    id: 'synarc-agent-001',
    name: 'SynArc Treasury Agent',
    category: 'ai-agent',
    description: 'Autonomous AI agent managing ecosystem grant allocations on Arc.',
    goal: 5000,
    raised: 1250.00,
    supporters: 67,
    daysLeft: 10,
    twitter: null,
    wallet: '0x5JKL00000000000000000000000000000000k0L1',
    slug: 'synarc-agent-001',
    isAgent: true,
  },
];
