---
icon: terminal
---

# Agent SDK & Integration Framework

The Syn DAO Agent SDK (`synarc-agent-sdk`) is the unified programmatic interface for **Organizations**, **Businesses**, **Communities**, and **Autonomous AI Agents** to coordinate capital, deploy milestone escrows, determine custom governance voting weights, and interact with the Arc Network and Circle ecosystem.

---

## Architectural Blueprints: Who Uses the SDK?

The SDK is designed to be modular and role-agnostic. Whether coordinating a corporate treasury, bootstrapping a creator collective, or deploying autonomous AI agent financial loops, the SDK provides purpose-built abstractions:

### 1. Organizations & Enterprise
* **Dual-Treasury Governance**: Maintain a community-visible, timelocked reserve treasury alongside a fast-access operating account.
* **Document-Anchored Vendor Settlements**: Enforce the **Three-Way Match Release Valve** (`SynArcTreasury.sol`). Every capital outflow requires contract-level agreement between the on-chain governance order, an authentic IPFS deliverable CID, and the registered payee address.
* **Anti-Tamper Payroll**: Enforce a mandatory 48-hour cooldown on payee address modifications to neutralize prompt-injection and unauthorized address substitution attacks.
* **Separation of Duties**: Micro-payments ($\le 50$ USDC) can execute autonomously under policy; any disbursement exceeding 50 USDC automatically halts on-chain for mandatory human multi-sig review.

### 2. Businesses & SMBs
* **Milestone-Gated Client Escrows**: Deploy isolated milestone-escrow contracts (`createCreatorDAO` / `SynArcCrowdfund`) for client retainers, SaaS delivery contracts, and consulting milestones. Capital is released only when milestones are verified.
* **Zero-Slippage Cross-Chain Payments**: Accept native USDC from clients on Ethereum, Base, or Avalanche and route funds 1:1 to Arc via native **Circle CCTP** burn-and-mint without wrapper tokens or liquidity pool fees.
* **Non-Custodial Working Capital Yield**: Put idle corporate treasury reserves to work in curated Morpho vaults on Arc via `SynArcEarn` (`@circle-fin/earn-kit`).

### 3. Communities & DAOs
* **Delegated Checkpointed Governance**: Full OpenZeppelin `ERC20Votes` support with snapshot-based delegation, preventing flash-loan double-voting attacks.
* **Creator DAO Launchpads**: Launch decentralized crowdfunds with customized durations, funding goals, and transparent milestone tracking.
* **Verifiable Grant Distributions**: Disburse ecosystem grants with public deliverable verification, transparent on-chain voting, and real-time execution telemetry.

### 4. Autonomous AI Agents
* **Autonomous Operating Accounts**: Grant AI agents programmatic wallets capable of executing sub-cap disbursements ($\le 50$ USDC) and rebalancing routines with zero human latency.
* **On-Chain Agent Identity (ERC-8004)**: Register agent metadata, capabilities, and owner addresses in the canonical on-chain Agent Registry (`0x8004A818BFB912233c491871b3d84c89A494BD9e`).
* **Automated Treasury Guard**: Continuous health monitoring, automated sweep triggers, and cross-chain rebalancing between Arc and Ethereum Sepolia via `SynArcTreasuryAgent`.
* **Idempotency Protection**: Hardware-style on-chain bit-flip guards eliminate replay attacks and accidental duplicate disbursements.

---

## Customizing Governance & Determining Voting Weight

The Syn DAO governance protocol provides granular customizability over how voting weight is computed, how proposals pass, and how execution timelocks operate.

### How Voting Weight is Determined On-Chain

By default, Syn DAO combines check-pointed governance tokens with real economic participation:

1. **Checkpointed sARC Tokens (`ERC20Votes`)**:
   - 1 delegated `sARC` = 1 base vote.
   - Balances are check-pointed by block height (`getPastVotes(account, blockNumber)`). Voting power is determined at the proposal snapshot block, making flash-loan manipulation impossible.
   - Token holders must delegate voting weight (either to themselves or a representative) before the proposal creation block to participate.

