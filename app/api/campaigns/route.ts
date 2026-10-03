import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Campaign } from "@/types";

const MOCK_CAMPAIGNS: Campaign[] = [];

// In-memory fallback if file writing fails or is restricted in some environments
const inMemoryDbs: Record<string, Campaign[]> = {
  mainnet: [],
  testnet: []
};

function getDbPath(network: 'mainnet' | 'testnet'): string {
  if (network === 'testnet') {
    const testnetPath = path.join(process.cwd(), "data/campaigns_testnet.json");
    if (fs.existsSync(testnetPath)) return testnetPath;
    return path.join(process.cwd(), "data/campaigns.json");
  }
  return path.join(process.cwd(), "data/campaigns_mainnet.json");
}

function readDb(network: 'mainnet' | 'testnet'): Campaign[] {
  const dbPath = getDbPath(network);
  try {
    if (fs.existsSync(dbPath)) {
      const fileContent = fs.readFileSync(dbPath, "utf8");
      return JSON.parse(fileContent);
    } else {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const initial = network === 'testnet' ? MOCK_CAMPAIGNS : [];
      fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
  } catch (err) {
    console.warn(`Failed to read ${network} campaigns DB from disk, using in-memory:`, err);
    return inMemoryDbs[network] || [];
  }
}

function writeDb(network: 'mainnet' | 'testnet', data: Campaign[]) {
  const dbPath = getDbPath(network);
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
    inMemoryDbs[network] = data;
  } catch (err) {
    console.warn(`Failed to write ${network} campaigns DB to disk, using in-memory:`, err);
    inMemoryDbs[network] = data;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const netParam = searchParams.get("network")?.toLowerCase();
    const network: 'mainnet' | 'testnet' = netParam === 'testnet' ? 'testnet' : 'mainnet';
    const campaigns = readDb(network);
    return NextResponse.json({ success: true, campaigns, network });
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
    const network: 'mainnet' | 'testnet' = body.network === 'testnet' ? 'testnet' : 'mainnet';
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
      twitter,
      image
    } = body;

    if (!title || !description || !recipient || !goal || !escrowAddress) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const campaigns = readDb(network);
    const prefix = network === 'mainnet' ? 'camp-main' : 'camp';
    const id = `${prefix}-${String(campaigns.length + 1).padStart(3, "0")}`;

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
      image: image || undefined,
      sybilProtection: {
        aiScanned: true,
        reputationChecked: false,
        stakeRequired: false
      }
    };

    campaigns.push(newCampaign);
    writeDb(network, campaigns);

    return NextResponse.json({ success: true, campaign: newCampaign, network });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
