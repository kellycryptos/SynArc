/**
 * Arc Governance Smart Contract Definitions
 * 
 * This file provides contract ABIs and configuration for interacting with
 * Arc governance smart contracts on Arc Testnet.
 * 
 * Contracts:
 * - Governor: Proposal voting and execution
 * - Token: USDC governance token
 * - Timelock: Execution delay and security
 * - Treasury: Governance-controlled funds
 */

import { Abi } from 'viem';

/**
 * Minimal Governor Contract ABI
 * Includes core voting and proposal functions
 */
export const GovernorABI = [
  {
    type: 'function',
    name: 'proposalCount',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'propose',
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'category', type: 'string' },
      { name: 'votingDuration', type: 'uint256' },
      { name: 'treasuryImpactValue', type: 'uint256' },
      { name: 'executionTarget', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'castVote',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'uint8' }, // 0=against, 1=for, 2=abstain
    ],
    outputs: [{ name: 'balance', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'castVoteWithReason',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'uint8' },
      { name: 'reason', type: 'string' },
    ],
    outputs: [{ name: 'balance', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'execute',
    inputs: [
      { name: 'proposalId', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'proposals',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'proposer', type: 'address' },
      { name: 'eta', type: 'uint256' },
      { name: 'startBlock', type: 'uint256' },
      { name: 'endBlock', type: 'uint256' },
      { name: 'forVotes', type: 'uint256' },
      { name: 'againstVotes', type: 'uint256' },
      { name: 'abstainVotes', type: 'uint256' },
      { name: 'canceled', type: 'bool' },
      { name: 'executed', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getProposal',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'proposer', type: 'address' },
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'category', type: 'string' },
      { name: 'votingDuration', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'forVotes', type: 'uint256' },
      { name: 'againstVotes', type: 'uint256' },
      { name: 'abstainVotes', type: 'uint256' },
      { name: 'canceled', type: 'bool' },
      { name: 'executed', type: 'bool' },
      { name: 'treasuryImpactValue', type: 'uint256' },
      { name: 'executionTarget', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'state',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [{ type: 'uint8' }], // 0=pending, 1=active, 2=canceled, 3=defeated, 4=succeeded, 5=queued, 6=expired, 7=executed
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasVoted',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'account', type: 'address' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'votingPeriod',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'votingDelay',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'quorumNumerator',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'ProposalCreated',
    inputs: [
      { name: 'proposalId', type: 'uint256', indexed: true },
      { name: 'proposer', type: 'address', indexed: true },
      { name: 'title', type: 'string', indexed: false },
      { name: 'description', type: 'string', indexed: false },
      { name: 'category', type: 'string', indexed: false },
      { name: 'startTime', type: 'uint256', indexed: false },
      { name: 'endTime', type: 'uint256', indexed: false },
      { name: 'treasuryImpactValue', type: 'uint256', indexed: false },
      { name: 'executionTarget', type: 'address', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'VoteCast',
    inputs: [
      { name: 'voter', type: 'address', indexed: true },
      { name: 'proposalId', type: 'uint256', indexed: true },
      { name: 'support', type: 'uint8', indexed: false },
      { name: 'weight', type: 'uint256', indexed: false },
      { name: 'reason', type: 'string', indexed: false },
    ],
  },
  {
    type: 'function',
    name: 'largeWithdrawalThreshold',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'largeWithdrawalVotingThreshold',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'ProposalExecuted',
    inputs: [
      { name: 'proposalId', type: 'uint256', indexed: true },
    ],
  },
] as const satisfies Abi;

/**
 * ERC20 Token ABI (USDC)
 * For checking balances and approvals
 */
export const ERC20ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const satisfies Abi;

/**
 * Treasury Contract ABI
 * For governance-controlled fund management
 */
export const TreasuryABI = [
  {
    type: 'function',
    name: 'balance',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenBalance',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'depositUSDC',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'depositEURC',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdrawalDelay',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'withdrawalCount',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'queuedWithdrawals',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'token', type: 'address' },
      { name: 'tokenSymbol', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'executionTime', type: 'uint256' },
      { name: 'executed', type: 'bool' },
      { name: 'canceled', type: 'bool' }
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getQueuedWithdrawals',
    inputs: [],
    outputs: [
      {
        type: 'tuple[]',
        name: '',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'recipient', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'token', type: 'address' },
          { name: 'tokenSymbol', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'executionTime', type: 'uint256' },
          { name: 'executed', type: 'bool' },
          { name: 'canceled', type: 'bool' }
        ]
      }
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'executeWithdrawal',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelWithdrawal',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'Withdrawal',
    inputs: [
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const satisfies Abi;

/**
 * Governance Contract Addresses (Arc Testnet)
 * These are placeholder addresses - replace with actual deployed contracts
 */
export const GOVERNANCE_CONTRACTS = {
  // Governor contract for proposal voting
  governor: (process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS || '0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e') as `0x${string}`,
  
  // USDC token for voting power
  token: (process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e') as `0x${string}`,
  
  // Governance Treasury (timelocked) — source of truth for balances and proposals
  treasury: (process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '0xFE0F6bF45D363d34CD5fC1781594a7471736dC18') as `0x${string}`,
  
  // EURC token address
  eurc: (process.env.NEXT_PUBLIC_EURC_CONTRACT_ADDRESS || '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a') as `0x${string}`,
  
  // Timelock for execution delays
  timelock: '0x0000000000000000000000000000000000000000' as `0x${string}`,
};

/**
 * Proposal State Enum
 */
export enum ProposalState {
  Pending = 0,
  Active = 1,
  Canceled = 2,
  Defeated = 3,
  Succeeded = 4,
  Queued = 5,
  Expired = 6,
  Executed = 7,
}

/**
 * Vote Type Enum
 */
export enum VoteType {
  Against = 0,
  For = 1,
  Abstain = 2,
}

/**
 * Get human-readable proposal state
 */
export function getProposalStateLabel(state: ProposalState): string {
  const labels: Record<ProposalState, string> = {
    [ProposalState.Pending]: 'Pending',
    [ProposalState.Active]: 'Active',
    [ProposalState.Canceled]: 'Canceled',
    [ProposalState.Defeated]: 'Defeated',
    [ProposalState.Succeeded]: 'Succeeded',
    [ProposalState.Queued]: 'Queued',
    [ProposalState.Expired]: 'Expired',
    [ProposalState.Executed]: 'Executed',
  };
  return labels[state] || 'Unknown';
}

/**
 * Get human-readable vote type
 */
export function getVoteTypeLabel(voteType: VoteType): string {
  const labels: Record<VoteType, string> = {
    [VoteType.Against]: 'Against',
    [VoteType.For]: 'For',
    [VoteType.Abstain]: 'Abstain',
  };
  return labels[voteType] || 'Unknown';
}

/**
 * Agent Contract ABI
 */
export const AgentABI = [
  { type: 'function', name: 'paused', inputs: [], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  { type: 'function', name: 'pause', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'unpause', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'maxRebalanceAmount', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'setMaxRebalanceAmount', inputs: [{ name: '_newLimit', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'getQueuedWithdrawals', inputs: [], outputs: [
    {
      type: 'tuple[]',
      name: '',
      components: [
        { name: 'id', type: 'uint256' },
        { name: 'token', type: 'address' },
        { name: 'recipient', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'executionTime', type: 'uint256' },
        { name: 'executed', type: 'bool' },
        { name: 'canceled', type: 'bool' }
      ]
    }
  ], stateMutability: 'view' },
  { type: 'function', name: 'executeWithdrawal', inputs: [{ name: 'id', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'cancelWithdrawal', inputs: [{ name: 'id', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'queueWithdrawal', inputs: [{ name: 'token', type: 'address' }, { name: 'recipient', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' }
] as const satisfies Abi;
