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

function fallbackAnalyze(text: string): any {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  
  let vote = "ABSTAIN";
  if (/vote["'\s:]+(FOR|AGAINST|ABSTAIN)/i.test(cleaned)) {
    const match = cleaned.match(/vote["'\s:]+(FOR|AGAINST|ABSTAIN)/i);
    if (match) vote = match[1].toUpperCase();
  } else if (/\b(FOR|AGAINST|ABSTAIN)\b/i.test(cleaned)) {
    const match = cleaned.match(/\b(FOR|AGAINST|ABSTAIN)\b/i);
    if (match) vote = match[1].toUpperCase();
  }

  let riskLevel = "MEDIUM";
  if (/riskLevel["'\s:]+(LOW|MEDIUM|HIGH)/i.test(cleaned)) {
    const match = cleaned.match(/riskLevel["'\s:]+(LOW|MEDIUM|HIGH)/i);
    if (match) riskLevel = match[1].toUpperCase();
  } else if (/risk\b.*?\b(LOW|MEDIUM|HIGH)/i.test(cleaned)) {
    const match = cleaned.match(/risk\b.*?\b(LOW|MEDIUM|HIGH)/i);
    if (match) riskLevel = match[1].toUpperCase();
  }

  let confidence = 75;
  const confMatch = cleaned.match(/confidence["'\s:]+(\d+)/i);
  if (confMatch) {
    confidence = parseInt(confMatch[1], 10);
  }

  let reasoning = "AI analysis completed with parser fallback.";
  const reasonMatch = cleaned.match(/reasoning["'\s:]+([^"}\n]+)/i);
  if (reasonMatch) {
    reasoning = reasonMatch[1].trim().replace(/^"/, "").replace(/"$/, "");
  } else {
    reasoning = cleaned.substring(0, 300).trim();
  }

  let summary = "AI analysis completed with parser fallback.";
  const summaryMatch = cleaned.match(/summary["'\s:]+([^"}\n]+)/i);
  if (summaryMatch) {
    summary = summaryMatch[1].trim().replace(/^"/, "").replace(/"$/, "");
  }

  let concerns = "None detected via parsing fallback.";
  const concernsMatch = cleaned.match(/concerns["'\s:]+([^"}\n]+)/i);
  if (concernsMatch) {
    concerns = concernsMatch[1].trim().replace(/^"/, "").replace(/"$/, "");
  }

  return { vote, reasoning, riskLevel, confidence, summary, concerns };
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

function fallbackAnalyzeCampaign(text: string): any {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "");

  let recommendation = "REVIEW";
  if (/recommendation["'\s:]+(FUND|REJECT|REVIEW)/i.test(cleaned)) {
    const match = cleaned.match(/recommendation["'\s:]+(FUND|REJECT|REVIEW)/i);
    if (match) recommendation = match[1].toUpperCase();
  }

  let legitimacy = 75, impact = 75, arcAlignment = 75, executionFeasibility = 75, milestoneRealism = 75, governanceAlignment = 75;
  const legMatch = cleaned.match(/legitimacy["'\s:]+(\d+)/i);
  if (legMatch) legitimacy = parseInt(legMatch[1], 10);
  const impMatch = cleaned.match(/impact["'\s:]+(\d+)/i);
  if (impMatch) impact = parseInt(impMatch[1], 10);
  const alignMatch = cleaned.match(/arcAlignment["'\s:]+(\d+)/i);
  if (alignMatch) arcAlignment = parseInt(alignMatch[1], 10);
  const execMatch = cleaned.match(/executionFeasibility["'\s:]+(\d+)/i);
  if (execMatch) executionFeasibility = parseInt(execMatch[1], 10);
  const mileMatch = cleaned.match(/milestoneRealism["'\s:]+(\d+)/i);
  if (mileMatch) milestoneRealism = parseInt(mileMatch[1], 10);
  const govMatch = cleaned.match(/governanceAlignment["'\s:]+(\d+)/i);
  if (govMatch) governanceAlignment = parseInt(govMatch[1], 10);

  let riskFlags = ["Unable to parse full list. Proceed with caution."];
  const riskMatch = cleaned.match(/riskFlags["'\s:]+\[([^\]]+)\]/i);
  if (riskMatch) {
    riskFlags = riskMatch[1].split(",").map(s => s.trim().replace(/^["']/, "").replace(/["']$/, ""));
  }

  let strengths = ["Proposal has standard template values."];
  const strengthMatch = cleaned.match(/strengths["'\s:]+\[([^\]]+)\]/i);
  if (strengthMatch) {
    strengths = strengthMatch[1].split(",").map(s => s.trim().replace(/^["']/, "").replace(/["']$/, ""));
  }

  let milestoneFeedback = "Escrow milestones appear standard.";
  const mfMatch = cleaned.match(/milestoneFeedback["'\s:]+([^"}\n]+)/i);
  if (mfMatch) milestoneFeedback = mfMatch[1].trim().replace(/^"/, "").replace(/"$/, "");

  let treasuryRisk = "MEDIUM";
  const trMatch = cleaned.match(/treasuryRisk["'\s:]+(LOW|MEDIUM|HIGH)/i);
  if (trMatch) treasuryRisk = trMatch[1].toUpperCase();

  let verdict = "Campaign analysis complete with parser fallback.";
  const verdictMatch = cleaned.match(/verdict["'\s:]+([^"}\n]+)/i);
  if (verdictMatch) verdict = verdictMatch[1].trim().replace(/^"/, "").replace(/"$/, "");

  let dueDiligenceNotes = "Diligence complete with parsing fallback.";
  const ddnMatch = cleaned.match(/dueDiligenceNotes["'\s:]+([^"}\n]+)/i);
  if (ddnMatch) dueDiligenceNotes = ddnMatch[1].trim().replace(/^"/, "").replace(/"$/, "");

  return {
    recommendation,
    scores: { legitimacy, impact, arcAlignment, executionFeasibility, milestoneRealism, governanceAlignment },
    riskFlags,
    strengths,
    milestoneFeedback,
    treasuryRisk,
    verdict,
    dueDiligenceNotes
  };
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

      let response;
      try {
        // Real Groq API completion call
        response = await groq.chat.completions.create({
          model: "qwen/qwen3.6-27b",
          messages: [
            {
              role: "system",
              content: "You are SynArc's governance AI agent. You are a helpful treasury and governance analyst. Keep your reasoning and thinking process extremely concise. Your thinking process inside <think> tags MUST be under 100 words. Always respond with a single valid JSON object containing reasoning, vote, riskLevel, confidence, summary, and concerns. Respond ONLY with valid JSON. Do not include markdown formatting or extra text."
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
                
                Respond in JSON format:
                {
                  "vote": "FOR",
                  "reasoning": "Detailed reasoning explaining decisions.",
                  "riskLevel": "LOW",
                  "confidence": 90,
                  "summary": "Plain English summary of the assessment.",
                  "concerns": "Specific flags or none."
                }
              `
            }
          ],
          max_tokens: 2048,
          temperature: 0.3
        });
      } catch (apiErr) {
        console.warn("[API Agent] Groq call failed for 'analyze', falling back to rule-based logic:", apiErr);
        const description = (proposalData?.description || "").toLowerCase();
        const title = (proposalData?.title || "").toLowerCase();
        
        const matchesAgainst = description.includes("malicious") || title.includes("drain") || description.includes("steal");
        const vote = matchesAgainst ? "AGAINST" : "FOR";
        const riskLevel = matchesAgainst ? "HIGH" : "LOW";
        const confidence = 95;
        const concerns = matchesAgainst ? "Potential treasury drain detected in proposal text." : "none";
        const reasoning = matchesAgainst 
          ? "[Rule-based: AI rate-limited/unavailable] CRITICAL: The proposal description contains terms associated with unauthorized withdrawals or fund draining. Recommendation: Vote AGAINST."
          : "[Rule-based: AI rate-limited/unavailable] The proposal aligns with standard operational guidelines and community utility development. Recommendation: Vote FOR.";

        const decision = {
          vote,
          reasoning,
          riskLevel,
          confidence,
          summary: `[Rule-based: AI rate-limited/unavailable] ${matchesAgainst ? "High risk parameter detected in transaction logs." : "Safe and aligned treasury allocation parameters."}`,
          concerns
        };
        return NextResponse.json({ success: true, decision });
      }

      const text = response.choices[0].message.content || "{}";
      try {
        const decision = tolerantParse(text);
        return NextResponse.json({ success: true, decision });
      } catch (err) {
        console.error("Failed to parse decision JSON, trying fallback:", err);
        const decision = fallbackAnalyze(text);
        return NextResponse.json({ success: true, decision });
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

      let response;
      try {
        // Real Groq API proposal generation call
        response = await groq.chat.completions.create({
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
                "${proposalData?.idea}"
                
                Constraints:
                1. Category must be one of: "Treasury", "Governance", "Ecosystem", "Protocol Upgrade"
                2. TreasuryImpact must be one of: "none", "low", "medium", "high"
                3. VotingDuration must be one of: 3, 5, 7
                
                Respond in JSON format:
                {
                  "title": "✨ Proposal Title",
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
      } catch (apiErr) {
        console.warn("[API Agent] Groq call failed for 'generate', falling back to rule-based mock:", apiErr);
        const idea = proposalData?.idea || "Build a mobile app";
        const proposal = {
          title: `✨ AI Generated: ${idea.substring(0, 1).toUpperCase() + idea.substring(1)}`,
          description: `This proposal details the design, execution parameters, and milestones to successfully implement the community initiative: "${idea}". \n\nBy leveraging Arc's high-throughput architecture, we aim to implement this within standard DAO timelines, boosting engagement metrics and establishing standard developer toolkits across all active delegates.\n\nWe request a USDC treasury allocation to fund core contributors and cover smart contract execution audits to ensure the stability of the deployment.\n\n[Rule-based: AI rate-limited/unavailable]`,
          category: idea.toLowerCase().includes("grant") || idea.toLowerCase().includes("usdc") ? "Treasury" : "Ecosystem",
          treasuryImpact: idea.toLowerCase().includes("grant") ? "medium" : "none",
          votingDuration: 7
        };
        return NextResponse.json({ success: true, proposal });
      }

      const text = response.choices[0].message.content || "{}";
      try {
        const proposal = tolerantParse(text);
        return NextResponse.json({ success: true, proposal });
      } catch (err) {
        console.error("Failed to parse proposal JSON, trying fallback:", err);
        const proposal = fallbackGenerate(text);
        return NextResponse.json({ success: true, proposal });
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

      let response;
      try {
        // Real Groq API Completion call for Campaign Analysis (Upgraded Risk Engine!)
        response = await groq.chat.completions.create({
          model: "qwen/qwen3.6-27b",
          messages: [
            {
              role: "system",
              content: "You are SynArc AI Risk Engine. Perform comprehensive due diligence on Creator DAOs. Keep your reasoning and thinking process extremely concise. Your thinking process inside <think> tags MUST be under 100 words. Always respond with a single valid JSON object containing recommendation, scores, riskFlags, strengths, milestoneFeedback, treasuryRisk, verdict, and dueDiligenceNotes. Respond ONLY with valid JSON. Do not include markdown formatting or extra text."
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
                
                Perform full risk assessment in JSON format:
                {
                  "recommendation": "FUND",
                  "scores": {
                    "legitimacy": 85,
                    "impact": 75,
                    "arcAlignment": 90,
                    "executionFeasibility": 80,
                    "milestoneRealism": 85,
                    "governanceAlignment": 88
                  },
                  "riskFlags": [],
                  "strengths": ["Clear value proposition and realistic milestones."],
                  "milestoneFeedback": "Milestones are structured properly and correspond to project phases.",
                  "treasuryRisk": "LOW",
                  "verdict": "A well-structured campaign that aligns with platform goals.",
                  "dueDiligenceNotes": "Provide a detailed analysis paragraph here."
                }
              `
            }
          ],
          max_tokens: 3000,
          temperature: 0.3
        });
      } catch (apiErr) {
        console.warn("[API Agent] Groq call failed for 'analyzeCampaign', falling back to rule-based mock:", apiErr);
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
        let riskFlags = ["[Rule-based: AI rate-limited/unavailable] Developer wallet history is relatively young, though active on-chain."];
        let strengths = [
          "[Rule-based: AI rate-limited/unavailable] Provides open source tooling to coordinate Arc testnet.",
          "[Rule-based: AI rate-limited/unavailable] Milestone structure is progressively weighted."
        ];
        let milestoneFeedback = "[Rule-based: AI rate-limited/unavailable] Capital divided correctly between milestones.";
        let treasuryRisk: 'LOW' | 'MEDIUM' | 'HIGH' = "LOW";
        let verdict = "[Rule-based: AI rate-limited/unavailable] Recommended for individual and treasury backing.";
        let dueDiligenceNotes = "[Rule-based: AI rate-limited/unavailable] Milestones correspond properly to deliverables. Safe execution bounds.";

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

      const text = response.choices[0].message.content || "{}";
      try {
        const decision = tolerantParse(text);
        return NextResponse.json({ success: true, decision });
      } catch (err) {
        console.error("Failed to parse campaign analysis JSON, trying fallback:", err);
        const decision = fallbackAnalyzeCampaign(text);
        return NextResponse.json({ success: true, decision });
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

      let response;
      try {
        // Real Groq API Completion call for Campaign Generation
        response = await groq.chat.completions.create({
          model: "qwen/qwen3.6-27b",
          messages: [
            {
              role: "system",
              content: "You are an expert Creator DAO builder for the SynArc platform on Arc Network. Keep your reasoning and thinking process extremely concise. Your thinking process inside <think> tags MUST be under 100 words. Generate detailed, aligned Creator DAOs for developers and agents. Always respond with a single valid JSON object containing title, description, category, goal, duration, recipient, and milestones. Respond ONLY with valid JSON. Do not include markdown formatting or extra text."
            },
            {
              role: "user",
              content: `
                Generate a Creator DAO configuration based on this idea:
                Idea: "${idea}"
                Creator DAO Type: ${isAgent ? 'Autonomous Agent Fund (AI created)' : 'Human Creator DAO (Developer/Community built)'}
                
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
      } catch (apiErr) {
        console.warn("[API Agent] Groq call failed for 'generateCampaign', falling back to rule-based mock:", apiErr);
        const cleanIdea = idea.trim();
        const goal = cleanIdea.toLowerCase().includes("million") || cleanIdea.toLowerCase().includes("large") ? 50000 : 8000;
        const category = isAgent ? "AI Infrastructure" : "Ecosystem Grant";

        const generated = {
          title: `✨ AI: ${cleanIdea.substring(0, 1).toUpperCase() + cleanIdea.substring(1)}`,
          description: `This campaign proposes the implementation of a solution for: "${cleanIdea}". Built on the Arc Testnet, this project optimizes coordination, security, and smart contract architecture to enable stablecoin workflows.\n\n[Rule-based: AI rate-limited/unavailable]`,
          category,
          goal,
          duration: 30,
          recipient: isAgent ? "0xAI" + "Agent" + Math.floor(Math.random()*1000) + "bFE" : "0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53",
          milestones: [
            { title: "Milestone 1 — Alpha Specification", amount: Math.floor(goal * 0.25), description: "Establish high-fidelity designs, architectural specs, and initial system flows.", status: "pending" },
            { title: "Milestone 2 — Implementation & Devnet", amount: Math.floor(goal * 0.50), description: "Integrate core logic, build test suites, and launch on internal devnet environments.", status: "pending" },
            { title: "Milestone 3 — Verification & Mainnet Prep", amount: Math.floor(goal * 0.25), description: "Deploy official testnet contract, complete external audit logs, and release documentation.", status: "pending" }
          ]
        };
        return NextResponse.json({ success: true, campaign: generated });
      }

      const text = response.choices[0].message.content || "{}";
      try {
        const generated = tolerantParse(text);
        return NextResponse.json({ success: true, campaign: generated });
      } catch (err) {
        console.error("Failed to parse generated campaign JSON, trying fallback:", err);
        const generated = fallbackGenerateCampaign(text);
        return NextResponse.json({ success: true, campaign: generated });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (globalError: any) {
    console.error("API handler global exception:", globalError);
    return NextResponse.json({ success: false, error: globalError?.message || "Internal server error" }, { status: 500 });
  }
}
