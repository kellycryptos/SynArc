---
icon: robot
---

# Automated Treasury Guard (Treasury Agent)

Syn DAO introduces the **Automated Treasury Guard**, a specialized autonomous agent designed to protect workspace assets, optimize yield on idle capital, manage payouts, and handle secure rebalancing across multiple networks.

***

## Overview

Traditional community treasuries often face idle capital, manual payment workflows, operational risk, and vulnerable bridging mechanics. The Automated Treasury Guard operates under community-approved rules to solve these issues autonomously:

1. **Auto Rebalancing**: Moves stablecoins across chains via native Circle CCTP to access higher-yield allocations.
2. **Auto Payments**: Processes scheduled team payrolls, creator payouts, and milestone releases.
3. **Auto Yield Farming**: Stakes or provides liquidity in conservative DeFi vaults (like Aave or Morpho) when capital sits idle.
4. **Risk Monitoring & Emergency Auto-Pause**: Continuously checks reserves for low liquidity, large outflows, and inactivity, executing on-chain pauses if necessary.
5. **Multi-Chain Auto Sweep**: Programmatically collects incoming stablecoins from bridges and sweeps them directly into the DAO treasury.

```
+--------------------+   Monitoring   +------------------------+
|  On-Chain Balance  | =============> |  Automated Treasury    |
|   & Risk Signals   |                |  Guard (Decision)      |
+--------------------+                +------------------------+
                                                  ||
                                                  || Action Taken
                                                  \/
+--------------------+   CCTP Bridge  +------------------------+
| Destination Chain  | <============= | executes Rebalance /   |
| (Minted native)    |    / Sweep     | Payouts / Pause / Farm |
+--------------------+                +------------------------+
```

---

## Core Capabilities

### 1. Auto Rebalancing (via Circle CCTP) — `LIVE`
When a community yield rebalance proposal is approved, or threshold rules are met on-chain, the agent initiates a bidirectional stablecoin transfer. By calling Circle's Native Burn-and-Mint interface, it avoids risky wrapper tokens and ensures slippage-free stablecoin mobility between Arc Testnet and Sepolia.

### 2. Auto Payments (Scheduled & Milestone) — `LIVE`
Creators and DAO teams can schedule recurring stablecoin payments (e.g. weekly creator payouts, monthly team payroll) or queue milestone-based payouts directly from the dashboard:
* **Security Timelock**: To protect community capital, all queued payments are subject to a **24-hour timelock delay** on-chain.
* **Autonomous Execution**: Once the timelock countdown finishes, the agent executes the payout transaction.

### 3. Risk Monitoring & Emergency Pause — `LIVE`
The agent constantly evaluates four risk metrics to assign a real-time **Risk Score (0–100)**:
* **Low Liquidity**: Triggered when the primary asset balance falls below safe operating levels.
* **Large Outflow**: Flags when single transfers exceed 80% of total reserves.
* **Emergency Stop**: Instantly triggers if the owner/community commands an on-chain pause.
* **Inactivity**: Triggers if the agent has not completed rule checks for more than 6 hours.

### 4. Arc Earn & Morpho Vault Operations — `LIVE`
To prevent stablecoins from sitting idle, the agent and DAO operators interact directly with curated Morpho vaults on Arc via Arc App Kit and the SDK's `SynArcEarn` module:
* **Morpho Blue USDC Strategy**: Optimized automated yields on Arc Mainnet and Testnet.
* Programmatic deposits, balance tracking, and yields sweeps accessible via `/earn`.

### 5. Multi-Chain Auto Sweep — `IN PROGRESS`
Instead of manual collections, sweeps bridged assets across Ethereum Mainnet, Base, and Avalanche directly into the primary DAO treasury vault.

---

## Tameion Dual-Agent Adversarial Mesh & Forensic Auditor

Syn DAO deploys a **Dual-Agent Adversarial Mesh** on Arc Mainnet:

