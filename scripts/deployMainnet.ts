import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * deployMainnet.ts
 * Ships the Tameion Escrow Release Valve on Arc Mainnet (Chain ID 5042).
 * Enforces the on-chain agent release cap (50 USDC) + human review gate.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log(`\n======================================================`);
  console.log(`🚀 SHIPPING TAMEION RELEASE VALVE ON ARC MAINNET (5042)`);
  console.log(`======================================================`);
  console.log("Deployer Address:", deployer.address);
  console.log("Connected Chain ID:", network.chainId.toString());

  if (network.chainId !== 5042n && network.chainId !== 5042002n) {
    console.warn(`⚠️ Warning: Expected Chain ID 5042 (Arc Mainnet). Current Chain ID: ${network.chainId}`);
  }

  // Canonical Token Addresses on Arc
  const USDC_ADDRESS = process.env.NEXT_PUBLIC_MAINNET_USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
  const EURC_ADDRESS = process.env.NEXT_PUBLIC_MAINNET_EURC_ADDRESS || "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";
  const AGENT_ADDRESS = process.env.NEXT_PUBLIC_MAINNET_AGENT_ADDRESS || process.env.NEXT_PUBLIC_AGENT_ADDRESS || "0x88BdF819466C1802ce6C780a9fbdF3A314cab07D";
  const GOVERNOR_ADDRESS = process.env.NEXT_PUBLIC_MAINNET_GOVERNOR_ADDRESS || "0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e";

  // 1. Deploy SynArcTreasury (The Release Valve)
  console.log("\n1. Deploying SynArcTreasury (Tameion Release Valve)...");
  const SynArcTreasury = await ethers.getContractFactory("SynArcTreasury");
  const treasury = await SynArcTreasury.deploy(USDC_ADDRESS, EURC_ADDRESS);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("✅ SynArcTreasury deployed to:", treasuryAddress);

  // 2. Set Governor
  console.log("\n2. Linking Governor contract...");
  const govTx = await treasury.setGovernor(GOVERNOR_ADDRESS);
  await govTx.wait();
  console.log("✅ Governor registered:", GOVERNOR_ADDRESS);

  // 3. Register Authorized Autonomous AI Agent
  console.log("\n3. Authorizing Autonomous AI Agent on Release Valve...");
  const agentTx = await treasury.setAgentAddress(AGENT_ADDRESS);
  await agentTx.wait();
  console.log("✅ Agent authorized:", AGENT_ADDRESS);

  // 4. Configure On-Chain Agent Cap & Human Review Threshold (50 USDC)
  const CAP_USDC = 50n * 10n ** 6n; // 50 USDC (6 decimals)
  console.log(`\n4. Setting On-Chain Agent Release Cap to 50 USDC (${CAP_USDC} micro-USDC)...`);
  const capTx = await treasury.setAgentReleaseCap(CAP_USDC);
  await capTx.wait();
  console.log("✅ On-chain cap confirmed:", (await treasury.agentReleaseCap()).toString());

  // 5. Verify Permissions Matrix on 5042
  console.log("\n5. Verifying Release Valve Permissions on 5042:");
  const isAgentAuth = await treasury.isAuthorizedAgent(AGENT_ADDRESS);
  const isGovAuth = await treasury.isAuthorizedReviewer(GOVERNOR_ADDRESS);
  const isDeployerAuth = await treasury.isAuthorizedReviewer(deployer.address);
  console.log(" - Autonomous Agent Authorized:", isAgentAuth);
  console.log(" - Governor Reviewer Authorized:", isGovAuth);
  console.log(" - Deployer Reviewer Authorized:", isDeployerAuth);

  // 6. Write to deployments/arcMainnet.json
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentData = {
    network: "arcMainnet",
    chainId: 5042,
    token: process.env.NEXT_PUBLIC_MAINNET_TOKEN_ADDRESS || "0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e",
    treasury: treasuryAddress,
    governor: GOVERNOR_ADDRESS,
    crowdfund: process.env.NEXT_PUBLIC_MAINNET_CROWDFUND_ADDRESS || "0xd5374DFC4B01F60115A52Df027704062506b3030",
    treasuryAgent: AGENT_ADDRESS,
    agentReleaseCapUSDC: 50,
    humanReviewThreshold: Number(CAP_USDC),
    releaseValve: "Tameion Three-Way Match Active",
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(deploymentsDir, "arcMainnet.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  console.log("\n✅ Saved deployment artifact to deployments/arcMainnet.json");
  console.log("======================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Mainnet deployment failed:", error);
    process.exit(1);
  });
