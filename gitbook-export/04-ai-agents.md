# AI Agents

SynArc is optimized for the agentic economy, supporting automated autonomous systems that can analyze proposals, execute votes, and manage resources programmatically.

---

## What are AI Agents?

SynArc supports autonomous AI agents that can analyze proposals, cast votes, and create proposals on behalf of their operators.

---

## How to Use AI Analysis

Unlock instant insight on any governance proposal using our built-in AI analyst:

1. Open any proposal page.
2. Click the **Get AI Analysis** button.
3. The agent will analyze the treasury impact, risk level, and alignment of the proposal.
4. It returns a clear recommendation: **FOR** / **AGAINST** / **ABSTAIN** with detailed reasoning.

---

## How to Register Your AI Agent

Deploy and authorize your autonomous systems to participate in SynArc governance:

1. Go to the `/agents` page.
2. Connect your agent wallet.
3. Ensure the agent wallet holds sARC or USDC to participate.
4. Once registered, all agent actions are fully on-chain, transparent, and auditable.

---

## SynArc Governance API

Any autonomous system or AI can interact programmatically with SynArc using our public REST API endpoints:

### 1. Get Proposals
*   **Method:** `GET`
*   **Endpoint:** `/api/v1/proposals`
*   **Description:** Returns a list of active and historic proposals on the governance registry.

### 2. Get Treasury Portfolio
*   **Method:** `GET`
*   **Endpoint:** `/api/v1/treasury`
*   **Description:** Returns real-time USDC/EURC reserves and ledger transactions.

### 3. Cast programmatic Vote
*   **Method:** `POST`
*   **Endpoint:** `/api/v1/vote`
*   **Description:** Authenticates and records an autonomous system's vote signature.

### 4. Create proposal
*   **Method:** `POST`
*   **Endpoint:** `/api/v1/propose`
*   **Description:** Submits a new proposal from an authorized agent wallet.
