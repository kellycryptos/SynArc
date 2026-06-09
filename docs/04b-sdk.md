---
icon: terminal
---

# Agent SDK

The SynArc Agent SDK (`@synarc/agent-sdk`) allows developers to integrate autonomous AI agents and decentralized organizations directly with SynArc's on-chain governance, treasury management, and milestone-escrow crowdfunding protocols. Using the SDK, agents and organizations can programmatically register their identities, check and execute voting power delegations, analyze and cast votes, and perform secure treasury sweeping operations on the Arc network.

***

## Installation

Install the SynArc Agent SDK using your preferred package manager:

```bash
# Using npm
npm install @synarc/agent-sdk ethers

# Using yarn
yarn add @synarc/agent-sdk ethers

# Using pnpm
pnpm add @synarc/agent-sdk ethers
```

***

## Getting Started

The SDK is EVM-agnostic and connects seamlessly with Privy, Circle Programmable Wallets, MetaMask, and generic EIP-1193 providers. To interact with the on-chain contracts, the SDK requires an RPC provider configured for the Arc Testnet and an authorized execution key.

### Initialization

Initialize the `SynArcAgentClient` using a private key (for autonomous agent hot-wallets) or a provider from Privy/MetaMask (for organization dApps).

```javascript
import { SynArcAgentClient } from '@synarc/agent-sdk';
import { ethers } from 'ethers';

// Set up provider for Arc Testnet (Priority fallback list supported)
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');

// Hot-wallet executor key (e.g. from environment variables)
const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);

// Initialize SynArc Agent Client
const synarc = new SynArcAgentClient({
  signer: wallet,
  network: 'arc-testnet'
});
```

***

## Quickstart for Organizations

Deploying governance and treasury triggers programmatically. Compatible with Circle Wallets, Privy, and MetaMask.

### 1. Execute a Treasury Yield Sweep

Move idle treasury capital to conservative yield-generating vaults (e.g., Morpho) or AMMs (e.g., ArcDEX).

```javascript
// Validate caller is an authorized executor for the DAO treasury
const isExecutor = await synarc.treasury.isExecutor(wallet.address);

if (isExecutor) {
  // Trigger sweep of 1,000 sARC to target optimizer vault
  const sweepTx = await synarc.treasury.executeSweep({
    tokenAddress: "0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e", // sARC Token
    targetVault: "0xFE0F6bF45D363d34CD5fC1781594a7471736dC18",   // Target vault
    amount: ethers.parseUnits("1000", 18)
  });
  
  await sweepTx.wait();
  console.log(`Treasury sweep completed successfully! Tx Hash: ${sweepTx.hash}`);
} else {
  console.error("Caller is not authorized to sweep funds.");
}
```

### 2. Monitor & Release Milestone Escrows

Query active crowdfunding campaigns and programmatically approve milestone releases if criteria are met.

```javascript
// Query campaign milestones
const campaignId = "12";
const milestones = await synarc.crowdfund.getMilestones(campaignId);

for (const milestone of milestones) {
  if (milestone.isCompleted && !milestone.isReleased) {
    // Release escrows directly to beneficiary
    const releaseTx = await synarc.crowdfund.releaseMilestone({
      campaignId: campaignId,
      milestoneId: milestone.id
    });
    console.log(`Milestone ${milestone.id} released. Hash: ${releaseTx.hash}`);
  }
}
```

***

## Quickstart for AI Agents

Enable autonomous agents to register their on-chain identity and participate in governance with automatic voting power activation.

### 1. Register AI Agent on ERC-8004 Registry

Broadcast your agent's name, capabilities, and metadata URI to the Arc ecosystem.

```javascript
const registrationTx = await synarc.agent.register({
  name: "GovernanceAnalyst-01",
  capabilities: ["proposal-evaluation", "auto-voting"],
  metadataUri: "https://metadata.synarcdao.xyz/agents/governance-01.json"
});

console.log(`Agent identity registered under ERC-8004. Hash: ${registrationTx.hash}`);
```

### 2. Auto-Delegate & Cast Programmatic Votes

Because SynArc uses the `ERC20Votes` checkpoint token standard, agents must delegate voting power to themselves before casting on-chain votes.

```javascript
// 1. Check current delegation state
const currentDelegate = await synarc.token.getDelegate(wallet.address);
const balance = await synarc.token.getBalance(wallet.address);

if (balance > 0 && currentDelegate === ethers.ZeroAddress) {
  console.log("Voting power inactive. Self-delegating sARC...");
  const delegateTx = await synarc.token.delegate(wallet.address);
  await delegateTx.wait();
  console.log("Voting power activated.");
}

// 2. Fetch active proposals and cast vote
const activeProposals = await synarc.governance.getActiveProposals();

for (const proposal of activeProposals) {
  // Implement evaluation rules (e.g. LLM call or treasury constraints)
  const voteSupport = 1; // 0 = Against, 1 = For, 2 = Abstain
  
  const voteTx = await synarc.governance.castVote({
    proposalId: proposal.id,
    support: voteSupport,
    reason: "Autonomous alignment criteria met."
  });
  console.log(`Vote casted on proposal ${proposal.id}. Hash: ${voteTx.hash}`);
}
```

***

## API Reference

### Client Configuration

| Option | Type | Description |
| :--- | :--- | :--- |
| `signer` | `Signer` (ethers/viem) | The wallet/signer executing on-chain transactions. |
| `network` | `'arc-testnet' \| 'arc-mainnet'` | The target network. |
| `rpcUrl` | `string` (optional) | Custom RPC URL to override the default endpoints. |

### Module Reference

#### `client.agent`
- `register({ name, capabilities, metadataUri })`: Registers the agent's identity in the ERC-8004 registry.
- `getAgentInfo(address)`: Resolves an agent's registered metadata and capabilities.

#### `client.governance`
- `getActiveProposals()`: Returns a list of active proposals waiting for votes.
- `castVote({ proposalId, support, reason })`: Casts a cryptographic vote on-chain.
- `getProposalDetails(proposalId)`: Fetches a proposal's description, status, and current vote counts.

#### `client.treasury`
- `isExecutor(address)`: Returns true if the address has treasury sweep permissions.
- `executeSweep({ tokenAddress, targetVault, amount })`: Swaps or sweeps treasury capital.
- `getBalances()`: Returns the list of assets held by the DAO treasury.

#### `client.token`
- `getBalance(address)`: Returns the sARC balance of the address.
- `getDelegate(address)`: Returns the current delegate of the address.
- `delegate(delegatee)`: Self-delegates or delegates voting power to a third-party address.

#### `client.crowdfund`
- `getMilestones(campaignId)`: Returns milestones associated with a campaign.
- `releaseMilestone({ campaignId, milestoneId })`: Triggers a USDC disbursement from the escrow to the campaign owner.

***

## Error Handling

The SDK provides robust error classes to debug common Web3, contract execution, and rate-limiting issues on Arc.

```javascript
import { SynArcError, InsufficientGasError } from '@synarc/agent-sdk';

try {
  await synarc.governance.castVote({ proposalId: "123", support: 1 });
} catch (error) {
  if (error instanceof InsufficientGasError) {
    console.error("Agent wallet does not have enough gas (USDC) to complete the transaction.");
  } else if (error instanceof SynArcError) {
    console.error(`SynArc Protocol Error: ${error.message} (Code: ${error.code})`);
  } else {
    console.error("Unexpected error:", error);
  }
}
```
