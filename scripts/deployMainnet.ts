import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * deployMainnet.ts
 * Deploys the complete SynArc Tameion Mesh on Arc Mainnet (Chain ID 5042):
 * 1. SynArcTreasury (The Tameion Three-Way Match Release Valve)
 * 2. SynArcGovernor (Document-Anchored Governance Engine)
 * 3. Enforces On-Chain Agent Release Cap (50 USDC) + Human Review Gate
 * 4. Authorizes Operator Agent & Forensic Sentinel Reviewers
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log(`\n================================================================`);
  console.log(`🚀 DEPLOYING TAMEION ADVERSARIAL MESH ON ARC MAINNET (5042)`);
  console.log(`================================================================`);
  console.log("Deployer Address:", deployer.address);
  console.log("Connected Chain ID:", network.chainId.toString());

  if (network.chainId !== 5042n && network.chainId !== 5042002n) {
    console.warn(`⚠️ Warning: Expected Chain ID 5042 (Arc Mainnet). Current Chain ID: ${network.chainId}`);
  }

  // Canonical Token Addresses on Arc
  const USDC_ADDRESS = process.env.NEXT_PUBLIC_MAINNET_USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
  const EURC_ADDRESS = process.env.NEXT_PUBLIC_MAINNET_EURC_ADDRESS || "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";
  const AGENT_ADDRESS = process.env.NEXT_PUBLIC_MAINNET_AGENT_ADDRESS || process.env.NEXT_PUBLIC_AGENT_ADDRESS || "0x88BdF819466C1802ce6C780a9fbdF3A314cab07D";
  let tokenAddress = process.env.NEXT_PUBLIC_MAINNET_TOKEN_ADDRESS;
  let governorAddress = process.env.NEXT_PUBLIC_MAINNET_GOVERNOR_ADDRESS;

  // 1. Deploy SynArcTreasury (The Release Valve)
  console.log("\n1. Deploying SynArcTreasury (Tameion Three-Way Match Release Valve)...");
  const SynArcTreasury = await ethers.getContractFactory("SynArcTreasury");
  const treasury = await SynArcTreasury.deploy(USDC_ADDRESS, EURC_ADDRESS);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("✅ SynArcTreasury deployed to:", treasuryAddress);

  // 2. Deploy SynArcToken if needed
  if (!tokenAddress) {
    console.log("\n2. Deploying SynArcToken (Governance Token)...");
    const SynArcToken = await ethers.getContractFactory("SynArcToken");
    const token = await SynArcToken.deploy();
    await token.waitForDeployment();
    tokenAddress = await token.getAddress();
    console.log("✅ SynArcToken deployed to:", tokenAddress);
  } else {
    console.log("\n2. Reusing existing SynArcToken at:", tokenAddress);
  }

  // 3. Deploy or Link SynArcGovernor
  const shouldDeployGovernor = process.env.DEPLOY_GOVERNOR === "true" || !governorAddress;
  if (shouldDeployGovernor) {
    console.log("\n3. Deploying SynArcGovernor (Document-Anchored Governance Engine)...");
    const executionDelay = 172800; // 48 hours timelock delay
    const SynArcGovernor = await ethers.getContractFactory("SynArcGovernor");
    const governor = await SynArcGovernor.deploy(tokenAddress, treasuryAddress, executionDelay);
    await governor.waitForDeployment();
    governorAddress = await governor.getAddress();
    console.log("✅ SynArcGovernor deployed to:", governorAddress);
  } else {
    console.log("\n3. Linking existing SynArcGovernor at:", governorAddress);
  }

  if (!governorAddress) {
    throw new Error("Governor address could not be resolved.");
  }

  // 4. Link Governor to Treasury
  console.log("\n4. Linking Governor to SynArcTreasury...");
  const govTx = await treasury.setGovernor(governorAddress);
  await govTx.wait();
  console.log("✅ Governor linked successfully:", governorAddress);

  // 5. Authorize Autonomous AI Operator Agent
  console.log("\n5. Authorizing Autonomous AI Agent on Release Valve...");
  const agentTx = await treasury.setAgentAddress(AGENT_ADDRESS);
  await agentTx.wait();
  console.log("✅ Autonomous Agent authorized:", AGENT_ADDRESS);

  // 6. Set On-Chain Agent Release Cap (50 USDC) & Human Review Threshold
  const CAP_USDC = 50n * 10n ** 6n; // 50 USDC (6 decimals)
  console.log(`\n6. Setting On-Chain Agent Release Cap to 50 USDC (${CAP_USDC} micro-USDC)...`);
  const capTx = await treasury.setAgentReleaseCap(CAP_USDC);
  await capTx.wait();
  console.log("✅ On-chain agent release cap confirmed:", (await treasury.agentReleaseCap()).toString());

  // 7. Authorize Deployer as Human Reviewer for Emergency Overrides
  console.log("\n7. Registering Deployer as Authorized Human Reviewer...");
  const reviewerTx = await treasury.setAuthorizedHumanReviewer(deployer.address, true);
  await reviewerTx.wait();
  console.log("✅ Deployer registered as authorized reviewer:", deployer.address);

  // 8. Verify Permissions Matrix on Chain
  console.log("\n8. Verifying On-Chain Permissions Matrix:");
  const isAgentAuth = await treasury.isAuthorizedAgent(AGENT_ADDRESS);
  const isGovAuth = await treasury.isAuthorizedReviewer(governorAddress);
  const isDeployerAuth = await treasury.isAuthorizedReviewer(deployer.address);
  console.log(" - Autonomous Agent Authorized:", isAgentAuth);
  console.log(" - Governor Reviewer Authorized:", isGovAuth);
  console.log(" - Deployer Reviewer Authorized:", isDeployerAuth);

  // 9. Write Deployment Artifacts
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentData = {
    network: "arcMainnet",
    chainId: Number(network.chainId),
    token: tokenAddress,
    treasury: treasuryAddress,
    governor: governorAddress,
    crowdfund: process.env.NEXT_PUBLIC_MAINNET_CROWDFUND_ADDRESS || "0xd5374DFC4B01F60115A52Df027704062506b3030",
    treasuryAgent: AGENT_ADDRESS,
    agentReleaseCapUSDC: 50,
    humanReviewThreshold: Number(CAP_USDC),
    releaseValve: "Tameion Three-Way Match Active",
    forensicMesh: "Dual-Agent Adversarial Sentinel Ready",
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(deploymentsDir, "arcMainnet.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  console.log("\n✅ Saved deployment artifact to deployments/arcMainnet.json");
  console.log("================================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Mainnet deployment failed:", error);
    process.exit(1);
  });
