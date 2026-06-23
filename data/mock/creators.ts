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
  escrowAddress?: string;
  image?: string;
}

export const MOCK_CREATORS: Creator[] = [];

