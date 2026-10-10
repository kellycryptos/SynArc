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

const INITIAL_AGENTS: RegisteredAgent[] = [
  {
    id: "agent_gov",
    name: "SynDAO Governance Agent",
    avatar: "",
    get address() { return (CONTRACTS.governor || "0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025") as string; },
    model: "Groq AI Engine",
    capabilities: "On-chain risk scans, automated treasury sanity audits, voting recommendations",
    metadataURI: "ipfs://QmGovernanceAgentERC8004Metadata",
    status: "Active",
    proposalsAnalyzed: 0,
    votesRecommended: 0,
    accuracyRate: "100%",
    usdcBalance: "0.00",
    sarcBalance: "0.00",
    reputation: 95,
    owner: "0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53",
    history: []
  },
  {
    id: "agent_allocation",
    name: "Ecosystem Allocation Agent",
    avatar: "",
    get address() { return (CONTRACTS.treasury || "0x8205e9782Fe54fD2aaD895b436B695db169F3d7B") as string; },
    model: "Groq AI Engine",
    capabilities: "Milestone escrow disburse auditing, gas optimization recommendations",
    metadataURI: "ipfs://QmAllocationAgentERC8004Metadata",
    status: "Paused",
    proposalsAnalyzed: 0,
    votesRecommended: 0,
    accuracyRate: "100%",
    usdcBalance: "0.00",
    sarcBalance: "0.00",
    reputation: 90,
    owner: "0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53",
    history: []
  },
  {
    id: "agent_guardian",
    name: "Emergency Guardian Agent",
    avatar: "",
    get address() { return (CONTRACTS.token || "0x8f4b429794ABa4607d177b100Cc5e481D22d0ad4") as string; },
    model: "Groq AI",
    capabilities: "Spam proposal identification, autonomous veto scoring",
    metadataURI: "ipfs://QmGuardianAgentERC8004Metadata",
    status: "Active",
    proposalsAnalyzed: 0,
    votesRecommended: 0,
    accuracyRate: "100%",
    usdcBalance: "0.00",
    sarcBalance: "0.00",
    reputation: 98,
    owner: "0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53",
    history: []
  }
];

let inMemoryDb: RegisteredAgent[] = [...INITIAL_AGENTS];

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
      fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_AGENTS, null, 2), "utf8");
      return INITIAL_AGENTS;
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
