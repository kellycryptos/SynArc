# Arc Governance Smart Contract Integration Guide

This guide explains how to integrate Arc governance smart contracts into SynArc for proposal voting, treasury management, and delegate coordination.

---

## Quick Start

### 1. Set Up Contract Addresses

Update `lib/governance/contracts.ts` with your deployed contract addresses:

```typescript
export const GOVERNANCE_CONTRACTS = {
  governor: '0x...' as `0x${string}`,      // Governor voting contract
  token: '0x...' as `0x${string}`,          // USDC token
  treasury: '0x...' as `0x${string}`,       // Treasury contract
  timelock: '0x...' as `0x${string}`,       // Timelock contract
};
```

### 2. Import and Use Governance Hooks

```typescript
import { 
  useProposalCount,
  useProposal,
  useCastVote,
  useTokenBalance,
} from '@/lib/hooks/useGovernance';

export function GovernanceDashboard() {
  const { count } = useProposalCount();
  const { balance } = useTokenBalance(userAddress);
  
  return (
    <div>
      <h1>Proposals: {count.toString()}</h1>
      <p>Voting Power: {balance.toString()} USDC</p>
    </div>
  );
}
```

---

## Core Governance Hooks

### Reading Proposal Data

#### `useProposalCount()`
Get total number of proposals.

```typescript
const { count, isLoading, error } = useProposalCount();

return <span>Total Proposals: {count.toString()}</span>;
```

#### `useProposal(proposalId)`
Get detailed proposal information.

```typescript
const { proposal, isLoading } = useProposal(123n);

if (proposal) {
  return (
    <div>
      <p>Proposer: {proposal.proposer}</p>
      <p>For Votes: {proposal.forVotes.toString()}</p>
      <p>Against Votes: {proposal.againstVotes.toString()}</p>
    </div>
  );
}
```

#### `useProposalState(proposalId)`
Get current proposal state (Pending, Active, Defeated, Executed, etc).

```typescript
import { ProposalState } from '@/lib/governance/contracts';
import { getProposalStateLabel } from '@/lib/governance/utils';

const { state } = useProposalState(123n);

return <span>Status: {getProposalStateLabel(state)}</span>;
```

#### `useHasVoted(proposalId, account)`
Check if account has voted on proposal.

```typescript
const { hasVoted } = useHasVoted(123n, userAddress);

return hasVoted 
  ? <p>You've voted on this proposal</p>
  : <p>You haven't voted yet</p>;
```

### Token & Treasury

#### `useTokenBalance(account)`
Get USDC balance for voting power.

```typescript
const { balance, refetch } = useTokenBalance(userAddress);

return (
  <div>
    <p>Balance: {balance.toString()} USDC</p>
    <button onClick={() => refetch()}>Refresh</button>
  </div>
);
```

#### `useTreasuryBalance()`
Get total treasury USDC balance.

```typescript
const { balance } = useTreasuryBalance();

return <p>Treasury: ${(Number(balance) / 1e18).toFixed(2)}</p>;
```

### Voting

#### `useCastVote()`
Cast a vote on a proposal.

```typescript
import { VoteType } from '@/lib/governance/contracts';

export function VoteButton({ proposalId }) {
  const { castVote, isPending, isSuccess } = useCastVote();
  
  const handleVoteFor = () => {
    castVote(proposalId, VoteType.For, 'Supporting this proposal');
  };
  
  return (
    <div>
      <button 
        onClick={handleVoteFor}
        disabled={isPending}
      >
        {isPending ? 'Voting...' : 'Vote For'}
      </button>
      {isSuccess && <p>Vote cast successfully!</p>}
    </div>
  );
}
```

Vote types:
- `VoteType.Against` (0) - Against proposal
- `VoteType.For` (1) - In favor of proposal
- `VoteType.Abstain` (2) - Abstain from voting

### Proposal Creation

#### `useCreateProposal()`
Create a new governance proposal.

```typescript
export function CreateProposalForm() {
  const { createProposal, isPending, isSuccess } = useCreateProposal();
  
  const handleCreate = () => {
    // Example: Transfer USDC from treasury
    const targets = ['0x...treasury_address'];
    const values = [0n];
    const calldatas = ['0x...encoded_transfer_call'];
    const description = 'Transfer 10,000 USDC to community programs';
    
    createProposal(targets, values, calldatas, description);
  };
  
  return (
    <button onClick={handleCreate} disabled={isPending}>
      {isPending ? 'Creating...' : 'Create Proposal'}
    </button>
  );
}
```

