---
icon: wallet
---

# Treasury

The SynArc Treasury manages all pool funding, inflow tracking, stablecoin reserves, and programmatic capital deployment.

***

## How the Treasury Works

The SynArc Treasury is a fully on-chain multi-asset vault managed strictly by smart contracts. The treasury can hold multiple stablecoin assets (USDC and EURC), allowing the DAO to operate across major regional reserve currencies.

All capital inflows, allocations, and outflows are tracked inside the immutable ledger, precluding single-point-of-failure vulnerabilities like manual multi-sig overrides.

***

## How to Deposit USDC

To fund the DAO operating runway, members can deposit USDC directly using the frontend:

1. Navigate to the **Treasury** page in the sidebar.
2. Locate the **Deposit Portal** on the right side of the dashboard.
3. Ensure the **USDC** tab is selected.
4. Enter the deposit amount or click **MAX** to fetch your current wallet balance.
5. Click **Deposit USDC** and authorize the ERC20 approval and deposit transactions inside your Privy wallet.

***

## How to Deposit EURC

In addition to USDC, SynArc natively supports EURC stablecoin deposits:

1. Toggle the token selector inside the **Deposit Portal** to **EURC**.
2. Input your desired deposit amount in EURC.
3. Authorize the approval transaction followed by the deposit transaction.
4. Once validated, your EURC will populate the treasury reserves separately, with the frontend converting its value dynamically to USD (converting EURC at a 1.08 exchange rate) for portfolio mapping.

***

## How Funds are Released via Governance

SynArc has no admin keys. No founder, member, or developer can withdraw assets manually. Release of funds is automated:

### Automated Smart Contract Flow

When a proposal requesting treasury capital successfully passes, the executable target inside the proposal represents a call to the treasury. Once the execution transaction is submitted on-chain, the Governor contract calls the `execute` wrapper, releasing the approved tokens directly to the proposal target address.
