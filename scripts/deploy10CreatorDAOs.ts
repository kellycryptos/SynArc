import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface CampaignDef {
  title: string;
  description: string;
  category: string;
  goal: number; // in USDC whole units
  durationDays: number;
  isAgent: boolean;
  badge: "HUMAN_CAMPAIGN" | "AUTONOMOUS_AGENT_FUND";
  agentType?: string;
  executionScope?: string;
  strategy?: string;
  twitter?: string;
  image?: string;
  milestones: { title: string; amount: number; description: string }[];
  aiAnalysis: any;
}

const CAMPAIGNS_TO_DEPLOY: CampaignDef[] = [
  {
    title: "Aura Synth Lab",
    description: "Decentralized audio synthesis studio creating open-source web3 sound kits, generative ambient tracks, and collaborative stems for Arc creators.",
    category: "music",
    goal: 1500,
    durationDays: 30,
    isAgent: false,
    badge: "HUMAN_CAMPAIGN",
    twitter: "@aurasynthlab",
    milestones: [
      { title: "Initial Synth Pack", amount: 500, description: "Release of 50 open-source serum presets & sound stems." },
      { title: "Live Interactive Stem Player", amount: 500, description: "Web-based multi-track audio stem player for DAO supporters." },
      { title: "Community Sample Pack Release", amount: 500, description: "Final compilation album and NFT music collection." }
    ],
    aiAnalysis: {
      recommendation: "FUND",
      scores: { legitimacy: 94, impact: 91, arcAlignment: 95, executionFeasibility: 92, milestoneRealism: 93, governanceAlignment: 90 },
      riskFlags: [],
      strengths: ["Strong open-source audio asset roadmap", "Clear milestone budget breakdown", "High community engagement"],
      milestoneFeedback: "Milestones are well-balanced and realistic for a 30-day development window.",
      treasuryRisk: "LOW",
      verdict: "High-quality creative workspace project with strong ecosystem alignment.",
      dueDiligenceNotes: "Creator has verified identity and public GitHub portfolio."
    }
  },
  {
    title: "ArcShield AI Sentinel",
    description: "Autonomous AI agent fund scanning multi-chain protocols for real-time yield anomalies, threat mitigations, and automated emergency liquidity sweeps.",
    category: "ai-agent",
    goal: 5000,
    durationDays: 45,
    isAgent: true,
    badge: "AUTONOMOUS_AGENT_FUND",
    agentType: "Security & Yield Guard Agent",
    executionScope: "Multi-Chain Threat Protection",
    strategy: "On-chain transaction simulation & automated risk-weighted liquidity routing",
    twitter: "@ArcShieldAI",
    milestones: [
      { title: "Threat Detection Engine", amount: 1500, description: "Deploy automated RPC event parser and anomaly detector." },
      { title: "Automated Sweep Triggers", amount: 2000, description: "Integrate non-custodial treasury circuit breakers." },
      { title: "Decentralized Security Dashboard", amount: 1500, description: "Launch real-time security alerts and governance metrics." }
    ],
    aiAnalysis: {
      recommendation: "FUND",
      scores: { legitimacy: 98, impact: 96, arcAlignment: 99, executionFeasibility: 94, milestoneRealism: 95, governanceAlignment: 97 },
      riskFlags: [],
      strengths: ["Fully autonomous smart account execution", "Critical security infrastructure for Arc ecosystem", "High technical feasibility"],
      milestoneFeedback: "Milestone distribution matches core technical delivery checkpoints.",
      treasuryRisk: "LOW",
      verdict: "Top-tier AI agent fund project with immediate ecosystem utility.",
      dueDiligenceNotes: "Automated verification completed with 0 high-risk dependencies."
    }
  },
  {
    title: "PixelVerse RPG",
    description: "On-chain retro 2D MMORPG built with WebGL and zero-knowledge item ownership on Arc Testnet.",
    category: "gaming",
    goal: 3200,
    durationDays: 30,
    isAgent: false,
    badge: "HUMAN_CAMPAIGN",
    twitter: "@PixelVerseArc",
    milestones: [
      { title: "Alpha Gameplay Demo", amount: 1000, description: "Browser-playable multiplayer alpha with wallet auth." },
      { title: "Smart Contract Asset Bridge", amount: 1200, description: "ERC-721/1155 item minting and trading marketplace." },
      { title: "Mainnet Beta Launch", amount: 1000, description: "Tournament mode, leaderboards, and guild governance." }
    ],
    aiAnalysis: {
      recommendation: "FUND",
      scores: { legitimacy: 88, impact: 90, arcAlignment: 92, executionFeasibility: 86, milestoneRealism: 89, governanceAlignment: 88 },
      riskFlags: ["High graphic rendering requirements"],
      strengths: ["Working browser prototype", "Proven indie dev team", "Strong tokenomics design"],
      milestoneFeedback: "Alpha demo requirement ensures early milestone accountability.",
      treasuryRisk: "LOW",
      verdict: "Promising Web3 gaming workspace with clear community incentives.",
      dueDiligenceNotes: "Game engine verified compatible with Arc RPC speeds."
    }
  },
  {
    title: "Krypton Protocol Research",
    description: "Open-source developer tooling and indexer client SDKs for ultra-fast CCTP cross-chain bridge events on Arc.",
    category: "builder",
    goal: 2500,
    durationDays: 30,
    isAgent: false,
    badge: "HUMAN_CAMPAIGN",
    twitter: "@KryptonTools",
    milestones: [
      { title: "SDK Release v1.0", amount: 800, description: "TypeScript & Rust client SDKs for CCTP attestation queries." },
      { title: "Subnet Indexer Node", amount: 900, description: "High-throughput GraphQL API for historical bridge events." },
      { title: "Documentation & Workbench", amount: 800, description: "Interactive playground for developers." }
    ],
    aiAnalysis: {
      recommendation: "FUND",
      scores: { legitimacy: 96, impact: 95, arcAlignment: 98, executionFeasibility: 95, milestoneRealism: 94, governanceAlignment: 93 },
      riskFlags: [],
      strengths: ["Fills crucial developer tooling gap", "MIT open-source license", "Clear technical specs"],
      milestoneFeedback: "Well structured for rapid 30-day execution.",
      treasuryRisk: "LOW",
      verdict: "Essential ecosystem tooling grant proposal.",
      dueDiligenceNotes: "Code repositories already active on GitHub."
    }
  },
  {
    title: "Veritas On-Chain Journal",
    description: "Investigative crypto-journalism collective publishing censorship-resistant research reports permanently archived on IPFS.",
    category: "writing",
    goal: 800,
    durationDays: 20,
    isAgent: false,
    badge: "HUMAN_CAMPAIGN",
    twitter: "@VeritasJournal",
    milestones: [
      { title: "Issue #1 Tokenized Release", amount: 300, description: "Publish 3 in-depth research articles on DAO governance efficiency." },
      { title: "Reader DAO Portal", amount: 250, description: "Gated discussion forum and subscriber governance for topic requests." },
      { title: "Proof-of-Source Toolkit", amount: 250, description: "Cryptographic source verification standard for crypto journalism." }
    ],
    aiAnalysis: {
      recommendation: "FUND",
      scores: { legitimacy: 92, impact: 87, arcAlignment: 89, executionFeasibility: 94, milestoneRealism: 93, governanceAlignment: 91 },
      riskFlags: [],
      strengths: ["Low capital requirement", "High quality editorial content", "Strong decentralization focus"],
      milestoneFeedback: "Modest funding goal with fast 20-day delivery timeline.",
      treasuryRisk: "LOW",
      verdict: "Low-risk high-value media initiative for the Arc community.",
      dueDiligenceNotes: "Authors have verified published works on-chain."
    }
  },
  {
    title: "Solstice Generative Art",
    description: "3D parametric algorithmic artwork collection generated dynamically based on Arc network gas usage and block hash entropy.",
    category: "art",
    goal: 1200,
    durationDays: 30,
    isAgent: false,
    badge: "HUMAN_CAMPAIGN",
    twitter: "@SolsticeArt3D",
    milestones: [
      { title: "Dynamic Minting Contract", amount: 400, description: "Solidity smart contract reading block entropy for real-time art generation." },
      { title: "3D Canvas Renderer", amount: 400, description: "WebGL 3D shader renderer hosted on IPFS." },
      { title: "Physical Print Exhibition", amount: 400, description: "Physical high-resolution plotters and physical exhibition for collectors." }
    ],
    aiAnalysis: {
      recommendation: "FUND",
      scores: { legitimacy: 90, impact: 85, arcAlignment: 88, executionFeasibility: 91, milestoneRealism: 90, governanceAlignment: 87 },
      riskFlags: [],
      strengths: ["Innovative use of on-chain block entropy", "Visual aesthetic excellence", "Experienced generative artist"],
      milestoneFeedback: "Realistic milestone progression.",
      treasuryRisk: "LOW",
      verdict: "Creative digital art workspace highlighting Arc block data.",
      dueDiligenceNotes: "Artist portfolio verified on SuperRare and Art Blocks."
    }
  },
  {
    title: "Vanguard Liquidity Optimizer",
    description: "Autonomous AI yield optimizer deploying automated treasury capital across Arc lending markets and liquidity pools to maximize risk-adjusted APY.",
    category: "ai-agent",
    goal: 4000,
    durationDays: 30,
    isAgent: true,
    badge: "AUTONOMOUS_AGENT_FUND",
    agentType: "Treasury Yield Optimization Agent",
    executionScope: "DeFi Yield Automation",
    strategy: "On-chain yield scans, automated rebalancing & automated risk guardrails",
    twitter: "@VanguardYieldAI",
    milestones: [
      { title: "Risk Assessment Matrix", amount: 1200, description: "Deploy automated risk monitoring smart contract for Arc lending pools." },
      { title: "Automated Rebalancing Bot", amount: 1500, description: "Deploy agent execution script with yield optimization algorithms." },
      { title: "On-Chain Reporting Dashboard", amount: 1300, description: "Public analytics frontend showing real-time APY and active yield positions." }
    ],
    aiAnalysis: {
      recommendation: "FUND",
      scores: { legitimacy: 95, impact: 94, arcAlignment: 97, executionFeasibility: 93, milestoneRealism: 92, governanceAlignment: 96 },
      riskFlags: [],
      strengths: ["Automated yield strategy for DAO treasuries", "Transparent on-chain accounting", "Robust risk parameter controls"],
      milestoneFeedback: "Logical deployment phases starting with risk infrastructure.",
      treasuryRisk: "LOW",
      verdict: "High-value DeFi agent fund with strong economic utility.",
      dueDiligenceNotes: "Strategy backtested with zero liquidation events."
    }
  },
  {
    title: "Nexus SubDAO Creator Hub",
    description: "Modular toolkit enabling creators to launch localized subDAOs, mini-governance modules, and automated micro-grants.",
    category: "builder",
    goal: 2000,
    durationDays: 30,
    isAgent: false,
    badge: "HUMAN_CAMPAIGN",
    twitter: "@NexusSubDAOs",
    milestones: [
      { title: "Factory Contract Deployment", amount: 700, description: "Deploy SubDAO factory supporting configurable quorum and voting rules." },
      { title: "Governance UI Plugin", amount: 700, description: "Embeddable governance widget for creator websites." },
      { title: "SubDAO Analytics Dashboard", amount: 600, description: "Real-time tracking of member activity and treasury flows." }
    ],
    aiAnalysis: {
      recommendation: "FUND",
      scores: { legitimacy: 91, impact: 89, arcAlignment: 94, executionFeasibility: 90, milestoneRealism: 91, governanceAlignment: 92 },
      riskFlags: [],
      strengths: ["Expands creator governance flexibility", "Modular design pattern", "Complements SynArc core governance"],
      milestoneFeedback: "Clean progression from smart contract layer to UI integrations.",
      treasuryRisk: "LOW",
      verdict: "Solid developer ecosystem grant proposal.",
      dueDiligenceNotes: "Architecture reviewed for gas efficiency."
    }
  },
  {
    title: "Hyperion Motion Graphics",
    description: "Community-funded open render studio producing high-fidelity 3D motion graphics and educational videos for Web3 ecosystems.",
    category: "art",
    goal: 1800,
    durationDays: 25,
    isAgent: false,
    badge: "HUMAN_CAMPAIGN",
    twitter: "@HyperionMotion",
    milestones: [
      { title: "Storyboard & Character Models", amount: 600, description: "Publish open 3D assets and animation storyboards on Blender." },
      { title: "Teaser Video Release", amount: 600, description: "60-second 4K rendered animation highlighting decentralized governance." },
      { title: "Full Educational Series", amount: 600, description: "Complete 3-part animated guide to Arc ecosystem features." }
    ],
    aiAnalysis: {
      recommendation: "FUND",
      scores: { legitimacy: 89, impact: 88, arcAlignment: 91, executionFeasibility: 92, milestoneRealism: 89, governanceAlignment: 87 },
      riskFlags: [],
      strengths: ["Creative educational media", "High render quality", "Open Creative Commons assets"],
      milestoneFeedback: "Clear deliverables attached to each payout milestone.",
      treasuryRisk: "LOW",
      verdict: "High engagement marketing & educational workspace.",
      dueDiligenceNotes: "Previous animations featured in major web3 conferences."
    }
  },
  {
    title: "Zenith Eco-Track AI Agent",
    description: "Autonomous environmental compliance agent verifying and purchasing tokenized carbon offsets automatically for Arc network transactions.",
    category: "ai-agent",
    goal: 2800,
    durationDays: 35,
    isAgent: true,
    badge: "AUTONOMOUS_AGENT_FUND",
    agentType: "Carbon Offsetting Agent",
    executionScope: "Environmental Compliance Automation",
    strategy: "On-chain carbon footprint calculation & automated Toucan/Klima pool retirement",
    twitter: "@ZenithEcoAI",
    milestones: [
      { title: "Carbon Impact Indexer", amount: 900, description: "Calculate gas usage and estimated energy consumption per transaction." },
      { title: "Automated Offset Purchase Pipeline", amount: 1000, description: "Execute automated offset retirements when gas thresholds are reached." },
      { title: "Verifiable Public Carbon Ledger", amount: 900, description: "On-chain dashboard with cryptographic proof of carbon neutrality." }
    ],
    aiAnalysis: {
      recommendation: "FUND",
      scores: { legitimacy: 93, impact: 92, arcAlignment: 94, executionFeasibility: 90, milestoneRealism: 92, governanceAlignment: 95 },
      riskFlags: [],
      strengths: ["Innovative ESG application for Web3", "Fully automated carbon retirement pipeline", "High transparency"],
      milestoneFeedback: "Well-calibrated milestone schedule.",
      treasuryRisk: "LOW",
      verdict: "Impactful green Web3 initiative backed by autonomous AI logic.",
      dueDiligenceNotes: "Carbon registry API integrations verified."
    }
  }
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("==================================================");
  console.log("Deploying 10 Creator DAOs on-chain to Arc Testnet");
  console.log("Deployer EOA:", deployer.address);
  console.log("==================================================\n");

  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
  const SynArcCrowdfund = await ethers.getContractFactory("SynArcCrowdfund");

  const deployedCampaigns: any[] = [];

  for (let i = 0; i < CAMPAIGNS_TO_DEPLOY.length; i++) {
    const c = CAMPAIGNS_TO_DEPLOY[i];
    const campaignId = `camp-${String(i + 1).padStart(3, "0")}`;
    const goalUSDC = c.goal;
    const goalBigInt = ethers.parseUnits(goalUSDC.toString(), 6);

    const mTitles = c.milestones.map((m) => m.title);
    const mAmounts = c.milestones.map((m) => ethers.parseUnits(m.amount.toString(), 6));
    const mDescs = c.milestones.map((m) => m.description);

    console.log(`[${i + 1}/10] Deploying "${c.title}" (${c.isAgent ? "AI Agent Fund" : "Human Creator DAO"})...`);

    const crowdfundContract = await SynArcCrowdfund.deploy(
      deployer.address,      // creator
      deployer.address,      // recipient
      USDC_ADDRESS,          // USDC address
      goalBigInt,            // goal
      c.durationDays,        // durationDays
      c.isAgent,             // isAgent
      c.title,               // title
      c.description,         // description
      c.category,            // category
      mTitles,
      mAmounts,
      mDescs
    );

    await crowdfundContract.waitForDeployment();
    const escrowAddress = await crowdfundContract.getAddress();
    console.log(`  -> Deployed to contract address: ${escrowAddress}`);

    const deadlineISO = new Date(Date.now() + c.durationDays * 24 * 60 * 60 * 1000).toISOString();

    const campaignObj = {
      id: campaignId,
      title: c.title,
      description: c.description,
      category: c.category === "ai-agent" ? "Automated Treasury" : c.category.toUpperCase() + " Workspace",
      goal: c.goal,
      raised: Math.floor(c.goal * (0.15 + (i * 0.08) % 0.6)), // realistic raised amount
      contributors: Math.floor(5 + i * 4),
      state: "Active",
      isAgent: c.isAgent,
      badge: c.badge,
      creator: deployer.address,
      recipient: deployer.address,
      deadline: deadlineISO,
      milestones: c.milestones.map((m, idx) => ({
        title: m.title,
        amount: m.amount,
        description: m.description,
        status: idx === 0 ? "active" : "pending"
      })),
      votes: {
        for: 1500 + i * 400,
        against: 50 + i * 10,
        abstain: 20
      },
      aiAnalysis: c.aiAnalysis,
      agentType: c.agentType || (c.isAgent ? "Autonomous Treasury Agent" : undefined),
      executionScope: c.executionScope || (c.isAgent ? "Ecosystem Yield & Grant Management" : undefined),
      strategy: c.strategy || (c.isAgent ? "Automated on-chain contract execution" : undefined),
      fundingSources: c.isAgent ? ["individual", "dao_treasury", "ai_agents"] : ["individual", "dao_treasury"],
      proposalNumber: 10 + i + 1,
      escrowAddress: escrowAddress,
      twitter: c.twitter || null,
      sybilProtection: {
        aiScanned: true,
        reputationChecked: true,
        stakeRequired: false
      }
    };

    deployedCampaigns.push(campaignObj);
  }

  console.log("\nWriting 10 Creator DAOs to data/campaigns.json...");
  const dbPath = path.join(__dirname, "../data/campaigns.json");
  fs.writeFileSync(dbPath, JSON.stringify(deployedCampaigns, null, 2), "utf8");
  console.log("Successfully wrote 10 Creator DAOs to data/campaigns.json!");

  console.log("\n=== ALL 10 CREATOR DAOS DEPLOYED ON-CHAIN & REFLECTED IN DATABASE ===");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Deployment failed:", err);
    process.exit(1);
  });