### Proposal Execution

#### `useExecuteProposal()`
Execute a passed proposal.

```typescript
import { getDescriptionHash } from '@/lib/governance/utils';

export function ExecuteButton({ targets, values, calldatas, description }) {
  const { executeProposal, isPending, isSuccess } = useExecuteProposal();
  
  const handleExecute = () => {
    const descriptionHash = getDescriptionHash(description);
    executeProposal(targets, values, calldatas, descriptionHash);
  };
  
  return (
    <button onClick={handleExecute} disabled={isPending}>
      {isPending ? 'Executing...' : 'Execute Proposal'}
    </button>
  );
}
```

---

## Governance Utilities

### Proposal State Management

#### `getProposalStateLabel(state)`
Get human-readable proposal state.

```typescript
import { getProposalStateLabel, ProposalState } from '@/lib/governance/contracts';

const label = getProposalStateLabel(ProposalState.Active);
// Returns: "Active"
```

#### `getProposalStateDisplay(state)`
Get display info for proposal state (label, color, icon).

```typescript
import { getProposalStateDisplay } from '@/lib/governance/utils';

const display = getProposalStateDisplay(ProposalState.Active);
// Returns: { label: 'Active', color: '...', icon: '🔵' }

return (
  <span className={display.color}>
    {display.icon} {display.label}
  </span>
);
```

### Vote Management

#### `getVoteTypeLabel(voteType)`
Get human-readable vote type.

```typescript
import { getVoteTypeLabel, VoteType } from '@/lib/governance/contracts';

const label = getVoteTypeLabel(VoteType.For);
// Returns: "For"
```

#### `getVoteTypeDisplay(voteType)`
Get display info for vote type.

```typescript
import { getVoteTypeDisplay } from '@/lib/governance/utils';

const display = getVoteTypeDisplay(VoteType.For);
// Returns: { label: 'For', color: '...', icon: '👍' }
```

### Proposal Analysis

#### `calculateVotingPowerPercentage(votes, totalVotes)`
Calculate percentage of total voting power.

```typescript
import { calculateVotingPowerPercentage } from '@/lib/governance/utils';

const percentage = calculateVotingPowerPercentage(500n, 1000n);
// Returns: 50
```

#### `determineProposalOutcome(forVotes, againstVotes, quorumThreshold)`
Determine if proposal passed.

```typescript
import { determineProposalOutcome } from '@/lib/governance/utils';

const outcome = determineProposalOutcome(600n, 400n, 500n);
// Returns: { passed: true, reason: 'Proposal passed' }
```

#### `calculateTimeRemaining(currentBlock, endBlock)`
Calculate time remaining for voting.

```typescript
import { calculateTimeRemaining } from '@/lib/governance/utils';

const timeLeft = calculateTimeRemaining(12345, 12400);
// Returns: { blocks: 55, seconds: 165, formatted: '2m 45s' }

return <p>Time remaining: {timeLeft.formatted}</p>;
```

### USDC Formatting

#### `formatUSDC(amount)`
Format USDC amount for display.

```typescript
import { formatUSDC } from '@/lib/governance/utils';

const formatted = formatUSDC(10000n * 10n ** 18n);
// Returns: "$10,000.00"
```

#### `parseUSDC(amountString)`
Parse USDC string to bigint with proper decimals.

```typescript
import { parseUSDC } from '@/lib/governance/utils';

const amount = parseUSDC('1000.50');
// Returns: 1000500000000000000n (1000.50 USDC in wei)
```

---

## Complete Example: Proposal Card Component

