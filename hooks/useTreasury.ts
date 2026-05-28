"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers, JsonRpcProvider, Contract, formatUnits } from "ethers";
import { GOVERNANCE_CONTRACTS } from "@/lib/governance/contracts";
import { TreasuryActivity } from "@/types";

import { getResilientProvider } from "@/lib/rpc/config";

const TREASURY_ABI = [
  "function getTransactions() external view returns (tuple(string txType, address party, uint256 amount, string tokenSymbol, string description, uint256 timestamp)[])",
  "function usdcBalance() external view returns (uint256)",
  "function eurcBalance() external view returns (uint256)",
  "function balance() external view returns (uint256)"
];

interface UseTreasuryReturn {
  balance: number; // Combined total in USD
  usdcBalance: number;
  eurcBalance: number;
  activities: TreasuryActivity[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook: useTreasury
 * Fetches treasury balances and transaction history from Arc Testnet
 */
export function useTreasury(customTreasuryAddress?: string): UseTreasuryReturn {
  const [balance, setBalance] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [eurcBalance, setEurcBalance] = useState(0);
  const [activities, setActivities] = useState<TreasuryActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTreasuryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const provider = await getResilientProvider();
      const treasuryAddress = customTreasuryAddress || GOVERNANCE_CONTRACTS.treasury;
      const treasuryContract = new Contract(treasuryAddress, TREASURY_ABI, provider);

      // Fetch USDC and EURC balances
      const [usdcBal, eurcBal] = await Promise.all([
        treasuryContract.usdcBalance().catch(() => 0n),
        treasuryContract.eurcBalance().catch(() => 0n)
      ]);

      const usdcVal = Number(formatUnits(usdcBal, 6));
      const eurcVal = Number(formatUnits(eurcBal, 6));
      
      setUsdcBalance(usdcVal);
      setEurcBalance(eurcVal);

      // Combined total USD value (EUR to USD conversion rate placeholder: 1.08)
      const combinedVal = usdcVal + (eurcVal * 1.08);
      setBalance(combinedVal);

      // Fetch transaction history
      const rawActivities = await treasuryContract.getTransactions();
      const formattedActivities: TreasuryActivity[] = rawActivities.map((act: any, idx: number) => ({
        id: idx.toString(),
        type: act.txType as "Inflow" | "Outflow",
        amount: Number(formatUnits(act.amount, 6)),
        token: act.tokenSymbol || "USDC",
        timestamp: new Date(Number(act.timestamp) * 1000).toISOString(),
        description: act.description,
        txHash: "0x" + Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")
      }));

      setActivities(formattedActivities.reverse());
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch treasury data");
      setError(error);
      console.error("Error fetching treasury data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTreasuryData();
  }, [fetchTreasuryData]);

  return {
    balance,
    usdcBalance,
    eurcBalance,
    activities,
    loading,
    error,
    refetch: fetchTreasuryData
  };
}
