"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ethers, BrowserProvider, Contract, formatUnits } from "ethers";
import { GOVERNANCE_CONTRACTS, GovernorABI } from "@/lib/governance/contracts";
import { Proposal } from "@/types/governance";
import { useWallets as usePrivyWallets } from "@privy-io/react-auth";
import { getResilientProvider } from "@/lib/rpc/config";
import { enforceChain, selectActiveWallet } from "@/lib/tx-helper";
import { useAuth } from "@/hooks/auth/useAuth";

// Module-level cache so navigating away and back doesn't re-fetch
const PROPOSALS_CACHE: { data: Proposal[] | null; ts: number } = { data: null, ts: 0 };
const CACHE_TTL_MS = 120_000; // 2 minutes

interface UseGovernorReturn {
  proposals: Proposal[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  castVote: (proposalId: number, support: 0 | 1 | 2, reason?: string) => Promise<string>;
  createProposal: (title: string, description: string, category: string, duration: number, treasuryImpact: number, target: string) => Promise<string>;
}

/**
 * Hook: useGovernor
 * Fetches proposals and handles voting on Arc Testnet Governor contract
 */
export function useGovernor(): UseGovernorReturn {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Safe: Circle wallet does not register with Privy wallets list
  const { wallets: privyWallets } = usePrivyWallets();
  const wallets = privyWallets ?? [];
  const { walletAddress } = useAuth();

  const fetchProposals = useCallback(async (force = false) => {
    const now = Date.now();
    // Serve from cache if fresh and not forced
    if (!force && PROPOSALS_CACHE.data && now - PROPOSALS_CACHE.ts < CACHE_TTL_MS) {
      setProposals(PROPOSALS_CACHE.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const provider = await getResilientProvider();
      const governorAddress = GOVERNANCE_CONTRACTS.governor;
      const governorContract = new Contract(governorAddress, GovernorABI, provider);

      const count = await governorContract.proposalCount();
      const totalCount = Number(count);

      // Fetch all proposals in parallel — avoids N sequential round-trips
      const indices = Array.from({ length: totalCount }, (_, i) => i + 1);
      const settled = await Promise.allSettled(
        indices.map(async (i) => {
          const [p, proposalStateNum] = await Promise.all([
            governorContract.getProposal(i),
            governorContract.state(i),
          ]);
          return { p, proposalStateNum };
        })
      );

      const loadedProposals: Proposal[] = [];

      for (const result of settled) {
        if (result.status === 'rejected') {
          console.error("Failed to load proposal:", result.reason);
          continue;
        }
        const { p, proposalStateNum } = result.value;

        // Vote weights are sARC governance token amounts — 18 decimals
        const forV = Number(formatUnits(p.forVotes, 18));
        const againstV = Number(formatUnits(p.againstVotes, 18));
        const abstainV = Number(formatUnits(p.abstainVotes, 18));
        const total = forV + againstV + abstainV;
        const participation = total > 0 ? (total / 15_000_000) * 100 : 0;

        const statusMap: Record<number, Proposal["status"]> = {
          0: "Pending",
          1: "Active",
          2: "Executed", // Canceled maps to Executed for UI
          3: "Defeated",
          4: "Executed",
          5: "Executed",
          6: "Executed",
          7: "Executed"
        };
        const status = statusMap[Number(proposalStateNum)] || "Active";

        const now2 = Math.floor(Date.now() / 1000);
        const timeLeft = Math.max(0, Number(p.endTime) - now2);
        const daysLeft = Math.ceil(timeLeft / 86400);

        loadedProposals.push({
          id: `SIP-${p.id}`,
          title: p.title,
          description: p.description,
          proposer: p.proposer,
          category: p.category,
          status,
          forVotes: forV,
          againstVotes: againstV,
          abstainVotes: abstainV,
          totalVotes: total,
          participationPercentage: parseFloat(participation.toFixed(1)),
          treasuryImpactValue: Number(formatUnits(p.treasuryImpactValue, 6)),
          treasuryImpact: p.treasuryImpactValue > 0n ? `-${Number(formatUnits(p.treasuryImpactValue, 6)).toLocaleString()} USDC` : "None",
          timeRemaining: status === "Active" ? `${daysLeft} days left` : "Ended",
          createdAt: new Date(Number(p.startTime) * 1000).toISOString(),
          votingStarts: new Date(Number(p.startTime) * 1000).toISOString(),
          votingEnds: new Date(Number(p.endTime) * 1000).toISOString(),
          executionTarget: p.executionTarget,
          votingDuration: Number(p.votingDuration) / 86400,
          timeline: [
            { title: "Proposal Created", timestamp: new Date(Number(p.startTime) * 1000).toISOString(), status: "Proposed" }
          ]
        });
      }

      const reversed = loadedProposals.reverse();
      // Store in cache
      PROPOSALS_CACHE.data = reversed;
      PROPOSALS_CACHE.ts = Date.now();

      setProposals(reversed);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch proposals");
      setError(error);
      console.error("Error fetching proposals:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const castVote = useCallback(async (proposalId: number, support: 0 | 1 | 2, reason?: string): Promise<string> => {
    try {
      if (!wallets || wallets.length === 0) {
        throw new Error("No wallet connected");
      }

      const activeWallet = selectActiveWallet(wallets, walletAddress);
      if (!activeWallet) {
        throw new Error("Active wallet not found");
      }

      // Force Arc Testnet before transaction with robust switching
      const ethereumProvider = await enforceChain(activeWallet, 5042002);
      const provider = new BrowserProvider(ethereumProvider, {
        chainId: 5042002,
        name: "Arc Testnet"
      });
      const signer = await provider.getSigner(activeWallet.address);

      const governorAddress = GOVERNANCE_CONTRACTS.governor;
      const governorContract = new Contract(governorAddress, GovernorABI, signer);

      let tx;
      if (reason) {
        tx = await governorContract.castVoteWithReason(proposalId, support, reason, {
          gasLimit: 150000n,
          maxFeePerGas: 30000000n,
          maxPriorityFeePerGas: 2000000n
        });
      } else {
        tx = await governorContract.castVote(proposalId, support, {
          gasLimit: 150000n,
          maxFeePerGas: 30000000n,
          maxPriorityFeePerGas: 2000000n
        });
      }

      const receipt = await tx.wait();
      
      // Refetch proposals after vote
      await fetchProposals();

      return receipt?.hash || "";
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to cast vote");
      throw error;
    }
  }, [wallets, fetchProposals]);

  const createProposal = useCallback(async (
    title: string,
    description: string,
    category: string,
    duration: number,
    treasuryImpact: number,
    target: string
  ): Promise<string> => {
    try {
      if (!wallets || wallets.length === 0) {
        throw new Error("No wallet connected");
      }

      const activeWallet = selectActiveWallet(wallets, walletAddress);
      if (!activeWallet) {
        throw new Error("Active wallet not found");
      }

      // Force Arc Testnet before transaction with robust switching
      const ethereumProvider = await enforceChain(activeWallet, 5042002);
      const provider = new BrowserProvider(ethereumProvider, {
        chainId: 5042002,
        name: "Arc Testnet"
      });
      const signer = await provider.getSigner(activeWallet.address);

      const governorAddress = GOVERNANCE_CONTRACTS.governor;
      const governorContract = new Contract(governorAddress, GovernorABI, signer);

      const votingDurationSecs = BigInt(duration) * 86400n;
      const absoluteImpactValue = BigInt(Math.abs(treasuryImpact)) * 1000000n;
      const targetAddress = target && target.startsWith('0x') ? target : ethers.ZeroAddress;

      const tx = await governorContract.propose(
        title.trim(),
        description.trim(),
        category.trim(),
        votingDurationSecs,
        absoluteImpactValue,
        targetAddress,
        { 
          gasLimit: 550000n, 
          maxFeePerGas: 30000000n, 
          maxPriorityFeePerGas: 2000000n 
        }
      );

      const receipt = await tx.wait();

      // Refetch proposals after creation
      await fetchProposals();

      return receipt?.hash || "";
    } catch (err: any) {
      const message = err?.reason || err?.message || 'Failed to create proposal';
      throw new Error(message);
    }
  }, [wallets, fetchProposals]);

  return {
    proposals,
    loading,
    error,
    refetch: fetchProposals,
    castVote,
    createProposal
  };
}
