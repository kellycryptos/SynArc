import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Campaign, MOCK_CAMPAIGNS } from "@/data/mock/campaigns";

const DB_PATH = path.join(process.cwd(), "data/campaigns.json");

// In-memory fallback if file writing fails or is restricted in some environments
let inMemoryDb: Campaign[] = [...MOCK_CAMPAIGNS];

function readDb(): Campaign[] {
  try {
    if (fs.existsSync(DB_PATH)) {
      const fileContent = fs.readFileSync(DB_PATH, "utf8");
      return JSON.parse(fileContent);
    } else {
      // Initialize with mock campaigns
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(MOCK_CAMPAIGNS, null, 2), "utf8");
      return MOCK_CAMPAIGNS;
    }
  } catch (err) {
    console.warn("Failed to read campaigns DB from disk, using in-memory:", err);
    return inMemoryDb;
  }
}

function writeDb(data: Campaign[]) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
    inMemoryDb = data;
  } catch (err) {
    console.warn("Failed to write campaigns DB to disk, using in-memory:", err);
    inMemoryDb = data;
  }
}

export async function GET() {
  try {
    const campaigns = readDb();
    return NextResponse.json({ success: true, campaigns });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      category,
      goal,
      isAgent,
      creator,
      recipient,
      deadline,
      milestones,
      escrowAddress,
      twitter
    } = body;

    if (!title || !description || !recipient || !goal || !escrowAddress) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const campaigns = readDb();
    const id = `camp-${String(campaigns.length + 1).padStart(3, "0")}`;

    const newCampaign: Campaign = {
      id,
      title,
      description,
      category: category || "Ecosystem Grant",
      goal: Number(goal),
      raised: 0,
      contributors: 0,
      state: "Active",
      isAgent: !!isAgent,
      badge: isAgent ? "AUTONOMOUS_AGENT_FUND" : "HUMAN_CAMPAIGN",
      creator,
      recipient,
      deadline,
      milestones: milestones.map((m: any, idx: number) => ({
        title: m.title,
        amount: Number(m.amount),
        description: m.description || "",
        status: idx === 0 ? "active" : "pending"
      })),
      votes: { for: 0, against: 0, abstain: 0 },
      aiAnalysis: null,
      agentType: isAgent ? "Treasury Optimization Agent" : undefined,
      executionScope: isAgent ? "Ecosystem Grant Allocation" : undefined,
      strategy: isAgent ? "On-chain yield scans & DeFi automation" : undefined,
      fundingSources: isAgent 
        ? ["individual", "dao_treasury", "ai_agents"] 
        : ["individual", "dao_treasury"],
      proposalNumber: Math.floor(Math.random() * 50) + 16,
      escrowAddress,
      twitter: twitter || null,
      sybilProtection: {
        aiScanned: true,
        reputationChecked: false,
        stakeRequired: false
      }
    };

    campaigns.push(newCampaign);
    writeDb(campaigns);

    return NextResponse.json({ success: true, campaign: newCampaign });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
