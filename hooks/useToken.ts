"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers, Contract, formatUnits } from "ethers";
import { GOVERNANCE_CONTRACTS } from "@/lib/governance/contracts";
import { getCachedProvider } from "@/lib/rpc/provider-cache";

const SARC_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function getVotes(address account) external view returns (uint256)",
  "function delegate(address delegatee) external",
  "function decimals() external view returns (uint8)",
];

const USDC_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
];

const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

export interface UseTokenReturn {
  /** Delegated sARC voting weight — what the Governor reads on-chain */
  votingPower: number;
  /** Raw sARC token balance (may differ from votingPower if not delegated) */
  sarcBalance: number;
  /** USDC balance fetched from Arc (6 decimals, displayed as whole units) */
  usdcBalance: number;
  /**
   * Combined display power for UI only.
   * NOTE: On-chain vote weight is sARC (votingPower) only.
   * USDC is shown for transparency but does NOT count toward the Governor vote.
   */
  totalDisplayPower: number;
  /** True when the user has sARC but hasn't self-delegated yet */
  needsDelegation: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook: useToken
 *
 * Fetches:
 *  - sARC delegated voting power (getVotes)  — what counts on-chain
 *  - sARC raw balance (balanceOf)
 *  - USDC balance                             — displayed as additional context
 *
 * totalDisplayPower = votingPower (sARC) + usdcBalance
 * This is shown in the UI to give users a full picture of their holdings.
 * The Governor contract only uses sARC (getPastVotes) for on-chain vote weight.
 */
export function useToken(userAddress: string | null): UseTokenReturn {
  const [votingPower, setVotingPower] = useState(0);
  const [sarcBalance, setSarcBalance] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [needsDelegation, setNeedsDelegation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!userAddress) {
      setVotingPower(0);
      setSarcBalance(0);
      setUsdcBalance(0);
      setNeedsDelegation(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const provider = await getCachedProvider();
      const tokenAddress = GOVERNANCE_CONTRACTS.token;
      const sarcContract = new Contract(tokenAddress, SARC_ABI, provider);
      const usdcContract = new Contract(USDC_ADDRESS, USDC_ABI, provider);

      // Fetch sARC balance, sARC votes, and USDC balance in parallel
      const [sarcBalRaw, sarcVotesRaw, usdcBalRaw] = await Promise.all([
        sarcContract.balanceOf(userAddress),
        sarcContract.getVotes(userAddress),
        usdcContract.balanceOf(userAddress).catch(() => 0n), // USDC fetch is non-critical
      ]);

      const sarcBal  = Number(formatUnits(sarcBalRaw, 18));
      const sarcVotes = Number(formatUnits(sarcVotesRaw, 18));
      const usdcBal  = typeof usdcBalRaw === "bigint"
        ? Number(formatUnits(usdcBalRaw, 6))
        : 0;

      setSarcBalance(sarcBal);
      setVotingPower(sarcVotes);
      setUsdcBalance(usdcBal);
      // Needs delegation: has sARC but no delegated votes
      setNeedsDelegation(sarcBal > 0 && sarcVotes === 0);
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Failed to fetch token balances");
      setError(e);
      console.error("useToken error:", e);
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchBalances();

    // Refresh every 60 seconds and only if visible
    const interval = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        fetchBalances();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  const totalDisplayPower = votingPower + usdcBalance;

  return {
    votingPower,
    sarcBalance,
    usdcBalance,
    totalDisplayPower,
    needsDelegation,
    loading,
    error,
    refetch: fetchBalances,
  };
}
