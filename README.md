<div align="center">

<img src="./public/logo.png" alt="SynArc Logo" width="100" height="100" />

# SynArc DAO

**SynArc is governance and funding infrastructure for the agentic economy, enabling creators, AI agents, and decentralized organizations to launch on-chain Creator DAOs, raise capital via USDC nanopayments ($0.01 minimum), and coordinate treasuries with milestone-based escrows on Arc.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![Arc Testnet](https://img.shields.io/badge/Arc_Testnet-5042002-7C3AED?style=for-the-badge)](https://arc.network)
[![Privy](https://img.shields.io/badge/Privy-Auth-FF6B6B?style=for-the-badge)](https://privy.io)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-Governor-4E5EE4?style=for-the-badge)](https://openzeppelin.com)
[![npm version](https://img.shields.io/npm/v/@synarc/agent-sdk?color=emerald&style=for-the-badge)](https://www.npmjs.com/package/@synarc/agent-sdk)

[**Launch App →**](https://www.synarcdao.xyz/) · [**Developer SDK Docs**](https://www.synarcdao.xyz/docs/sdk) · [**SDK GitHub**](https://github.com/kellycryptos/synarc-agent-sdk) · [**Arc Ecosystem**](https://arc.network)

</div>

---

## 1. Introduction

SynArc is governance and funding infrastructure for the agentic economy, enabling creators, AI agents, and decentralized organizations to launch on-chain Creator DAOs, raise capital via USDC nanopayments ($0.01 minimum), and coordinate treasuries with milestone-based escrows on Arc. The first multi-DAO governance and funding layer built natively on Arc with Circle's full stablecoin stack.

Designed for decentralized organizations, SynArc provides the full governance and funding lifecycle stack: from template-based Creator DAO launches and off-chain gasless voting to timelocked milestones and on-chain USDC execution.

SynArc is built for the **agentic economy**: a world where DAOs, autonomous agents, and programmable organizations coordinate and fund at scale without compromising operational security or member privacy.

Key features include:
*   **Creator Economy & Creator DAOs**: One-click template-based DAO launches for artists, developers, writers, and autonomous AI agents.
*   **USDC Nanopayments ($0.01+)**: Direct micro-tipping and creator support enabled by Arc's low-fee transactions.
*   **Confidential Governance**: Secure voting mechanisms that protect participant intent and delegate integrity.
*   **USDC-Native Treasury Coordination**: Real-time management and deployment of stablecoin reserves.
*   **Milestone Escrow & Backer Protection**: Funds are locked in smart contracts and released progressively upon community vote approval.
*   **Agentic Economy Alignment**: Native integration pathways for AI agents, multi-sig controls, and autonomous protocols to act as governance participants.

```
Proposal Creation ──> Off-Chain Signing ──> On-Chain Queue ──> Treasury Settlement
```

---

## 2. Vision

The next generation of decentralized organizations will require more than simple token-weighted voting. They demand:

*   **Confidential governance** — Vote without exposing your position to frontend frontrunning until consensus is reached, preserving market independence.
*   **USDC-native treasury coordination** — Eliminate currency risk for operational spending by coordinating entirely in stable, programmable capital.
*   **Programmable organizations** — Automate operational procedures and system parameters using Timelock and modular architecture.
*   **Agentic economy alignment** — Provide secure APIs, cryptographic delegation, and gasless voting pathways optimized for AI agents and autonomous protocols.
*   **Arc-native design** — Leverage Arc's high-performance, low-latency execution environment to power responsive, high-fidelity coordination tools.

SynArc is the infrastructure layer that makes this future possible today.

---

## 3. Features

### 🎨 Creator Economy
*   **⚡ Creator DAOs**: One-click launch of a fully on-chain Creator DAO — each with its own isolated, milestone-gated escrow contract deployed directly from your wallet.
*   **💸 USDC Nanopayments ($0.01 minimum)**: Instant micro-tipping and creator support enabled by Arc's ultra-low fee environment. Supporters can tip any amount, from $0.01 upward, directly to a creator's escrow.
*   **🏆 Creator Leaderboard**: Dynamic weekly / monthly / all-time rankings of top-performing creators by funds raised and backer count.
*   **👤 Creator Profile Pages**: Public, shareable creator profiles with preset donation buttons, native Web Share API integration, AI-driven audits, cover images, and live on-chain metrics.
*   **🔗 Share Links**: Every creator profile has a canonical shareable URL (`https://synarcdao.xyz/creator/[slug]`) with full Web Share API and clipboard fallback support.
*   **⚡ Crowdfund Hub**: Permissionless USDC crowdfunding for humans and AI agents — no platform gatekeeping.
*   **🤖 Autonomous Agent Fund**: AI-created campaigns with on-chain validation and ERC-8004 agent identity registration.
*   **🏦 Milestone Escrow**: Funds locked in isolated smart contracts and released progressively only upon community vote approval.
*   **💸 1:1 USDC Releases**: Direct stablecoin payouts to the beneficiary upon milestone approval — no intermediaries.

### 🏛️ Governance
*   **Proposals**: Create, discuss, and vote on governance proposals.
*   **Treasury**: Real-time management and analytics of DAO assets in USDC.
*   **Wallet Connect**: Hybrid wallet system supporting both Privy embedded wallets and Circle Programmable Wallets, giving users the choice between standard (social/Google/external) and fully gasless USDC-native governance participation.
*   **Arc Testnet Integration**: Native support for Arc Testnet with zero-latency execution.
*   **USDC Balance Display**: Real-time balance tracking and treasury visualization.
*   **Dashboard Analytics**: Governance participation metrics and voting trends.
*   **Responsive Design**: Mobile-first interface with glassmorphism effects.

---

## 4. Arc Ecosystem Alignment

SynArc is built natively for **Arc** — a high-performance, EVM-equivalent blockchain engineered to power the agentic economy.

| Arc Specification | Value |
| :--- | :--- |
| **Network Name** | Arc Testnet |
| **Chain ID** | `5042002` |
| **RPC URL** | `https://rpc.testnet.arc.network` |
| **Currency** | USDC |
| **Block Explorer** | [testnet.arcscan.app](https://testnet.arcscan.app) |
| **Fallback RPC 1** | `https://arc-testnet.drpc.org` |
| **Fallback RPC 2** | `https://5042002.rpc.thirdweb.com` |

Arc's dedicated focus on institutional-grade settlement, native USDC capital, and autonomous agent participation perfectly aligns with SynArc's governance framework.

### Canteen ARC CLI & Resilient RPC Fallbacks

SynArc is integrated with the **Canteen Builder Program**, providing personalized high-performance RPC connections and gasless transaction routing for all critical treasury and governance operations.

#### CLI Installation & Commands

To manage and retrieve your personalized Canteen RPC endpoints, install the Canteen ARC CLI tool:

```bash
# Install uv tool suite (if not present)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install the Canteen ARC CLI
uv tool install git+https://github.com/the-canteen-dev/ARC-cli
```

Once installed, use the following commands:
*   `arc-canteen login` - Log into your Canteen developer account.
*   `arc-canteen rpc-url` - Fetch your personalized, high-performance Arc RPC endpoint.
*   `arc-canteen update product` - Sync your latest product status with the Canteen registry.

#### Centralized 4-Endpoint RPC Resiliency Chain

To ensure uninterrupted uptime for our users and AI agents, the SynArc frontend implements a centralized sequential fallback resolver traversing four RPC nodes in priority order:
1.  **Personalized Canteen RPC** (`process.env.NEXT_PUBLIC_ARC_RPC_URL`)
2.  **Arc Testnet Public RPC** (`https://rpc.testnet.arc.network`)
3.  **dRPC Arc Testnet Node** (`https://arc-testnet.drpc.org`)
4.  **Thirdweb Arc Testnet Node** (`https://5042002.rpc.thirdweb.com`)

If the primary endpoint experiences rate limits or downtime, the system transparently loops through the fallback nodes to maintain client connectivity.

---

## 5. Governance Infrastructure

SynArc utilizes a modular, battle-tested governance stack that brings enterprise-level safety to on-chain organizations.

```
┌────────────────────────────────────────────────────────┐
│                     SynArc Protocol                    │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   Governor   │  │  Timelock    │  │  Treasury   │  │
│  │  (OZ Votes)  │──│ Controller  │──│  (USDC)     │  │
│  └──────────────┘  └──────────────┘  └─────────────┘  │
│           │                                  │         │
│  ┌──────────────┐                  ┌─────────────┐    │
│  │  Off-Chain   │                  │   Delegate   │    │
│  │   Voting     │                  │   Registry   │    │
│  └──────────────┘                  └─────────────┘    │
└────────────────────────────────────────────────────────┘
```

### Proposal Lifecycle
1.  **Creation**: Members with voting power above the `proposalThreshold` propose executable transactions on-chain.
2.  **Pending**: A configurable delay allows members to adjust delegations before voting snapshot is finalized.
3.  **Active**: Token holders cast votes (For, Against, or Abstain) cryptographically signed via their embedded wallets.
4.  **Passed**: Proposals meeting quorum and majority requirements are queued into the `TimelockController`.
5.  **Execution**: After the timelock delay expires, the proposed transactions are executed, dispersing funds or modifying configurations.

---

## 6. Treasury Coordination

SynArc coordinates and reports on DAO treasury assets entirely in **USDC**, ensuring predictable, low-volatility financial runway for organizations.

*   **Liquid Reserves**: Operating capital held in secure, highly liquid multisig vaults (Target: 82%).
*   **Yield Generation**: Capital placed in conservative yield-bearing platforms like Morpho to counter inflation (Target: 15%).
*   **Ecosystem Liquidity**: Deployed in automated market makers like ArcDEX to maintain token and LP stability (Target: 3%).

All treasury interactions are authorized strictly via successful governance outcomes, precluding single-point-of-failure vulnerabilities.

---

## 7. Tech Stack

### Frontend
*   **Framework**: [Next.js 15 (App Router)](https://nextjs.org)
*   **Language**: [TypeScript 5](https://typescriptlang.org)
*   **Styling**: [TailwindCSS 4](https://tailwindcss.com)
*   **Animations**: [Framer Motion 11](https://framer.com/motion)
*   **Design Tokens**: [shadcn/ui](https://ui.shadcn.com)
*   **State Management**: [Zustand](https://zustand-demo.pmnd.rs)

### Web3 Integration
*   **Authentication & Embedded Wallets**: [Privy](https://privy.io)
*   **Ethereum Provider Interface**: [Wagmi 2](https://wagmi.sh)
*   **Low-Level Client Library**: [Viem 2](https://viem.sh)

### Smart Contracts
*   **Governance Engine**: `SynArcGovernor` (inherits from [OpenZeppelin Governor](https://openzeppelin.com))
*   **Execution Delay**: `TimelockController` (OpenZeppelin)
*   **Voting Mechanism**: `SynArcToken` (ERC20Votes)
*   **Asset Management**: `SynArcTreasury` (EVM USDC multi-signature integration)
*   **Milestone Escrow**: `SynArcCrowdfund` (Dynamic stablecoin escrow with milestone locks and refund checks)
*   **AI Agent Wallet**: `SynArcAgent` (Autonomous ERC-8004 AI Agent execution contract)

### Network
*   **Execution Layer**: Arc Testnet


---

## 7a. Complete Tech Stack

**Frontend & Styling**:
- Next.js 15 - React framework with App Router
- TailwindCSS 4 - Utility-first CSS framework
- Framer Motion - Animation library

**Web3 Integration**:
- Privy - Authentication and embedded wallets
- ethers.js - Ethereum library (via Viem compatibility)
- Wagmi / Viem - Low-level web3 client

**Deployment**:
- Vercel - Hosting and deployment platform

---
## 8. Architecture

```
synarc-dao/
├── app/
│   ├── (dashboard)/          # Authenticated and protected application views
│   │   ├── dashboard/        # Main governance metrics & action cards
│   │   ├── proposals/        # Interactive proposal feed and creation wizard
│   │   └── treasury/         # Comprehensive treasury ledger and visual reports
│   ├── (marketing)/          # Public-facing brand presentation and landing views
│   │   └── page.tsx          # Homepage with integrated roadmap timeline
│   └── api/                  # API endpoints and background event webhooks
├── components/
│   ├── ui/                   # Reusable atomic design tokens (GlassCard, SynArcLogo, etc.)
│   ├── layout/               # Global page layouts, navigation components, and footers
│   ├── dashboard/            # Specialized widgets and telemetry cards
│   ├── proposals/            # Proposal creation, voting, and timeline sub-components
│   └── sidebar/              # Responsive sidebar navigation controls
├── hooks/
│   ├── useGovernanceStore.ts # Global Zustand state provider managing simulated states
│   ├── useUSDCBalance.ts     # Live balance fetcher utilizing ERC-20 contract interfaces
│   └── useSwitchArcNetwork.ts# Automated RPC configuration and chain-switching utility
├── lib/                      # Base configurations, utilities, and helper functions
├── providers/                # Top-level React wrappers (Web3, Privy, Theme)
└── styles/                   # Core Tailwind configurations and global styles
```

---

## 9. Roadmap

### Current (Phase 1 & Phase 2) — Active Testing & UI
*   **Phase 1 — Governance Frontend**:
    *   [x] Establish clean, modern landing pages and Arc-native aesthetics.
    *   [x] Build real-time analytics dashboard with deep data visualization.
    *   [x] Deploy responsive, mobile-optimized glassmorphic UI layout.
    *   [x] Build proposal submission and detail view pages.
*   **Phase 2 — Authentication Infrastructure**:
    *   [x] Integrate Privy authentication with custom app identifiers.
    *   [x] Enable secure embedded wallets with background keys.
    *   [x] Enable zero-gas cryptographic signature verification.
    *   [x] Integrate live balance polling from Arc Testnet nodes.
    *   [x] Crowdfund Hub prototype (milestone escrow, AI governance, human + agent campaigns)
    *   [x] SynArcCrowdfund escrow contract deployment and dynamic wallet compiler
    *   [x] Live USDC milestone escrow approvals and releases on-chain

### Upcoming (Phase 3 & Phase 4) — On-Chain Integration
*   **Phase 3 — Governance Contracts**:
    *   [x] Deploy custom OpenZeppelin Governor and ERC20Votes contracts on Arc Testnet.
    *   [x] Set up TimelockController logic with custom execution buffers.
    *   [x] Integrate actual EVM smart contract reads/writes into the UI (USDC, governor, and escrows).
    *   [x] Connect proposal submission directly to on-chain transactions.
*   **Phase 4 — Arc Ecosystem Integration**:
    *   [x] Coordinate real USDC-denominated treasury disbursements.
    *   [x] Connect autonomous AI agents to vote natively on active proposals and register identity.
    *   [x] Deploy on-chain delegate registries for frictionless delegation (ERC-8004 Trustless Agents integrated).

### Future (Phase 5) — Advanced Architecture
*   **Phase 5 — Confidential Governance**:
    *   [ ] Implement encrypted voting via Zero-Knowledge (ZK) proofs.
    *   [ ] Enable private coordinator sets to shield voting positions during voting periods.
    *   [x] Released `@synarc/agent-sdk` TypeScript SDK for seamless integration into other Arc ecosystem apps.
    *   [ ] Creator DAO mainnet graduation — move verified escrows to Arc Mainnet.
    *   [ ] Cross-DAO nanopayment routing — pay a creator on any DAO from any other.

### Planned Features
*   **Members**: Member management and delegation interfaces
*   **Analytics**: Advanced governance analytics and reporting
*   **Settings**: DAO configuration and parameter management
*   **Mainnet Integration**: Production deployment on Arc Mainnet for real-asset management


## 10. Deployment

## Live Deployment
https://www.synarcdao.xyz/

### Deploying to Vercel
1.  Install the Vercel CLI globally:
    ```bash
    npm install -g vercel
    ```
2.  Initiate deployment from the `synarc-dao` subfolder:
    ```bash
    vercel --prod
    ```
3.  In the Vercel project settings page, add the corresponding environment variables:
    *   `NEXT_PUBLIC_PRIVY_APP_ID`
    *   `NEXT_PUBLIC_RPC_URL`

### Privy Production Settings
1.  Log into your dashboard at [privy.io](https://privy.io).
2.  Add your production URL to the **Allowed Origins** whitelist.
3.  Ensure the "Embedded Wallets" toggle is set to `Enabled` under login methods.

---

## 11. Folder Structure

SynArc organizes its code base into high-cohesion, low-coupling directories to maximize development efficiency:

```
synarc-dao/
├── app/                      # Next.js 15 app router pages & api paths
├── components/               # UI components, layout models, sub-systems
├── contracts/                # Smart contract repositories (Hardhat/Foundry)
├── data/                     # Configuration JSONs and mock records
├── hooks/                    # Reusable React hooks (web3 connections, stores)
├── lib/                      # Client setup files, cryptographic utils
├── providers/                # React Global context wrappers
├── public/                   # Static images, icons, and assets
├── styles/                   # Global style sheets & Tailwind targets
├── types/                    # System-wide static type safety interfaces
├── utils/                    # Clean mapping and math helper functions
├── package.json              # Project packages and build scripts
└── tsconfig.json             # Compiler rules for TypeScript
```

---

## 12. Security Philosophy

SynArc is developed with a strict security-first mindset, preparing for institutional integration:

*   **Trustless Settlement**: The `TimelockController` acts as a non-bypassable barrier, ensuring all token holders have sufficient warning to withdraw funds if malicious updates pass.
*   **Decentralized Control**: No admin keys, multi-sigs, or backdoors. The governance smart contract is the sole owner of the treasury and other core protocol components.
*   **Non-Custodial Integrity**: User private keys are never transmitted, stored, or managed by the SynArc server layer. All cryptographic keys are secured directly via hardware and client-side systems using Privy.
*   **Mathematical Transparency**: All votes are verified cryptographically via ECDSA signatures on the client side, ensuring full provability of election inputs.
*   **Isolated Creator Escrows**: Every Creator DAO deploys its own independent `SynArcCrowdfund` escrow contract from the creator's wallet. No single contract holds funds for multiple creators — eliminating shared-contract attack surfaces.
*   **Permissionless Architecture**: Anyone can verify the escrow source code. Contract addresses are surfaced in the UI after deployment and linkable on [ArcScan](https://testnet.arcscan.app) for full on-chain transparency.

### Recent Security Improvements

| Area | Improvement | Status |
| :--- | :--- | :--- |
| **Escrow Isolation** | Each creator gets a fresh, independent contract deployment | ✅ Live |
| **On-Chain State Reads** | `totalRaised` and contributor counts read directly from chain via `viem` | ✅ Live |
| **RPC Resiliency** | 4-endpoint sequential fallback chain prevents single-point-of-failure | ✅ Live |
| **Verification Docs** | Hardhat CLI + ArcScan UI verification guide published in `docs/07-smart-contracts.md` | ✅ Live |
| **Pre-Audit Review** | Internal security review of Governor, Timelock, and Crowdfund contracts | 🔄 In Progress |
| **ZK Voting** | Encrypted ballots via Zero-Knowledge proofs | 🗓 Planned |

> ⚠️ **Warning**: SynArc's smart contracts are currently undergoing internal pre-audit reviews. Ensure proper testing on Arc Testnet before committing high-value operational reserves.

---

## 13. Future Plans

| Initiative | Timeline | Objectives |
| :--- | :--- | :--- |
| **Mainnet Transition** | Q3 2026 | Audited production deployment of Governor and Timelock Controller models on Arc Mainnet. |
| **Privacy Expansion** | Q4 2026 | Private coordinator election setups, ZK-Snark voting protocols, and secret ballot options. |
| **Autonomous Execution** | Q1 2027 | AI agent delegation layers with automated intent checking and programmable execution limits. |
| **Ecosystem Bridges** | Q2 2027 | Cross-chain governance links allowing remote treasury operations via safe bridges. |

---

## 14. License

This repository is licensed under the **MIT License**. Check [LICENSE](./LICENSE) for additional details.

---

## 15. Key Agent Features

### 🤖 Autonomous Treasury Agent
SynArc features a fully autonomous treasury agent deployed and verified on Arc Testnet at `0x4625f81f72dB9BfE78eAce6b0Da249658eBE64de`.
- **Real-Time Monitoring**: Automatically scans pool yields and active balances on-chain.
- **Groq Llama 3.3 Integration**: Generates professional rebalancing proposals autonomously when yield variances exceed parameters.
- **Interactive Agent Console**: A premium console on `/agent` to simulate logs, proposal generation, and cross-chain execution.
- **ERC-8004 Agent Standard**: Seamless registry of agent capabilities, owners, and reputation tracking.

### 🌉 Bidirectional Circle CCTP Bridge
A fully bidirectional stablecoin routing pipeline built natively with Circle CCTP:
- **Deposit (IN)**: Bridge native USDC from Ethereum Sepolia, Base Sepolia, Avalanche Fuji, and Solana Devnet directly into Arc Testnet.
- **Withdraw (OUT)**: Bridge USDC from Arc Testnet back to external EVM networks, changing user wallet chains dynamically.
- **Iris Consensus Polling**: Programmatic attestation polling with Sandbox Iris endpoints for secure, wrapper-free stablecoin burns and mints.

### Developer Agent SDK

Integrate autonomous agents and organizations programmatically using the **`@synarc/agent-sdk`** npm package:

```bash
npm install @synarc/agent-sdk
# or
yarn add @synarc/agent-sdk
```

```typescript
import { SynArcAgent } from '@synarc/agent-sdk';

const agent = new SynArcAgent({ rpcUrl: process.env.ARC_RPC_URL });
await agent.registerIdentity();
await agent.vote(proposalId, 1 /* For */);
```

- **Easy Integration**: Fully typed SDK for JavaScript/TypeScript agent runners.
- **Full Governance & Treasury**: Register agent identities on the ERC-8004 registry, self-delegate voting power, check and cast programmatic votes, and trigger timelocked treasury sweeps.
- **Creator DAO Support**: Programmatically launch Creator DAOs, contribute to escrows, and read live campaign metrics.
- **Multi-wallet Compatibility**: Works seamlessly with Circle Programmable Wallets, Privy, MetaMask, and WalletConnect.
- **Repository**: [kellycryptos/synarc-agent-sdk](https://github.com/kellycryptos/synarc-agent-sdk)
- **npm**: [@synarc/agent-sdk](https://www.npmjs.com/package/@synarc/agent-sdk)
- **Documentation**: [synarcdao.xyz/docs/sdk](https://www.synarcdao.xyz/docs/sdk)

---

<div align="center">

**Built for the Arc agentic economy.**

[Website](https://www.synarcdao.xyz/) · [Twitter](https://x.com/synarc_) · [GitHub](https://github.com/kellycryptos/SynArc) · [Arc Network](https://arc.network)

<sub>© 2026 SynArc. All rights reserved.</sub>

</div>
