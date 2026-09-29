---
icon: shield-check
---

# Adversarial Verification & Three-Way Match Architecture

## Why Syn DAO Does the Opposite of Circle's `arc-escrow`

In automated treasury and escrow management, the default assumption must be **adversarial**. When autonomous AI agents, off-chain prompt evaluations, and smart contract treasuries interact, relying on naive trust assumptions creates catastrophic systemic risks.

### The Problem: Circle's `arc-escrow` Reference Sample

Circle's `arc-escrow` reference sample—the starting point recommended to Request for Builders (RFB) applicants—releases real stablecoin reserves based on a single condition:

```typescript
// Circle's arc-escrow sample release logic
isValid = parsedPromptAnswerContent.valid && confidence === "HIGH"
```

This pattern exhibits critical failure modes:
1. **Blind AI Trigger**: Funds move purely because an off-chain LLM (e.g., GPT-4o) outputs the string `"HIGH"`. Prompt injection, context truncation, or model hallucinations immediately trigger fund transfers.
2. **Missing Document Checks**: The contract takes a recipient address and an amount with zero cryptographic or content-addressed verification of the underlying deliverable.
3. **Dead Timestamps**: The sample contract stores release timestamps on-chain but never reads or enforces them in the payout pathway.
4. **Payee Substitution Vulnerability**: Beneficiary payout addresses can be redirected without notice, mirroring the most common automated accounts payable fraud vector (vendor bank detail spoofing).
5. **Silent Discrepancies**: Partial failures or amount mismatches are either silently swallowed or lack granular revert signals.

---

## The 6 Architectural Principles of Syn DAO

Syn DAO rejects naive AI triggers and implements a **Contract-Level Three-Way Match** architecture inspired by robust enterprise accounting (Odoo) and idempotent simulation patterns (Ghostfolio).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SYN DAO THREE-WAY MATCH                         │
│                                                                        │
│   1. Purchase Order          2. Receiving Report      3. Vendor Invoice│
│   (Governor / OrderTerms)    (Deliverable / IPFS CID) (Release Claim)  │
│   ┌─────────────────────┐    ┌─────────────────────┐  ┌───────────────┐│
│   │ Proposal #42        │    │ IPFS CID Deliverable│  │ Invoice Hash  ││
│   │ Expected Hash: 0x8f…│    │ Actual Hash: 0x8f…  │  │ Claim: 25 USDC││
│   │ Budget: 25 USDC     │    │ CIDv1 Verified      │  │ Recipient: Bob││
│   │ Payee: Bob          │    │                     │  │               ││
│   └──────────┬──────────┘    └──────────┬──────────┘  └───────┬───────┘│
│              │                          │                     │        │
│              └──────────────────────────┼─────────────────────┘        │
│                                         ▼                              │
│                    ┌────────────────────────────────────────┐          │
│                    │   SynArcTreasury._evaluateMatch()      │          │
│                    │   - Order == Invoice == Deliverable?   │          │
│                    │   - Payee unchanged & cooled down?     │          │
│                    │   - AI score >= 70? (Input only)       │          │
│                    │   - Amount > 50 USDC? Human required!  │          │
│                    │   - Duplicate release key check        │          │
│                    └───────────────────┬────────────────────┘          │
│                                        ▼                              │
│                           Deterministic USDC Transfer                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Principle 1: Document-Anchored Entries (Odoo vs. ERPNext)

In traditional ERP design, ERPNext models the ledger as an unanchored running balance: entries can be appended without binding them to an immutable underlying document. In contrast, Odoo treats the **document as the entry**.

Syn DAO adopts the Odoo invariant on-chain:
- **No bare withdrawals**: Every fund disbursement strictly requires an explicit document reference (`proposalId`, `milestoneId`, `documentHash`, `invoiceHash`).
- **Auditability**: On-chain logs unambiguously answer: *Which passed community proposal, which milestone, and which specific deliverable hash is being paid?*
- The contract stores full historical records in `releaseHistory[releaseKey]` emitting `MilestoneReleased` with document anchors.

---

### Principle 2: Contract-Level Three-Way Match

In enterprise finance, Accounts Payable requires a **Three-Way Match** before any invoice is paid:
1. **Purchase Order (PO)**: The authorized terms, milestones, and budget approved by governance (`OrderTerms` or passed `SynArcGovernor` proposal).
2. **Receiving Report**: Cryptographic proof of deliverable receipt (`documentHash` matching the IPFS CIDv0/CIDv1 deliverable URI).
3. **Vendor Invoice**: The payment request submitted by the agent or recipient (`invoiceHash` and `amountUSDC`).

