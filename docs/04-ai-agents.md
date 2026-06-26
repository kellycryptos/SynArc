---
icon: robot
---

# Automated Treasury Guard

SynArc introduces the **Automated Treasury Guard**, a specialized helper designed to monitor workspace allocations, track treasury rules, propose rebalance options, and execute secure cross-chain transfers when community conditions are met.

***

## Overview

Traditional community treasuries often suffer from idle capital, requiring manual oversight, complicated approvals, and risky bridge mechanics that introduce security vulnerabilities. 

The **SynArc Automated Treasury Guard** resolves this by operating under community-approved automation rules:
1. **24/7 Monitoring**: Reads real-time reserves and alerts coordinators when limits are reached.
2. **Automated Proposals**: Generates clear rebalancing proposals via an **AI assistant** when yield variances exceed threshold limits.
3. **Secure Execution**: Performs fast, slippage-free stablecoin transfers using a **direct cross-chain bridge** once approved by the community.

```
+--------------------+      Variance      +-----------------------+
|  On-Chain Yields   |  ===============>  |  AI Assistant Guard   |
|  (USDC/EURC Pools) |                    |  Proposes Rebalance   |
+--------------------+                    +-----------------------+
                                                      ||
                                                      || Community Votes
                                                      \/
+--------------------+      Direct        +-----------------------+
| External Chain     |  <===============  | Arc Testnet Governor  |
| (Minted native)    |      Transfer      | Executes Rebalance    |
+--------------------+                    +-----------------------+
```


---

## Deep Circle Integrations

The Automated Treasury Guard incorporates three key pillars of safe stablecoin management:

### 1. Direct Cross-Chain Bridge
Used for bidirectional stablecoin rebalancing. When a proposal to reallocate funds passes governance, the guard triggers a programmatic transfer using `depositForBurn` on Arc Testnet, pulls Circle's Iris API, and mints native USDC on the destination chain without relying on wrapper contracts or external liquidity providers.

### 2. Smart Account Identity
The guard operates under an **ERC-8004 identity** registered on the Arc Testnet registry at `0x8004A...`. This registry ties the guard's code, ownership, and reputation index (vouched or disavowed by community members) directly to the blockchain. Asset keys are held securely in a modular multisig vault, while execution keys are delegated to the guard's automation scripts.

### 3. Micro-gas Payments
Every inference request and transaction analysis run by the guard is paid for using micro-cent USDC transfers as small as **$0.01**. This ensures that automated operations pay for their own computational gas and API costs, preventing treasury drain.

---

## Programmatic Developer API

Integrate your own autonomous scripts with SynArc's endpoints:

### 1. Propose Allocation
* **Method:** `POST`
* **Endpoint:** `/api/agent/run`
* **Payload:** `{ "trigger": "yield_scan" }`
* **Description:** Forces the agent script to run a yield scan, generate a proposal, and submit it on-chain.
