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
