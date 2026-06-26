---
icon: scale-balanced
---

# Governance

SynArc makes it simple for creators and decentralized teams to coordinate decisions, vote on community initiatives, and execute treasury changes. This section details how proposals work, how to participate, and how voting weight is determined.

---

## How Proposals Work

SynArc utilizes an on-chain, decentralized lifecycle modeled after the standard OpenZeppelin Governor contract.

```
Submission → Pending → Active → Queued (Timelock) → Executed / Defeated
```

1. **Submission & Pending State**: A proposal is submitted with executable transactions. It enters a **Pending** delay allowing delegates to adjust voting weight snapshots.
2. **Active Voting Phase**: The proposal enters the **Active** voting window. Members cast votes (For, Against, Abstain) signed cryptographically via their wallets.
3. **Resolution & Timelock Controller**: If voting requirements and the 4% Quorum are met, the proposal enters the **Timelock Controller** buffer to prevent immediate execution surprises.
4. **On-Chain Execution**: Once the timelock expires, anyone can execute the proposal transactions, triggering on-chain transfers or changing system properties.

---

## How to Create a Proposal

If your voting power meets or exceeds the proposal threshold, you can author a proposal:

1. Navigate to the **Proposals** tab and click **New Proposal**.
2. Fill in the **Title**, **Description**, **Category**, and **Execution Duration** parameters.
3. Under **Treasury Impact**, define the disbursement value in USDC, and assign the destination **Target EVM address**.
4. Confirm the transaction inside your Privy embedded wallet. Once mined, your proposal enters the **Pending** phase.

> ⚠️ You need a minimum sARC balance (above the `proposalThreshold`) to submit proposals. If you don't have enough, consider requesting delegation from another member.

---

## How to Vote

Active proposals can be voted on by any member with a balance greater than 0 sARC at the snapshot block:

1. Select any proposal currently marked as **Active** from the Proposals grid.
2. Select **For**, **Against**, or **Abstain** on the voting module card.
3. _Optional_: Add a text reason detailing your voting rationale.
4. Author the signature inside your wallet to submit your vote on-chain.

---

## Proposal States Explained

| State | Description |
| :--- | :--- |
| **Pending** | Submitted but snapshot not yet finalized. Members can adjust delegations. |
| **Active** | Voting window is open. Members cast cryptographic on-chain signatures. |
| **Queued** | Passed quorum and majority. Waiting in the Timelock buffer before execution. |
| **Executed** | Timelock expired and proposal transactions have been run on-chain. |
| **Defeated** | Voting window closed but failed to meet quorum or received majority Against votes. |
| **Cancelled** | Proposer withdrew the proposal before it reached execution. |

---

## Voting Power: USDC + SynArcToken

Voting weight in the SynArc DAO ecosystem is governed by two complementary tokens:

### 1. SynArcToken (sARC)

The core governance asset. 1 sARC corresponds to 1 raw vote. sARC tokens are fully delegatable and record check-pointed balance history on-chain to prevent double-voting.

### 2. USDC Balance Weight

To ensure that active participants have a voice, SynArc uses stable asset balances to calculate voting multipliers, reinforcing stable and reliable decision-making.

---

## Delegation Guide

Delegation lets you assign your voting power to another address (or yourself) without transferring tokens. This is essential before you can vote.

### Why Delegate?

SynArc uses the `ERC20Votes` checkpoint standard. Your voting power is **inactive by default**. You must delegate to activate it — even if delegating to yourself.

### How to Self-Delegate (activate your vote)

1. Go to the **Governance** page → **Delegate** tab.
2. Paste your own wallet address in the **Delegatee** field.
3. Click **Delegate Voting Power** and confirm the transaction.
4. Your sARC balance is now active as voting weight.

### How to Delegate to Another Member

1. Go to the **Governance** page → **Delegate** tab.
2. Paste the **Delegatee's wallet address**.
3. Click **Delegate Voting Power** and confirm.
4. Your votes are now attributed to their address on active proposals.

> 💡 Delegation does **not** transfer your tokens. You retain full ownership and can re-delegate at any time.

### Via the SDK

```typescript
// Self-delegate
await synarc.token.delegate(wallet.address);

// Delegate to another address
await synarc.token.delegate("0xDelegateeAddress...");

// Check current delegate
const currentDelegate = await synarc.token.getDelegate(wallet.address);
console.log("Currently delegated to:", currentDelegate);
```

---

## Quorum & Thresholds

| Parameter | Value |
| :--- | :--- |
| **Quorum** | 4% of total sARC supply |
| **Proposal Threshold** | Minimum sARC balance to submit proposals |
| **Voting Period** | Configurable per-proposal (default: 3 days) |
| **Timelock Delay** | 1–2 days before execution |
