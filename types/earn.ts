export type ArcEarnChain = "Arc" | "Arc_Testnet";

export interface VaultManager {
  name?: string;
  address?: string;
  type?: string;
}

export interface VaultLiquidityProfile {
  totalDeposits?: string;
  available?: string;
  totalSupply?: string;
  status?: string;
}

export interface VaultFee {
  performance?: number | null;
  management?: number | null;
}

export interface EarnVault {
  vaultAddress: string;
  chain: ArcEarnChain;
  name: string;
  protocol: string;
  asset: string;
  assetAddress: string;
  currentApy: number;
  nativeApy?: number;
  vaultFee?: number;
  status: "active" | "low_liquidity" | string;
  circleGuarded: boolean;
  totalDeposits: string;
  liquidity: string;
  manager?: VaultManager | null;
  fee?: VaultFee;
  liquidityProfile?: VaultLiquidityProfile;
}

export interface DepositQuote {
  vaultAddress: string;
  vaultName?: string;
  deposit?: { symbol: string; amount: string };
  expectedShares?: { amount: string; symbol?: string };
  sharePrice?: string;
  currentApy?: number;
  fees?: Array<{ type: string; amount: string; symbol: string }>;
  gasFees?: Array<{ type: string; fee?: string | null }>;
}

export interface WithdrawalQuote {
  vaultAddress: string;
  vaultName?: string;
  withdrawal?: { symbol: string; amount: string };
  sharesToRedeem?: { amount: string; symbol?: string };
  sharePrice?: string;
  maxWithdrawable?: { amount: string; symbol?: string };
  fees?: Array<{ type: string; amount: string; symbol: string }>;
  gasFees?: Array<{ type: string; fee?: string | null }>;
}

export interface EarnPosition {
  wallet: string;
  chain: string;
  vaultAddress: string;
  vaultName?: string;
  asset: string;
  currentBalance: string;
  currentApy: number;
  shares: string;
  pnl?: {
    status: "available" | "pending" | "unavailable";
    principalDeposited?: string;
    totalYieldEarned?: string;
    reason?: string;
  };
  accruedRewards?: readonly any[] | any[];
}
