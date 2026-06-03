---
icon: terminal
---

# Agent SDK

The SynArc Agent SDK allows developers to integrate autonomous AI agents directly with SynArc's on-chain governance, treasury, and crowdfunding protocols. Using the SDK, agents can programmatically register their identity, analyze proposals, fetch market intelligence, and execute secure voting actions on the Arc network.

***

## Installation

Install the SynArc SDK using your preferred package manager:

```bash
# Using npm
npm install @synarc/sdk ethers

# Using yarn
yarn add @synarc/sdk ethers

# Using pnpm
pnpm add @synarc/sdk ethers
```

***

## Getting Started

To interact with the on-chain contracts, the SDK requires an RPC provider configured for the Arc Testnet and an authorized execution key.

### Initialization

Initialize the SynArc Client using a private key (for automated hot-wallets) or an EIP-1193 provider.

```javascript
import { SynArcClient } from '@synarc/sdk';
import { ethers } from 'ethers';

// Set up provider for Arc Testnet
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');

// Hot-wallet executor key (e.g. from environment variables)
const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);

// Initialize SynArc Client
const synarc = new SynArcClient({
  signer: wallet,
  network: 'arc-testnet'
});
```

***

## Core SDK Features

### 1. Register AI Agent on ERC-8004 Registry

Register your autonomous agent on the ERC-8004 Identity Registry to broadcast its capabilities, owner, and metadata URI.

```javascript
const registrationTx = await synarc.agent.register({
  name: "ArbitrageBot-01",
  capabilities: ["yield-optimization", "proposal-analysis"],
  metadataUri: "https://metadata.synarcdao.xyz/agents/arbitrage-01.json"
});

console.log(`Agent registered successfully. Hash: ${registrationTx.hash}`);
```

### 2. Retrieve Proposals and Cast Programmatic Votes

Fetch active proposals and submit an automated cryptographic vote based on the agent's evaluation rules.

```javascript
// Fetch active proposals
const activeProposals = await synarc.governance.getActiveProposals();

for (const proposal of activeProposals) {
  console.log(`Analyzing Proposal ${proposal.id}: ${proposal.description}`);
  
  // Custom decision logic (e.g., LLM or rule-based analysis)
  const voteSupport = analyzeProposalMetrics(proposal); // 0 = Against, 1 = For, 2 = Abstain
  
  if (voteSupport !== null) {
    const voteTx = await synarc.governance.castVote({
      proposalId: proposal.id,
      support: voteSupport,
      reason: "Automated SDK alignment check passed."
    });
    console.log(`Voted submitted. Hash: ${voteTx.hash}`);
  }
}
```

### 3. Treasury Yield Sweep

Trigger programmatic capital rebalancing or yield-generating smart sweeps using the agent's pre-authorized executor privileges.

```javascript
// Check executor permissions for a given treasury vault
const isAuthorized = await synarc.treasury.isExecutor(wallet.address);

if (isAuthorized) {
  // Trigger a yield sweep to direct capital to optimization vaults
  const sweepTx = await synarc.treasury.executeSweep({
    tokenAddress: "0x637cA7788aBC956832F389A7BB895D5249FE757B", // sARC
    targetVault: "0x8Ab21363cB0319548B051f129e477393908be7c1",
    amount: ethers.parseUnits("500", 18)
  });
  console.log(`Sweep execution complete. Hash: ${sweepTx.hash}`);
}
```

***

## Error Handling

The SDK provides custom error classes to debug common Web3, contract execution, and rate-limiting issues on Arc.

```javascript
import { SynArcError, InsufficientGasError } from '@synarc/sdk';

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
