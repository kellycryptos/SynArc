---
icon: road
---

# Project Roadmap

This section outlines Syn DAO's multi-phase roadmap towards providing secure funding, automated treasury protection, and seamless community coordination tools.

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
* **Description:** Autonomous Treasury Agent rules (Auto Rebalancing, Auto Payments with timelocks, and Risk Monitoring) and public npm `synarc-agent-sdk` for programmatic integration.

### Phase 7: Three-Way Match Release Valve & Arc Mainnet Deployment (Tameion)

* **Status:** _Completed / Live on Arc Mainnet (Chain ID 5042)_
* **Description:** Contract-enforced Three-Way Match release valve (`SynArcTreasury.sol`), 48h payee timelocked cooldown, idempotency bit-flip guard, Iris witness attestations, authentic IPFS pinning, and dual-agent adversarial mesh with forensic auditor. Releases $\le 50$ USDC are autonomous; $> 50$ USDC require mandatory human multisig signoff.

### Phase 8: DeFi Yield Automation & ZK Privacy

* **Status:** _In Progress / Planned_
* **Description:** Conservative stablecoin yield sweeps into Morpho/Aave vaults via agent rules, and ZK-snark private governance ballots.
