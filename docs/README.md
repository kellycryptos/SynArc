---
icon: rocket
---

# Getting Started

Welcome to **SynArc** — secure funding and coordination infrastructure for creators, independent teams, and digital organizations. This documentation covers everything from setting up your project workspace to configuring automated treasury rules and coordinating community decisions.

---

## What is SynArc?

SynArc provides the tools you need to pool funds, vote on capital releases, and automate treasury management. It enables creators and decentralized teams to:

- 🎨 **Launch Project Workspaces** — Establish a shared home for your project with built-in milestone escrows that protect backer funds.
- 💸 **Receive Micro-Funding** — Pool contributions of any size with near-zero transaction fees.
- 🏛️ **Decide Together** — Propose, vote on, and execute decisions collectively using simple on-chain tools.
- 🤖 **Automate Treasury Rules** — Protect your reserves from sitting idle or losing value by setting up automated assistant routines.
- 🔗 **Integrate via SDK** — Programmatically coordinate allocations or automate actions using our developer tools.


---

## Contracts & Network Reference

Below is the official network configuration and deployed smart contract addresses for SynArc on the Arc Testnet.

| Configuration / Contract | Value / Address | Description |
|:---|:---|:---|
| **Chain ID** | `5042002` | Arc Testnet Chain Identifier |
| **RPC Endpoint** | `https://rpc.testnet.arc-node.thecanteenapp.com/v1/swrm_104d24688adcae992878acabfd41b2ed5800817b20d57aa9b17a64d225c0bf8f` | Primary RPC endpoint for client node calls |
| **SynArcGovernor** | `0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e` | Governance proposal and voting controller |
| **Governance Treasury (`treasuryGovernance`)** | `0xFE0F6bF45D363d34CD5fC1781594a7471736dC18` | Timelocked treasury for core DAO balances |
| **Agent Operating Treasury (`treasuryAgent`)** | `0x302D7cba3553e22E24C7A5C9aFee3942EBC6ea63` | Fast-access agent operating reserves |
| **Crowdfund Factory / Template** | `0xd5374DFC4B01F60115A52Df027704062506b3030` | Deploys new campaign milestone escrows |
| **SynArcToken (sARC)** | `0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e` | Primary governance voting weight token |
| **EURC Token** | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` | EURC stablecoin contract address |
| **USDC (Gas Token)** | `0x3600000000000000000000000000000000000000` | Native USDC stablecoin for fee payment |
| **Treasury Agent Contract** | `0x88BdF819466C1802ce6C780a9fbdF3A314cab07D` | On-chain autonomous agent rules executor |

---

## Circle & Agent Integrations

SynArc integrates with the Circle ecosystem and autonomous systems to power its rebalancing, governance, and onboarding systems:

*   **Circle CCTP (Cross-Chain Transfer Protocol)** — *Fully Deployed & Functional*: Handles native burn-and-mint USDC routing between Arc Testnet and Ethereum Sepolia. In `lib/agent/cctp-executor.ts`, the system executes burns, polls Circle's Iris attestation API for validation consensus, and triggers mint receipts on the destination Messenger contract.
*   **Circle Gateway (x402 Nanopayments)** — *Simulated/Planned*: Tracks AI model execution fees for each inference call in `lib/agent/gateway-payments.ts`. The codebase contains hooks to deduct USDC internally for every Groq API request, awaiting live production endpoints to route actual on-chain fee payments.
*   **Modular Wallets (ERC-4337 & Social Auth)** — *Fully Deployed & Functional*: Provisioned dynamically for users using Privy social logins and Circle's Web3 Services (W3S). In `lib/tx-helper.ts`, transactions submitted by Circle embedded wallets are routed via custom EIP-1193 providers and sponsored gaslessly via paymasters.
*   **Groq AI** — *Fully Deployed & Functional*: Powers the agent's real-time treasury analysis engine in `lib/agent/treasury-agent.ts`. The agent script calls the Groq SDK using the `qwen/qwen3.6-27b` model to evaluate current balances and autonomously execute or queue rebalancing decisions.
*   **ERC-8004 Identity Registry** — *Fully Deployed & Functional*: The `SynArcAgent.sol` contract implements the `IERC8004Registry` interface. Upon deployment, the agent calls the registry contract at `0x8004A818BFB912233c491871b3d84c89A494BD9e` to register its identity, capabilities, and IPFS metadata on-chain.

---


## Quick Navigation

| Section | What you'll learn |
| :--- | :--- |
| [Creator Economy](/docs/creator-economy) | Launching workspaces, micro-funding, and profiles |
| [Agent SDK](/docs/sdk) | Integration guides and developer tools |
| [Governance](/docs/governance) | Proposals, community voting, and decision-making |
| [Treasury](/docs/treasury) | Escrows, fund management, and tranches |
| [Smart Contracts](/docs/smart-contracts) | Contract parameters, security, and verification |
| [Treasury Agent](/docs/ai-agents) | Automated treasury rules and management |
| [FAQ](/docs/faq) | Common questions answered |

---

## How to Connect Your Wallet

SynArc leverages Privy authentication to enable frictionless onboarding. You do not need a pre-configured Web3 wallet like MetaMask to participate.

1. Click the **Connect Wallet** button in the page header or sidebar.
2. Sign in using your **Google account**, **Twitter / X**, **Discord**, or standard **Email**.
3. Alternatively, click **Detect Wallets** to connect external hardware or browser extension accounts like MetaMask or Coinbase Wallet.
4. Once connected, Privy automatically provisions a secure, non-custodial embedded wallet key secured directly via your device hardware.

> 💡 **Read-only access**: You can browse creator profiles, leaderboards, and proposals without connecting a wallet. A wallet is only required to support creators, vote, or launch your own DAO.

---

## How to Switch to Arc Testnet

SynArc requires your connected wallet to be configured for Arc Testnet to query balances and execute contract operations.

### Method 1: Automatic

If you are on another network, SynArc will display a **Switch to Arc** banner on your settings page. Simply click this banner to automatically authorize a network switch in your wallet.

### Method 2: Manual Parameters

Add the custom network configuration manually in your wallet:

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

SynArc supports a highly polished presentation mode toggleable directly in the interface.

* **Toggle available in Settings page**: Easily switch between light and dark themes via the Appearance setting.
* **Dark mode is default**: SynArc defaults to dark mode on first load to optimize readability.
* **Preference saved across sessions**: Your selected theme preference is persisted automatically in local storage.
