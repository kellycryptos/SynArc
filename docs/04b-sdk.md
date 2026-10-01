---
icon: terminal
---

# Agent SDK

The Syn DAO Agent SDK (`synarc-agent-sdk`) allows developers to integrate autonomous AI agents and decentralized organizations directly with Syn DAO's on-chain governance, two-treasury management, Creator DAO launches, milestone-escrow crowdfunding, and Circle CCTP cross-chain bridge on the Arc Network.

---

## Installation

Install `synarc-agent-sdk` alongside `viem` using your preferred package manager:

```bash
# Using npm
npm install synarc-agent-sdk viem

# Using yarn
yarn add synarc-agent-sdk viem

# Using pnpm
pnpm add synarc-agent-sdk viem
```

**Requirements:**
- Node.js 18+
- TypeScript 5+ (recommended)
- `viem` ^2.0 (peer dependency)
- Arc Testnet RPC endpoint (`https://rpc.testnet.arc.network`)

---

## Deployed Contracts & Network Reference

Below is the official network configuration and deployed smart contracts on Arc Testnet (`chainId: 5042002`).

| Contract / Config | Address / Value | Description |
| :--- | :--- | :--- |
| **Chain ID** | `5042002` | Arc Testnet Chain Identifier |
| **RPC Endpoint** | `https://rpc.testnet.arc.network` | Primary Arc Testnet RPC endpoint |
| **SynArcGovernor** | `0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e` | Governance proposal and voting controller |
| **Governance Treasury** | `0xFE0F6bF45D363d34CD5fC1781594a7471736dC18` | Timelocked treasury for community balances |
| **Agent Operating Treasury** | `0xE6bAC65d7f060B805B8dd6f1c4DBfa6571905f28` | Fast-access agent operating reserves |
| **Crowdfund Escrow Factory** | `0xd5374DFC4B01F60115A52Df027704062506b3030` | Deploys campaign milestone escrows |
| **SynArcToken (sARC)** | `0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e` | Primary governance voting weight token |
| **EURC Token** | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` | EURC stablecoin contract address |
| **USDC (Gas Token)** | `0x3600000000000000000000000000000000000000` | Native USDC stablecoin for fee payment |
| **Treasury Agent Contract** | `0x88BdF819466C1802ce6C780a9fbdF3A314cab07D` | On-chain autonomous agent rules executor |
| **CCTP Token Messenger** | `0xd0C3da4E20F0D24dB1cE8f1fF36814Ea8F60309e` | Circle CCTP Token Messenger address |
| **ERC-8004 Agent Registry** | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | Agent on-chain identity registry |

### Two-Treasury Architecture

Syn DAO uses two distinct treasury contracts by design:

- **Governance Treasury** (`0xFE0F6bF45D363d34CD5fC1781594a7471736dC18`) — The community-visible, timelocked treasury. All user-facing balance displays, governance proposals, and dashboard stats read from this contract. Withdrawals require a passing governance vote and a 24-hour timelock delay.
- **Agent Operating Treasury** (`0xE6bAC65d7f060B805B8dd6f1c4DBfa6571905f28`) — Used exclusively by the autonomous treasury agent for instant CCTP rebalances. Funded via governance-approved transfers from the main treasury.

Import addresses directly from the SDK:
```typescript
import { TREASURY_GOVERNANCE_ADDRESS, TREASURY_AGENT_ADDRESS } from 'synarc-agent-sdk';
```

---

## Client Initialization

The SDK is EVM-agnostic and connects seamlessly with WalletConnect, Circle Programmable Wallets, MetaMask, Rabby, Coinbase Wallet, or raw private keys.

### 1. Read-Only Client

Query balances, active campaigns, and treasury stats without connecting a wallet:

```typescript
import { SynArc, SYNARC_TESTNET } from 'synarc-agent-sdk';

const synarc = new SynArc({
  governorAddress: SYNARC_TESTNET.governor,
  treasuryAddress: SYNARC_TESTNET.treasuryGovernance,
  tokenAddress: SYNARC_TESTNET.token,
});