All three items MUST match deterministically inside `SynArcTreasury.sol`:

```solidity
// Order deliverable hash must match the received deliverable hash
if (order.expectedDocumentHash != documentHash) {
    revert DocumentReceiptMismatch(order.expectedDocumentHash, documentHash);
}

// Invoice amount must match approved order milestone amount exactly
if (order.amountUSDC != amountUSDC) {
    revert AmountMismatch(order.amountUSDC, amountUSDC);
}

// Invoice recipient must match current verified payee
if (currentPayee != recipient) {
    revert PayeeMismatch(currentPayee, recipient);
}
```

If a single micro-USDC or hash bit differs, the transaction reverts.

---

### Principle 3: Payee Change Tracking & Timelocked Cooldown

The single largest source of payment fraud in corporate AP is **payee substitution** (attackers or rogue agents changing the payout address right before disbursement).

Syn DAO mitigates this at the contract level:
- Changing a payout address requires a two-step handshake: `requestPayeeChange(proposalId, newPayee)` followed by `confirmPayeeChange(proposalId)`.
- Requesting a change emits `PayeeChangeRequested` and initiates a mandatory **48-hour timelocked cooldown** (`PAYEE_CHANGE_COOLDOWN = 2 days`).
- Releases attempted to the new address during cooldown revert with `PayeeCooldownActive(cooldownExpiry)`.
- Community backers and multisig signers have a 48-hour window to detect unauthorized substitutions and trigger `overridePayeeChange(...)`.

---

### Principle 4: Model Verdict as Input, Never Release Trigger

AI models are probabilistic; smart contracts are deterministic. Syn DAO treats AI verdicts as **bounded inputs**, never unconditional release triggers:

1. **Deterministic Bounding**: Off-chain agents (GPT-4o, Claude) evaluate deliverables and provide a confidence score (0–100). The contract enforces `aiConfidenceScore >= MIN_AI_CONFIDENCE_SCORE` (70). Lower scores revert with `LowConfidenceScore`.
2. **Dual-Key Multisig Gate**: For high-value disbursements exceeding `humanReviewThreshold` (default: 50 USDC), an AI confidence score of 100% is insufficient. Funds remain locked until an authorized human multisig or DAO security council calls `approveReleaseHuman(releaseKey)`. Releases attempted without human signoff revert with `HumanApprovalRequired`.

---

### Principle 5: Make Failure Loud

ERPNext's most dangerous accounting anti-pattern is silently dumping discrepancies into a "round-off" account. In decentralized treasury systems, silent tolerance enables draining attacks.

Syn DAO makes all failures **loud, explicit, and auditable** using custom Solidity errors:

| Custom Error | Trigger Condition |
| :--- | :--- |
| `OrderNotFound(proposalId, milestoneId)` | No approved order terms registered for milestone |
| `DocumentReceiptMismatch(expected, provided)` | Deliverable hash does not match approved proposal CID |
| `AmountMismatch(expected, provided)` | Claimed amount differs even by 1 micro-USDC |
| `PayeeMismatch(expected, provided)` | Invoice recipient does not match approved payee |
| `PayeeCooldownActive(unlockTimestamp)` | Payout attempted before 48h payee cooldown expires |
| `DuplicateRelease(proposalId, milestoneId)` | Replay attack or double-spending an invoice |
| `LowConfidenceScore(score, required)` | AI model evaluation score is below 70 |
| `HumanApprovalRequired(amount, threshold)` | Payout exceeds 50 USDC without human multisig signoff |
| `InsufficientTreasuryBalance()` | Treasury liquid reserves cannot cover disbursement |

---

### Principle 6: Idempotency Guard & Dry-Run Simulation (Ghostfolio Pattern)

Inspired by Ghostfolio's idempotent transaction processing:
- **Idempotency Guard**: Every release is keyed by `keccak256(abi.encodePacked(proposalId, milestoneId, invoiceHash))`. Once executed, `releaseExecuted[releaseKey] = true`. Replaying the same release immediately reverts with `DuplicateRelease`.
- **Pre-Flight Simulation**: The view function `simulateRelease(...)` executes complete validation logic off-chain without spending gas or committing state.

