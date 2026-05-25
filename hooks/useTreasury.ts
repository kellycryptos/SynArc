"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers, JsonRpcProvider, Contract, formatUnits } from "ethers";
import { GOVERNANCE_CONTRACTS } from "@/lib/governance/contracts";
import { TreasuryActivity } from "@/types";

const TREASURY_ABI = [
  "function getTransactions() external view returns (tuple(string txType, address party, uint256 amount, string description, uint256 timestamp)[])",
  "function balance() external view returns (uint256)"
];

interface UseTreasuryReturn {
  balance: number;
  activities: TreasuryActivity[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook: useTreasury
 * Fetches treasury balance and transaction history from Arc Testnet
 */
export function useTreasury(): UseTreasuryReturn {
  const [balance, setBalance] = useState(0);
  const [activities, setActivities] = useState<TreasuryActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTreasuryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const rpcUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network";
      const provider = new JsonRpcProvider(rpcUrl);
      const treasuryAddress = GOVERNANCE_CONTRACTS.treasury;
      const treasuryContract = new Contract(treasuryAddress, TREASURY_ABI, provider);

      // Fetch balance
      const bal = await treasuryContract.balance();
      const balanceValue = Number(formatUnits(bal, 6));
      setBalance(balanceValue);

      // Fetch transaction history
      const rawActivities = await treasuryContract.getTransactions();
      const formattedActivities: TreasuryActivity[] = rawActivities.map((act: any, idx: number) => ({
        id: idx.toString(),
        type: act.txType as "Inflow" | "Outflow" | "Stake" | "Unstake" | "Swap",
        amount: Number(formatUnits(act.amount, 6)),
        token: "USDC",
        timestamp: new Date(Number(act.timestamp) * 1000).toISOString(),
        description: act.description,
        txHash: "0x" + Math.random().toString(16).substring(2, 10) + "..."
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
    activities,
    loading,
    error,
    refetch: fetchTreasuryData
  };
}
