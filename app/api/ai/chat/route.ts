import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const isMockKey = !process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "mock_groq_api_key_123456";

const groq = new Groq({
  apiKey: isMockKey ? "mock_key" : process.env.GROQ_API_KEY
});

const SYSTEM_PROMPT = `You are "SynArc Assistant", the official AI companion on the SynArc platform.
You answer user questions about SynArc, Creator Economy, Creator DAOs, USDC nanopayments, milestone-based escrow governance, and @synarc/agent-sdk usage.

Key Context:
1. SynArc is a multi-DAO governance and funding layer built natively on Arc Testnet (Chain ID: 5042002, RPC: https://rpc.testnet.arc.network).
2. Creator DAOs: Creators and AI agents can launch their own on-chain organizations in one click at "/create-dao".
3. USDC Nanopayments: Supports micro-donations starting from $0.01 with near-zero gas on Arc.
4. Milestone Escrow: Contributed funds are locked in SynArcCrowdfund smart contracts and released progressively upon community milestone approval votes.
5. AI Risk Audits: Every campaign gets analyzed by our Llama 3.3 risk engine (legitimacy, impact, due diligence notes).
6. Agent SDK (@synarc/agent-sdk): A TypeScript library to query campaigns, deploy escrows, and tip creators programmatically.
7. Wallet Integrations: Supports Privy embedded wallets (social/Google/email login) and Circle programmable wallets.

Be concise, helpful, friendly, and structure your responses with bullet points where appropriate. If asked about SDK integration, show brief, clean TypeScript examples.`;

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
      let reply = "Hello! I am your SynArc Companion. I can help you understand how to launch Creator DAOs, configure milestone escrows, query the SDK, or execute USDC nanopayments on Arc Testnet. What would you like to build today?";

      if (lastMessage.includes("launch") || lastMessage.includes("create")) {
        reply = "To launch a Creator DAO, head over to the **Launch Creator DAO** page under `/create-dao`. You will go through a simple 3-step wizard: select your template (Music, Artist, Writing, Gaming, AI Agent, or Builder), enter your goal and milestones, and click deploy! This compiles and deploys a custom `SynArcCrowdfund` smart contract directly to Arc Testnet.";
      } else if (lastMessage.includes("nanopayment") || lastMessage.includes("usdc") || lastMessage.includes("tip")) {
        reply = "SynArc supports USDC nanopayments as low as **$0.01**. Because Arc Testnet gas fees are sub-penny, fans can micro-tip creators easily. Under creator profiles, you can click presets ($0.01, $0.10, $1.00) or enter a custom amount. The transaction triggers a direct on-chain deposit to the campaign's milestone escrow contract.";
      } else if (lastMessage.includes("sdk") || lastMessage.includes("agent-sdk")) {
        reply = "The `@synarc/agent-sdk` lets you interact with SynArc programmatically. You can install it via npm:\n`npm install @synarc/agent-sdk`\n\nHere is a simple example to launch a campaign:\n```typescript\nimport { SynArcClient } from '@synarc/agent-sdk';\nconst client = new SynArcClient({ network: 'arc-testnet' });\nconst campaign = await client.campaigns.create({\n  title: 'My AI Art DAO',\n  goal: 1000\n});\n```";
      } else if (lastMessage.includes("escrow") || lastMessage.includes("milestone") || lastMessage.includes("vote")) {
        reply = "Milestone Escrows secure backer capital. When contributors support a Creator DAO, USDC goes to a custom smart contract instead of the creator's wallet. The creator claims funds by completing milestones (e.g., 'Alpha Launch'). Release of each milestone requires a community approval vote.";
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      return NextResponse.json({ success: true, reply });
    }

    // Call Groq API
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
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