2. **USDC Economic Weighting Multiplier**:
   - In community and creator escrows, voting weight can factor in stable asset holdings or contribution amounts, aligning decision-making power with direct economic commitment.

### Pluggable Voting Weight Strategies

Developers integrating the SDK can implement custom voting weight strategies on top of the Governor contracts:

```typescript
import { SynArc, SYNARC_MAINNET } from 'synarc-agent-sdk';

const synarc = new SynArc({
  ...SYNARC_MAINNET,
});

/**
 * Strategy 1: Standard Token-Weighted (Default)
 * Direct check-pointed snapshot balance at proposal creation block.
 */
async function getTokenWeight(address: string, snapshotBlock: bigint): Promise<bigint> {
  return await synarc.getPastVotes(address, snapshotBlock);
}

/**
 * Strategy 2: Quadratic Voting Calculation
 * Voting Weight = sqrt(sARC Tokens)
 * Amplifies grassroots participation and dampens plutocratic whale dominance.
 */
function calculateQuadraticWeight(tokenBalanceRaw: bigint): bigint {
  if (tokenBalanceRaw < 0n) throw new Error("Negative balance");
  if (tokenBalanceRaw < 2n) return tokenBalanceRaw;
  let x0 = tokenBalanceRaw / 2n;
  let x1 = (x0 + tokenBalanceRaw / x0) / 2n;
  while (x1 < x0) {
    x0 = x1;
    x1 = (x0 + tokenBalanceRaw / x0) / 2n;
  }
  return x0;
}

/**
 * Strategy 3: Multi-Asset Weighted Blended Index
 * Combines sARC governance tokens, USDC gas reserves, EURC, and cirBTC:
 * Score = (sARC * 1.0) + (USDC * 0.5) + (EURC * 0.5) + (cirBTC_USD * 1.2)
 */
interface AssetBalances {
  sarc: number;
  usdc: number;
  eurc: number;
  cirBtcUsd: number;
}

function calculateBlendedVotingPower(balances: AssetBalances): number {
  return (
    balances.sarc * 1.0 +
    balances.usdc * 0.5 +
    balances.eurc * 0.5 +
    balances.cirBtcUsd * 1.2
  );
}

/**
 * Strategy 4: Reputation & Soulbound Agent Credentials
 * Queries ERC-8004 Agent Registry or soulbound badges to multiply voting weight.
 */
async function getAgentReputationMultiplier(agentAddress: string): Promise<number> {
  const isRegistered = await synarc.isRegisteredAgent(agentAddress);
  // Verified registered autonomous agents receive a 1.25x validation multiplier
  return isRegistered ? 1.25 : 1.0;
}
```

### Customizing Governance Execution Parameters

When deploying or configuring a DAO instance via the SDK, developers can configure:
* **Proposal Threshold**: Minimum `sARC` required to submit a proposal (default: `1,000 sARC`).
* **Voting Delay**: Number of blocks between proposal creation and voting start (default: `1 block`).
* **Voting Period**: Duration of the active voting window (e.g., `3 days` or `7 days`).
* **Quorum Fraction**: Percentage of total supply required for a valid vote (default: `4%`).
* **Timelock Delay**: Grace buffer between vote success and on-chain execution (default: `48 hours` on Mainnet, `24 hours` on Testnet).

---

## Privacy Roadmap: Shielded Governance & Private Disbursements (Coming Soon)

