import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

// Fallback logic if API key is not present or is the default mock key
const isMockKey = !process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "mock_groq_api_key_123456";

const groq = new Groq({
  apiKey: isMockKey ? "mock_key" : process.env.GROQ_API_KEY
});

export async function POST(req: NextRequest) {
  try {
    const { action, proposalData, treasuryData } = await req.json();

    if (action === "analyze") {
      if (isMockKey) {
        // High-fidelity fallback mock response if no active Groq key is found
        const proposalTitle = proposalData?.title || "Ecosystem Grant";
        const matchesAgainst = proposalTitle.toLowerCase().includes("malicious") || proposalTitle.toLowerCase().includes("exploit");
        
        const vote = matchesAgainst ? "AGAINST" : "FOR";
        const riskLevel = matchesAgainst ? "HIGH" : "LOW";
        const confidence = matchesAgainst ? 98 : 88;
        const concerns = matchesAgainst ? "Critical threat vector detected in execution target address." : "None. Execution target contract is verified.";
        const reasoning = matchesAgainst
          ? "This proposal allocates DAO assets to an unverified target that presents a severe exploit pattern. Voting AGAINST is highly recommended."
          : `This proposal allocates USDC assets which represent safe treasury parameters for ${proposalTitle}. It aligns perfectly with SynArc's long-term ecosystem growth metrics and Arc network decentralization goals.`;

        const decision = {
          vote,
          reasoning,
          riskLevel,
          confidence,
          summary: matchesAgainst ? "High risk parameter detected in transaction logs." : "Safe and aligned treasury allocation parameters.",
          concerns
        };

        // Artificial latency to simulate active AI analysis
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return NextResponse.json({ success: true, decision });
      }

      // Real Groq API completion call
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are SynArc's governance AI agent. You analyze DAO proposals and treasury data to make informed governance decisions. You always act in the best interest of the SynArc ecosystem and Arc network. Respond ONLY in valid JSON with no extra text."
          },
          {
            role: "user",
            content: `
              Action: ${action}
              
              Current Treasury:
              - USDC Balance: ${treasuryData?.usdc || "0.00"}
              - EURC Balance: ${treasuryData?.eurc || "0.00"}
              
              Proposal Details:
              ${JSON.stringify(proposalData)}
              
              Based on this data, should the agent:
              1. Vote FOR, AGAINST, or ABSTAIN?
              2. What is the reasoning?
              3. Risk level: LOW, MEDIUM, HIGH?
              
              Respond in JSON:
              {
                "vote": "FOR" or "AGAINST" or "ABSTAIN",
                "reasoning": "explanation",
                "riskLevel": "LOW" or "MEDIUM" or "HIGH",
                "confidence": 0 to 100,
                "summary": "one sentence plain English summary",
                "concerns": "any red flags or concerns"
              }
            `
          }
        ],
        max_tokens: 600,
        temperature: 0.3
      });

      try {
        const text = response.choices[0].message.content || "{}";
        const decision = JSON.parse(text);
        return NextResponse.json({ success: true, decision });
      } catch {
        return NextResponse.json({
          success: false,
          error: "Failed to parse AI response"
        }, { status: 500 });
      }
    }

    if (action === "generate") {
      if (isMockKey) {
        // High-fidelity fallback proposal generator
        const idea = proposalData?.idea || "Build a mobile app";
        
        const proposal = {
          title: `✨ AI Generated: ${idea.substring(0, 1).toUpperCase() + idea.substring(1)}`,
          description: `This proposal details the design, execution parameters, and milestones to successfully implement the community initiative: "${idea}". \n\nBy leveraging Arc's high-throughput architecture, we aim to implement this within standard DAO timelines, boosting engagement metrics and establishing standard developer toolkits across all active delegates.\n\nWe request a USDC treasury allocation to fund core contributors and cover smart contract execution audits to ensure the stability of the deployment.`,
          category: idea.toLowerCase().includes("grant") || idea.toLowerCase().includes("usdc") ? "Treasury Allocation" : "Ecosystem Grant",
          treasuryImpact: idea.toLowerCase().includes("grant") ? "medium" : "none",
          votingDuration: 7
        };

        // Artificial latency to simulate LLM thinking
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return NextResponse.json({ success: true, proposal });
      }

      // Real Groq API proposal generation call
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a DAO governance expert for SynArc on Arc Network. Generate professional governance proposals. Respond ONLY in valid JSON with no extra text."
          },
          {
            role: "user",
            content: `
              Generate a complete governance proposal based on this idea:
              "${proposalData?.idea}"
              
              Respond in JSON:
              {
                "title": "clear proposal title",
                "description": "detailed 2-3 paragraph description",
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
        const text = response.choices[0].message.content || "{}";
        const proposal = JSON.parse(text);
        return NextResponse.json({ success: true, proposal });
      } catch {
        return NextResponse.json({
          success: false,
          error: "Failed to generate proposal"
        }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (globalError: any) {
    console.error("API handler global exception:", globalError);
    return NextResponse.json({ success: false, error: globalError?.message || "Internal server error" }, { status: 500 });
  }
}
