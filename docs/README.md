---
icon: rocket
---

# Getting Started

Welcome to **Syn DAO** — the payment-safety and governance rail for humans and autonomous agents, built on Arc. This documentation covers everything from configuring automated treasury rules and contract-enforced Three-Way Match release valves to integrating autonomous agents via our public SDK.

---

## What is Syn DAO?

Syn DAO provides the critical payment-safety layer for organizations and agent-run businesses on Arc:

- 🛡️ **Three-Way Match Release Valve** — Enforce contract-level agreement between Governor proposals, IPFS deliverable CIDs, and payee claims with a 48h payee cooldown and idempotency guard.
- 🤖 **Autonomous Agent Rails & Release Engine** — Autonomous agents audit deliverables, score acceptance criteria, and trigger micro-payouts under an on-chain policy cap ($\le 50$ USDC) directly on Arc Mainnet, escalating larger disbursements to human review.
- 🏦 **Multi-Asset Treasury Vaults** — Native support for USDC, EURC, and cirBTC with real-time balance tracking and allowance protection.
- 🎨 **Launch Milestone Escrows** — Deploy template-based Creator DAOs with milestone locks that release funds progressively as milestones pass community votes.
- 🌉 **High-Resilience CCTP Bridging** — Native Circle burn-and-mint bridging between Arc and external EVM chains with a server-side balance proxy and multi-RPC redundancy.
- 🔗 **Developer Agent SDK** — Public TypeScript package (`synarc-agent-sdk`) allowing external AI agents (Eliza, LangChain, AutoGPT) to govern treasuries and execute payouts programmatically.


---

## Contracts & Network Reference

### Arc Mainnet — Live Production

