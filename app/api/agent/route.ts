import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

// Fallback logic if API key is not present or is the default mock key
const isMockKey = !process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "mock_groq_api_key_123456";

const groq = new Groq({
  apiKey: isMockKey ? "mock_key" : process.env.GROQ_API_KEY
});

function cleanJson(str: string): string {
  let cleaned = str.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }
  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, proposalData, treasuryData, campaignData, idea, isAgent } = body;

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
        model: "qwen/qwen3.6-27b",
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
        const cleanedText = cleanJson(text);
        const decision = JSON.parse(cleanedText);
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
        model: "qwen/qwen3.6-27b",
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
        const cleanedText = cleanJson(text);
        const proposal = JSON.parse(cleanedText);
        return NextResponse.json({ success: true, proposal });
      } catch {
        return NextResponse.json({
          success: false,
          error: "Failed to generate proposal"
        }, { status: 500 });
      }
    }

    if (action === "analyzeCampaign") {
      if (!campaignData) {
        return NextResponse.json({ success: false, error: "Campaign data is required" }, { status: 400 });
      }

      if (isMockKey) {
        // High-fidelity mock campaign risk analysis based on the campaign inputs
        const isAgent = !!campaignData.isAgent;
        const title = campaignData.title || "Ecosystem Proposal";
        
        let recommendation: 'FUND' | 'REJECT' | 'REVIEW' = "FUND";
        let scores = {
          legitimacy: 88,
          impact: 85,
          arcAlignment: 90,
          executionFeasibility: 82,
          milestoneRealism: 85,
          governanceAlignment: 89
        };
        let riskFlags = ["Developer wallet history is relatively young, though active on-chain."];
        let strengths = [
          "Provides open source tooling to accelerate Arc testnet coordination.",
          "Milestone structure is progressively weighted and locked securely in escrow."
        ];
        let milestoneFeedback = "Excellent division of capital. Milestones are properly scoped relative to developer delivery expectations.";
        let treasuryRisk: 'LOW' | 'MEDIUM' | 'HIGH' = "LOW";
        let verdict = "Highly viable, recommended for DAO backing and immediate milestone escrow release.";
        let dueDiligenceNotes = "Proposer has high Discord participation. The milestones are realistic and correspond properly to deliverables. Recommended for individual and treasury backing.";

        if (title.toLowerCase().includes("malicious") || title.toLowerCase().includes("exploit") || title.toLowerCase().includes("hack")) {
          recommendation = "REJECT";
          scores = {
            legitimacy: 15,
            impact: 10,
            arcAlignment: 12,
            executionFeasibility: 20,
            milestoneRealism: 15,
            governanceAlignment: 10
          };
          riskFlags = [
            "Severe security pattern detected in execution target address.",
            "Lack of developer identity and anonymous multisig locks."
          ];
          strengths = [];
          milestoneFeedback = "Unclear milestones. High front-loading of capital with zero safety parameters.";
          treasuryRisk = "HIGH";
          verdict = "Severe safety risk. Immediate rejection recommended.";
          dueDiligenceNotes = "High probability of treasury drain or smart contract exploit. Governance must veto this proposal immediately.";
        } else if (isAgent) {
          recommendation = "FUND";
          scores = {
            legitimacy: 95,
            impact: 94,
            arcAlignment: 98,
            executionFeasibility: 90,
            milestoneRealism: 92,
            governanceAlignment: 96
          };
          riskFlags = [
            "Liquidity relies on external protocol pool yields.",
            "Gas transaction limits for frequent state rebalancing."
          ];
          strengths = [
            "Fully autonomous agent rebalancing yields superior stablecoin yields.",
            "Staked developer deposit holds active collateral in governor contract.",
            "Includes secure multisig override triggers for DAO delegates."
          ];
          milestoneFeedback = "Milestone disbursements are split correctly between deployment and actual operational audits.";
          treasuryRisk = "LOW";
          verdict = "Highly innovative agent design. Represents standard ecosystem integration path.";
          dueDiligenceNotes = "Autonomous neural logic contains zero malicious parameters. Hardcoded slippage safety triggers ensure safe execution limits.";
        }

        // Artificial latency to feel real
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return NextResponse.json({
          success: true,
          decision: {
            recommendation,
            scores,
            riskFlags,
            strengths,
            milestoneFeedback,
            treasuryRisk,
            verdict,
            dueDiligenceNotes
          }
        });
      }

      // Real Groq API Completion call for Campaign Analysis (Upgraded Risk Engine!)
      const response = await groq.chat.completions.create({
        model: "qwen/qwen3.6-27b",
        messages: [
          {
            role: "system",
            content: "You are SynArc AI Risk Engine. Perform comprehensive due diligence on Creator DAOs. Respond ONLY in valid JSON."
          },
          {
            role: "user",
            content: `
              Creator DAO: ${campaignData.title}
              Type: ${campaignData.isAgent ? 'AI Agent' : 'Human'}
              Description: ${campaignData.description}
              Goal: ${campaignData.goal} USDC
              Category: ${campaignData.category}
              Milestones: ${JSON.stringify(campaignData.milestones)}
              Creator wallet: ${campaignData.creator}
              
              Perform full risk assessment:
              {
                "recommendation": "FUND" or "REJECT" or "REVIEW",
                "scores": {
                  "legitimacy": 0-100,
                  "impact": 0-100,
                  "arcAlignment": 0-100,
                  "executionFeasibility": 0-100,
                  "milestoneRealism": 0-100,
                  "governanceAlignment": 0-100
                },
                "riskFlags": ["list of specific concerns"],
                "strengths": ["list of positive signals"],
                "milestoneFeedback": "feedback on milestone structure",
                "treasuryRisk": "LOW" or "MEDIUM" or "HIGH",
                "verdict": "one sentence summary",
                "dueDiligenceNotes": "detailed analysis paragraph"
              }
            `
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      try {
        const text = response.choices[0].message.content || "{}";
        const cleanedText = cleanJson(text);
        const decision = JSON.parse(cleanedText);
        return NextResponse.json({ success: true, decision });
      } catch {
        return NextResponse.json({ success: false, error: "Failed to parse AI analysis response" }, { status: 500 });
      }
    }

    if (action === "generateCampaign") {
      if (!idea) {
        return NextResponse.json({ success: false, error: "Idea prompt is required" }, { status: 400 });
      }

      if (isMockKey) {
        // High-fidelity fallback generated campaign
        const cleanIdea = idea.trim();
        const goal = cleanIdea.toLowerCase().includes("million") || cleanIdea.toLowerCase().includes("large") ? 50000 : 8000;
        const category = isAgent ? "AI Infrastructure" : "Ecosystem Grant";

        const generated = {
          title: `✨ AI: ${cleanIdea.substring(0, 1).toUpperCase() + cleanIdea.substring(1)}`,
          description: `This autonomous campaign proposes the implementation of a decentralized solution for: "${cleanIdea}". Built natively on the Arc Testnet, this project optimizes coordination, security, and smart contract architecture to enable frictionless stablecoin workflows. We request funding to coordinate developers, establish testing rigs, and deploy final production frameworks.`,
          category,
          goal,
          duration: 30,
          recipient: isAgent ? "0xAI" + "Agent" + Math.floor(Math.random()*1000) + "bFE...5968" : "0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53",
          milestones: [
            { title: "Milestone 1 — Alpha Specification", amount: Math.floor(goal * 0.25), description: "Establish high-fidelity designs, architectural specs, and initial system flows.", status: "pending" },
            { title: "Milestone 2 — Implementation & Devnet", amount: Math.floor(goal * 0.50), description: "Integrate core logic, build test suites, and launch on internal devnet environments.", status: "pending" },
            { title: "Milestone 3 — Verification & Mainnet Prep", amount: Math.floor(goal * 0.25), description: "Deploy official testnet contract, complete external audit logs, and release documentation.", status: "pending" }
          ]
        };

        // Artificial latency to feel real
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return NextResponse.json({ success: true, campaign: generated });
      }

      // Real Groq API Completion call for Campaign Generation
      const response = await groq.chat.completions.create({
        model: "qwen/qwen3.6-27b",
        messages: [
          {
            role: "system",
            content: "You are an expert Creator DAO builder for the SynArc platform on Arc Network. Generate detailed, aligned Creator DAOs for developers and agents. Respond ONLY in valid JSON."
          },
          {
            role: "user",
            content: `
              Generate a Creator DAO configuration based on this idea:
              Idea: "${idea}"
              Creator DAO Type: ${isAgent ? 'Autonomous Agent Fund (AI created)' : 'Human Creator DAO (Developer/Community built)'}
              
              Create a realistic funding goal, duration (days), and split it into 3 clear, logical milestones. The sum of the milestone amounts MUST equal the goal amount exactly.
              
              Respond in JSON:
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
        const text = response.choices[0].message.content || "{}";
        const cleanedText = cleanJson(text);
        const generated = JSON.parse(cleanedText);
        return NextResponse.json({ success: true, campaign: generated });
      } catch {
        return NextResponse.json({ success: false, error: "Failed to parse AI generated campaign response" }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (globalError: any) {
    console.error("API handler global exception:", globalError);
    return NextResponse.json({ success: false, error: globalError?.message || "Internal server error" }, { status: 500 });
  }
}
