"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers, Contract, formatUnits } from "ethers";
import { GOVERNANCE_CONTRACTS } from "@/lib/governance/contracts";
import { getResilientProvider } from "@/lib/rpc/config";

const SARC_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function getVotes(address account) external view returns (uint256)",
  "function delegate(address delegatee) external",
  "function decimals() external view returns (uint8)",
];

interface UseTokenReturn {
  /** Actual delegated voting power (what counts on-chain) */
  votingPower: number;
  /** Raw sARC balance (may differ from votingPower if not delegated) */
  sarcBalance: number;
  /** True when the user has sARC but hasn't self-delegated */
  needsDelegation: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook: useToken
 * Fetches user's actual on-chain voting power (getVotes) and raw sARC balance.
 * ERC20Votes requires tokens to be delegated (even to self) before they count
 * as voting power in getPastVotes snapshots used by the Governor.
 */
export function useToken(userAddress: string | null): UseTokenReturn {
  const [votingPower, setVotingPower] = useState(0);
  const [sarcBalance, setSarcBalance] = useState(0);
  const [needsDelegation, setNeedsDelegation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVotingPower = useCallback(async () => {
    if (!userAddress) {
      setVotingPower(0);
      setSarcBalance(0);
      setNeedsDelegation(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const provider = await getResilientProvider();
      const tokenAddress = GOVERNANCE_CONTRACTS.token;
      const tokenContract = new Contract(tokenAddress, SARC_ABI, provider);

      // Fetch both balance and delegated votes in parallel
      const [balance, votes] = await Promise.all([
        tokenContract.balanceOf(userAddress),
        tokenContract.getVotes(userAddress),
      ]);

      const balanceNum = Number(formatUnits(balance, 18));
      const votesNum = Number(formatUnits(votes, 18));

      setSarcBalance(balanceNum);
      setVotingPower(votesNum);
      // User needs to delegate if they have sARC but voting power is zero (or less than balance)
      setNeedsDelegation(balanceNum > 0 && votesNum === 0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch voting power");
      setError(error);
      console.error("Error fetching voting power:", error);
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchVotingPower();
  }, [fetchVotingPower]);

  return {
    votingPower,
    sarcBalance,
    needsDelegation,
    loading,
    error,
    refetch: fetchVotingPower,
  };
}
