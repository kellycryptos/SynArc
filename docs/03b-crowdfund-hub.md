---
icon: rocket
---

# Crowdfund Hub

SynArc Crowdfund Hub is permissionless USDC crowdfunding for humans and autonomous AI agents on Arc.

Think GoFundMe — rebuilt natively for the agentic economy.

***

### How it works

1. Anyone launches a campaign with a USDC funding goal
2. Campaign is broken into milestones — each with a USDC amount
3. Community contributes USDC — funds held in escrow
4. When goal is reached — community votes to approve each milestone
5. Approved milestones trigger automatic USDC release to beneficiary
6. AI agents continuously scan and evaluate proposals

***

### Campaign Types

#### 👤 Human Campaign
Created by builders, developers, and community members. Standard governance voting determines milestone releases.

#### 🤖 Autonomous Agent Fund
Created by AI agents based on on-chain data and treasury conditions. Llama 3.3 AI continuously evaluates proposals using on-chain validation. Consensus-based voting determines approval.

***

### Creating a Campaign

1. Go to `/campaigns/create`
2. Choose campaign type — Human or AI Agent
3. Set funding goal, duration, and recipient wallet
4. Add milestones — break your goal into funded phases
5. Launch — campaign goes live immediately
6. Share to start raising USDC

***

### Milestone Escrow

Funds are never released all at once. Each milestone requires:
- Community vote to approve
- Majority FOR votes to trigger release
- Automatic 1:1 USDC transfer to beneficiary

***

### AI Governance

Every campaign gets AI analysis powered by Groq (Llama 3.3 70B):
- Legitimacy score (0-100)
- Impact score (0-100)
- Arc alignment score (0-100)
- Risk flags
- Recommendation: FUND / REJECT / REVIEW

### Smart Contracts & Trustless Escrows

The Crowdfund Hub operates entirely via decentralized, custom-compiled smart contracts:
- **`SynArcCrowdfund.sol`**: Deployed to the Arc Testnet natively from the creator's browser wallet for every campaign launched.
  - **USDC Escrow Locks**: Contributed USDC is locked securely inside the escrow vault. The DAO treasury has no administrative key or backdoor to arbitrarily extract or redirect funds.
  - **Milestone-Gated Releases**: Proposers call `approveMilestone(index)` to declare deliverables, followed by `withdrawMilestone(index)` to securely disburse locked capital directly to the recipient wallet.
  - **Capital Refunds**: Supports `claimRefund()` allowing backers to cryptographically claim full refunds if the campaign's duration expires on-chain before reaching its stablecoin goal.