```typescript
"use client";

import { useProposal, useProposalState, useHasVoted, useCastVote } from '@/lib/hooks/useGovernance';
import { 
  getProposalStateDisplay, 
  calculateTimeRemaining,
  calculateVotingPowerPercentage,
  formatUSDC,
} from '@/lib/governance/utils';
import { VoteType } from '@/lib/governance/contracts';
import { useAccount } from 'wagmi';

export function ProposalCard({ proposalId }: { proposalId: bigint }) {
  const { address } = useAccount();
  const { proposal, isLoading } = useProposal(proposalId);
  const { state } = useProposalState(proposalId);
  const { hasVoted } = useHasVoted(proposalId, address);
  const { castVote, isPending } = useCastVote();

  if (isLoading) return <div>Loading...</div>;
  if (!proposal) return <div>Proposal not found</div>;

  const stateDisplay = getProposalStateDisplay(state);
  const totalVotes = proposal.forVotes + proposal.againstVotes;
  const forPercentage = calculateVotingPowerPercentage(proposal.forVotes, totalVotes);
  const againstPercentage = calculateVotingPowerPercentage(proposal.againstVotes, totalVotes);

  return (
    <div className="border border-border-thin rounded-lg p-4 bg-surface-elevated">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">Proposal #{proposalId.toString()}</h3>
        <span className={`px-3 py-1 rounded-full text-sm ${stateDisplay.color}`}>
          {stateDisplay.icon} {stateDisplay.label}
        </span>
      </div>

      <p className="text-sm text-muted mb-4">By {proposal.proposer.slice(0, 6)}...</p>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span>For: {forPercentage.toFixed(1)}%</span>
          <span>Against: {againstPercentage.toFixed(1)}%</span>
        </div>
        <div className="flex gap-1 h-2 bg-surface-dark rounded-full overflow-hidden">
          <div 
            className="bg-green-500" 
            style={{ width: `${forPercentage}%` }}
          />
          <div 
            className="bg-red-500" 
            style={{ width: `${againstPercentage}%` }}
          />
        </div>
      </div>

      <div className="text-xs text-muted mb-4">
        <p>For: {formatUSDC(proposal.forVotes)}</p>
        <p>Against: {formatUSDC(proposal.againstVotes)}</p>
      </div>

      {!hasVoted && state === 1 && (
        <div className="flex gap-2">
          <button 
            onClick={() => castVote(proposalId, VoteType.For)}
            disabled={isPending}
            className="flex-1 px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 disabled:opacity-50"
          >
            Vote For
          </button>
          <button 
            onClick={() => castVote(proposalId, VoteType.Against)}
            disabled={isPending}
            className="flex-1 px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 disabled:opacity-50"
          >
            Vote Against
          </button>
        </div>
      )}

      {hasVoted && <p className="text-sm text-muted">✓ You voted on this proposal</p>}
    </div>
  );
}
```

---

## Deployment Checklist

Before deploying governance features:

- ✅ Contract addresses set in `GOVERNANCE_CONTRACTS`
- ✅ Contracts deployed to Arc Testnet
- ✅ Governor contract initialized with voting parameters
- ✅ USDC token deployed or configured
- ✅ Treasury contract deployed and funded
- ✅ Timelock contract configured
- ✅ Test proposals created and voted on
- ✅ Execution flow tested
- ✅ Gas costs estimated and budgeted

---

## Security Considerations

1. **Contract Verification**: Verify all contract code on ArcScan before deployment
2. **Proposal Validation**: Validate proposal actions before execution
3. **Timelock**: Ensure timelock provides adequate delay for review
4. **Access Control**: Verify only authorized addresses can create proposals
5. **Quorum**: Set appropriate quorum requirements to prevent low-turnout proposals
6. **Voting Delay**: Implement voting delay to prevent flash loan attacks

---

## Advanced Topics

### Custom Proposal Actions

For complex governance actions, create custom encodings:

```typescript
import { encodeFunctionData } from 'viem';
import { ERC20ABI } from '@/lib/governance/contracts';

// Example: Transfer USDC
const calldata = encodeFunctionData({
  abi: ERC20ABI,
  functionName: 'transfer',
  args: ['0x...recipient', 1000n * 10n ** 18n],
});
```

### Proposal Simulation

Test proposals before creation:

```typescript
import { simulateProposalExecution } from '@/lib/governance/utils';

const result = await simulateProposalExecution(targets, values, calldatas);
if (result.success) {
  // Safe to create proposal
} else {
  console.error('Simulation errors:', result.errors);
}
```

### Custom Voting Logic

Extend voting with custom logic:

```typescript
export function useWeightedVote(proposalId: bigint, userWeight: bigint) {
  const { castVote } = useCastVote();
  
  const castWeightedVote = (support: VoteType) => {
    // Custom logic here
    castVote(proposalId, support);
  };
  
  return { castWeightedVote };
}
```

---

## Support

For questions or issues:
1. Check SETUP.md for general guidance
2. Review contract ABIs in `lib/governance/contracts.ts`
3. Check hook implementations in `lib/hooks/useGovernance.ts`
4. Test with local fork before mainnet

---

**Status**: Production Ready  
**Last Updated**: May 2026  
**Arc Network**: Testnet (5042002)
