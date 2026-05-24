/**
 * Governance Utilities
 * 
 * Helper functions for governance operations and calculations
 */

import { keccak256, toBytes } from 'viem';
import { ProposalState, VoteType, GovernorABI } from '@/lib/governance/contracts';

/**
 * Calculate proposal description hash
 * Used for proposal execution
 */
export function getDescriptionHash(description: string): `0x${string}` {
  return keccak256(toBytes(description));
}

/**
 * Encode function call for proposal
 * Converts function call to bytes for proposal creation
 */
export function encodeFunctionCall(
  target: `0x${string}`,
  functionSignature: string,
  params: string[]
): `0x${string}` {
  // Simple encoding - for production, use viem's encodeFunctionData
  const functionSelector = keccak256(toBytes(functionSignature)).slice(0, 10);
  let encodedParams = '';
  
  // This is a placeholder - proper implementation requires ABI encoding
  return (functionSelector + encodedParams) as `0x${string}`;
}

/**
 * Calculate voting power percentage
 */
export function calculateVotingPowerPercentage(
  votes: bigint,
  totalVotes: bigint
): number {
  if (totalVotes === 0n) return 0;
  return Number((votes * BigInt(100)) / totalVotes);
}

/**
 * Determine proposal outcome
 * Returns whether proposal passed based on vote counts
 */
export function determineProposalOutcome(
  forVotes: bigint,
  againstVotes: bigint,
  quorumThreshold: bigint
): {
  passed: boolean;
  reason: string;
} {
  const totalVotes = forVotes + againstVotes;
  
  if (totalVotes < quorumThreshold) {
    return {
      passed: false,
      reason: 'Quorum not reached',
    };
  }
  
  if (forVotes > againstVotes) {
    return {
      passed: true,
      reason: 'Proposal passed',
    };
  }
  
  return {
    passed: false,
    reason: 'Proposal rejected',
  };
}

/**
 * Format proposal state for display
 */
export function getProposalStateDisplay(state: ProposalState): {
  label: string;
  color: string;
  icon: string;
} {
  const displays: Record<ProposalState, { label: string; color: string; icon: string }> = {
    [ProposalState.Pending]: {
      label: 'Pending',
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
      icon: '⏳',
    },
    [ProposalState.Active]: {
      label: 'Active',
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
      icon: '🔵',
    },
    [ProposalState.Canceled]: {
      label: 'Canceled',
      color: 'bg-red-500/20 text-red-400 border-red-500/20',
      icon: '❌',
    },
    [ProposalState.Defeated]: {
      label: 'Defeated',
      color: 'bg-red-500/20 text-red-400 border-red-500/20',
      icon: '👎',
    },
    [ProposalState.Succeeded]: {
      label: 'Succeeded',
      color: 'bg-green-500/20 text-green-400 border-green-500/20',
      icon: '✅',
    },
    [ProposalState.Queued]: {
      label: 'Queued',
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
      icon: '📦',
    },
    [ProposalState.Expired]: {
      label: 'Expired',
      color: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
      icon: '⏰',
    },
    [ProposalState.Executed]: {
      label: 'Executed',
      color: 'bg-green-500/20 text-green-400 border-green-500/20',
      icon: '🚀',
    },
  };

  return displays[state] || displays[ProposalState.Pending];
}

/**
 * Format vote type for display
 */
export function getVoteTypeDisplay(voteType: VoteType): {
  label: string;
  color: string;
  icon: string;
} {
  const displays: Record<VoteType, { label: string; color: string; icon: string }> = {
    [VoteType.Against]: {
      label: 'Against',
      color: 'text-red-400 bg-red-500/10',
      icon: '👎',
    },
    [VoteType.For]: {
      label: 'For',
      color: 'text-green-400 bg-green-500/10',
      icon: '👍',
    },
    [VoteType.Abstain]: {
      label: 'Abstain',
      color: 'text-gray-400 bg-gray-500/10',
      icon: '🤷',
    },
  };

  return displays[voteType];
}

/**
 * Calculate time remaining until voting ends
 */
