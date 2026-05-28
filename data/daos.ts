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
    name: 'SynArc DAO',
    description: 'Governance infrastructure for the Arc ecosystem',
    logo: '/logo.png',
    governorAddress: '0x17D9d585CBB1AF6aa4a3C787116f7ba59651B702',
    treasuryAddress: '0x8Ab21363cB0319548B051f129e477393908be7c1',
    tokenAddress: '0x637cA7788aBC956832F389A7BB895D5249FE757B',
    status: 'active',
    verified: true,
    featured: true,
    category: 'Governance',
    members: 0, // live
    treasury: 0, // live
    website: 'https://synarcdao.xyz',
  },
  {
    id: 'aave',
    name: 'Aave',
    description: 'Non-custodial liquidity markets to earn interest on supplying and borrowing assets on Arc.',
    logo: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png',
    status: 'active',
    verified: true,
    category: 'Borrow/Lend',
    members: 12400,
    treasury: 4200000,
    website: 'https://aave.com',
  },
  {
    id: 'uniswap',
    name: 'Uniswap',
    description: 'Leading decentralized trading protocol for swapping USDC and stablecoins on Arc.',
    logo: 'https://cdn.prod.website-files.com/68af181813eec5493447a1ae/68fd155a120921d12e223675_crossmint-mark-green.svg',
    status: 'active',
    verified: true,
    category: 'DEX',
    members: 89000,
    treasury: 12000000,
    website: 'https://uniswap.org',
  },
  {
    id: 'maple',
    name: 'Maple Finance',
    description: 'Onchain asset manager providing institutional lending and borrowing infrastructure on Arc.',
    logo: 'https://cdn.prod.website-files.com/68af181813eec5493447a1ae/6900d56d012d389e7faa891a_%24SYRUP.svg',
    status: 'active',
    verified: true,
    category: 'Yield',
    members: 3200,
    treasury: 8500000,
    website: 'https://maple.finance',
  },
  {
    id: 'chainlink',
    name: 'Chainlink',
    description: 'Decentralized oracle network providing real-world data to Arc smart contracts.',
    logo: 'https://cdn.prod.website-files.com/68af181813eec5493447a1ae/68fffb074f79406a3b36d2ca_Chainlink_Logo_Blue.svg.png',
    status: 'active',
    verified: true,
    category: 'Infrastructure',
    members: 45000,
    treasury: 25000000,
    website: 'https://chain.link',
  },
  {
    id: 'morpho',
    name: 'Morpho',
    description: 'Open credit network connecting lenders and borrowers to optimal DeFi opportunities on Arc.',
    logo: 'https://cdn.prod.website-files.com/68af181813eec5493447a1ae/6900dd4d5ab8afd5b17ea7e3_Morpho-with-background-logo.svg',
    status: 'active',
    verified: true,
    category: 'Borrow/Lend',
    members: 8700,
    treasury: 6200000,
    website: 'https://morpho.org',
  },
];
