---
icon: wallet
---

# Treasury

The SynArc Treasury manages all pool funding, inflow tracking, stablecoin reserves, and programmatic capital deployment. All movements require successful on-chain governance approval — no admin keys exist.

---

## How the Treasury Works

The SynArc Treasury is a fully on-chain multi-asset vault managed strictly by smart contracts. The treasury can hold multiple stablecoin assets (USDC and EURC), allowing the DAO to operate across major regional reserve currencies.

All capital inflows, allocations, and outflows are tracked inside the immutable ledger, precluding single-point-of-failure vulnerabilities like manual multi-sig overrides.

### Treasury Architecture

```
Contributor Deposit
        ↓
  SynArcTreasury (vault)
        ↓
 Governor Proposal Pass
        ↓
TimelockController delay
        ↓
  On-chain Execution → Target Address
```

---

## How to Deposit USDC

To fund the DAO operating runway, members can deposit USDC directly using the frontend:

1. Navigate to the **Treasury** page in the sidebar.
2. Locate the **Deposit Portal** on the right side of the dashboard.
3. Ensure the **USDC** tab is selected.
4. Enter the deposit amount or click **MAX** to fetch your current wallet balance.
5. Click **Deposit USDC** and authorize the ERC20 approval and deposit transactions inside your Privy wallet.

---

## How to Deposit EURC

In addition to USDC, SynArc natively supports EURC stablecoin deposits:

1. Toggle the token selector inside the **Deposit Portal** to **EURC**.
2. Input your desired deposit amount in EURC.
3. Authorize the approval transaction followed by the deposit transaction.
4. Once validated, your EURC will populate the treasury reserves separately, with the frontend converting its value dynamically to USD (at a 1.08 exchange rate) for portfolio mapping.

---

## Fund Allocation & Management

The SynArc Treasury targets the following capital allocation strategy:

| Allocation | Target % | Purpose |
| :--- | :--- | :--- |
| **Liquid Reserves** | 82% | Operating capital in secure, highly liquid multisig vaults |
| **Yield Generation** | 15% | Conservative yield platforms (e.g. Morpho) to counter inflation |
| **Ecosystem Liquidity** | 3% | Automated market makers (e.g. ArcDEX) for token and LP stability |

> 💡 All allocation changes require a successful governance proposal — no single actor can reallocate treasury funds unilaterally.

---

## How Funds are Released via Governance

SynArc has **no admin keys**. No founder, member, or developer can withdraw assets manually. Release of funds is fully automated through the governance lifecycle:

### Automated Smart Contract Flow

1. A governance proposal is submitted specifying the **target address** and **USDC amount** to disburse.
2. The proposal passes quorum (4% of sARC supply) during the Active voting period.
3. The proposal enters the **TimelockController** buffer (1–2 day delay) — giving the community time to react if something looks wrong.
4. After the timelock expires, the `execute()` call releases the USDC directly to the target address.

### Creator DAO Milestone Releases

Creator DAOs use a separate but parallel mechanism:

1. Each Creator DAO has its own **isolated `SynArcCrowdfund` escrow contract**.
2. Funds are locked until each milestone is approved by the community via on-chain vote.
3. Upon milestone approval, USDC is released 1:1 directly to the creator/beneficiary wallet.
4. If a campaign fails to meet its goal or milestone votes are rejected, contributors can **claim a refund**.

---

## Treasury Dashboard

The **Treasury** page in the SynArc dashboard shows:

- **Total Reserves** — real-time USDC + EURC balances
- **Asset Breakdown** — pie chart of liquid vs. yield vs. liquidity allocation
- **Recent Transactions** — inflow and outflow ledger
- **Proposal Queue** — pending treasury proposals awaiting execution

---

## Security Notes

- The treasury contract (`SynArcTreasury`) is owned exclusively by the `TimelockController` — not any EOA.
- No individual wallet address can call `withdraw()` directly.
- EURC reserves are tracked separately and converted to USD for display only.
- All treasury balances are read directly from the Arc Testnet chain via `viem`.
