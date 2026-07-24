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
    description: 'Governance infrastructure and autonomous treasury for the Arc ecosystem.',
    logo: '/logo.png',
    governorAddress: process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS || '0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e',
    treasuryAddress: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '0xFE0F6bF45D363d34CD5fC1781594a7471736dC18',
    tokenAddress: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e',
    status: 'active',
    verified: true,
    featured: true,
    category: 'Governance',
    members: 0,
    treasury: 0,
    website: 'https://synarcdao.xyz',
  },
];
