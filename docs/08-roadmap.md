---
icon: road
---

# Project Roadmap

This section outlines Syn DAO's multi-phase roadmap towards providing secure funding, automated treasury protection, customizable governance, and native privacy rails on the Arc Network.

***

## Roadmap Milestones

### Phase 1: Frictionless Coordinator Onboarding

* **Status:** _Completed / Live_
* **Description:** Unified Web3 connectivity via RainbowKit, ConnectKit, WalletConnect (Reown), and Circle User-Controlled Smart Accounts with native USDC gas fees.

### Phase 2: Secure Milestone Escrows

* **Status:** _Completed / Live_
* **Description:** Lock capital in smart contract vaults released only as deliverable milestones are verified and approved by community vote.

### Phase 3: Delegated Community Voting

* **Status:** _Completed / Live_
* **Description:** OpenZeppelin ERC20Votes token model with checkpointed delegation and timelocked governor execution.

### Phase 4: Cross-Chain Funding & Bridging

* **Status:** _Completed / Live_
* **Description:** Native bidirectional Circle CCTP bridge (Arc to Ethereum, Base, Avalanche) without wrapper tokens or liquidity pools.

### Phase 5: One-Click Creator DAO Factory

* **Status:** _Completed / Live_
* **Description:** Deploy pre-configured templates with isolated escrows and on-chain telemetry.

### Phase 6: Automated Treasury Guard & Agent SDK

* **Status:** _Completed / Live_
* **Description:** Autonomous Treasury Agent rules (Auto Rebalancing, Auto Payments with timelocks, and Risk Monitoring) and public npm `synarc-agent-sdk` for programmatic integration across organizations, businesses, communities, and AI agents.

### Phase 7: Three-Way Match Release Valve & Arc Mainnet Deployment

* **Status:** _Completed / Live on Arc Mainnet (Chain ID 5042)_
* **Description:** Contract-enforced Three-Way Match release valve (`SynArcTreasury.sol`), 48h payee timelocked cooldown, idempotency bit-flip guard, Iris witness attestations, authentic IPFS pinning, and dual-agent adversarial mesh with forensic auditor. Releases $\le 50$ USDC are autonomous; $> 50$ USDC require mandatory human multisig signoff.

### Phase 7b: Autonomous Release Engine, cirBTC & High-Resilience Infrastructure

* **Status:** _Completed / Live on Arc Mainnet (October 2026)_
* **Description:** 
  - **Autonomous Milestone Release Engine**: AI agent independently scores project deliverables and triggers `releaseMilestone` on Arc Mainnet with a 950,000 gas limit and 30 Gwei gas price floor.
  - **Multi-Asset Treasury (cirBTC)**: Full treasury support for `cirBTC` alongside USDC and EURC with real-time balance tracking and allowance-protected deposit flows.
  - **High-Resilience CCTP Bridge Architecture**: Dedicated server-side balance proxy route (`/api/bridge/balance`) with 6-second in-memory caching, micro-balance UI precision, and multi-RPC fallback arrays (Base, Ethereum, Avalanche).
  - **RPC Resiliency & Store Batching**: Batched on-chain hydration (concurrency 3 with 50ms pauses) and increased timeouts (4.5s–8s) across `useCampaignStore`, `useCreatorStore`, and `useGovernanceStore` to eliminate RPC throttling.

### Phase 8: DeFi Yield Automation & Circle Alliance Rails

* **Status:** _Live / Operational_
* **Description:** Automated treasury yield sweeping into curated Morpho vaults on Arc via `@circle-fin/earn-kit`, Circle Programmable Wallets (passkeys and gasless paymaster sponsorship), and canonical Arc USDC settlement.

### Phase 9: ZK Privacy Layer (Coming Soon)

* **Status:** _In Active Development_
* **Description:**
  - **ZK Confidential Ballots (Shielded Voting)**: Zero-knowledge proofs (ZK-SNARKs) allowing DAO and organization members to prove voting eligibility and token weight without revealing wallet identity or exact holdings, eliminating voter intimidation and bandwagon bias.
  - **Shielded Treasury Disbursements**: Stealth address generation and private USDC milestone payouts for enterprise payroll, sensitive vendor contracts, and private grants.
  - **Selective Compliance View Keys**: Enterprise-grade viewing keys that allow authorized compliance auditors and tax authorities to inspect transaction proofs without exposing balances publicly.