To support sensitive enterprise payroll, private corporate governance, and confidential contributor compensation, Syn DAO is developing native zero-knowledge privacy extensions for Arc:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SYN DAO PRIVACY ROADMAP (V3)                       │
├────────────────────────────────┬────────────────────────────────────────┤
│ 1. ZK Confidential Ballots     │ • Vote casting via ZK-SNARK proofs    │
│    (Private Governance)        │ • Verify weight without balance leak   │
│                                │ • Homomorphic on-chain tallying        │
├────────────────────────────────┼────────────────────────────────────────┤
│ 2. Shielded Disbursements      │ • Stealth addresses for payouts        │
│    (Confidential Payroll)      │ • Zero-knowledge vendor invoices       │
│                                │ • Shielded USDC grants & milestones    │
├────────────────────────────────┼────────────────────────────────────────┤
│ 3. Selective Compliance Keys   │ • Exportable viewing keys for audits   │
│    (Enterprise-Ready)          │ • Cryptographic proofs for tax/AML     │
└────────────────────────────────┴────────────────────────────────────────┘
```

### 1. Zero-Knowledge Confidential Ballots (ZK-SNARK Voting)
* **Problem**: Public voting exposes token holdings and opens delegates to targeted lobbying, front-running, and voter intimidation.
* **Solution**: Voters generate a client-side ZK-SNARK proof demonstrating they hold voting weight exceeding a threshold at the snapshot block without revealing their wallet address or exact balance.
* **Result**: Complete ballot confidentiality with mathematical auditability on-chain.

### 2. Shielded Treasury Disbursements & Stealth Payroll
* **Problem**: Public block explorers expose exact vendor payments, executive payroll, and strategic contractor retainers to competitors.
* **Solution**: The Release Valve will support stealth address derivation and shielded USDC transfers on Arc, enabling private disbursements while maintaining on-chain proof of invoice fulfillment.

### 3. Selective Compliance Viewing Keys
* **Enterprise Compliance**: Privacy without illicit opacity. Organizations can generate selective cryptographic viewing keys, allowing authorized auditors or tax authorities to decrypt specific disbursement histories on demand.

---

## Circle Alliance Ecosystem & Core Rails

Syn DAO is an official member of the **Circle Alliance** ([partners.circle.com/partner/syn-dao](https://partners.circle.com/partner/syn-dao)), delivering native stablecoin infrastructure directly on Arc:

* **Canonical Arc USDC**: Native Circle USDC serves as the primary gas and settlement asset on Arc (`0x3600000000000000000000000000000000000000`). No wrapped synthetic equivalents.
* **Circle CCTP (Cross-Chain Transfer Protocol)**: Native burn-and-mint bridge connecting Arc with Ethereum, Base, and Avalanche. Rebalances and transfers clear 1:1 with cryptographic attestation consensus from Circle's Iris oracle.
* **Circle App Kit & Programmable Wallets**: Web3 Services (W3S) integration providing seamless passkey authentication, social onboarding, and gasless sponsored transactions via paymaster relayers.
* **Circle Earn Kit & Morpho Vaults**: Direct integration with curated Morpho DeFi vaults on Arc for automated treasury yield generation via `SynArcEarn`.

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
- Arc Mainnet RPC (`https://rpc.mainnet.arc.io`) or Arc Testnet RPC (`https://rpc.testnet.arc.network`)

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

---

## Client Initialization

The SDK is EVM-agnostic and connects with WalletConnect, Circle Programmable Wallets, MetaMask, Rabby, Coinbase Wallet, or raw private keys.

### 1. Read-Only Client (Arc Mainnet — Default)

Query live production balances, active campaigns, and treasury stats:

```typescript
import { SynArc, SYNARC_MAINNET } from 'synarc-agent-sdk';

const synarc = new SynArc({
  network: 'mainnet',
  ...SYNARC_MAINNET,
});

// Read treasury balance
const balance = await synarc.getTreasuryBalance();
console.log(`Mainnet Reserves: ${balance.usdc} USDC / ${balance.eurc} EURC`);
```

### 2. Browser Client (EIP-1193 Provider)

Connect with user-injected browser wallets (MetaMask, Rabby, RainbowKit):

```typescript
import { SynArc, SYNARC_MAINNET } from 'synarc-agent-sdk';

const synarc = new SynArc({
  network: 'mainnet',
  ...SYNARC_MAINNET,
  provider: window.ethereum,
});
```

### 3. Headless Node.js / AI Agent Client (Private Key)

For autonomous backends, trading bots, and Treasury Guard daemons:

```typescript
import { SynArc, SYNARC_MAINNET } from 'synarc-agent-sdk';

const synarc = new SynArc({
  network: 'mainnet',
  ...SYNARC_MAINNET,
  privateKey: process.env.AGENT_PRIVATE_KEY as `0x${string}`,
});
```

