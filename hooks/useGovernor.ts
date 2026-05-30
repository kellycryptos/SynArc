"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers, BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";
import { GOVERNANCE_CONTRACTS, GovernorABI } from "@/lib/governance/contracts";
import { Proposal } from "@/types/governance";
import { useWallets } from "@privy-io/react-auth";
import { getResilientProvider } from "@/lib/rpc/config";

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
  const { wallets } = useWallets();

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const provider = await getResilientProvider();
      const governorAddress = GOVERNANCE_CONTRACTS.governor;
      const governorContract = new Contract(governorAddress, GovernorABI, provider);

      const count = await governorContract.proposalCount();
      const loadedProposals: Proposal[] = [];

      for (let i = 1; i <= Number(count); i++) {
        const p = await governorContract.getProposal(i);
        const proposalStateNum = await governorContract.state(i);

        const forV = Number(formatUnits(p.forVotes, 6));
        const againstV = Number(formatUnits(p.againstVotes, 6));
        const abstainV = Number(formatUnits(p.abstainVotes, 6));
        const total = forV + againstV + abstainV;
        const participation = total > 0 ? (total / 15000000) * 100 : 0;

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

        const now = Math.floor(Date.now() / 1000);
        const timeLeft = Math.max(0, Number(p.endTime) - now);
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

      setProposals(loadedProposals.reverse());
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

      const activeWallet = wallets && wallets.length > 0 ? wallets[0] : null;
      if (!activeWallet) {
        throw new Error("Active wallet not found");
      }

      // Force Arc Testnet before transaction
      const currentChainId = parseInt(activeWallet.chainId.replace("eip155:", ""));
      if (currentChainId !== 5042002) {
        await activeWallet.switchChain(5042002);
      }

      const ethereumProvider = await activeWallet.getEthereumProvider();
      const provider = new BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();

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

      const activeWallet = wallets && wallets.length > 0 ? wallets[0] : null;
      if (!activeWallet) {
        throw new Error("Active wallet not found");
      }

      // Force Arc Testnet before transaction
      const currentChainId = parseInt(activeWallet.chainId.replace("eip155:", ""));
      if (currentChainId !== 5042002) {
        await activeWallet.switchChain(5042002);
      }

      const ethereumProvider = await activeWallet.getEthereumProvider();
      const provider = new BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();

      const governorAddress = GOVERNANCE_CONTRACTS.governor;
      const governorContract = new Contract(governorAddress, GovernorABI, signer);

      const targets = [ethers.ZeroAddress]; // placeholder target
      const values = [0n];                   // no ETH value
      const calldatas = ['0x'];              // empty calldata
      const optimizedDescription = `${title.trim()}\n\n${description.trim()}\n\nCategory: ${category.trim()}`;

      const tx = await governorContract.propose(
        targets,
        values,
        calldatas,
        optimizedDescription,
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
