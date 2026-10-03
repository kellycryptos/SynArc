import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/lib/ai/ai-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, proposalData, treasuryData, campaignData, idea } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: "Action parameter is required" }, { status: 400 });
    }

    // 1. Analyze Governance Proposal (Autonomous Agent vote analysis)
    if (action === "analyze") {
      const decision = await AIService.analyzeGovernanceProposal(proposalData, treasuryData);
      return NextResponse.json({ success: true, decision });
    }

    // 2. Generate Governance Proposal
    if (action === "generate") {
      const proposal = await AIService.generateProposal(idea || "Community Ecosystem Growth");
      return NextResponse.json({ success: true, proposal });
    }

    // 3. Analyze / Audit Creator DAO Campaign
    if (action === "analyzeCampaign") {
      const decision = await AIService.auditCampaign(campaignData || {});
      return NextResponse.json({ success: true, decision });
    }

    // 4. Generate Creator DAO Campaign
    if (action === "generateCampaign") {
      const campaign = await AIService.generateCampaign(idea || "Creative Project Workspace");
      return NextResponse.json({ success: true, campaign });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("[API Agent Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
