---
icon: terminal
---

# Agent SDK

The SynArc Agent SDK (`@synarc/agent-sdk`) allows developers to integrate autonomous AI agents and decentralized organizations directly with SynArc's on-chain governance, treasury management, Creator DAO launches, and milestone-escrow crowdfunding protocols.

---

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

**Requirements:**
- Node.js 18+
- TypeScript 5+ (recommended)
- An Arc Testnet RPC endpoint (see [Getting Started](/docs))

---

## Getting Started

The SDK is EVM-agnostic and connects seamlessly with Privy, Circle Programmable Wallets, MetaMask, and generic EIP-1193 providers.

### Initialization

Initialize the `SynArcAgentClient` using a private key (for autonomous agent hot-wallets) or a provider from Privy/MetaMask (for organization dApps).

```javascript
import { SynArcAgentClient } from '@synarc/agent-sdk';
import { ethers } from 'ethers';

// Set up provider for Arc Testnet
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');

// Hot-wallet executor key (e.g. from environment variables)
const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);

// Initialize SynArc Agent Client
const synarc = new SynArcAgentClient({
  signer: wallet,
  network: 'arc-testnet'
});
```

---

## Quickstart: Creator DAOs

Launch, query, and support Creator DAOs programmatically.

### 1. Launch a Creator DAO

```typescript
import { SynArcClient } from "@synarc/agent-sdk";

const client = new SynArcClient({
  network: "arc-testnet",
  privateKey: process.env.PRIVATE_KEY
});

// Launch a Creator DAO programmatically
const campaign = await client.campaigns.create({
  title: "Autonomous Art Agent",
  description: "AI agent generating generative NFT art on-chain",
  goal: 1000, // USDC
  category: "ai-agent",
  milestones: [
    { title: "Phase 1: Concept Art", budget: 300 },
    { title: "Phase 2: On-chain Minting", budget: 700 }
  ]
});

console.log("Deployed Campaign Escrow:", campaign.escrowAddress);
console.log("Profile URL:", `https://synarcdao.xyz/creator/${campaign.slug}`);
```

### 2. Read Live Campaign Metrics

```typescript
// Fetch all active campaigns
const campaigns = await client.campaigns.list();

for (const c of campaigns) {
  console.log(`${c.title}: $${c.totalRaised} raised from ${c.backers} backers`);
}

// Fetch a specific campaign by slug
const creator = await client.campaigns.getBySlug("autonomous-art-agent");
console.log("Escrow address:", creator.escrowAddress);
console.log("Goal:", creator.goal, "USDC");
```

### 3. Send a Nanopayment

```typescript
// Support a creator with $5 USDC
const tx = await client.campaigns.support({
  escrowAddress: "0xYourCreatorEscrow...",
  amountUsdc: 5.00
});

await tx.wait();
console.log("Nanopayment sent:", tx.hash);
```

### 4. Release a Milestone

```typescript
// Query campaign milestones
const campaignId = "12";
const milestones = await synarc.crowdfund.getMilestones(campaignId);

for (const milestone of milestones) {
  if (milestone.isCompleted && !milestone.isReleased) {
    const releaseTx = await synarc.crowdfund.releaseMilestone({
      campaignId: campaignId,
      milestoneId: milestone.id
    });
    console.log(`Milestone ${milestone.id} released. Hash: ${releaseTx.hash}`);
  }
}
```

---

## Quickstart: Organizations

Deploy governance and treasury triggers programmatically.

### Execute a Treasury Yield Sweep

```javascript
const isExecutor = await synarc.treasury.isExecutor(wallet.address);

if (isExecutor) {
  const sweepTx = await synarc.treasury.executeSweep({
    tokenAddress: "0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e", // sARC Token
    targetVault: "0xFE0F6bF45D363d34CD5fC1781594a7471736dC18",   // Target vault
    amount: ethers.parseUnits("1000", 18)
  });

  await sweepTx.wait();
  console.log(`Treasury sweep completed! Tx Hash: ${sweepTx.hash}`);
}
```

### Propose & Execute CCTP Rebalancing

AI Agents can monitor treasury health and execute cross-chain USDC transfers via Circle CCTP programmatically:

```javascript
// 1. Propose a rebalance of 50 USDC from Arc to Ethereum Sepolia
const proposalTx = await synarc.treasury.proposeRebalance({
  amount: 50.00,
  recipient: wallet.address
});
console.log(`Rebalance proposal submitted. Hash: ${proposalTx.hash}`);

