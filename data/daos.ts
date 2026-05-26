export interface DAOInfo {
  id: string;
  name: string;
  description: string;
  logo: string;
  governorAddress: string;
  treasuryAddress: string;
  tokenAddress: string;
  status: 'active' | 'pending' | 'inactive';
  category: string;
  members?: number;
  treasury?: number;
}

export const DAO_REGISTRY: DAOInfo[] = [
  {
    id: 'synarc',
    name: 'SynArc DAO',
    description: 'Governance infrastructure for the Arc ecosystem',
    logo: '/logo.png',
    governorAddress: '0x17D9d585CBB1AF6aa4a3C787116f7ba59651B702',
    treasuryAddress: '0x8Ab21363cB0319548B051f129e477393908be7c1',
    tokenAddress: '0x637cA7788aBC956832F389A7BB895D5249FE757B',
    status: 'active',
    category: 'Infrastructure',
    members: 12450,
    treasury: 2450000,
  },
  {
    id: 'canteen',
    name: 'Canteen DAO',
    description: 'Decentralized liquidity and rewards layer for Arc dApps',
    logo: '/canteen-logo.png',
    governorAddress: '0x17D9d585CBB1AF6aa4a3C787116f7ba59651B702', // Fallback to SynArc contracts for high-fidelity testnet mock interaction
    treasuryAddress: '0x8Ab21363cB0319548B051f129e477393908be7c1',
    tokenAddress: '0x637cA7788aBC956832F389A7BB895D5249FE757B',
    status: 'active',
    category: 'DeFi',
    members: 512,
    treasury: 750000,
  },
  {
    id: 'arclabs',
    name: 'ArcLabs DAO',
    description: 'Incubating and funding early-stage AI agent builders on Arc',
    logo: '/arclabs-logo.png',
    governorAddress: '0x17D9d585CBB1AF6aa4a3C787116f7ba59651B702', // Fallback to SynArc contracts for high-fidelity testnet mock interaction
    treasuryAddress: '0x8Ab21363cB0319548B051f129e477393908be7c1',
    tokenAddress: '0x637cA7788aBC956832F389A7BB895D5249FE757B',
    status: 'active',
    category: 'Ecosystem',
    members: 245,
    treasury: 1200000,
  }
];
