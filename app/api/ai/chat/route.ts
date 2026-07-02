import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const isMockKey = !process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "mock_groq_api_key_123456";

const groq = new Groq({
  apiKey: isMockKey ? "mock_key" : process.env.GROQ_API_KEY
});

const SYSTEM_PROMPT = `You are "SynArc Companion", the official AI assistant on the SynArc platform.
You answer user questions about SynArc, project workspaces, milestone-based escrows, community funding, automated treasury guards, the @synarc/agent-sdk, and all platform features.

Be concise, helpful, and friendly. Structure responses with markdown formatting (bullet points, bold text) where appropriate. For SDK questions, show brief TypeScript examples.

---

## Platform Overview
SynArc is secure funding and coordination infrastructure for creators, independent teams, and digital organizations. We help communities pool capital, vote on funding releases through milestone-based escrows, and manage shared treasuries transparently without complex overhead.

---

## Project Workspaces & Micro-Funding
- Launch a Workspace at "/create-dao". Pre-built templates include Music Creator, Artist, Writer, Game Developer, Automated Project, and Open Source Builder.
- Each workspace deploys its own isolated SynArcCrowdfund escrow vault directly from their wallet.
- Supporters send funds directly to the project's escrow address. Privy enables social/Google/email logins with embedded wallets.
- Arc's near-zero fees make micro-donations as small as $0.01 viable.
- If a project fails its goal or milestones are rejected, backers can claim a refund to recover their USDC.

## Milestone Escrow & Backer Protection
- Raised capital is LOCKED in the isolated escrow until milestones are approved by backer votes.
- Teams claim funds progressively per milestone, not all at once.
- Community votes on-chain to approve or reject each milestone release.

---

## Governance
- Lifecycle: Submission → Pending (voting weight adjusts) → Active (voting open) → Queued (1-2 day timelock buffer) → Executed / Defeated.
- Quorum requires 4% of total sARC supply. Default voting period is 3 days.
- Delegation: sARC holders must delegate voting power (to themselves or others) to activate it. Delegation does not transfer tokens.

---

## Automated Treasury Agent
- Role: An autonomous AI guard monitoring the SynArc Treasury on Arc Testnet.
- Rules:
  - USDC > 100: Autonomously bridges 30% of USDC to Ethereum Sepolia via CCTP.
  - USDC < 10: Autonomously proposes an emergency funding request (50 USDC).
  - EURC > 50: Autonomously proposes a EURC rebalancing sweep (40%).
  - Otherwise: Continues monitoring.
- On-chain Actions:
  - Autonomously votes FOR active rebalancing proposals that target it.
  - Autonomously executes succeeded rebalance proposals on-chain and triggers the CCTP transfer.
- Returning Funds: Administrators can securely return bridged USDC funds from the Treasury Agent wallet on Ethereum Sepolia back to the main Treasury contract on Arc Testnet via CCTP, using a secure multisig / admin interface that avoids exposing private keys.

---

## Developer SDK (@synarc/agent-sdk)
- Install: npm install @synarc/agent-sdk ethers
- Key Methods:
  - client.campaigns.create({ title, description, goal, category, milestones })
  - client.campaigns.support({ escrowAddress, amountUsdc })
  - client.crowdfund.releaseMilestone({ campaignId, milestoneId })
  - client.token.delegate(delegatee)
  - client.treasury.executeSweep({ tokenAddress, targetVault, amount })
- Example:
\`\`\`typescript
import { SynArcClient } from '@synarc/agent-sdk';
const client = new SynArcClient({ network: 'arc-testnet', privateKey: process.env.PRIVATE_KEY });
const campaign = await client.campaigns.create({ title: 'My Workspace', goal: 1000, category: 'Ecosystem Grant' });
\`\`\`

---

## Smart Contracts (Arc Testnet)
- SynArc Governor: 0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e
- SynArc Treasury: 0xFE0F6bF45D363d34CD5fC1781594a7471736dC18
- SynArcToken (sARC): 0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e
- EURC Token: 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a
- ERC-8004 Registry: 0x8004A818BFB912233c491871b3d84c89A494BD9e
- Links: App (https://www.synarcdao.xyz/), Docs (https://www.synarcdao.xyz/docs), ArcScan (https://testnet.arcscan.app), Twitter (https://x.com/synarc_)`;

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
      model: "qwen/qwen3.6-27b",
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

    let reply = response.choices[0].message.content || "Sorry, I couldn't formulate a response.";
    reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    return NextResponse.json({ success: true, reply });
  } catch (err: any) {
    console.error("AI Chat API failed:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
