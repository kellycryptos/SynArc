import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { CONTRACTS } from "@/lib/arc-config";

const DB_PATH = path.join(process.cwd(), "data/agents.json");

export interface RegisteredAgent {
  id: string;
  name: string;
  avatar: string;
  address: string;
  model: string;
  capabilities: string;
  metadataURI: string;
  status: "Active" | "Paused";
  proposalsAnalyzed: number;
  votesRecommended: number;
  accuracyRate: string;
  usdcBalance: string;
  sarcBalance: string;
  reputation: number;
  owner: string;
  history: {
    proposalId: string;
    title: string;
    recommendation: "FOR" | "AGAINST" | "ABSTAIN";
    confidence: number;
    timestamp: string;
  }[];
}

const DEFAULT_EMPTY_AGENTS: RegisteredAgent[] = [];

let inMemoryDb: RegisteredAgent[] = [...DEFAULT_EMPTY_AGENTS];

function readDb(): RegisteredAgent[] {
  try {
    if (fs.existsSync(DB_PATH)) {
      const fileContent = fs.readFileSync(DB_PATH, "utf8");
      return JSON.parse(fileContent);
    } else {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_EMPTY_AGENTS, null, 2), "utf8");
      return DEFAULT_EMPTY_AGENTS;
    }
  } catch (err) {
    console.warn("Failed to read agents DB from disk, using in-memory:", err);
    return inMemoryDb;
  }
}

function writeDb(data: RegisteredAgent[]) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
    inMemoryDb = data;
  } catch (err) {
    console.warn("Failed to write agents DB to disk, using in-memory:", err);
    inMemoryDb = data;
  }
}

export async function GET() {
  try {
    const agents = readDb();
    return NextResponse.json({ success: true, agents });
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
      name,
      address,
      model,
      capabilities,
      metadataURI,
      owner,
      reputation
    } = body;

    if (!name || !address || !capabilities || !metadataURI || !owner) {
      return NextResponse.json(
        { success: false, error: "Missing required agent parameters" },
        { status: 400 }
      );
    }

    const agents = readDb();
    
    // Check if agent is already registered in DB cache
    const existingIndex = agents.findIndex(
      (a) => a.address.toLowerCase() === address.toLowerCase()
    );

    const newAgent: RegisteredAgent = {
      id: `agent-${String(agents.length + 1).padStart(3, "0")}`,
      name,
      avatar: "",
      address,
      model: model || "Groq AI Engine",
      capabilities,
      metadataURI,
      status: "Active",
      proposalsAnalyzed: 0,
      votesRecommended: 0,
      accuracyRate: "100%",
      usdcBalance: "0.00",
      sarcBalance: "0.00",
      reputation: Number(reputation) || 100,
      owner,
      history: []
    };

    if (existingIndex >= 0) {
      // Update metadata in place
      agents[existingIndex] = {
        ...agents[existingIndex],
        name,
        capabilities,
        metadataURI,
        model: model || agents[existingIndex].model,
        owner
      };
    } else {
      agents.push(newAgent);
    }

    writeDb(agents);

    return NextResponse.json({ success: true, agent: newAgent });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
