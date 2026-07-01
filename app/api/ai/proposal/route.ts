import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

// Fallback logic if API key is not present or is the default mock key
const isMockKey = !process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "mock_groq_api_key_123456";

const groq = new Groq({
  apiKey: isMockKey ? "mock_key" : process.env.GROQ_API_KEY
});

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
        model: "gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: "You are an expert Creator DAO builder for the SynArc platform on Arc Network. Generate detailed, aligned Creator DAOs for developers and agents. Respond ONLY in valid JSON. Do not wrap the JSON in markdown code blocks."
          },
          {
            role: "user",
            content: `
              Generate a Creator DAO configuration proposal based on:
              Topic/Idea: "${topic}"
              Context: ${context || "Creator DAO on Arc with USDC nanopayments"}
              
              Create a realistic funding goal, duration (days), and split it into 3 clear, logical milestones. The sum of the milestone amounts MUST equal the goal amount exactly.
              
              Respond in JSON format:
              {
                "title": "a clean, compelling title prefixed with '✨ AI: '",
                "description": "a beautifully structured 2-3 paragraph description explaining value and implementation plans",
                "category": "Ecosystem Grant" or "AI Infrastructure" or "Product Development" or "Protocol Upgrade" or "Community Initiative" or "Research",
                "goal": 5000 to 25000 (USDC amount as number),
                "duration": 14 to 60 (number of days),
                "recipient": "0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53" (or similar realistic address),
                "milestones": [
                  { "title": "Milestone 1 title", "amount": USDC amount as number, "description": "deliverable description", "status": "pending" },
                  { "title": "Milestone 2 title", "amount": USDC amount as number, "description": "deliverable description", "status": "pending" },
                  { "title": "Milestone 3 title", "amount": USDC amount as number, "description": "deliverable description", "status": "pending" }
                ]
              }
            `
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      try {
        let text = response.choices[0].message.content || "{}";
        // Strip markdown code block wrappers if any
        text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        const data = JSON.parse(text);
        return NextResponse.json({ success: true, campaign: data });
      } catch (err) {
        console.error("Failed to parse campaign JSON:", err);
        return NextResponse.json({ success: false, error: "Failed to parse AI generated campaign response" }, { status: 500 });
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
        model: "gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: "You are a DAO governance expert for SynArc on Arc Network. Generate professional governance proposals. Respond ONLY in valid JSON. Do not wrap the JSON in markdown code blocks."
          },
          {
            role: "user",
            content: `
              Generate a complete governance proposal based on this idea:
              "${topic}"
              Context: ${context || "None"}
              
              Respond in JSON format:
              {
                "title": "clear proposal title",
                "description": "detailed 2-3 paragraph description detailing value, execution path, and safety protocols",
                "category": "Treasury" or "Governance" or "Ecosystem" or "Protocol Upgrade",
                "treasuryImpact": "none" or "low" or "medium" or "high",
                "votingDuration": 3 or 5 or 7
              }
            `
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      });

      try {
        let text = response.choices[0].message.content || "{}";
        // Strip markdown code block wrappers if any
        text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        const data = JSON.parse(text);
        return NextResponse.json({ success: true, proposal: data });
      } catch (err) {
        console.error("Failed to parse proposal JSON:", err);
        return NextResponse.json({ success: false, error: "Failed to generate proposal" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: false, error: "Invalid type parameter" }, { status: 400 });
  } catch (err: any) {
    console.error("API handler global exception:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