```typescript
const simulation = await treasury.simulateRelease({
  proposalId: 42,
  milestoneId: 1,
  documentHash: "0x8f...",
  invoiceHash: "0x3a...",
  recipient: "0xBob...",
  amountUSDC: 25,
  aiConfidenceScore: 92
});

console.log(simulation);
// {
//   canRelease: true,
//   isDuplicate: false,
//   orderMatches: true,
//   receiptMatches: true,
//   invoiceMatches: true,
//   payeeMatches: true,
//   payeeCooldownActive: false,
//   requiresHumanApproval: false,
//   sufficientBalance: true,
//   statusMessage: "Validation passed: ready for execution",
//   returnCode: 200
// }
```

---

## SDK Integration

Both `SynArcTreasury` and `SynArcTreasuryAgent` expose these methods in the `@synarc/agent-sdk`:

```typescript
import { SynArc, SynArcTreasury, SynArcTreasuryAgent } from 'synarc-agent-sdk';

const synarc = new SynArc({ privateKey: process.env.AGENT_PRIVATE_KEY! });
const treasury = new SynArcTreasury(synarc);

// 1. Simulate release before broadcasting
const preview = await treasury.simulateRelease(releaseParams);
if (!preview.canRelease) {
  throw new Error(`Simulation failed [${preview.returnCode}]: ${preview.statusMessage}`);
}

// 2. Execute Three-Way Match release
const txHash = await treasury.releaseMilestone(releaseParams);
console.log(`Milestone released: ${txHash}`);
```

---

## Summary of Differences: Syn DAO vs. `arc-escrow`

| Feature | Circle `arc-escrow` Sample | Syn DAO Treasury |
| :--- | :--- | :--- |
| **Release Trigger** | `parsedContent.valid && confidence === "HIGH"` | On-Chain Three-Way Match (Order == Receipt == Invoice) |
| **Deliverable Check** | None (funds released blindly) | Cryptographic Hash verification (IPFS CIDv0/CIDv1) |
| **Document Binding** | None | Document-anchored release entry (Odoo model) |
| **Payee Protection** | Unchecked address changes | 48-Hour Cooldown & Emergency Override |
| **Human In The Loop** | None | Mandatory multisig gate for amounts > 50 USDC |
| **Error Handling** | Silent / Generic Reverts | Loud Custom Errors with auditable parameters |
| **Dry-Run Mode** | None | Idempotent `simulateRelease` preview (Ghostfolio) |
| **Replay Protection** | Timestamp stored but never read | Idempotent release key mapping |
| **Release Valve Track** | Not supported | Tameion on Arc Mainnet 5042 |

---

## 7. Tameion Escrow Release Valve on Arc Mainnet (Chain ID 5042)

**Syn DAO is the release valve: USDC in escrow, proof attached, paid once.**

Agent can release under an on-chain cap. Over the cap it stops for a human. Same payment cannot run twice.

### The 3 Non-Negotiable Invariants

1. **USDC in Escrow**:
   - Liquid USDC resides natively within `SynArcTreasury.sol` on Arc Mainnet (`5042`).
   - Escrow is fully funded and backed; no uncollateralized promises or credit lines.

2. **Proof Attached**:
   - Deliverable proofs must be attached via content-addressed IPFS CIDs (CIDv0 or CIDv1) or deterministic cryptographic invoice hashes (`invoiceHash`).
   - The contract verifies the document anchor before releasing a single micro-USDC.

3. **Paid Once (Idempotency Active)**:
   - Every payout is protected by `executedReleases[releaseKey] = true` where `releaseKey = keccak256(abi.encodePacked(proposalId, milestoneId, invoiceHash))`.
   - Replaying the same claim immediately reverts with `DuplicateRelease(proposalId, milestoneId)`.

### On-Chain Threshold & Who Can Release

| Participant | Release Threshold | Permission Requirement | Revert on Breach |
| :--- | :--- | :--- | :--- |
| **Autonomous Agent** | $\le 50.00\text{ USDC}$ | `isAuthorizedAgent(caller) == true` | Reverts with `HumanApprovalRequired` if amount $> 50\text{ USDC}$ |
| **Human Reviewer / Multisig** | Unlimited ($> 50.00\text{ USDC}$) | `isAuthorizedReviewer(caller) == true` or `humanApproved[releaseKey] == true` | Reverts with `HumanApprovalRequired` if unauthorized |

### Rebrand & Official Channels
- **Official X (Twitter)**: [@syndaopro](https://x.com/syndaopro)
- **Live Domain**: [syndaopro.xyz](https://www.syndaopro.xyz/)
- **Arc Mainnet Explorer**: [explorer.arc.io](https://explorer.arc.io)

