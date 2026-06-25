---
icon: settings
---

# Technical Reference

This section provides a deep technical reference of the SynArc protocol architecture, transaction flows, security controls, and on-chain specifications.

***

## Protocol Architecture

SynArc is designed as a modular, stablecoin-native governance layer on the Arc network. It decouples long-term asset management (Timelocked Treasury Vaults) from short-term operations (AI Agent Executors).

```
   ┌──────────────────────────────────────────────────────────┐
   │                       SynArc DAO                         │
   └─────────────┬──────────────────────────────┬─────────────┘
                 │ (Proposes & Votes)           │ (Authorizes)
                 ▼                              ▼
     ┌───────────────────────┐      ┌───────────────────────┐
     │    SynArc Governor    │      │ ERC-8004 Agent Registry│
     └───────────┬───────────┘      └───────────┬───────────┘
                 │ (Executes Actions)           │ (Vouches & Tracks)
                 ▼                              ▼
     ┌───────────────────────┐      ┌───────────────────────┐
     │  Timelocked Treasury  │      │ Deployed AI Agents    │
     └───────────┬───────────┘      └───────────────────────┘
                 │ (Allocates Gas & Capital)
                 ▼
     ┌───────────────────────┐
     │     Creator DAOs      │
     └───────────────────────┘
```

### Core Security Principles

1. **Gated Executions**: Deployed AI agent contracts (`SynArcAgent.sol`) delegate task executions to hot keys but route asset withdrawal and major treasury updates through timelocked multi-sig transactions.
2. **Deterministic Governance**: Custom proposal templates are validated on-chain to prevent malicious state manipulation.
3. **Reputation Registry**: The ERC-8004 Registry incorporates a decentralized peer vouching system where agents can be penalized or rewarded based on execution accuracy.

***

## ERC-8004 Identity Registry

The **ERC-8004** standard defines how autonomous agents advertise their identity, owner, capabilities, and dynamic reputation index.

### Interface Specification

```solidity
interface IERC8004 {
    event AgentRegistered(address indexed agentAddress, address indexed owner, string name);
    event ReputationUpdated(address indexed agentAddress, uint8 newReputation);

    function registerAgent(string calldata name, string[] calldata capabilities, string calldata metadataUri) external;
    function vouch(address agentAddress) external;
    function disavow(address agentAddress) external;
    function getAgent(address agentAddress) external view returns (
        address owner,
        string memory name,
        string[] memory capabilities,
        string memory metadataUri,
        uint8 reputationIndex
    );
}
```

***

## Treasury Escrow Flow

SynArc's Creator DAO mechanism protects contributors by holding funds in campaign-specific escrows (`SynArcCrowdfund.sol`) that release tokens based on milestone approvals.

1. **DAO Creation**: Creator deploys a `SynArcCrowdfund` contract.
2. **Capital Contribution**: Backers deposit USDC or EURC into the escrow.
3. **Milestone Locks**: Funds are partitioned into milestones (e.g., 30% / 40% / 30%).
4. **Milestone Verification**: The creator requests a release, triggering a DAO proposal.
5. **Release / Refund**: If the proposal passes, the milestone funds release to the creator. If the milestone fails, backers can trigger refund claims for the remaining escrow balance.

***

## Network Specifications

SynArc is optimized for the **Arc Testnet**. Here are the official contract parameters and endpoints:

* **EVM Chain ID:** `5042002`
* **Official RPC URL:** `https://rpc.testnet.arc.network`
* **Block Explorer:** `https://testnet.arcscan.app`
* **USDC Contract Address:** `0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e` (sARC is matched to this on-chain asset for voting checkpoints)
* **EURC Contract Address:** `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a`
