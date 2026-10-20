import { CONTRACTS } from "@/lib/arc-config";

export interface DAOInfo {
  id: string;
  name: string;
  description: string;
  logo: string;
  governorAddress?: string;
  treasuryAddress?: string;
  tokenAddress?: string;
  status: 'active' | 'pending' | 'inactive';
  category: string;
  members?: number;
  treasury?: number;
  verified: boolean;
  featured?: boolean;
  website?: string;
}

export const DAO_REGISTRY: DAOInfo[] = [
  {
    id: 'synarc',
    name: 'Syn DAO',
    description: 'Governance and treasury infrastructure on Arc',
    logo: '/logo.png',
    get governorAddress() {
      return CONTRACTS.governor;
    },
    get treasuryAddress() {
      return CONTRACTS.treasuryGovernance;
    },
    get tokenAddress() {
      return CONTRACTS.token;
    },
    status: 'active',
    verified: true,
    featured: true,
    category: 'Governance',
    website: 'https://syndaopro.xyz',
  },
  {
    id: 'aave',
    name: 'Aave',
    description: 'Non-custodial liquidity markets to earn interest on supplying and borrowing assets on Arc.',
    logo: '/logos/aave.png',
    status: 'active',
    verified: false,
    category: 'Borrow/Lend',
    website: 'https://aave.com',
  },
  {
    id: 'uniswap',
    name: 'Uniswap',
    description: 'Leading decentralized trading protocol for swapping USDC and stablecoins on Arc.',
    logo: '/logos/uniswap.png',
    status: 'active',
    verified: false,
    category: 'DEX',
    website: 'https://uniswap.org',
  },
  {
    id: 'maple',
    name: 'Maple Finance',
    description: 'Onchain asset manager providing institutional lending and borrowing infrastructure on Arc.',
    logo: '/logos/maple.webp',
    status: 'active',
    verified: false,
    category: 'Yield',
    website: 'https://maple.finance',
  },
  {
    id: 'chainlink',
    name: 'Chainlink',
    description: 'Decentralized oracle network providing real-world data to Arc smart contracts.',
    logo: '/logos/chainlink.png',
    status: 'active',
    verified: false,
    category: 'Infrastructure',
    website: 'https://chain.link',
  },
  {
    id: 'morpho',
    name: 'Morpho',
    description: 'Open credit network connecting lenders and borrowers to optimal DeFi opportunities on Arc.',
    logo: '/logos/morpho.png',
    status: 'active',
    verified: false,
    category: 'Borrow/Lend',
    website: 'https://morpho.org',
  },
];
