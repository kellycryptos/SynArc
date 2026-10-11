---
icon: settings
---

# Technical Reference

This section provides a deep technical reference of the Syn DAO protocol architecture, transaction flows, security controls, and on-chain specifications.

***

## Protocol Architecture

Syn DAO is designed as a modular, stablecoin-native governance layer on the Arc network. It decouples long-term asset management (Timelocked Treasury Vaults) from short-term operations (AI Agent Executors).

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

Syn DAO's Creator DAO mechanism protects contributors by holding funds in campaign-specific escrows (`SynArcCrowdfund.sol`) that release tokens based on milestone approvals.

1. **DAO Creation**: Creator deploys a `SynArcCrowdfund` contract.
2. **Capital Contribution**: Backers deposit USDC or EURC into the escrow.
3. **Milestone Locks**: Funds are partitioned into milestones (e.g., 30% / 40% / 30%).
4. **Milestone Verification**: The creator requests a release, triggering a DAO proposal.
5. **Release / Refund**: If the proposal passes, the milestone funds release to the creator. If the milestone fails, backers can trigger refund claims for the remaining escrow balance.

***

## Network Specifications

Syn DAO operates natively on **Arc** (Circle's Layer 1 blockchain where gas is paid natively in USDC):

### Arc Mainnet — Production
* **EVM Chain ID:** `5042`
* **Official Primary RPC:** `https://rpc.mainnet.arc.io` (Fallback: `https://rpc.arc.network`)
* **Block Explorer:** [explorer.arc.io](https://explorer.arc.io)
* **Canonical USDC (Gas Token):** `0x3600000000000000000000000000000000000000`
* **Canonical EURC:** `0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1`
* **SynArcToken (sARC):** `0x8f4b429794ABa4607d177b100Cc5e481D22d0ad4`
* **SynArc Treasury (Release Valve):** `0x8205e9782Fe54fD2aaD895b436B695db169F3d7B`
* **SynArc Governor:** `0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025`

### Arc Testnet — Developer Sandbox
* **EVM Chain ID:** `5042002`
* **Official RPC URL:** `https://rpc.testnet.arc.network`
* **Block Explorer:** [testnet.arcscan.app](https://testnet.arcscan.app)
* **Canonical USDC (Gas Token):** `0x3600000000000000000000000000000000000000`
* **EURC Contract Address:** `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a`
* **SynArcToken (sARC):** `0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e`
* **SynArc Treasury (Governance):** `0xFE0F6bF45D363d34CD5fC1781594a7471736dC18`
* **SynArc Treasury (Agent Operating):** `0xE6bAC65d7f060B805B8dd6f1c4DBfa6571905f28`
* **SynArc Governor:** `0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e`
* **ERC-8004 Registry:** `0x8004A818BFB912233c491871b3d84c89A494BD9e`
