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

### Arc Mainnet — Production (`chainId: 5042`)

| Configuration / Contract | Value / Address | Description |
|:---|:---|:---|
| **Chain ID** | `5042` | Arc Mainnet Identifier |
| **RPC Endpoint** | `https://rpc.mainnet.arc.io` | Official Arc Mainnet RPC Endpoint |
| **SynArcTreasury (Release Valve)** | `0x8205e9782Fe54fD2aaD895b436B695db169F3d7B` | Three-Way Match Release Valve, Payee Cooldown & Idempotency Guard |
| **SynArcGovernor** | `0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025` | Document-Anchored Governance Engine (48h timelock) |
| **SynArcToken (sARC)** | `0x8f4b429794ABa4607d177b100Cc5e481D22d0ad4` | Primary Governance Token |
| **Authorized Operator Agent** | `0x88BdF819466C1802ce6C780a9fbdF3A314cab07D` | Autonomous AI Agent executing under-cap releases & rebalances |
| **Agent Release Cap** | `50.00 USDC` (`50_000_000 micro-USDC`) | Enforced on-chain: releases $\le 50$ autonomous; $> 50$ require human review |
| **Canonical USDC** | `0x3600000000000000000000000000000000000000` | Native Circle USDC (gas token) |
| **Canonical EURC** | `0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1` | Native Circle EURC on Arc Mainnet |
| **CCTP Token Messenger** | `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` | Production Circle CCTP Token Messenger |
| **CCTP Message Transmitter** | `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64` | Production Circle CCTP Message Transmitter |
| **Crowdfund Escrow Template** | `0xd5374DFC4B01F60115A52Df027704062506b3030` | Deploys new campaign milestone escrows |
| **Authorized Human Reviewer** | `0xE819090D7810D89f2E86e167d0b58425dEd745D8` | Deployer EOA registered on-chain for emergency signoff |

### Arc Testnet — Developer Sandbox (`chainId: 5042002`)

| Configuration / Contract | Value / Address | Description |
|:---|:---|:---|
| **Chain ID** | `5042002` | Arc Testnet Chain Identifier |
| **RPC Endpoint** | `https://rpc.testnet.arc.network` | Primary RPC endpoint for testnet calls |
| **SynArcGovernor** | `0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e` | Governance proposal and voting controller |
| **Governance Treasury (`treasuryGovernance`)** | `0xFE0F6bF45D363d34CD5fC1781594a7471736dC18` | Timelocked treasury for core DAO balances |
| **Agent Operating Treasury (`treasuryAgent`)** | `0xE6bAC65d7f060B805B8dd6f1c4DBfa6571905f28` | Fast-access agent operating reserves |
| **Crowdfund Escrow Factory** | `0xd5374DFC4B01F60115A52Df027704062506b3030` | Deploys campaign milestone escrows |
| **SynArcToken (sARC)** | `0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e` | Primary governance voting weight token |
| **EURC Token** | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` | EURC stablecoin contract address |
| **USDC (Gas Token)** | `0x3600000000000000000000000000000000000000` | Native USDC stablecoin for fee payment |
| **Treasury Agent Contract** | `0x88BdF819466C1802ce6C780a9fbdF3A314cab07D` | On-chain autonomous agent rules executor |
| **CCTP Token Messenger** | `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` | Circle CCTP Token Messenger address |
| **CCTP Message Transmitter** | `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` | Circle CCTP Message Transmitter address |
| **ERC-8004 Agent Registry** | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | Agent on-chain identity registry |

### Two-Treasury Architecture

Syn DAO uses two distinct treasury contracts by design:

- **Governance Treasury** (`0x8205...` on Mainnet, `0xFE0F...` on Testnet) — The community-visible, timelocked treasury. All user-facing balance displays, governance proposals, and dashboard stats read from this contract. Withdrawals require a passing governance vote and a 24-48 hour timelock delay.
- **Agent Operating Treasury** (`0x88Bd...` on Mainnet, `0xE6bA...` on Testnet) — Used exclusively by the autonomous treasury agent for instant CCTP rebalances and under-cap payouts ($\le 50$ USDC). Funded via governance-approved transfers from the main treasury.

Import addresses and network constants directly from the SDK:
```typescript
import { 
  SYNARC_MAINNET, 
  SYNARC_TESTNET, 
  MAINNET_TREASURY_ADDRESS, 
  TREASURY_GOVERNANCE_ADDRESS 
} from 'synarc-agent-sdk';
```

---

## Client Initialization

The SDK is EVM-agnostic and connects seamlessly with WalletConnect, Circle Programmable Wallets, MetaMask, Rabby, Coinbase Wallet, or raw private keys.

### 1. Read-Only Client (Arc Mainnet — Default)

Query live production balances, active campaigns, and treasury stats:

```typescript
import { SynArc, SYNARC_MAINNET } from 'synarc-agent-sdk';

const synarc = new SynArc({
  network: 'mainnet',
  governorAddress: SYNARC_MAINNET.governor,
  treasuryAddress: SYNARC_MAINNET.treasuryGovernance,
  tokenAddress: SYNARC_MAINNET.token,
  usdcAddress: SYNARC_MAINNET.usdc,
});

const balances = await synarc.getTreasuryBalance();
console.log(`Mainnet Treasury: ${balances.usdc} USDC | ${balances.eurc} EURC`);
```

### 2. Autonomous Agent (Private Key)

Initialize with a hot-wallet private key for autonomous bots, scheduled agent routines, and under-cap releases:

```typescript
import { SynArc, SYNARC_MAINNET } from 'synarc-agent-sdk';

