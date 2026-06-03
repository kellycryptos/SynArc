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

      // Fetch transaction history
      let rawActivities: any[] = [];
      try {
        rawActivities = await treasuryContract.getTransactions();
      } catch (e) {
        console.warn("Failed to fetch raw on-chain treasury transactions:", e);
      }

      const formattedActivities: TreasuryActivity[] = rawActivities.map((act: any, idx: number) => ({
        id: idx.toString(),
        type: act.txType as "Inflow" | "Outflow",
        amount: Number(formatUnits(act.amount, 6)),
        token: act.tokenSymbol || "USDC",
        timestamp: new Date(Number(act.timestamp) * 1000).toISOString(),
        description: act.description,
        txHash: "0x" + Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")
      }));

      // Merge simulated activities from localStorage
      let simulatedActivities: TreasuryActivity[] = [];
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(`synarc_simulated_activities_${treasuryAddress}`);
          if (stored) {
            simulatedActivities = JSON.parse(stored);
          }
        } catch (err) {
          console.error("Failed to parse simulated activities from localStorage", err);
        }
      }
      const combinedActivities = [...simulatedActivities, ...formattedActivities];

      // Sum up simulated activities to adjust balances
      let simulatedUSDC = 0;
      let simulatedEURC = 0;
      simulatedActivities.forEach(act => {
        const val = act.amount;
        if (act.type === "Inflow") {
          if (act.token === "USDC") simulatedUSDC += val;
          else if (act.token === "EURC") simulatedEURC += val;
        } else {
          if (act.token === "USDC") simulatedUSDC -= val;
          else if (act.token === "EURC") simulatedEURC -= val;
        }
      });

      const finalUSDC = usdcVal + simulatedUSDC;
      const finalEURC = eurcVal + simulatedEURC;

      setUsdcBalance(finalUSDC);
      setEurcBalance(finalEURC);

      const combinedVal = finalUSDC + (finalEURC * 1.08);
      setBalance(combinedVal);

      setActivities(combinedActivities.reverse());
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
