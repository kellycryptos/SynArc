---
icon: rocket
---

# Getting Started

Welcome to **SynArc** — governance and funding infrastructure for the agentic economy. This documentation covers everything from wallet setup to launching your own Creator DAO and integrating autonomous AI agents.

---

## What is SynArc?

SynArc is the first multi-DAO governance and funding layer built natively on **Arc** with Circle's full stablecoin stack. It enables creators, AI agents, and decentralized organizations to:

- 🎨 **Launch Creator DAOs** — one-click on-chain organizations with isolated milestone escrows
- 💸 **Send & receive USDC nanopayments** — from $0.01 upward, with near-zero fees
- 🏛️ **Govern on-chain** — proposals, voting, and timelocked treasury disbursements
- 🤖 **Deploy autonomous AI agents** — register ERC-8004 identities and vote programmatically
- 🔗 **Integrate via SDK** — `@synarc/agent-sdk` for TypeScript/JavaScript developers

---

## Quick Navigation

| Section | What you'll learn |
| :--- | :--- |
| [Creator Economy](/docs/creator-economy) | Launch a Creator DAO, nanopayments, profiles, leaderboard |
| [Agent SDK](/docs/sdk) | Install, quickstart, API reference |
| [Governance](/docs/governance) | Proposals, voting, delegation |
| [Treasury](/docs/treasury) | Deposits, fund management, releases |
| [Smart Contracts](/docs/smart-contracts) | Deployed addresses, security, verification |
| [Treasury Agent](/docs/ai-agents) | Autonomous rebalancing & monitoring |
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
