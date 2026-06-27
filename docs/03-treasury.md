---
icon: wallet
---

# Treasury

The SynArc Treasury manages workspace funds, tracks inflows, and handles reserve allocations. Every fund movement is community-approved and fully transparent — there are no admin overrides.

---

The SynArc Treasury is a fully secure workspace vault. The treasury can hold multiple stable digital assets (USDC and EURC), allowing teams to manage reserves across different currencies.
 
All capital inflows, allocations, and outflows are tracked inside a transparent ledger, ensuring full accountability.

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
| **Liquid Reserves** | 82% | Operating capital in secure, highly liquid workspace vaults |
| **Yield Generation** | 15% | Conservative yield platforms (e.g. Morpho) to counter inflation |
| **Ecosystem Liquidity** | 3% | Automated market makers (e.g. ArcDEX) for token and LP stability |

> 💡 All allocation changes require a successful governance proposal — no single actor can reallocate treasury funds unilaterally.

---

## Automated Treasury Guard & Rules

The SynArc Treasury is integrated with the **Automated Treasury Guard** (Treasury Agent). While the treasury itself enforces core vault safety and timelocks, the Automated Treasury Guard acts as an automated executor following strict community-approved rules:
- **Auto Rebalancing**: Relocates stablecoins to higher-yield chains when thresholds are reached via native Circle CCTP. (Live)
- **Auto Payments**: Processes recurring payroll or scheduled payouts autonomously. (Live)
- **Risk Alerts & Pause**: Pauses operations automatically if low liquidity or abnormal outflows are detected. (Live)
- **Auto Yield Farming**: Staker/LP placement to generate yield on idle stablecoins. (Coming Soon)
- **Multi-Chain Sweep**: Automatically pulls incoming deposits from bridges back into the treasury. (Coming Soon)

For more details, see the [Automated Treasury Guard guide](04-ai-agents.md).

---

## How Funds are Released via Governance

SynArc has **no admin keys**. No founder, member, or developer can withdraw assets manually. Release of funds is fully automated through the governance lifecycle:

### Automated Smart Contract Flow

1. A governance proposal is submitted specifying the **target address** and **USDC amount** to disburse.
2. The proposal passes quorum (4% of sARC supply) during the Active voting period.
3. The proposal enters the **TimelockController** buffer (1–2 day delay) — giving the community time to react if something looks wrong.
4. After the timelock expires, the `execute()` call releases the USDC directly to the target address.

### Project Milestone Releases
 
Project workspaces use a separate but parallel mechanism:
 
1. Each workspace has its own **isolated escrow vault**.
2. Funds are locked until each milestone is approved by the community via on-chain vote.
3. Upon milestone approval, funds are released directly to the project's wallet.
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
