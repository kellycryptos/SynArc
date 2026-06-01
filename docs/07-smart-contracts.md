---
icon: code
---

# Smart Contracts

All core SynArc mechanics operate programmatically through secure on-chain EVM smart contracts. This section details deployed addresses and configurations.

***

## Deployed Contract Addresses

SynArc contracts are deployed on the Arc Testnet and can be inspected on the block explorer:

### 1. SynArc Governor

* **Address:** `0x17D9d585CBB1AF6aa4a3C787116f7ba59651B702`
* **Description:** Implements core voting parameters, proposal execution triggers, and quorum rules.
* **Explorer:** [View on ArcScan](https://testnet.arcscan.app/address/0x17D9d585CBB1AF6aa4a3C787116f7ba59651B702)

### 2. SynArc Treasury

* **Address:** `0x8Ab21363cB0319548B051f129e477393908be7c1`
* **Description:** Vault contract managing USDC/EURC stablecoin deposits and governance-approved disbursements.
* **Explorer:** [View on ArcScan](https://testnet.arcscan.app/address/0x8Ab21363cB0319548B051f129e477393908be7c1)

### 3. SynArcToken (sARC)

* **Address:** `0x637cA7788aBC956832F389A7BB895D5249FE757B`
* **Description:** Core ERC20 voting asset with checkpoint history tracking to authorize DAO voting power weight.
* **Explorer:** [View on ArcScan](https://testnet.arcscan.app/address/0x637cA7788aBC956832F389A7BB895D5249FE757B)

### 4. EURC Token (Circle)

* **Address:** `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a`
* **Description:** Circle's Euro-backed stablecoin used for multi-currency reserve diversity.
* **Explorer:** [View on ArcScan](https://testnet.arcscan.app/address/0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a)

### 5. ERC-8004 Identity Registry

* **Address:** `0x8004A818BFB912233c491871b3d84c89A494BD9e`
* **Description:** Ratified on-chain registry for AI Agents identity registration and dynamic reputation index tracking.

### 6. SynArcCrowdfund (Dynamic Escrow)

* **Solidity Source:** `contracts/SynArcCrowdfund.sol`
* **Description:** Deployed on-demand for every crowdfunding campaign to lock USDC stablecoin reserves securely until community milestones are approved.

### 7. SynArcAgent (Autonomous AI Agent)

* **Solidity Source:** `contracts/SynArcAgent.sol`
* **Description:** Represents an autonomous AI Agent on-chain. Gated to a hot-wallet execution hot-key for automated yields and proposals while ownership is held by the DAO.


***

## Network Configuration

Ensure your developer suite or wallet RPC parameters are configured correctly:

* **Network Name:** Arc Testnet
* **Chain ID:** `5042002`
* **Currency Symbol:** `USDC`
* **RPC URL:** `https://rpc.testnet.arc.network`
* **Block Explorer:** `https://testnet.arcscan.app`
