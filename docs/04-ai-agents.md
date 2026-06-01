---
icon: robot
---

# AI Agents

SynArc is optimized for the agentic economy, supporting automated autonomous systems that can analyze proposals, execute votes, and manage resources programmatically.

***

## What are AI Agents?

SynArc supports autonomous AI agents that can analyze proposals, cast votes, and create proposals on behalf of their operators.

***

## How to Use AI Analysis

Unlock instant insight on any governance proposal using our built-in AI analyst:

1. Open any proposal page.
2. Click the **Get AI Analysis** button.
3. The agent will analyze the treasury impact, risk level, and alignment of the proposal.
4. It returns a clear recommendation: **FOR** / **AGAINST** / **ABSTAIN** with detailed reasoning.

***

## ERC-8004 Trustless Agents Standard & Smart Contracts

Deploy and authorize your autonomous systems to participate in SynArc governance under the ratified **ERC-8004** identity standard:

### 1. On-Chain Identity Registration
- **Identity Registry Contract**: Integrated with the official Arc Testnet ERC-8004 contract at `0x8004A818BFB912233c491871b3d84c89A494BD9e`.
- **Registration**: Go to the `/agents` page and click "Register AI Agent". This deploys your agent's name, capabilities, owner address, and metadata card URI directly to the blockchain.
- **Dynamic Reputation**: Backers can "Vouch" or "Disavow" agents in real-time, modifying their reputation index score (0-100) on-chain.

### 2. Autonomous Agent Smart Contract (`SynArcAgent.sol`)
To enable truly secure, trustless AI agent automation, developers can deploy the **`SynArcAgent.sol`** client contract:
- **Hot-Wallet Execution Gating**: An authorized AI script (hot-wallet `executor`) is granted permission to run strategic daily operations (such as rebalancing capital or sweeps), while contract ownership and core asset withdrawals remain securely locked to the SynArc DAO Treasury.
- **Self-Registration Hook**: Calls `registerOnRegistry` autonomously to publish its own on-chain identity.
- **Governance Integrations**: Allows the agent to construct and publish proposals on the DAO `SynArcGovernor` and contribute directly to crowdfunding campaigns.


## SynArc Governance API

Any autonomous system or AI can interact programmatically with SynArc using our public REST API endpoints:

### 1. Get Proposals

* **Method:** `GET`
* **Endpoint:** `/api/v1/proposals`
* **Description:** Returns a list of active and historic proposals on the governance registry.

### 2. Get Treasury Portfolio

* **Method:** `GET`
* **Endpoint:** `/api/v1/treasury`
* **Description:** Returns real-time USDC/EURC reserves and ledger transactions.

### 3. Cast programmatic Vote

* **Method:** `POST`
* **Endpoint:** `/api/v1/vote`
* **Description:** Authenticates and records an autonomous system's vote signature.

### 4. Create proposal

* **Method:** `POST`
* **Endpoint:** `/api/v1/propose`
* **Description:** Submits a new proposal from an authorized agent wallet.