1. **Operator Agent**: Evaluates treasury health, verifies deliverables against on-chain policies, and executes under-cap payouts ($\le 50$ USDC).
2. **Forensic Auditor**: An independent, adversarial watcher simulating rogue agent vectors (e.g. payee address hijacking, duplicate claims, threshold tampering).
3. **Adversarial Simulator**: Interactive stress-test console on `/agent` allowing operators to benchmark release valve defenses against prompt injection and spoofed inputs.
4. **Safety Invariants**:
   - **0.018 USDC Gas Threshold**: Automated preflight checks ensure sufficient gas floor before initiating on-chain transactions.
   - **12-Hour Proposal Cooldown**: Enforces pacing between consecutive automated proposals to eliminate flood/DoS vectors.

---

## Two-Treasury Architecture & Governance Gating

To maximize security while maintaining high operational mobility, Syn DAO implements a **Two-Treasury Architecture**:

1. **Governance Treasury (Timelocked)**: Holds the bulk of DAO funds (`0x8205...` on Mainnet, `0xFE0F...` on Testnet). Any withdrawal or allocation from this treasury requires a standard governance proposal, community vote, and a mandatory 24-48 hour timelock delay.
2. **Agent Operating Treasury (Fast-Access)**: A dedicated, smaller treasury used by the Treasury Agent to perform swift rebalances and under-cap payouts. The agent contract holds withdrawal and execution rights here to respond immediately to changing yields or risk parameters.

### Funding Flow (Governance-Gated)

To fund the Agent Operating Treasury:
1. A user submits a **Fund Agent Treasury** proposal via the dashboard, specifying the amount of USDC to allocate.
2. The proposal is voted on by sARC token holders.
3. Once approved, the proposal is queued in the Governance Treasury's withdrawal queue.
4. After the timelock expires, the proposal is executed, transferring the USDC to the Agent Operating Treasury.
5. Anyone can then call the `syncBalance()` function on the Agent Operating Treasury to update its internal balance state, allowing the agent to begin utilizing the newly allocated capital.

---

## Deep Circle Integrations

The Automated Treasury Guard incorporates three key pillars of safe stablecoin management:

### 1. Direct Cross-Chain Bridge
Used for bidirectional stablecoin rebalancing. Programmatic transfers use `depositForBurn` on Arc, poll Circle's Iris API, and mint native USDC on the destination chain without relying on wrapper contracts or external liquidity providers.

### 2. Smart Account Identity
The guard operates under an **ERC-8004 identity** registered on the Arc registry at `0x8004A818BFB912233c491871b3d84c89A494BD9e`. This registry ties the guard's code, ownership, and reputation index directly to the blockchain.

### 3. Micro-gas Payments
Every inference request and transaction analysis run by the guard is paid for using micro-cent USDC transfers as small as **$0.01**. This ensures that automated operations pay for their own computational gas and API costs, preventing treasury drain.

---

## Programmatic Developer API & Cron Scheduling

Syn DAO’s Treasury Agent is executed programmatically on a **5-minute recurring schedule** via [cron-job.org](https://cron-job.org) rather than native Vercel crons (due to Hobby tier limitations).

### 1. Run Agent Scan
* **Method:** `GET` or `POST`
* **Endpoint:** `https://www.syndaopro.xyz/api/agent/run?network=mainnet`
* **Query Parameters (Required):**
  - `network`: `mainnet` or `testnet` *(Calling without this query param returns HTTP 400)*
* **Headers (Required):**
  - `x-cron-secret: <CRON_SECRET>` or `Authorization: Bearer <CRON_SECRET>`
* **Description:** Triggers the agent's main decision cycle. The agent checks active rules, evaluates on-chain state, executes under-cap releases ($\le 50$ USDC), votes on active proposals, and syncs balances.

#### Execution Response Shape
The endpoint returns a minimal, low-overhead JSON payload (~120 bytes) optimized to prevent buffer bloat on cron services:

```json
{
  "status": "ok",
  "network": "mainnet",
  "actionsExecuted": 0,
  "action": "monitoring",
  "timestamp": "2026-10-11T18:25:00.000Z"
}
```

