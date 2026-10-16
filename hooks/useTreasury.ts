"use client";

import { useTreasuryBalances } from "./useTreasuryBalances";
import { TreasuryActivity } from "@/types";

interface UseTreasuryReturn {
  balance: number; // Combined total in USD
  usdcBalance: number;
  eurcBalance: number;
  cirBtcBalance: number;
  activities: TreasuryActivity[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTreasury(customTreasuryAddress?: string): UseTreasuryReturn {
  const { balance, usdcBalance, eurcBalance, cirBtcBalance, activities, loading, error, refetch } = useTreasuryBalances(customTreasuryAddress);
  
  return {
    balance,
    usdcBalance,
    eurcBalance,
    cirBtcBalance,
    activities,
    loading,
    error: error ? new Error(error) : null,
    refetch
  };
}