const balances = await synarc.getTreasuryBalance();
console.log(`Treasury: ${balances.usdc} USDC / ${balances.eurc} EURC`);
```

### 2. Autonomous Agent (Private Key)

Initialize with a hot-wallet private key for autonomous bots and scheduled agent routines:

```typescript
import { SynArc, SYNARC_TESTNET } from 'synarc-agent-sdk';

const synarc = new SynArc({
  ...SYNARC_TESTNET,
  privateKey: process.env.AGENT_PRIVATE_KEY as `0x${string}`,
});
```

### 3. Frontend dApp (Injected EIP-1193 Provider)

Initialize with MetaMask, Privy, or Circle embedded wallets:

```typescript
import { SynArc, SYNARC_TESTNET } from 'synarc-agent-sdk';

const synarc = new SynArc({
  ...SYNARC_TESTNET,
  provider: window.ethereum,
});
```

---

## Creator DAOs & Crowdfunding

Deploy and interact with milestone-gated Creator DAO escrow contracts.

### 1. Launch a Creator DAO

```typescript
const txHash = await synarc.createCreatorDAO({
  name: "Autonomous Art Studio",
  description: "Decentralized generative AI art studio on Arc Network",
  goalUSDC: 1000,
  durationDays: 30,
  template: "art",
  recipientWallet: "0xYourPayoutWalletAddress",
});

console.log(`Creator DAO deployed! Tx: ${txHash}`);
```

### 2. Fund a Campaign Escrow

```typescript
// Support an escrow campaign with 50 USDC
const txHash = await synarc.supportCreatorDAO("0xEscrowContractAddress", 50);
console.log(`Funded! Tx: ${txHash}`);
```

### 3. Backer Milestone Voting & Payouts

Backing capital remains milestone-gated inside the escrow:

```typescript
// 1. Backers vote to approve a completed milestone
const approveTx = await synarc.approveMilestone("0xEscrowContractAddress", 0);
console.log(`Voted to approve milestone! Tx: ${approveTx}`);

// 2. Creator withdraws milestone budget after approval (>50% support)
const withdrawTx = await synarc.withdrawMilestone("0xEscrowContractAddress", 0);
console.log(`Milestone budget withdrawn! Tx: ${withdrawTx}`);

// 3. Backers claim refund if campaign fails to reach goal before deadline
const refundTx = await synarc.claimRefund("0xEscrowContractAddress");
console.log(`Refund claimed! Tx: ${refundTx}`);
```

### 4. USDC Direct Nanopayments

Send instant micro-payments directly to any creator wallet on Arc:

```typescript
// Send $0.10 micro-support
await synarc.supportCreator("0xCreatorWalletAddress", 0.10);

// Autonomous agent rewards creator with $5.00
await synarc.supportCreator("0xCreatorWalletAddress", 5.00);
```

---

## Treasury Management & Balance Sync

### Sync Direct ERC-20 Transfers

When a treasury receives direct USDC transfers (e.g., from governance funding to the Agent Operating Treasury), trigger balance sync:

```typescript
import { SynArc, SYNARC_TESTNET, TREASURY_AGENT_ADDRESS } from 'synarc-agent-sdk';

const synarc = new SynArc({
  ...SYNARC_TESTNET,
  provider: window.ethereum,
});

// Sync on-chain accounting variables
const txHash = await synarc.syncBalance(TREASURY_AGENT_ADDRESS);
console.log(`Balances synced! Tx: ${txHash}`);
```

### Queue and Execute Timelocked Disbursements

```typescript
// 1. Queue withdrawal (initiates 24-hour timelock)
const queueTx = await synarc.queueWithdrawal({
  recipient: "0xRecipientAddress",
  amountUSDC: 250,
});
console.log(`Withdrawal queued! Tx: ${queueTx}`);

