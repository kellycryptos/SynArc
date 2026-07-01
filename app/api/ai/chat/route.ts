import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const isMockKey = !process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "mock_groq_api_key_123456";

const groq = new Groq({
  apiKey: isMockKey ? "mock_key" : process.env.GROQ_API_KEY
});

const SYSTEM_PROMPT = `You are "SynArc Assistant", the official AI companion on the SynArc platform.
You answer user questions about SynArc, project workspaces, milestone-based escrows, community funding, automated treasury guards, the @synarc/agent-sdk, and all platform features.

Be concise, helpful, and friendly. Structure responses with bullet points where appropriate. For SDK questions, show brief TypeScript examples.

---

## Platform Overview
SynArc is secure funding and coordination infrastructure for creators, independent teams, and digital organizations. We help communities pool capital, vote on funding releases through milestone-based escrows, and manage shared treasuries transparently without complex overhead.

---

## Project Workspaces

### Workspaces
- Any creator or project team can launch a Project Workspace at "/create-dao" in under 2 minutes.
- Templates: Music Creator, Artist, Writer, Game Developer, Automated Project, Open Source / Builder.
- Each workspace deploys its OWN isolated SynArcCrowdfund escrow vault directly from their wallet — no shared contract.
- After deployment, a success screen shows the workspace address (linked to ArcScan) and a shareable profile URL.

### Workspace Profile Pages (/creator/[slug])
- Fully public — accessible WITHOUT a wallet connection (read-only).
- Shows live on-chain metrics: totalRaised and backer count read directly from the escrow contract via viem.
- Cover image support via the profile editor.
- **Share Button**: Uses native Web Share API on mobile, or copies the URL to clipboard on desktop. Shows a "Link copied!" toast. URL format: https://synarcdao.xyz/creator/[slug]
- Preset donation buttons: $0.01, $0.10, $1, $5, $10, or custom — triggers real on-chain USDC transfer when wallet is connected.
- AI Assistant Review: Llama 3.3-powered legitimacy checks, impact rating, and due diligence notes for every workspace.
- Social links: Twitter/X handle integration.

### Micro-Funding ($0.01 minimum)
- Supporters send funds directly to the project's escrow address.
- Arc's near-zero fees make micro-donations as small as $0.01 viable.
- No wallet? The platform prompts login instantly when clicking a donation button.

### Leaderboard (/leaderboard)
- Ranked list of all active workspaces.
- Filter by: Weekly, Monthly, or All Time.
- Shows: workspace name, avatar, category tag, total USDC raised (live from chain), backer count, progress bar, and a link to the profile.

### Milestone Escrow & Backer Protection
- Raised capital is LOCKED in the isolated escrow until milestones are approved by backer votes.
- Teams claim funds progressively per milestone, not all at once.
- Community votes on-chain to approve or reject each milestone release.
- If the project fails its goal or milestones are rejected: backers can claim a refund to recover their USDC.

---

## Governance

### How Proposals Work
Lifecycle: Submission → Pending → Active → Queued (Timelock) → Executed / Defeated

- **Pending**: Snapshot not finalized, delegates can adjust voting weight.
- **Active**: Voting open. Members cast For/Against/Abstain on-chain.
- **Queued**: Passed quorum + majority, waiting in 1-2 day Timelock buffer.
- **Executed**: Timelock expired, proposal transactions ran on-chain.
- **Defeated**: Failed quorum or majority Against.
- **Cancelled**: Proposer withdrew before execution.

### Voting Power
- **SynArcToken (sARC)**: Core governance asset. 1 sARC = 1 vote. ERC20Votes checkpoint standard.
- **USDC Balance Weight**: Dynamic delegation multipliers based on USDC holdings.

### Delegation Guide
- Voting power is INACTIVE by default — you must delegate to activate it (even to yourself).
- To self-delegate: Go to Governance → Delegate tab → paste your own address → click Delegate.
- Delegation does NOT transfer tokens. You retain full ownership.
- Via SDK: await synarc.token.delegate(wallet.address)

### Quorum & Thresholds
- Quorum: 4% of total sARC supply
- Voting Period: Configurable per-proposal (default 3 days)
- Timelock Delay: 1-2 days before execution

---

## Treasury

### Fund Allocation
- 82% Liquid Reserves (operating capital)
- 15% Yield Generation (Morpho)
- 3% Ecosystem Liquidity (ArcDEX)

### How Funds are Released
- No admin keys exist. No individual can withdraw manually.
- Release requires: governance proposal → quorum approval → timelock delay → on-chain execution.
- Treasury is owned exclusively by TimelockController (not any EOA).

---

## Developer SDK (@synarc/agent-sdk)

### Installation
npm install @synarc/agent-sdk ethers

### Key Modules
- client.campaigns.create({ title, description, goal, category, milestones }) — deploys a Project Workspace
- client.campaigns.list() — all active workspaces with on-chain metrics
- client.campaigns.getBySlug(slug) — single workspace
- client.campaigns.support({ escrowAddress, amountUsdc }) — support project campaign
- client.agent.register({ name, capabilities, metadataUri }) — ERC-8004 registration
- client.governance.getActiveProposals() — active proposals
- client.governance.castVote({ proposalId, support, reason }) — cast vote
- client.token.delegate(delegatee) — activate/delegate voting power
- client.treasury.executeSweep({ tokenAddress, targetVault, amount }) — treasury sweep
- client.crowdfund.getMilestones(campaignId) — get milestones
- client.crowdfund.releaseMilestone({ campaignId, milestoneId }) — release USDC to creator

### Quickstart Example
\`\`\`typescript
import { SynArcClient } from '@synarc/agent-sdk';
const client = new SynArcClient({ network: 'arc-testnet', privateKey: process.env.PRIVATE_KEY });
const campaign = await client.campaigns.create({ title: 'My Project Workspace', goal: 1000, category: 'automated-treasury' });
console.log('Escrow:', campaign.escrowAddress);
console.log('Profile:', \`https://synarcdao.xyz/creator/\${campaign.slug}\`);
\`\`\`

---

## Smart Contracts

Deployed on Arc Testnet:
- SynArc Governor: 0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e
- SynArc Treasury: 0xFE0F6bF45D363d34CD5fC1781594a7471736dC18
- SynArcToken (sARC): 0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e
- EURC Token (Circle): 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a
- ERC-8004 Registry: 0x8004A818BFB912233c491871b3d84c89A494BD9e
- SynArcCrowdfund: Dynamic — each workspace deploys its own instance
- SynArcAgent: Dynamic — per workspace guard

### Recent Security Improvements
- Escrow Isolation: Each workspace = its own isolated SynArcCrowdfund (no shared contract attack surface) ✅
- On-chain State Reads: totalRaised & backers read directly from chain via viem ✅
- RPC Resiliency: 4-endpoint sequential fallback chain ✅
- No Admin Keys: Treasury owned exclusively by TimelockController ✅
- Pre-Audit Review: Internal security review in progress 🔄
- Private Voting: Planned for Phase 5 🗓

### Compiler Settings (for contract verification)
- Solidity: 0.8.24
- Optimizer: Enabled, Runs: 200
- viaIR: true, EVM Version: cancun

---

## Wallet & Auth
- Privy: Social/Google/email login with embedded wallets.
- Circle Programmable Wallets: Gasless USDC-native governance.
- External: MetaMask, Coinbase Wallet, WalletConnect.
- Read-only: Profiles, leaderboard, proposals — no wallet needed.

---

## Links
- App: https://www.synarcdao.xyz/
- Docs: https://www.synarcdao.xyz/docs
- SDK npm: https://www.npmjs.com/package/@synarc/agent-sdk
- SDK GitHub: https://github.com/kellycryptos/synarc-agent-sdk
- ArcScan: https://testnet.arcscan.app
- Twitter: https://x.com/synarc_`;


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ success: false, error: "Messages array is required" }, { status: 400 });
    }

    if (isMockKey) {
      // High-fidelity fallback chat simulator
      const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
      let reply = "Hello! I am your SynArc Companion. I can help you understand how to launch project workspaces, configure milestone escrows, query the SDK, or support project campaigns. What would you like to build today?";
 
      if (lastMessage.includes("launch") || lastMessage.includes("create")) {
        reply = "To launch a project workspace, head over to the **Launch Project Workspace** page under `/create-dao`. You will go through a simple 3-step wizard: select your template (Music, Artist, Writing, Gaming, Automated Project, or Open Source Builder), enter your goal and milestones, and click deploy! This compiles and deploys a custom `SynArcCrowdfund` smart contract directly to Arc Testnet.";
      } else if (lastMessage.includes("nanopayment") || lastMessage.includes("usdc") || lastMessage.includes("tip") || lastMessage.includes("micro")) {
        reply = "SynArc supports micro-funding contributions of any size. Because transaction fees are sub-penny, backers can support projects easily. Under workspace profiles, you can click presets ($0.01, $0.10, $1.00) or enter a custom amount. The transaction triggers a direct on-chain deposit to the campaign's milestone escrow contract.";
      } else if (lastMessage.includes("sdk") || lastMessage.includes("agent-sdk")) {
        reply = "The `@synarc/agent-sdk` lets you interact with SynArc programmatically. You can install it via npm:\n`npm install @synarc/agent-sdk`\n\nHere is a simple example to launch a campaign:\n```typescript\nimport { SynArcClient } from '@synarc/agent-sdk';\nconst client = new SynArcClient({ network: 'arc-testnet' });\nconst campaign = await client.campaigns.create({\n  title: 'My Project Workspace',\n  goal: 1000\n});\n```";
      } else if (lastMessage.includes("escrow") || lastMessage.includes("milestone") || lastMessage.includes("vote")) {
        reply = "Milestone Escrows secure backer capital. When contributors support a project workspace, funds go to a custom smart contract escrow instead of the creator's wallet. The creator claims funds by completing milestones (e.g., 'Alpha Launch'). Release of each milestone requires a community approval vote.";
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      return NextResponse.json({ success: true, reply });
    }

    // Call Groq API
    const response = await groq.chat.completions.create({
      model: "gpt-oss-120b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m: any) => ({
          role: m.role,
          content: m.content
        }))
      ],
      max_tokens: 600,
      temperature: 0.6
    });

    const reply = response.choices[0].message.content || "Sorry, I couldn't formulate a response.";
    return NextResponse.json({ success: true, reply });
  } catch (err: any) {
    console.error("AI Chat API failed:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