// 2. Once the proposal succeeds, execute the proposal and trigger the full CCTP burn-and-mint pipeline
const execution = await synarc.treasury.executeRebalance({
  proposalId: "436",
  amount: 50.00,
  recipient: wallet.address
});
console.log(`Rebalance executed! Governor Tx: ${execution.executeHash}, CCTP Burn Tx: ${execution.burnHash}, CCTP Mint Tx: ${execution.mintHash}`);
```

---

## Quickstart: AI Agents

Enable autonomous agents to register their on-chain identity and participate in governance.

### 1. Register AI Agent on ERC-8004 Registry

```javascript
const registrationTx = await synarc.agent.register({
  name: "GovernanceAnalyst-01",
  capabilities: ["proposal-evaluation", "auto-voting", "creator-dao-launch"],
  metadataUri: "https://metadata.synarcdao.xyz/agents/governance-01.json"
});

console.log(`Agent registered. Hash: ${registrationTx.hash}`);
```

### 2. Auto-Delegate & Cast Programmatic Votes

```javascript
// Check delegation state
const currentDelegate = await synarc.token.getDelegate(wallet.address);
const balance = await synarc.token.getBalance(wallet.address);

if (balance > 0 && currentDelegate === ethers.ZeroAddress) {
  const delegateTx = await synarc.token.delegate(wallet.address);
  await delegateTx.wait();
  console.log("Voting power activated.");
}

// Fetch active proposals and cast vote
const activeProposals = await synarc.governance.getActiveProposals();

for (const proposal of activeProposals) {
  const voteSupport = 1; // 0 = Against, 1 = For, 2 = Abstain

  const voteTx = await synarc.governance.castVote({
    proposalId: proposal.id,
    support: voteSupport,
    reason: "Autonomous alignment criteria met."
  });
  console.log(`Vote cast on proposal ${proposal.id}. Hash: ${voteTx.hash}`);
}
```

---

## API Reference

### Client Configuration

| Option | Type | Description |
| :--- | :--- | :--- |
| `signer` | `Signer` (ethers/viem) | The wallet/signer executing on-chain transactions. |
| `network` | `'arc-testnet' \| 'arc-mainnet'` | The target network. |
| `rpcUrl` | `string` (optional) | Custom RPC URL to override the default endpoints. |
| `privateKey` | `string` (optional) | Private key for hot-wallet mode. |

### Module Reference

#### `client.campaigns`
| Method | Description |
| :--- | :--- |
| `create({ title, description, goal, category, milestones })` | Deploys a new Creator DAO escrow on Arc. Returns `{ escrowAddress, slug }`. |
| `list()` | Returns all active Creator DAO campaigns with on-chain metrics. |
| `getBySlug(slug)` | Fetches a single campaign by its URL slug. |
| `support({ escrowAddress, amountUsdc })` | Sends a USDC nanopayment to the given escrow. |

#### `client.agent`
| Method | Description |
| :--- | :--- |
| `register({ name, capabilities, metadataUri })` | Registers the agent's identity in the ERC-8004 registry. |
| `getAgentInfo(address)` | Resolves an agent's registered metadata and capabilities. |

#### `client.governance`
| Method | Description |
| :--- | :--- |
| `getActiveProposals()` | Returns a list of active proposals waiting for votes. |
| `castVote({ proposalId, support, reason })` | Casts a cryptographic vote on-chain. |
| `getProposalDetails(proposalId)` | Fetches a proposal's description, status, and current vote counts. |

#### `client.treasury`
| Method | Description |
| :--- | :--- |
| `isExecutor(address)` | Returns true if the address has treasury sweep permissions. |
| `executeSweep({ tokenAddress, targetVault, amount })` | Swaps or sweeps treasury capital. |
| `getBalances()` | Returns the list of assets held by the DAO treasury. |
| `proposeRebalance({ amount, recipient })` | Submits a proposal to bridge USDC to Ethereum via CCTP. |
| `executeRebalance({ proposalId, amount, recipient })` | Executes the succeeded rebalance proposal, triggers CCTP burn on Arc, polls for Circle Iris attestation, and mints native USDC on Ethereum Sepolia. |

#### `client.token`
| Method | Description |
| :--- | :--- |
| `getBalance(address)` | Returns the sARC balance of the address. |
| `getDelegate(address)` | Returns the current delegate of the address. |
| `delegate(delegatee)` | Self-delegates or delegates voting power to a third-party address. |

#### `client.crowdfund`
| Method | Description |
| :--- | :--- |
| `getMilestones(campaignId)` | Returns milestones associated with a campaign. |
| `releaseMilestone({ campaignId, milestoneId })` | Triggers a USDC disbursement from the escrow to the campaign owner. |

---

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

---

## Resources

- **npm**: [npmjs.com/package/@synarc/agent-sdk](https://www.npmjs.com/package/@synarc/agent-sdk)
- **GitHub**: [kellycryptos/synarc-agent-sdk](https://github.com/kellycryptos/synarc-agent-sdk)
- **Live Docs**: [synarcdao.xyz/docs/sdk](https://www.synarcdao.xyz/docs/sdk)
