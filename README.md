<div align="center">

<img src="./public/logo.png" alt="SynArc Logo" width="100" height="100" />

# SynArc

**Confidential governance infrastructure for the agentic economy on Arc.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![Arc Testnet](https://img.shields.io/badge/Arc_Testnet-5042002-7C3AED?style=for-the-badge)](https://arc.network)
[![Privy](https://img.shields.io/badge/Privy-Auth-FF6B6B?style=for-the-badge)](https://privy.io)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-Governor-4E5EE4?style=for-the-badge)](https://openzeppelin.com)

[**Launch App →**](https://synarc-dao.vercel.app) · [**Documentation**](https://docs.arc.network) · [**Arc Ecosystem**](https://arc.network)

</div>

---

## 1. Introduction

SynArc is a governance coordination protocol built for the Arc ecosystem, enabling decentralized organizations to manage proposals, treasury coordination, and programmable governance infrastructure through a modern Arc-native interface.

Designed for institutional-grade decentralized organizations, SynArc provides the full governance lifecycle stack: from on-chain proposal creation and off-chain gasless voting to treasury execution and confidential coordination — all denominated natively in USDC.

SynArc is built for the **agentic economy**: a world where DAOs, autonomous agents, and programmable organizations coordinate at scale without compromising operational security or member privacy.

Key features include:
*   **Confidential Governance**: Secure voting mechanisms that protect participant intent and delegate integrity.
*   **USDC-Native Treasury Coordination**: Real-time management and deployment of stablecoin reserves.
*   **Proposal Execution**: Automated and programmable governance execution through timelock controller modules.
*   **Programmable Organizations**: Modular and composable smart contract building blocks for decentralized organizations.
*   **Governance Infrastructure**: A complete stack encompassing smart contracts, indexers, state management, and an interactive front-end.
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

*   **Governance Dashboard**: Real-time overview of active and historical proposals, system participation rates, and treasury distributions.
*   **Proposal System**: Comprehensive interface for drafting, submitting, voting, and queuing proposals.
*   **Treasury Analytics**: Dynamic charts detailing liquid USDC reserves, yield-bearing positions, and transaction ledgers.
*   **Proposal Execution**: Simulated and verified on-chain execution with precise treasury impact calculations.
*   **Arc Testnet Support**: Zero-latency interaction with the official Arc Testnet environment.
*   **Privy Authentication**: Multi-method onboarding with social login, email, and external wallet connections.
*   **Embedded Wallet Infrastructure**: Non-custodial embedded wallets powered by Privy for zero-friction user onboarding.
*   **Responsive Governance UI**: Visually stunning, mobile-first design leveraging modern glassmorphism.
*   **Light/Dark Theme System**: Optimized reading and voting environments designed to minimize user fatigue.
*   **Modular DAO Architecture**: Extensible design structure that cleanly separates state, UI views, and smart contract layers.

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

### Network
*   **Execution Layer**: Arc Testnet

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

### Upcoming (Phase 3 & Phase 4) — On-Chain Integration
*   **Phase 3 — Governance Contracts**:
    *   [ ] Deploy custom OpenZeppelin Governor and ERC20Votes contracts on Arc Testnet.
    *   [ ] Set up TimelockController logic with custom execution buffers.
    *   [ ] Integrate actual EVM smart contract reads/writes into the UI.
    *   [ ] Connect proposal submission directly to on-chain transactions.
*   **Phase 4 — Arc Ecosystem Integration**:
    *   [ ] Coordinate real USDC-denominated treasury disbursements.
    *   [ ] Connect autonomous AI agents to vote natively on active proposals.
    *   [ ] Deploy on-chain delegate registries for frictionless delegation.

### Future (Phase 5) — Advanced Architecture
*   **Phase 5 — Confidential Governance**:
    *   [ ] Implement encrypted voting via Zero-Knowledge (ZK) proofs.
    *   [ ] Enable private coordinator sets to shield voting positions during voting periods.
    *   [ ] Release SynArc TypeScript SDK for seamless integration into other Arc ecosystem apps.

---

## 10. Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org) `>= 18.x`
*   [npm](https://www.npmjs.com) `>= 9.x`
*   An EVM-compatible browser extension (e.g., MetaMask, Rabby)

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/kellycryptos/SynArc.git
    ```
2.  Navigate to the project root directory:
    ```bash
    cd SynArc/synarc-dao
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```

---

## 11. Local Development

### 1. Configure Environment Variables
Copy the environmental template to set up local configurations:
```bash
cp .env.example .env.local
```

Open `.env.local` and configure your credentials:
```env
# Privy App Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Network Configurations
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
```

### 2. Run the Development Server
```bash
npm run dev
```
Your local environment is now running at `http://localhost:3000`.

### 3. Setup Arc Testnet in MetaMask
To interact with the protocol, add Arc Testnet to your wallet using these parameters:
*   **Network Name**: Arc Testnet
*   **New RPC URL**: `https://rpc.testnet.arc.network`
*   **Chain ID**: `5042002`
*   **Currency Symbol**: USDC
*   **Block Explorer URL**: `https://testnet.arcscan.app`

---

## 12. Deployment

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

## 13. Folder Structure

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

## 14. Security Philosophy

SynArc is developed with a strict security-first mindset, preparing for institutional integration:

*   **Trustless Settlement**: The `TimelockController` acts as a non-bypassable barrier, ensuring all token holders have sufficient warning to withdraw funds if malicious updates pass.
*   **Decentralized Control**: No admin keys, multi-sigs, or backdoors. The governance smart contract is the sole owner of the treasury and other core protocol components.
*   **Non-Custodial Integrity**: User private keys are never transmitted, stored, or managed by the SynArc server layer. All cryptographic keys are secured directly via hardware and client-side systems using Privy.
*   **Mathematical Transparency**: All votes are verified cryptographically via ECDSA signatures on the client side, ensuring full provability of election inputs.

> ⚠️ **Warning**: SynArc's smart contracts are currently undergoing internal pre-audit reviews. Ensure proper testing on Arc Testnet before committing high-value operational reserves.

---

## 15. Future Plans

| Initiative | Timeline | Objectives |
| :--- | :--- | :--- |
| **Mainnet Transition** | Q3 2026 | Audited production deployment of Governor and Timelock Controller models on Arc Mainnet. |
| **Privacy Expansion** | Q4 2026 | Private coordinator election setups, ZK-Snark voting protocols, and secret ballot options. |
| **Autonomous Execution** | Q1 2027 | AI agent delegation layers with automated intent checking and programmable execution limits. |
| **Ecosystem Bridges** | Q2 2027 | Cross-chain governance links allowing remote treasury operations via safe bridges. |

---

## 16. License

This repository is licensed under the **MIT License**. Check [LICENSE](./LICENSE) for additional details.

---

<div align="center">

**Built for the Arc agentic economy.**

[Website](https://synarc-dao.vercel.app) · [Twitter](https://x.com/synarc_) · [GitHub](https://github.com/kellycryptos/SynArc) · [Arc Network](https://arc.network)

<sub>© 2026 SynArc. All rights reserved.</sub>

</div>
