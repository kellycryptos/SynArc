import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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
    name: "SynArc Governance Agent",
    avatar: "🤖",
    address: "0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e",
    model: "Llama 3.3 70B via Groq",
    capabilities: "On-chain risk scans, automated treasury sanity audits, voting recommendations",
    metadataURI: "ipfs://QmGovernanceAgentERC8004Metadata",
    status: "Active",
    proposalsAnalyzed: 142,
    votesRecommended: 89,
    accuracyRate: "94%",
    usdcBalance: "50.00",
    sarcBalance: "500.00",
    reputation: 94,
    owner: "0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53",
    history: [
      {
        proposalId: "prop_1",
        title: "Allocate 20k USDC for Canteen Mobile Integration",
        recommendation: "FOR",
        confidence: 87,
        timestamp: "2026-05-28T04:12:00Z"
      },
      {
        proposalId: "prop_2",
        title: "Alter Quorum Parameter from 4% to 8%",
        recommendation: "AGAINST",
        confidence: 94,
        timestamp: "2026-05-27T18:30:00Z"
      },
      {
        proposalId: "prop_3",
        title: "Timelock Delay Extension to 14 Days",
        recommendation: "ABSTAIN",
        confidence: 65,
        timestamp: "2026-05-25T09:15:00Z"
      }
    ]
  },
  {
    id: "agent_allocation",
    name: "Ecosystem Allocation Agent",
    avatar: "📈",
    address: "0xFE0F6bF45D363d34CD5fC1781594a7471736dC18",
    model: "Llama 3.3 70B via Groq",
    capabilities: "Milestone escrow disburse auditing, gas optimization recommendations",
    metadataURI: "ipfs://QmAllocationAgentERC8004Metadata",
    status: "Paused",
    proposalsAnalyzed: 56,
    votesRecommended: 32,
    accuracyRate: "91%",
    usdcBalance: "1,250.00",
    sarcBalance: "0.00",
    reputation: 85,
    owner: "0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53",
    history: [
      {
        proposalId: "prop_1",
        title: "Allocate 20k USDC for Canteen Mobile Integration",
        recommendation: "FOR",
        confidence: 90,
        timestamp: "2026-05-28T04:15:00Z"
      },
      {
        proposalId: "prop_3",
        title: "Timelock Delay Extension to 14 Days",
        recommendation: "FOR",
        confidence: 72,
        timestamp: "2026-05-25T09:20:00Z"
      }
    ]
  },
  {
    id: "agent_guardian",
    name: "Emergency Guardian Agent",
    avatar: "🛡️",
    address: "0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e",
    model: "Llama 3 8B via Groq",
    capabilities: "Spam proposal identification, autonomous veto scoring",
    metadataURI: "ipfs://QmGuardianAgentERC8004Metadata",
    status: "Active",
    proposalsAnalyzed: 18,
    votesRecommended: 4,
    accuracyRate: "98%",
    usdcBalance: "0.00",
    sarcBalance: "12,500.00",
    reputation: 98,
    owner: "0x1BDA3b78D0B3D55A1A86d4eC36d93339185c8E53",
    history: [
      {
        proposalId: "prop_2",
        title: "Alter Quorum Parameter from 4% to 8%",
        recommendation: "AGAINST",
        confidence: 98,
        timestamp: "2026-05-27T18:32:00Z"
      }
    ]
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
      avatar: "🤖",
      address,
      model: model || "Llama 3.3 70B via Groq",
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