---

## Creator & Business Escrows (`createCreatorDAO`)

Deploy isolated milestone-gated escrow contracts for client engagements or community crowdfunds:

```typescript
const txHash = await synarc.createCreatorDAO({
  name: "Enterprise AI Security Audit",
  description: "Milestone-locked consulting escrow for smart contract verification.",
  goalUSDC: 2500,
  durationDays: 30,
  recipientWallet: "0xVendorAddress...",
  template: "software",
});
console.log(`Escrow deployed! Tx: ${txHash}`);
```

---

## Escrow Release Valve & Three-Way Match

The Release Valve (`SynArcTreasury.sol`) enforces that funds cannot leave the treasury without cryptographic agreement:

```typescript
// 1. Dry-run zero-gas release simulation
const simulation = await synarc.simulateRelease({
  proposalId: 42n,
  milestoneId: 1n,
  documentHash: "0x8f1234abcd...", // Keccak256 hash of IPFS deliverable CID
  invoiceHash: "0x9e5678ef01...",
  amountUSDC: 25,
  recipient: "0xRecipientAddress...",
});

// 2. Execute release under the 50 USDC policy cap
if (simulation.canRelease) {
  const releaseTx = await synarc.releaseMilestone({
    proposalId: 42n,
    milestoneId: 1n,
    documentHash: "0x8f1234abcd...",
    invoiceHash: "0x9e5678ef01...",
    amountUSDC: 25,
    recipient: "0xRecipientAddress...",
  });
  console.log(`Disbursement confirmed! Tx: ${releaseTx}`);
}
```

---

## Automated Treasury Guard & AI Agent

The Automated Treasury Guard monitors treasury health and executes automated sweep and rebalancing rules:

```typescript
import { SynArc, SynArcTreasuryAgent, SYNARC_TESTNET } from 'synarc-agent-sdk';

const synarc = new SynArc({
  ...SYNARC_TESTNET,
  privateKey: process.env.AGENT_PRIVATE_KEY as `0x${string}`,
  rebalanceThresholdUSDC: 100,
});

const agent = new SynArcTreasuryAgent(synarc);

// Monitor treasury status
const health = await agent.monitorTreasury();
console.log("Treasury Health:", health.status);

// Trigger CCTP rebalance if recommended
if (health.recommendedAction === 'rebalance') {
  const txHash = await agent.triggerRebalance(50, synarc.config.treasuryAddress);
  console.log(`Rebalance tx: ${txHash}`);
}
```

---

## Arc Earn & DeFi Vaults (`SynArcEarn`)

Interact with curated Morpho vaults on Arc Network via Circle Earn Kit:

```typescript
import { SynArc, SynArcEarn, SYNARC_MAINNET } from 'synarc-agent-sdk';

const synarc = new SynArc({
  network: 'mainnet',
  ...SYNARC_MAINNET,
  privateKey: process.env.AGENT_PRIVATE_KEY as `0x${string}`,
});

const earn = new SynArcEarn(synarc);

// 1. Explore available yield vaults
const vaults = await earn.exploreVaults();

// 2. Deposit idle USDC into vault
const depositTx = await earn.deposit("0xVaultAddress...", 100);

// 3. Read current earning position
const position = await earn.getPosition("0xVaultAddress...", synarc.account?.address);
console.log(`Current Position: ${position.assets} USDC`);
```

---

## Official Developer Resources

- **Circle Alliance Partner Page**: [partners.circle.com/partner/syn-dao](https://partners.circle.com/partner/syn-dao)
- **npm Package**: [npmjs.com/package/synarc-agent-sdk](https://www.npmjs.com/package/synarc-agent-sdk)
- **GitHub Repository**: [kellycryptos/SynArc](https://github.com/kellycryptos/SynArc)
- **Official Documentation**: [syndaopro.xyz/docs/sdk](https://www.syndaopro.xyz/docs/sdk)
- **YouTube Channel**: [@syndaopro](https://youtube.com/@syndaopro)
- **Official X (Twitter)**: [@syndaopro](https://x.com/syndaopro)
