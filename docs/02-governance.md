---
icon: scale-balanced
---

# Governance

SynArc enables decentralized, on-chain administration modeled after standard, battle-tested governance architectures. This section details the proposal lifecycle, authoring criteria, and voting rules.

***

## How Proposals Work

SynArc utilizes an on-chain, decentralized lifecycle modeled after the standard OpenZeppelin Governor contract.

1. **Submission & Pending State**: A proposal is submitted with executable transactions. It enters a **Pending** delay allowing delegates to adjust voting weight snapshots.
2. **Active Voting Phase**: The proposal enters the **Active** voting window. Members cast votes (For, Against, Abstain) signed cryptographically via their wallets.
3. **Resolution & Timelock Controller**: If voting requirements and the 4% Quorum are met, the proposal enters the **Timelock Controller** buffer to prevent immediate execution surprises.
4. **On-Chain Execution**: Once the timelock expires, anyone can execute the proposal transactions, triggering on-chain transfers or changing system properties.

***

## How to Create a Proposal

If your voting power meets or exceeds the proposal threshold, you can author a proposal:

1. Navigate to the **Proposals** tab and click **New Proposal**.
2. Fill in the **Title**, **Description**, **Category**, and **Execution Duration** parameters.
3. Under **Treasury Impact**, define the disbursement value in USDC, and assign the destination **Target EVM address**.
4. Confirm the transaction inside your Privy embedded wallet. Once mined, your proposal enters the **Pending** phase.

***

## How to Vote

Active proposals can be voted on by any member with a balance greater than 0 sARC at the snapshot block:

1. Select any proposal currently marked as **Active** from the Proposals grid.
2. Select **For**, **Against**, or **Abstain** on the voting module card.
3. _Optional_: Add a text reason detailing your voting rationale.
4. Author the signature inside your wallet to submit your vote on-chain.

***

## Proposal States Explained

* **Pending**: Proposal has been submitted but voting snapshot has not been finalized yet. Users can delegate weight.
* **Active**: Voting is actively open. Users can record cryptographic signatures on-chain to support or oppose.
* **Executed**: The proposal has passed quorum, satisfied timelock delays, and has been successfully executed on-chain.
* **Defeated**: The voting window has closed but the proposal failed to meet quorum or received majority Against votes.

***

## Voting Power: USDC + SynArcToken

Voting weight in the SynArc DAO ecosystem is governed by two complementary tokens:

### 1. SynArcToken (sARC)

The core governance asset. 1 sARC corresponds to 1 raw vote. sARC tokens are fully delegatable and record check-pointed balance history on-chain to prevent double-voting.

### 2. USDC Balance Weight

To align capital with operations, SynArc utilizes USDC balances to calculate dynamic delegation multipliers, reinforcing stable, institutional-grade decision metrics.
