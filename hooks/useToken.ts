"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers, JsonRpcProvider, Contract, formatUnits } from "ethers";
import { GOVERNANCE_CONTRACTS } from "@/lib/governance/contracts";

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

interface UseTokenReturn {
  votingPower: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook: useToken
 * Fetches user's voting power (SynArcToken balance) from Arc Testnet
 */
export function useToken(userAddress: string | null): UseTokenReturn {
  const [votingPower, setVotingPower] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVotingPower = useCallback(async () => {
    if (!userAddress) {
      setVotingPower(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const rpcUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network";
      const provider = new JsonRpcProvider(rpcUrl);
      const tokenAddress = GOVERNANCE_CONTRACTS.token;
      const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);

      const balance = await tokenContract.balanceOf(userAddress);
      const votingPowerValue = Number(formatUnits(balance, 18)); // Assuming 18 decimals for governance token
      setVotingPower(votingPowerValue);
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
    loading,
    error,
    refetch: fetchVotingPower
  };
}