const synarc = new SynArc({
  network: 'mainnet',
  ...SYNARC_MAINNET,
  privateKey: process.env.AGENT_PRIVATE_KEY as `0x${string}`,
});
```

> 💡 **Developer Sandbox (Arc Testnet)**: Pass `network: 'testnet'` and `...SYNARC_TESTNET` to run against Arc Testnet (`chainId: 5042002`).

### 3. Frontend dApp (Injected EIP-1193 Provider)

Initialize with MetaMask, Rabby, Rainbow, or Circle embedded wallets:

```typescript
import { SynArc, SYNARC_MAINNET } from 'synarc-agent-sdk';

const synarc = new SynArc({
  network: 'mainnet',
  ...SYNARC_MAINNET,
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

## Arc Earn & DeFi Vaults (`SynArcEarn`)

The `SynArcEarn` module enables autonomous agents and DAO operators to interact directly with curated Morpho vaults on Arc Mainnet and Testnet via Arc App Kit:

```typescript
import { SynArc, SynArcEarn, SYNARC_MAINNET } from 'synarc-agent-sdk';

const synarc = new SynArc({
  network: 'mainnet',
  ...SYNARC_MAINNET,
  privateKey: process.env.AGENT_PRIVATE_KEY as `0x${string}`,
});

const earn = new SynArcEarn(synarc);

// 1. Explore available curated yield vaults on Arc
const vaults = await earn.exploreVaults();
console.log("Available Vaults:", vaults);

// 2. Deposit idle treasury USDC into a Morpho vault
const depositTx = await earn.deposit("0xVaultAddress...", 100);
console.log(`Deposited into vault! Tx: ${depositTx}`);

// 3. Read current earning position and accrued yield
const position = await earn.getPosition("0xVaultAddress...", synarc.account?.address);
console.log(`Current Position: ${position.assets} USDC (Shares: ${position.shares})`);

// 4. Withdraw principal or yield back to the treasury
const withdrawTx = await earn.withdraw("0xVaultAddress...", 50);
console.log(`Withdrawn to treasury! Tx: ${withdrawTx}`);
```

---

## Escrow Release Valve & Three-Way Match

The escrow release valve (`SynArcTreasury.sol`) enforces contract-level agreement between the Governor order terms, an authentic IPFS deliverable CID, and the payee's claim:

- **$\le 50.00$ USDC Autonomous Track**: Authorized AI agents can trigger micro-disbursements instantly without manual review.
- **$> 50.00$ USDC Human Review Gate**: Larger disbursements halt on-chain with `HumanApprovalRequired` and require explicit signoff via `approveReleaseHuman` by a designated reviewer or Governor timelock.
- **Payee Timelocked Cooldown (48h)**: Beneficiary address changes require a mandatory 48-hour cooldown to defeat prompt-injection address substitution attacks.
- **Idempotency Guard**: Deterministic on-chain bit flips ensure the exact same release cannot execute twice.

```typescript
// 1. Check on-chain agent release cap (50 USDC)
const cap = await synarc.getAgentReleaseCap();
console.log(`On-chain agent release cap: ${cap} USDC`);

// 2. Dry-run zero-gas release simulation (Ghostfolio pattern)
const simulation = await synarc.simulateRelease({
  proposalId: 42n,
  milestoneId: 1n,
  documentHash: "0x8f1234abcd...", // Keccak256 hash of IPFS deliverable CID
  invoiceHash: "0x9e5678ef01...",
  amountUSDC: 25,
  recipient: "0xRecipientAddress...",
});
console.log(`Simulation result (code ${simulation.code}):`, simulation.canRelease);

// 3. Execute milestone release under policy cap
const releaseTx = await synarc.releaseMilestone({
  proposalId: 42n,
  milestoneId: 1n,
  documentHash: "0x8f1234abcd...",
  invoiceHash: "0x9e5678ef01...",
  amountUSDC: 25,
  recipient: "0xRecipientAddress...",
});
console.log(`Disbursement released! Tx: ${releaseTx}`);
```

---

## On-Chain Governance & Voting

Participate in Syn DAO's OpenZeppelin-compatible governance protocol.

### 1. Create a Governance Proposal

```typescript
const proposalId = await synarc.propose({
  title: "Fund Autonomous Market Maker Development",
  description: "Disburse 500 USDC from Governance Treasury to fund liquidity agent research.",
  targetContract: SYNARC_MAINNET.treasuryGovernance,
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

## Cross-Chain USDC Transfers (Circle CCTP & Bridge Kit)

Syn DAO natively routes USDC between Arc (Mainnet/Testnet) and external chains (Ethereum, Base, Avalanche) without wrapped tokens using Circle's Cross-Chain Transfer Protocol (CCTP) and Circle Bridge Kit:

1. **Burn on Arc**: The agent or user initiates a `depositForBurn` via the canonical Circle Token Messenger contract (`0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` on Mainnet, `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` on Testnet).
2. **Iris Attestation**: The system queries Circle's Iris API for cryptographic validator attestations.
3. **Mint on Destination**: `receiveMessage` is executed on the target network to mint 1:1 native USDC directly to the recipient wallet. Immediate pending tracking and CCTP recovery tooling ensure no transfers are lost.

---

## Official Developer Resources

- **npm Package**: [npmjs.com/package/synarc-agent-sdk](https://www.npmjs.com/package/synarc-agent-sdk)
- **GitHub Repository**: [kellycryptos/synarc-agent-sdk](https://github.com/kellycryptos/synarc-agent-sdk)
- **Live Portal**: [syndaopro.xyz](https://www.syndaopro.xyz)
- **Documentation**: [syndaopro.xyz/docs/sdk](https://www.syndaopro.xyz/docs/sdk)
- **ArcScan Block Explorer**: [testnet.arcscan.app](https://testnet.arcscan.app)