export function calculateTimeRemaining(
  currentBlock: number,
  endBlock: number,
  blocksPerSecond: number = 0.33 // ~3 seconds per block on Ethereum
): {
  blocks: number;
  seconds: number;
  formatted: string;
} {
  const blocksRemaining = Math.max(0, endBlock - currentBlock);
  const secondsRemaining = Math.floor(blocksRemaining / blocksPerSecond);
  
  const days = Math.floor(secondsRemaining / 86400);
  const hours = Math.floor((secondsRemaining % 86400) / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);

  let formatted = '';
  if (days > 0) formatted += `${days}d `;
  if (hours > 0) formatted += `${hours}h `;
  if (minutes > 0) formatted += `${minutes}m`;

  return {
    blocks: blocksRemaining,
    seconds: secondsRemaining,
    formatted: formatted.trim() || 'Voting ended',
  };
}

/**
 * Validate proposal targets, values, and calldatas lengths match
 */
export function validateProposalArrays(
  targets: `0x${string}`[],
  values: bigint[],
  calldatas: `0x${string}`[]
): { valid: boolean; error?: string } {
  if (targets.length === 0) {
    return { valid: false, error: 'No targets specified' };
  }

  if (targets.length !== values.length) {
    return { valid: false, error: 'Targets and values length mismatch' };
  }

  if (targets.length !== calldatas.length) {
    return { valid: false, error: 'Targets and calldatas length mismatch' };
  }

  return { valid: true };
}

/**
 * Format USDC amount for display
 */
export function formatUSDC(amount: bigint, decimals: number = 18): string {
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = amount / divisor;
  const fractional = amount % divisor;

  const fractionalStr = fractional
    .toString()
    .padStart(decimals, '0')
    .slice(0, 2);

  return `$${whole.toLocaleString()}.${fractionalStr}`;
}

/**
 * Parse USDC amount from string
 */
export function parseUSDC(amount: string, decimals: number = 18): bigint {
  const [whole, fractional] = amount.split('.');
  const wholeAmount = BigInt(whole || '0');
  const divisor = BigInt(10) ** BigInt(decimals);
  
  let fractionalAmount = BigInt(0);
  if (fractional) {
    const padded = fractional.padEnd(decimals, '0');
    fractionalAmount = BigInt(padded);
  }

  return wholeAmount * divisor + fractionalAmount;
}

/**
 * Check if proposal can be executed
 */
export function canExecuteProposal(state: ProposalState): boolean {
  return state === ProposalState.Succeeded || state === ProposalState.Queued;
}

/**
 * Check if proposal is active for voting
 */
export function isProposalActive(state: ProposalState): boolean {
  return state === ProposalState.Active;
}

/**
 * Check if proposal is in final state
 */
export function isProposalFinalized(state: ProposalState): boolean {
  return (
    state === ProposalState.Defeated ||
    state === ProposalState.Executed ||
    state === ProposalState.Expired ||
    state === ProposalState.Canceled
  );
}

/**
 * Get proposal action description
 * Formats proposal for display in UI
 */
export interface ProposalAction {
  target: `0x${string}`;
  value: bigint;
  calldata: `0x${string}`;
}

export function describeProposalAction(action: ProposalAction): string {
  if (action.value > 0n) {
    return `Transfer ${formatUSDC(action.value)} to ${action.target.slice(0, 6)}...`;
  }
  
  return `Call contract ${action.target.slice(0, 6)}...`;
}

/**
 * Simulate proposal execution
 * Returns whether proposal would likely execute successfully
 */
export async function simulateProposalExecution(
  targets: `0x${string}`[],
  values: bigint[],
  calldatas: `0x${string}`[]
): Promise<{
  success: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Validate array lengths
  const validation = validateProposalArrays(targets, values, calldatas);
  if (!validation.valid) {
    errors.push(validation.error || 'Invalid proposal arrays');
    return { success: false, errors };
  }

  // In production, use viem's simulateContract
  // This is a placeholder for demonstration
  
  return {
    success: errors.length === 0,
    errors,
  };
}