// 2. Execute withdrawal after 24h timelock delay has elapsed
const executeTx = await synarc.executeWithdrawal(0);
console.log(`Withdrawal executed! Tx: ${executeTx}`);
```

---

## Automated Treasury Guard & AI Agent

The **Automated Treasury Guard** monitors treasury health, handles automated sweep triggers, and coordinates Circle CCTP rebalances between Arc Testnet and Ethereum Sepolia.

```typescript
import { SynArc, SynArcTreasuryAgent, SYNARC_TESTNET } from 'synarc-agent-sdk';

const synarc = new SynArc({
  ...SYNARC_TESTNET,
  privateKey: process.env.AGENT_PRIVATE_KEY as `0x${string}`,
  rebalanceThresholdUSDC: 100, // Rebalance trigger threshold
});

const agent = new SynArcTreasuryAgent(synarc);

// Check treasury health and recommended actions
const health = await agent.monitorTreasury();
console.log("Treasury Health:", health.status);
console.log("Recommended Action:", health.recommendedAction);

// Trigger CCTP rebalance if threshold exceeded
if (health.recommendedAction === 'rebalance') {
  const txHash = await agent.triggerRebalance(50, synarc.config.treasuryAddress);
  console.log(`Rebalance initiated! Tx: ${txHash}`);
}
```

---

## Escrow Release Valve

The escrow release valve provides controlled, capped disbursements with role-based allowances and rate limits:

```typescript
// 1. Check release allowance for an address
const allowance = await synarc.checkReleaseAllowance("0xExecutorAddress");
console.log(`Available allowance: ${allowance} USDC`);

// 2. Authorize and claim release valve disbursement
const releaseTx = await synarc.releaseMilestone({ proposalId: 42, milestoneId: 1, invoiceHash: "0x..." });
console.log(`Disbursement claimed! Tx: ${releaseTx}`);
```

---

## On-Chain Governance & Voting

Participate in Syn DAO's OpenZeppelin-compatible governance protocol.

### 1. Create a Governance Proposal

```typescript
const proposalId = await synarc.propose({
  title: "Fund Autonomous Market Maker Development",
  description: "Disburse 500 USDC from Governance Treasury to fund liquidity agent research.",
  targetContract: SYNARC_TESTNET.treasuryGovernance,
  valueUSDC: 500,
  durationDays: 3,
});

console.log(`Proposal submitted! ID: ${proposalId}`);
```

### 2. Cast Programmatic Votes

```typescript
// Vote options: 0 = Against, 1 = For, 2 = Abstain
const voteTx = await synarc.castVote(
  proposalId,
  1, // For
  "Autonomous evaluation confirmed alignment with DAO roadmap"
);

console.log(`Vote cast! Tx: ${voteTx}`);
```

### 3. Delegate Voting Weight

```typescript
// Delegate sARC voting power to your wallet or a trusted delegate
const delegateTx = await synarc.delegate("0xDelegateAddress");
console.log(`Delegation set! Tx: ${delegateTx}`);
```

---

## Cross-Chain USDC Transfers (Circle CCTP)

Syn DAO natively routes USDC between Arc Testnet and Ethereum Sepolia without wrapped tokens using Circle's Cross-Chain Transfer Protocol (CCTP):

1. **Burn on Arc**: The agent or user initiates a `depositForBurn` via the Circle Token Messenger contract (`0xd0C3da4E20F0D24dB1cE8f1fF36814Ea8F60309e`).
2. **Iris Attestation**: The system queries Circle's Iris API for cryptographic validator attestations.
3. **Mint on Ethereum**: `receiveMessage` is executed on Sepolia to mint native USDC directly to the recipient wallet.

---

## Official Developer Resources

- **npm Package**: [npmjs.com/package/synarc-agent-sdk](https://www.npmjs.com/package/synarc-agent-sdk)
- **GitHub Repository**: [kellycryptos/synarc-agent-sdk](https://github.com/kellycryptos/synarc-agent-sdk)
- **Live Portal**: [syndaopro.xyz](https://www.syndaopro.xyz)
- **Documentation**: [syndaopro.xyz/docs/sdk](https://www.syndaopro.xyz/docs/sdk)
- **ArcScan Block Explorer**: [testnet.arcscan.app](https://testnet.arcscan.app)
