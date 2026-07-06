---
icon: robot
---

# Automated Treasury Guard (Treasury Agent)

SynArc introduces the **Automated Treasury Guard**, a specialized autonomous agent designed to protect workspace assets, optimize yield on idle capital, manage payouts, and handle secure rebalancing across multiple networks.

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

### 4. Auto Yield Farming — `COMING SOON`
To prevent stablecoins from sitting idle and losing value, the agent stakes capital in verified DeFi integrations:
* **Aave USDC Strategy**: Target yield of 3.2% APY.
* **Compound Strategy**: Target yield of 2.9% APY.
* **Morpho Blue Strategy**: Target yield of 4.1% APY.

### 5. Multi-Chain Auto Sweep — `COMING SOON`
Instead of manual collections, this feature sweeps bridged assets across Ethereum Mainnet, Base, and Arbitrum directly into the primary DAO treasury vault automatically.

---

## Deep Circle Integrations

The Automated Treasury Guard incorporates three key pillars of safe stablecoin management:

### 1. Direct Cross-Chain Bridge
Used for bidirectional stablecoin rebalancing. Programmatic transfers use `depositForBurn` on Arc Testnet, poll Circle's Iris API, and mint native USDC on the destination chain without relying on wrapper contracts or external liquidity providers.

### 2. Smart Account Identity
The guard operates under an **ERC-8004 identity** registered on the Arc Testnet registry at `0x8004A...`. This registry ties the guard's code, ownership, and reputation index (vouched or disavowed by community members) directly to the blockchain. Asset keys are held securely in a modular multisig vault, while execution keys are delegated to the guard's automation scripts.

### 3. Micro-gas Payments
Every inference request and transaction analysis run by the guard is paid for using micro-cent USDC transfers as small as **$0.01**. This ensures that automated operations pay for their own computational gas and API costs, preventing treasury drain.

---

## Programmatic Developer API & Cron Scheduling

SynArc’s Treasury Agent is executed programmatically on a **5-minute recurring schedule** via [cron-job.org](https://cron-job.org) rather than native Vercel crons (due to Hobby tier limitations).

### 1. Run Agent Scan
* **Method:** `POST` / `GET`
* **Endpoint:** `https://www.synarcdao.xyz/api/agent/run`
* **Headers:**
  - `x-cron-secret`: `<CRON_SECRET>` (shared-secret authentication header)
* **Payload:** `{}` (optional)
* **Description:** Triggers the agent's main decision cycle. The agent checks active rules, parses on-chain state, votes on active proposals, and submits transactions/proposals on-chain.

#### Execution Response Shape
The endpoint returns a structured JSON payload detailing the current agent state, treasury balances, and the specific action evaluated during this tick:

```json
{
  "success": true,
  "action": {
    "timestamp": "2026-07-06T14:32:00.000Z",
    "action": "monitoring",
    "reasoning": "Treasury balance is healthy ($142.50 USDC). No active threshold triggers found. Continuous passive monitoring active.",
    "status": "executed",
    "usdcAmount": 0
  },
  "treasury": {
    "usdc": 142.5,
    "eurc": 50,
    "sepoliaUsdc": 10
  },
  "treasurySource": "live",
  "recentActions": [
    {
      "timestamp": "2026-07-06T14:32:00.000Z",
      "action": "monitoring",
      "reasoning": "Treasury balance is healthy ($142.50 USDC). No active threshold triggers found. Continuous passive monitoring active.",
      "status": "executed"
    }
  ]
}
```

