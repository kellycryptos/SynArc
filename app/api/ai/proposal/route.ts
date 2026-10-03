import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/lib/ai/ai-service";

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
      const campaign = await AIService.generateCampaign(topic, context);
      return NextResponse.json({ success: true, campaign });
    }

    if (type === "proposal") {
      const proposal = await AIService.generateProposal(topic, context);
      return NextResponse.json({ success: true, proposal });
    }

    return NextResponse.json(
      { success: false, error: "Invalid type parameter. Expected 'campaign' or 'proposal'." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[AI Proposal API Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
