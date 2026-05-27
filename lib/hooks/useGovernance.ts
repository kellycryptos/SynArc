"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { arcTestnet } from '@/lib/chains/arc';
import { GovernorABI, ERC20ABI, GOVERNANCE_CONTRACTS, ProposalState, VoteType } from '@/lib/governance/contracts';
import { parseUnits } from 'viem';

/**
 * Hook: useProposalCount
 * Fetches the total number of proposals
 */
export function useProposalCount() {
  const { data: count, isLoading, error } = useReadContract({
    chainId: arcTestnet.id,
    address: GOVERNANCE_CONTRACTS.governor,
    abi: GovernorABI,
    functionName: 'proposalCount',
  });

  return { count: count || 0n, isLoading, error };
}

/**
 * Hook: useProposal
 * Fetches detailed proposal information by ID
 */
export function useProposal(proposalId: bigint | null) {
  const { data: proposal, isLoading, error } = useReadContract({
    chainId: arcTestnet.id,
    address: GOVERNANCE_CONTRACTS.governor,
    abi: GovernorABI,
    functionName: 'proposals',
    args: [proposalId || 0n],
    query: { enabled: proposalId !== null },
  });

  return { proposal, isLoading, error };
}

/**
 * Hook: useProposalState
 * Fetches the current state of a proposal
 */
export function useProposalState(proposalId: bigint | null) {
  const { data: stateNumber, isLoading, error } = useReadContract({
    chainId: arcTestnet.id,
    address: GOVERNANCE_CONTRACTS.governor,
    abi: GovernorABI,
    functionName: 'state',
    args: [proposalId || 0n],
    query: { enabled: proposalId !== null },
  });

  const state = stateNumber !== undefined ? (stateNumber as ProposalState) : null;
  return { state, isLoading, error };
}

/**
 * Hook: useHasVoted
 * Checks if an account has voted on a proposal
 */
export function useHasVoted(proposalId: bigint | null, account: `0x${string}` | null) {
  const { data: hasVoted, isLoading, error } = useReadContract({
    chainId: arcTestnet.id,
    address: GOVERNANCE_CONTRACTS.governor,
    abi: GovernorABI,
    functionName: 'hasVoted',
    args: [proposalId || 0n, account || '0x0000000000000000000000000000000000000000'],
    query: { enabled: proposalId !== null && account !== null },
  });

  return { hasVoted: hasVoted || false, isLoading, error };
}

/**
 * Hook: useTokenBalance
 * Fetches USDC token balance for an account
 */
export function useTokenBalance(account: `0x${string}` | null) {
  const { data: balance, isLoading, error, refetch } = useReadContract({
    chainId: arcTestnet.id,
    address: GOVERNANCE_CONTRACTS.token,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: [account || '0x0000000000000000000000000000000000000000'],
    query: { enabled: account !== null },
  });

  return { 
    balance: balance || 0n, 
    isLoading, 
    error,
    refetch,
  };
}

/**
 * Hook: useTreasuryBalance
 * Fetches treasury USDC balance
 */
export function useTreasuryBalance() {
  const { data: balance, isLoading, error, refetch } = useReadContract({
    chainId: arcTestnet.id,
    address: GOVERNANCE_CONTRACTS.treasury,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: [GOVERNANCE_CONTRACTS.treasury],
  });

  return { 
    balance: balance || 0n, 
    isLoading, 
    error,
    refetch,
  };
}

/**
 * Hook: useCastVote
 * Cast a vote on a proposal
 */
export function useCastVote() {
  const { 
    data: hash, 
    isPending, 
    error, 
    writeContract 
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const castVote = (proposalId: bigint, support: VoteType, reason?: string) => {
    if (reason) {
      writeContract({
        chainId: arcTestnet.id,
        address: GOVERNANCE_CONTRACTS.governor,
        abi: GovernorABI,
        functionName: 'castVoteWithReason',
        args: [proposalId, support, reason],
      });
    } else {
      writeContract({
        chainId: arcTestnet.id,
        address: GOVERNANCE_CONTRACTS.governor,
        abi: GovernorABI,
        functionName: 'castVote',
        args: [proposalId, support],
      });
    }
  };

  return {
    castVote,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook: useCreateProposal
 * Create a new governance proposal
 */
export function useCreateProposal() {
  const { 
    data: hash, 
    isPending, 
    error, 
    writeContract 
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createProposal = (
    targets: `0x${string}`[],
    values: bigint[],
    calldatas: `0x${string}`[],
    description: string
  ) => {
    writeContract({
      chainId: arcTestnet.id,
      address: GOVERNANCE_CONTRACTS.governor,
      abi: GovernorABI,
      functionName: 'propose',
      args: [targets, values, calldatas, description],
      gas: 600000n, // Manual override fallback prevent estimateGas lockups
    });
  };

  return {
    createProposal,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook: useExecuteProposal
 * Execute a passed proposal
 */
export function useExecuteProposal() {
  const { 
    data: hash, 
    isPending, 
    error, 
    writeContract 
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const executeProposal = (
    targets: `0x${string}`[],
    values: bigint[],
    calldatas: `0x${string}`[],
    descriptionHash: `0x${string}`
  ) => {
    writeContract({
      chainId: arcTestnet.id,
      address: GOVERNANCE_CONTRACTS.governor,
      abi: GovernorABI,
      functionName: 'execute',
      args: [targets, values, calldatas, descriptionHash],
    });
  };

  return {
    executeProposal,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook: useVotingPeriod
 * Fetches the voting period in blocks
 */
export function useVotingPeriod() {
  const { data: period, isLoading, error } = useReadContract({
    chainId: arcTestnet.id,
    address: GOVERNANCE_CONTRACTS.governor,
    abi: GovernorABI,
    functionName: 'votingPeriod',
  });

  return { period: period || 0n, isLoading, error };
}

/**
 * Hook: useQuorumNumerator
 * Fetches the quorum requirement percentage
 */
export function useQuorumNumerator() {
  const { data: quorum, isLoading, error } = useReadContract({
    chainId: arcTestnet.id,
    address: GOVERNANCE_CONTRACTS.governor,
    abi: GovernorABI,
    functionName: 'quorumNumerator',
  });

  return { quorum: quorum || 0n, isLoading, error };
}
