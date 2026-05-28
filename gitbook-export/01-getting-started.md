# Getting Started

Welcome to SynArc! This section contains guides on how to configure your environment and connect your wallet to start participating in the on-chain agentic economy.

---

## What is SynArc?

SynArc is governance infrastructure for the agentic economy — enabling DAOs, AI agents, and autonomous systems to coordinate, vote, and manage USDC-native treasuries on Arc. It is the first multi-DAO governance layer built natively on Arc with Circle's full stablecoin stack.

### Ecosystem Purpose
By combining secure OpenZeppelin Governor frameworks, timelocked vaults, and multi-asset reserves, SynArc provides robust administrative security for digital assets.

---

## How to Connect Your Wallet

SynArc leverages Privy authentication to enable frictionless onboarding. You do not need a pre-configured Web3 wallet like MetaMask to participate.

1. Click the **Connect Wallet** button in the page header or sidebar.
2. Sign in using your **Google account**, **Twitter / X**, **Discord**, or standard **Email**.
3. Alternatively, click **Detect Wallets** to connect external hardware or browser extension accounts like MetaMask or Coinbase Wallet.
4. Once connected, Privy automatically provisions a secure, non-custodial embedded wallet key secured directly via your device hardware.

---

## How to Switch to Arc Testnet

SynArc requires your connected wallet to be configured for Arc Testnet to query balances and execute contract operations.

### Method 1: Automatic
If you are on another network, SynArc will display a **Switch to Arc** banner on your settings page. Simply click this banner to automatically authorize a network switch in your wallet.

### Method 2: Manual Parameters
Add the custom network configuration manually in your wallet:
*   **Network Name:** Arc Testnet
*   **Chain ID:** `5042002`
*   **RPC URL:** `https://rpc.testnet.arc.network`
*   **Currency Symbol:** `USDC`
*   **Block Explorer:** `https://testnet.arcscan.app`

---

## How to Get USDC on Arc Testnet

Arc is a stablecoin-native network where transaction gas fees are denominated directly in stablecoins like USDC. To interact with contracts, you require testnet USDC:

1. Make sure you have the **Canteen ARC CLI** installed by running:
   ```bash
   uv tool install git+https://github.com/the-canteen-dev/ARC-cli
   ```
2. Retrieve a developer faucet allotment in your terminal using `arc-canteen rpc-url` or the official Canteen platform developer portal.
3. Use the faucet link inside the developer dashboard to mint mock testnet USDC directly to your connected wallet address.

---

## Light/Dark Mode

SynArc supports a highly polished presentation mode toggleable directly in the interface.

*   **Toggle available in Settings page**: Easily switch between light and dark themes via the Appearance setting.
*   **Dark mode is default**: SynArc defaults to dark mode on first load to optimize readability.
*   **Preference saved across sessions**: Your selected theme preference is persisted automatically in local storage.
