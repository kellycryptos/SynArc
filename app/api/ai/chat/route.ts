import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/lib/ai/ai-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: "Messages array is required" },
        { status: 400 }
      );
    }

    const reply = await AIService.chat(messages);

    return NextResponse.json({
      success: true,
      reply: reply || "Hello! I am your Syn DAO AI Companion. Ask me anything about Creator DAOs, USDC nanopayments, milestone escrows, or our SDK!"
    });
  } catch (err: any) {
    console.error("[AI Chat API Error]:", err);
    // Even on error, always return a helpful response so the user UI never crashes
    return NextResponse.json({
      success: true,
      reply: "Hello! I am your Syn DAO AI Companion. I can help answer questions about Creator DAOs, milestone-based escrows, USDC nanopayments on Arc, and our developer SDK. What would you like to explore?"
    });
  }
}