| Configuration / Contract | Value / Address | Description | Explorer Link |
|:---|:---|:---|:---|
| **Chain ID** | `5042` | Arc Mainnet Identifier | [Arc Explorer](https://explorer.arc.io) |
| **RPC Endpoint** | `https://rpc.mainnet.arc.io` | Official Arc Mainnet RPC Endpoint | — |
| **SynArcTreasury** (Release Valve) | `0x8205e9782Fe54fD2aaD895b436B695db169F3d7B` | Three-Way Match Release Valve, Payee Cooldown & Idempotency Guard (Verified ✅) | [Inspect](https://explorer.arc.io/address/0x8205e9782Fe54fD2aaD895b436B695db169F3d7B) |
| **SynArcGovernor** (Document Engine) | `0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025` | Document-Anchored Governance Engine (48h timelock) (Verified ✅) | [Inspect](https://explorer.arc.io/address/0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025) |
| **SynArcToken** (`sARC`) | `0x8f4b429794ABa4607d177b100Cc5e481D22d0ad4` | Primary Governance Token with checkpoint delegation (Verified ✅) | [Inspect](https://explorer.arc.io/address/0x8f4b429794ABa4607d177b100Cc5e481D22d0ad4) |
| **SynArcCrowdfund (Primary Mainnet Escrow)** | `0x99955b487aE5519a2b1Ff677f9bed3A6145b750d` | Milestone-Locked Creator DAO Escrow (Aura Synth Lab) (Verified ✅) | [Inspect](https://explorer.arc.io/address/0x99955b487aE5519a2b1Ff677f9bed3A6145b750d) |
| **Authorized Operator Agent** | `0x88BdF819466C1802ce6C780a9fbdF3A314cab07D` | Autonomous AI Agent executing under-cap releases & rebalances | [Inspect](https://explorer.arc.io/address/0x88BdF819466C1802ce6C780a9fbdF3A314cab07D) |
| **Authorized Human Reviewer** | `0xE819090D7810D89f2E86e167d0b58425dEd745D8` | Deployer EOA registered on-chain for emergency overrides & multisig signoff | [Inspect](https://explorer.arc.io/address/0xE819090D7810D89f2E86e167d0b58425dEd745D8) |
| **Canonical USDC** | `0x3600000000000000000000000000000000000000` | Native Circle USDC on Arc Mainnet | [Inspect](https://explorer.arc.io/address/0x3600000000000000000000000000000000000000) |
| **Canonical EURC** | `0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1` | Native Circle EURC on Arc Mainnet | [Inspect](https://explorer.arc.io/address/0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1) |
| **Canonical cirBTC** | `0x171A4217b86A807A64eB94757Db6849fb4bDbAA0` | Native Circle cirBTC on Arc Mainnet | [Inspect](https://explorer.arc.io/address/0x171A4217b86A807A64eB94757Db6849fb4bDbAA0) |
| **Agent Release Cap** | `50.00 USDC` (`50_000_000 micro-USDC`) | Enforced on-chain: releases $\le 50$ autonomous; $> 50$ require human review | [Inspect](https://explorer.arc.io/address/0x8205e9782Fe54fD2aaD895b436B695db169F3d7B) |

> ℹ️ All 10 Creator DAO Crowdfund contracts deployed on Arc Mainnet are verified with exact match on Sourcify. See [`docs/07-smart-contracts.md`](/docs/smart-contracts) for the complete list of creator escrow addresses.

### Arc Testnet

| Configuration / Contract | Value / Address | Description |
|:---|:---|:---|
| **Chain ID** | `5042002` | Arc Testnet Chain Identifier |
| **RPC Endpoint** | `https://rpc.testnet.arc.network` | Primary RPC endpoint for client node calls |
| **SynArcGovernor** | `0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e` | Governance proposal and voting controller |
| **Governance Treasury (`treasuryGovernance`)** | `0xFE0F6bF45D363d34CD5fC1781594a7471736dC18` | Timelocked treasury for core DAO balances |
| **Agent Operating Treasury (`treasuryAgent`)** | `0xE6bAC65d7f060B805B8dd6f1c4DBfa6571905f28` | Fast-access agent operating reserves |
| **Crowdfund Factory / Template** | `0xd5374DFC4B01F60115A52Df027704062506b3030` | Deploys new campaign milestone escrows |
| **SynArcToken (sARC)** | `0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e` | Primary governance voting weight token |
| **EURC Token** | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` | EURC stablecoin contract address |
| **cirBTC Token** | `0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF` | cirBTC token contract address |
| **USDC (Gas Token)** | `0x3600000000000000000000000000000000000000` | Native USDC stablecoin for fee payment |
| **Treasury Agent Contract** | `0x88BdF819466C1802ce6C780a9fbdF3A314cab07D` | On-chain autonomous agent rules executor |
| **CCTP Token Messenger** | `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` | Circle CCTP Token Messenger address |
| **CCTP Message Transmitter** | `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` | Circle CCTP Message Transmitter address |

---

## Circle & Agent Integrations

Syn DAO integrates with the Circle ecosystem and autonomous systems to power its rebalancing, governance, and onboarding systems:

*   **Circle CCTP (Cross-Chain Transfer Protocol)** — *Fully Deployed & Functional*: Handles native burn-and-mint USDC routing between Arc (Mainnet/Testnet) and external EVM chains via Circle Bridge Kit. In `lib/agent/cctp-executor.ts`, the system executes burns, polls Circle's Iris attestation API for validation consensus, and triggers mint receipts on the destination Messenger contract.
*   **Circle Gateway (x402 Nanopayments)** — *Simulated/Planned*: Tracks AI model execution fees for each inference call in `lib/agent/gateway-payments.ts`. The codebase contains hooks to deduct USDC internally for every Groq API request, awaiting live production endpoints to route actual on-chain fee payments.
*   **Web3 & Modular Wallets (WalletConnect & Circle W3S)** — *Fully Deployed & Functional*: Flexible wallet connectivity powered by WalletConnect / Reown Cloud and RainbowKit for 300+ mobile and browser wallets, alongside Circle's Web3 Services (W3S) user-controlled smart accounts. In `lib/tx-helper.ts`, transactions submitted by Circle embedded wallets are routed via custom EIP-1193 providers and sponsored gaslessly via paymasters.
*   **Groq AI** — *Fully Deployed & Functional*: Powers the agent's real-time treasury analysis engine in `lib/agent/treasury-agent.ts`. The agent script calls the Groq SDK using the Groq AI Engine to evaluate current balances and autonomously execute or queue rebalancing decisions.
*   **ERC-8004 Identity Registry** — *Fully Deployed & Functional*: The `SynArcAgent.sol` contract implements the `IERC8004Registry` interface. Upon deployment, the agent calls the registry contract at `0x8004A818BFB912233c491871b3d84c89A494BD9e` to register its identity, capabilities, and IPFS metadata on-chain.

---


## Quick Navigation

| Section | What you'll learn |
| :--- | :--- |
| [Creator Economy](/docs/creator-economy) | Launching workspaces, micro-funding, and profiles |
| [Agent SDK](/docs/sdk) | Integration guides and developer tools (`synarc-agent-sdk`) |
| [Governance](/docs/governance) | Proposals, community voting, and decision-making |
| [Treasury](/docs/treasury) | Escrows, fund management, and reserve tranches |
| [Smart Contracts](/docs/smart-contracts) | Contract parameters, security, and verification |
| [Three-Way Match](/docs/three-way-match) | Contract-enforced release valve, payee cooldown, and invariants |
| [Treasury Agent](/docs/ai-agents) | Automated treasury rules and Tameion Dual-Agent mesh |
| [Bridge](/docs/bridge) | Cross-chain Circle CCTP & Bridge Kit mobility |
| [Technical Reference](/docs/technical-reference) | Protocol architecture and interface specifications |
| [Mainnet Roadmap](/docs/roadmap) | Protocol milestones and future phases |
| [FAQ](/docs/faq) | Common questions answered |

---

## How to Connect Your Wallet

Syn DAO features a unified Web3 connection modal powered by **RainbowKit** and **WalletConnect (Reown)**, with support for Circle User-Controlled Smart Accounts.

1. Click the **Connect Wallet** button in the page header or sidebar.
2. Choose your preferred connection method:
   * **Mobile Wallets (QR Code)**: Select **WalletConnect** to scan the QR code using any compatible mobile wallet app (MetaMask Mobile, Rainbow, Trust Wallet, Zerion, Coinbase Wallet, etc.).
   * **Browser Extension Wallets**: Click on detected extensions like MetaMask, Rabby, Coinbase Wallet, or OKX Wallet.
   * **Circle Smart Account**: Log in via Circle User-Controlled Wallets for secure, PIN-protected embedded accounts.
3. If prompted, approve the connection and network configuration for **Arc Mainnet** (`chainId: 5042`) or **Arc Testnet** (`chainId: 5042002`).

> 💡 **Developer Note**: Ensure `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is defined in your `.env.local` or environment settings. You can obtain a free project ID at [cloud.reown.com](https://cloud.reown.com).

> 💡 **Read-only access**: You can browse creator profiles, leaderboards, and proposals without connecting a wallet. A wallet is only required to support creators, vote, or launch your own DAO.

---

## How to Configure Arc Networks in Your Wallet

Syn DAO operates by default on **Arc Mainnet**, with seamless switching to **Arc Testnet** for development.

### Method 1: Automatic

Click the network selector badge in the top navigation bar to toggle between **Arc Mainnet** and **Arc Testnet**. Your connected wallet will automatically prompt you to approve the network switch.

### Method 2: Manual Parameters

If adding manually to your wallet:

#### Arc Mainnet (Production — Default)
* **Network Name:** Arc Mainnet
* **Chain ID:** `5042`
* **RPC URL:** `https://rpc.mainnet.arc.io`
* **Currency Symbol:** `USDC`
* **Block Explorer:** `https://explorer.arc.io`

#### Arc Testnet (Developer Sandbox)
* **Network Name:** Arc Testnet
* **Chain ID:** `5042002`
* **RPC URL:** `https://rpc.testnet.arc.network`
* **Currency Symbol:** `USDC`
* **Block Explorer:** `https://testnet.arcscan.app`

---

## How to Get USDC on Arc Testnet

Arc is a stablecoin-native network where transaction gas fees are denominated directly in stablecoins like USDC. To interact with contracts, you require testnet USDC:

1.  Make sure you have the **Canteen ARC CLI** installed by running:

    ```bash
    uv tool install git+https://github.com/the-canteen-dev/ARC-cli
    ```
2. Retrieve a developer faucet allotment in your terminal using `arc-canteen rpc-url` or the official Canteen platform developer portal.
3. Use the faucet link inside the developer dashboard to mint mock testnet USDC directly to your connected wallet address.

---

## Light/Dark Mode

Syn DAO supports a highly polished presentation mode toggleable directly in the interface.

* **Toggle available in Settings page**: Easily switch between light and dark themes via the Appearance setting.
* **Dark mode is default**: Syn DAO defaults to dark mode on first load to optimize readability.
* **Preference saved across sessions**: Your selected theme preference is persisted automatically in local storage.

---

## Official Channels & Community

- 📺 **Official YouTube Channel**: [@syndaopro](https://youtube.com/@syndaopro) — Architecture deep dives, demos, and integration walkthroughs.
- 🐦 **Twitter / X**: [@syndaopro](https://x.com/syndaopro) — Announcements, release alerts, and ecosystem news.
- 🌐 **Web Portal**: [syndaopro.xyz](https://www.syndaopro.xyz/)
- 💻 **GitHub**: [github.com/kellycryptos/SynArc](https://github.com/kellycryptos/SynArc)
- ✉️ **Core Team Email**: [hello@syndaopro.xyz](mailto:hello@syndaopro.xyz)
