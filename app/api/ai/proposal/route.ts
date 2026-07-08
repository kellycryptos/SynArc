import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

// Fallback logic if API key is not present or is the default mock key
const isMockKey = !process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "mock_groq_api_key_123456";

const groq = new Groq({
  apiKey: isMockKey ? "mock_key" : process.env.GROQ_API_KEY
});

function tolerantParse(str: string): any {
  let cleaned = str.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {}

  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {}

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {}

  let fixed = cleaned;
  fixed = fixed.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/g, '"$1":');
  fixed = fixed.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ': "$1"');
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
  fixed = fixed.replace(/,\s*([}\]])/g, '$1');
  fixed = fixed.replace(/:\s*True\b/gi, ': true');
  fixed = fixed.replace(/:\s*False\b/gi, ': false');
  fixed = fixed.replace(/:\s*Null\b/gi, ': null');

  try {
    return JSON.parse(fixed);
  } catch (e) {
    console.error("[tolerantParse] Failed parsing even after fixes. Original:", str);
    throw e;
  }
}

function fallbackGenerate(text: string): any {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  
  let title = "✨ AI Generated Proposal";
  const titleMatch = cleaned.match(/title["'\s:]+([^"}\n]+)/i);
  if (titleMatch) title = titleMatch[1].trim().replace(/^"/, "").replace(/"$/, "");

  let description = "This proposal details the design, execution parameters, and milestones to successfully implement the community initiative.";
  const descMatch = cleaned.match(/description["'\s:]+([^"}\n]+)/i);
  if (descMatch) description = descMatch[1].trim().replace(/^"/, "").replace(/"$/, "");
  else description = cleaned.substring(0, 500).trim();

  let category = "Governance";
  const catMatch = cleaned.match(/category["'\s:]+([^"}\n]+)/i);
  if (catMatch) category = catMatch[1].trim().replace(/^"/, "").replace(/"$/, "");

  let treasuryImpact = "medium";
  const impactMatch = cleaned.match(/treasuryImpact["'\s:]+([^"}\n]+)/i);
  if (impactMatch) treasuryImpact = impactMatch[1].trim().replace(/^"/, "").replace(/"$/, "");

  let votingDuration = 7;
  const durationMatch = cleaned.match(/votingDuration["'\s:]+(\d+)/i);
  if (durationMatch) votingDuration = parseInt(durationMatch[1], 10);

  return { title, description, category, treasuryImpact, votingDuration };
}

function fallbackGenerateCampaign(text: string): any {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "");

  let title = "✨ AI: Generated Campaign";
  const titleMatch = cleaned.match(/title["'\s:]+([^"}\n]+)/i);
  if (titleMatch) title = titleMatch[1].trim().replace(/^"/, "").replace(/"$/, "");

  let description = "This autonomous campaign proposes the implementation of a decentralized solution on Arc Testnet.";
  const descMatch = cleaned.match(/description["'\s:]+([^"}\n]+)/i);
  if (descMatch) description = descMatch[1].trim().replace(/^"/, "").replace(/"$/, "");

  let category = "Ecosystem Grant";
  const catMatch = cleaned.match(/category["'\s:]+([^"}\n]+)/i);
  if (catMatch) category = catMatch[1].trim().replace(/^"/, "").replace(/"$/, "");

  let goal = 10000;
  const goalMatch = cleaned.match(/goal["'\s:]+(\d+)/i);
  if (goalMatch) goal = parseInt(goalMatch[1], 10);

  let duration = 30;
  const durMatch = cleaned.match(/duration["'\s:]+(\d+)/i);
  if (durMatch) duration = parseInt(durMatch[1], 10);

  let recipient = "0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53";
  const recMatch = cleaned.match(/recipient["'\s:]+([^"}\n]+)/i);
  if (recMatch) recipient = recMatch[1].trim().replace(/^"/, "").replace(/"$/, "");

  let milestones = [
    { title: "Milestone 1 — Specification & Architecture", amount: Math.floor(goal * 0.25), description: "Establish high-fidelity designs, architectural specs, and initial system flows.", status: "pending" },
    { title: "Milestone 2 — Implementation & Devnet Testing", amount: Math.floor(goal * 0.50), description: "Integrate core logic, build test suites, and launch on internal devnet environments.", status: "pending" },
    { title: "Milestone 3 — Deployment & Verification", amount: Math.floor(goal * 0.25), description: "Deploy official testnet contract, complete external audit logs, and release documentation.", status: "pending" }
  ];

  return { title, description, category, goal, duration, recipient, milestones };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, type, context } = body;

    if (!topic || !type) {
      return NextResponse.json(
        { success: false, error: "Topic and Type parameters are required" },
        { status: 400 }
      );
    }

    if (type === "campaign") {
      if (isMockKey) {
        const goal = topic.toLowerCase().includes("large") ? 20000 : 8000;
        const generated = {
          title: `✨ AI: ${topic.substring(0, 1).toUpperCase() + topic.substring(1)}`,
          description: `This Creator DAO campaign outlines the implementation of a decentralized solution for "${topic}". Built natively on the Arc Testnet, this project optimizes coordination, security, and smart contract architecture to enable frictionless stablecoin workflows. We request funding to coordinate developers, establish testing rigs, and deploy final production frameworks.`,
          category: topic.toLowerCase().includes("infrastructure") ? "AI Infrastructure" : "Ecosystem Grant",
          goal,
          duration: 30,
          recipient: "0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53",
          milestones: [
            { title: "Milestone 1 — Alpha Specification", amount: Math.floor(goal * 0.25), description: "Establish high-fidelity designs, architectural specs, and initial system flows.", status: "pending" },
            { title: "Milestone 2 — Implementation & Devnet", amount: Math.floor(goal * 0.50), description: "Integrate core logic, build test suites, and launch on internal devnet environments.", status: "pending" },
            { title: "Milestone 3 — Verification & Mainnet Prep", amount: Math.floor(goal * 0.25), description: "Deploy official testnet contract, complete external audit logs, and release documentation.", status: "pending" }
          ]
        };
        await new Promise((resolve) => setTimeout(resolve, 1200));
        return NextResponse.json({ success: true, campaign: generated });
      }

      // Real Groq campaign generation completion
      const response = await groq.chat.completions.create({
        model: "qwen/qwen3.6-27b",
        messages: [
          {
            role: "system",
            content: "You are an expert Creator DAO builder for the SynArc platform on Arc Network. Keep your reasoning and thinking process extremely concise. Your thinking process inside <think> tags MUST be under 100 words. Always respond with a single valid JSON object containing title, description, category, goal, duration, recipient, and milestones. Respond ONLY with valid JSON. Do not include markdown formatting or extra text."
          },
          {
            role: "user",
            content: `
              Generate a Creator DAO configuration proposal based on:
              Topic/Idea: "${topic}"
              Context: ${context || "Creator DAO on Arc with USDC nanopayments"}
              
              Constraints:
              1. Title must start with "✨ AI: "
              2. Category must be exactly one of: "Ecosystem Grant", "AI Infrastructure", "Product Development", "Protocol Upgrade", "Community Initiative", "Research"
              3. Goal must be a number between 5000 and 25000 (USDC amount as number)
              4. Duration must be a number between 14 and 60 (number of days)
              5. Split it into 3 clear, logical milestones. The sum of the milestone amounts MUST equal the goal amount exactly.
              6. Recipient must be a realistic Ethereum address.
              
              Respond in JSON format:
              {
                "title": "✨ AI: Arcade Ecosystem Hub",
                "description": "Provide a detailed 2-3 paragraph explanation of the value proposition, development milestones, and ecosystem benefits.",
                "category": "Community Initiative",
                "goal": 10000,
                "duration": 30,
                "recipient": "0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53",
                "milestones": [
                  { "title": "Milestone 1: Prototype", "amount": 2500, "description": "Core interface and initial contracts.", "status": "pending" },
                  { "title": "Milestone 2: Testnet Integration", "amount": 5000, "description": "Integrate USDC nanopayments and deploy testnets.", "status": "pending" },
                  { "title": "Milestone 3: Mainnet Launch", "amount": 2500, "description": "Final audit and live public launch.", "status": "pending" }
                ]
              }
            `
          }
        ],
        max_tokens: 3000,
        temperature: 0.7
      });

      const text = response.choices[0].message.content || "{}";
      try {
        const data = tolerantParse(text);
        return NextResponse.json({ success: true, campaign: data });
      } catch (err) {
        console.error("Failed to parse campaign JSON, trying fallback:", err);
        const data = fallbackGenerateCampaign(text);
        return NextResponse.json({ success: true, campaign: data });
      }
    }

    if (type === "proposal") {
      if (isMockKey) {
        const proposal = {
          title: `✨ AI Generated: ${topic.substring(0, 1).toUpperCase() + topic.substring(1)}`,
          description: `This proposal details the design, execution parameters, and milestones to successfully implement the community initiative: "${topic}". \n\nBy leveraging Arc's high-throughput architecture, we aim to implement this within standard DAO timelines, boosting engagement metrics and establishing standard developer toolkits across all active delegates.\n\nWe request a USDC treasury allocation to fund core contributors and cover smart contract execution audits to ensure the stability of the deployment.`,
          category: topic.toLowerCase().includes("grant") ? "Ecosystem" : "Governance",
          treasuryImpact: topic.toLowerCase().includes("grant") ? "medium" : "none",
          votingDuration: 7
        };
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return NextResponse.json({ success: true, proposal });
      }

      // Real Groq proposal generation completion
      const response = await groq.chat.completions.create({
        model: "qwen/qwen3.6-27b",
        messages: [
          {
            role: "system",
            content: "You are a DAO governance expert for SynArc on Arc Network. Keep your reasoning and thinking process extremely concise. Your thinking process inside <think> tags MUST be under 100 words. Generate professional governance proposals. Always respond with a single valid JSON object containing title, description, category, treasuryImpact, and votingDuration. Respond ONLY with valid JSON. Do not include markdown formatting or extra text."
          },
          {
            role: "user",
            content: `
              Generate a complete governance proposal based on this idea:
              "${topic}"
              Context: ${context || "None"}
              
              Constraints:
              1. Category must be one of: "Treasury", "Governance", "Ecosystem", "Protocol Upgrade"
              2. TreasuryImpact must be one of: "none", "low", "medium", "high"
              3. VotingDuration must be one of: 3, 5, 7
              
              Respond in JSON format:
              {
                "title": "Upgrade Governance Smart Contracts",
                "description": "Provide a detailed 2-3 paragraph explanation of the proposal detailing value, execution path, and safety protocols.",
                "category": "Governance",
                "treasuryImpact": "none",
                "votingDuration": 7
              }
            `
          }
        ],
        max_tokens: 2048,
        temperature: 0.7
      });

      const text = response.choices[0].message.content || "{}";
      try {
        const data = tolerantParse(text);
        return NextResponse.json({ success: true, proposal: data });
      } catch (err) {
        console.error("Failed to parse proposal JSON, trying fallback:", err);
        const data = fallbackGenerate(text);
        return NextResponse.json({ success: true, proposal: data });
      }
    }

    return NextResponse.json({ success: false, error: "Invalid type parameter" }, { status: 400 });
  } catch (err: any) {
    console.error("API handler global exception:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
