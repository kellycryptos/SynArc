# Project Funding & Workspaces
 
SynArc enables creators, independent teams, and digital organizations to launch their own project workspaces, pool community funds, and govern reserves transparently through consensus.

---

## What is a Project Workspace?
 
A Project Workspace is a shared environment managed by creators or project teams and supported by their community of backers. Instead of high platform fees and intermediary control, workspaces establish direct relationships using secure escrows and community voting.
 
Key advantages include:
- **Digital Reserve Capital**: Accumulate and manage funding in native stablecoins without currency fluctuations.
- **Programmable Releases**: Capital is held in milestone-based escrow vaults, released only when deliverables are verified.
- **Isolated Security**: Each workspace deploys its own independent escrow contract — no shared contract risk.
- **Automated Assistance**: Automated guards and assistants can help monitor, alert, and govern treasury allocations.

---

## Launching a Project Workspace
 
Launching a workspace on SynArc takes less than 2 minutes.
 
### Step 1: Choose Your Template
Navigate to **Create Workspace** in the sidebar. Select from template types:
- 🎵 **Music Creator**: For albums, tours, or music videos.
- 🎨 **Artist**: For commissions, digital art, or physical galleries.
- 🤖 **Automated Project**: For starting a project with custom automated treasury rules.
- 🏗️ **Open Source / Builder**: For software development and ecosystem infrastructure.
 
### Step 2: Configure Goals & Details
Set your campaign name, target goal (in USDC), duration, and social tags. Crucially, specify the **milestones** that represent your deliverables. An AI assistant can auto-draft your campaign description from your title.
 
### Step 3: Deploy to Arc Testnet
Authenticate with your wallet (via Privy/MetaMask/Coinbase). Click **Launch Project Workspace**. This deploys a fresh, independent `SynArcCrowdfund` escrow contract from **your wallet** directly to Arc Testnet.

### Step 4: Share Your DAO
After deployment, a success screen shows:
- ✅ Your newly deployed **contract address** (linked to ArcScan)
- 🔗 Your **shareable profile URL**: `https://synarcdao.xyz/creator/[your-slug]`
- One-click **Share** button using the native Web Share API

---

## Creator Profile Pages
 
Every workspace has a public profile page at `/creator/[slug]` — accessible without a wallet connection.

### Profile Features:
- **Live On-Chain Metrics**: `totalRaised` and backer count read directly from your escrow contract via `viem`
- **Cover Image**: Upload a custom banner via the profile editor
- **Share Button**: Uses the Web Share API (mobile) or clipboard fallback (desktop) — copies `https://synarcdao.xyz/creator/[slug]`
- **Preset Donation Amounts**: $1, $5, $10, or custom amounts — triggers a real on-chain USDC transfer when wallet is connected
- **AI Agent Audit**: An automated Llama 3.3-powered audit analyzes campaign feasibility and outputs a legitimacy score
- **Social Links**: Twitter / X handle integration

### Share Your Profile
Click the **Share** button on any creator profile to:
1. On mobile: triggers the native OS share sheet (Web Share API)
2. On desktop: copies the URL to clipboard and shows a "Link copied!" toast

---

## Micro-Funding ($0.01 and up)
 
SynArc is optimized for the **micro-funding economy**. With transaction fees on the Arc network near-zero, fans can support creators with amounts as low as **$0.01**.

### Preset Donation Buttons
Each creator profile has preset buttons:

| Button | Amount |
| :--- | :--- |
| Tip | $0.01 – $0.10 |
| Support | $1.00 |
| Back | $5.00 |
| Champion | $10.00 |
| Custom | Any amount |

### How Micro-Funding Works
1. Connect your wallet (or Privy handles it automatically).
2. SynArc sends a USDC `transfer()` call to the creator's escrow contract address.
3. The transaction is confirmed on Arc in seconds.
4. The creator's live metrics update in real-time from the chain.

> 💡 **No wallet?** The platform prompts login instantly when you click a donation button.

---

## Creator Leaderboard
 
Navigate to **/leaderboard** to see a ranked list of all active workspaces.

### Leaderboard Filters
- **📅 Weekly** — campaigns with the most growth in the past 7 days
- **📆 Monthly** — top performers over the past 30 days
- **🏆 All Time** — highest total raised across all campaigns

### What's Shown
Each leaderboard entry displays:
- Creator name, avatar, and category tag
- Total USDC raised (live from chain)
- Number of backers
- Campaign progress bar toward goal
- Quicklink to the creator profile

---

## Milestone Escrow & Community Voting

To ensure trust, all raised capital is managed under a milestone-based safety mechanism:

1. **Capital Locking**: Contributed funds are held securely within the campaign's isolated escrow contract.
2. **Release Triggers**: Creators claim funding in progressive milestones — not all at once.
3. **Governance Audits**: Community members review progress and cast on-chain votes to approve or veto release of funds for the next milestone.
4. **Refund Protection**: If a campaign fails to meet goals or milestones are rejected, contributors can reclaim their USDC.

Additionally, every campaign is subjected to an **AI Agent Audit** powered by Llama 3.3. This agent analyzes the validity, feasibility, and legitimacy of the creator's campaign and outputs:
- A **legitimacy score** (0–100)
- An **impact rating**
- Automatic **due diligence notes** to guide potential backer decisions

---

## Customizing via the SDK

For developers and advanced organizations, the entire Creator Economy architecture is customizable via the **@synarc/agent-sdk**.

You can programmatically:
- **Query Campaigns**: Fetch active creator profiles, fundraising progress, and member details.
- **Deploy programmatically**: Let your own external AI agents or scripts launch DAOs dynamically.
- **Trigger Nanopayments**: Inject tip and support features into your own frontends or social bots.

```typescript
import { SynArcClient } from "@synarc/agent-sdk";

const client = new SynArcClient({
  network: "arc-testnet",
  privateKey: process.env.PRIVATE_KEY
});

// Launch a Creator DAO programmatically
const campaign = await client.campaigns.create({
  title: "Autonomous Art Agent",
  description: "AI agent generating generative NFT art on-chain",
  goal: 1000, // USDC
  category: "ai-agent"
});

console.log("Deployed Campaign Escrow:", campaign.escrowAddress);
console.log("Profile URL:", `https://synarcdao.xyz/creator/${campaign.slug}`);
```

→ See the full [Agent SDK guide](/docs/sdk) for all available methods.
