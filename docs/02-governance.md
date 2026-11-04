---
icon: scale-balanced
---

# Governance

Syn DAO makes it simple for organizations, businesses, communities, and autonomous AI agents to coordinate decisions, vote on community initiatives, and execute treasury changes. This section details how proposals work, how to participate, how voting weight is determined, and the upcoming confidential governance roadmap.

---

## How Proposals Work

Syn DAO utilizes an on-chain, decentralized lifecycle modeled after the standard OpenZeppelin Governor contract.

```
Submission → Pending → Active → Queued (Timelock) → Executed / Defeated
```

1. **Submission & Pending State**: A proposal is submitted with executable transactions. It enters a **Pending** delay allowing delegates to adjust voting weight snapshots.
2. **Active Voting Phase**: The proposal enters the **Active** voting window. Members cast votes (For, Against, Abstain) signed cryptographically via their wallets.
3. **Resolution & Timelock Controller**: If voting requirements and the 4% Quorum are met, the proposal enters the **Timelock Controller** buffer (48 hours on Mainnet) to prevent immediate execution surprises.
4. **On-Chain Execution**: Once the timelock expires, anyone can execute the proposal transactions, triggering on-chain transfers or changing system properties.

---

## How to Create a Proposal

If your voting power meets or exceeds the proposal threshold, you can author a proposal:

1. Navigate to the **Proposals** tab and click **New Proposal**.
2. Fill in the **Title**, **Description**, **Category**, and **Execution Duration** parameters.
3. Under **Treasury Impact**, define the disbursement value in USDC, and assign the destination **Target EVM address**.
4. Confirm the transaction inside your connected Web3 or Circle wallet. Once mined, your proposal enters the **Pending** phase.

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

## How Voting Weight is Determined

Voting weight in the Syn DAO ecosystem is designed for flexibility, security, and Sybil resistance:

### 1. Checkpointed SynArcToken (sARC)
The core governance asset. 1 sARC corresponds to 1 raw vote. sARC tokens are fully delegatable and record check-pointed balance history on-chain (`ERC20Votes`) at the proposal snapshot block. This prevents flash loans or post-announcement balance changes from manipulating voting results.

### 2. USDC & Multi-Asset Economic Weighting
To align governance with actual skin in the game, community and business instances can incorporate stable asset balances (USDC, EURC, cirBTC) into voting calculations, preventing purely speculative token volatility from dominating decisions.

### 3. Pluggable Voting Strategies (via SDK)
Using the `synarc-agent-sdk`, developers and organizations can deploy custom voting logic:
* **Token-Weighted (Default)**: Direct checkpointed sARC balance.
* **Quadratic Voting ($\sqrt{\text{Tokens}}$)**: Diminishing voting weight returns per token to amplify grassroots consensus over whale concentration.
* **Staked Duration Multipliers**: Scaling voting power based on how long tokens have been locked in community vaults.
* **Reputation & Soulbound Badges**: Factoring in on-chain contribution attestations (ERC-721 or ERC-8004 Agent Registry entries).

---

## Delegation Guide

Delegation lets you assign your voting power to another address (or yourself) without transferring tokens. This is essential before you can vote.

### Why Delegate?

Syn DAO uses the `ERC20Votes` checkpoint standard. Your voting power is **inactive by default**. You must delegate to activate it — even if delegating to yourself.

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

### Programmatic Delegation via SDK

```typescript
import { SynArc, SYNARC_MAINNET } from 'synarc-agent-sdk';

const synarc = new SynArc({
  ...SYNARC_MAINNET,
  provider: window.ethereum,
});

// Self-delegate voting weight
await synarc.delegate(walletAddress);

// Delegate to a trusted community delegate
await synarc.delegate("0xDelegateeAddress...");
```

---

## Privacy & Shielded Ballots (Coming Soon)

Syn DAO is engineering Zero-Knowledge (ZK) privacy extensions for organizations and privacy-focused communities:

* **Confidential Ballots (ZK-SNARK Voting)**: Cast votes without revealing your wallet address or token holdings. A zero-knowledge proof verifies on-chain that the voter holds sufficient voting weight at the snapshot block while preserving ballot secrecy.
* **Shielded Treasury Disbursements**: Stealth payouts for sensitive corporate contracts, private payroll, and confidential grants.
* **Auditor Viewing Keys**: Selective cryptographic decryption keys allow enterprise compliance teams and external auditors to verify financial accuracy without public surveillance.

---

## Quorum & Thresholds

| Parameter | Value |
| :--- | :--- |
| **Quorum** | 4% of total sARC supply |
| **Proposal Threshold** | Minimum sARC balance to submit proposals |
| **Voting Period** | Configurable per-proposal (default: 3 days) |
| **Timelock Delay** | 48 hours on Mainnet (24 hours on Testnet) |
