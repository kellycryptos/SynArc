---
icon: circle-question
---

# FAQ

This section answers frequently asked questions about the SynArc ecosystem, token metrics, reserve management, project workspaces, and security.

---

## General

### 1. What is Arc Testnet?

Arc is a high-performance EVM-equivalent blockchain tailored for the decentralized stablecoin economy and AI autonomous agent coordination. Transaction fees are denominated natively in USDC.

### 2. What is USDC?

USDC is a fully reserve-backed digital dollar stablecoin minted by Circle. SynArc coordinates all treasury allocations and vote parameters using USDC to prevent asset volatility risks.

### 3. Is SynArc audited?

The core smart contracts inherit from battle-tested OpenZeppelin Governor and ERC20 sets. The multi-asset treasury vault addition is currently undergoing internal audit preparations. Do not deploy high-value mainnet funds before final security reports are released.

### 4. How do I report a bug?

If you detect any issues, file a bug report directly inside our [GitHub repository issue tracker](https://github.com/kellycryptos/SynArc/issues), or drop a message to the engineering team in the Discord channel.

### 5. Where can I get help?

Visit our Discord server for technical support, or browse our internal documentation sections to learn more about the platform's core features.

---

## Workspaces & Micro-Funding
 
### 6. What is a Project Workspace?
 
A Project Workspace is a shared coordination space launched by creators or project teams on SynArc. Each workspace deploys its own isolated escrow vault, holding backer funds securely until milestones are approved by community votes.
 
### 7. How do I launch a Project Workspace?
 
Go to **Create Workspace** in the sidebar, choose a template (Music, Artist, Automated Project, or Builder), fill in your campaign details and milestones, then click **Launch Project Workspace**. Your wallet will deploy a fresh escrow contract to Arc Testnet. The whole process takes under 2 minutes.
 
See the [Creator Economy guide](/docs/creator-economy) for step-by-step instructions.
 
### 8. How does micro-funding work?
 
Micro-funding contributions are direct stablecoin transfers from a supporter's wallet to a project's escrow contract. Arc's ultra-low fees make payments as small as **$0.01** economically viable. Simply visit a project profile, click a preset amount ($1, $5, $10) or enter a custom amount, and confirm the transaction in your wallet.
 
### 9. Can I browse workspaces without a wallet?
 
Yes! Workspace profiles, the leaderboard, and all read-only views are fully accessible without connecting a wallet. A wallet is only required to send micro-funding, create a workspace, or vote on milestones.

### 10. What happens if a campaign doesn't reach its goal?

If a campaign's funding goal is not reached by the deadline, backers can call `claimRefund()` on the escrow contract to recover their contributed USDC. No funds can be taken by the creator if the goal isn't met.

### 11. How are milestones released?

Milestone releases require:
1. The creator to mark a milestone as complete.
2. A community governance vote — majority FOR votes required.
3. An on-chain transaction calling `withdrawMilestone(index)` which releases USDC 1:1 to the creator's beneficiary wallet.

### 12. How do I share my workspace profile?
 
Every creator profile has a canonical URL: `https://synarcdao.xyz/creator/[your-slug]`. Click the **Share** button on your profile to use the native Web Share API (mobile) or copy the link to clipboard (desktop).

---

## SDK & Developers

### 13. How do I install the Agent SDK?

```bash
npm install @synarc/agent-sdk ethers
```

See the full [SDK guide](/docs/sdk) for initialization and quickstart examples.

### 14. Can developers launch project workspaces programmatically?
 
Yes! Using `client.campaigns.create()` in the SDK, developers can deploy project workspaces, contribute micro-funding, and read live campaign metrics entirely programmatically.

### 15. What is ERC-8004?

ERC-8004 is the on-chain AI Agent identity standard used by SynArc. Agents register their name, capabilities, and metadata on Arc Testnet's ERC-8004 registry contract (`0x8004A818BFB912233c491871b3d84c89A494BD9e`), enabling verifiable on-chain participation in governance and fundraising.

---

## Security

### 16. Who controls the SynArc Treasury?

No individual controls the treasury. It is owned exclusively by the `TimelockController` smart contract. All disbursements require a successful governance proposal, quorum approval, and a 1–2 day timelock delay before execution.

### 17. Are project escrows shared?
 
No. Every workspace deploys its own completely independent escrow vault. There is no shared contract holding multiple projects' funds — eliminating shared-contract attack surfaces.

### 18. How can I verify a Creator DAO escrow contract?

After launching your Creator DAO, you'll see the deployed contract address in the success screen. Visit [testnet.arcscan.app](https://testnet.arcscan.app), search for the address, and use the verification guide in [Smart Contracts](/docs/smart-contracts) to publish your source code.
