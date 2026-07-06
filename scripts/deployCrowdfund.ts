import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploys a fresh SynArcCrowdfund implementation/factory to Arc Testnet.
 * This is needed whenever SynArcCrowdfund.sol changes (e.g. backer-voting update).
 *
 * NOTE: This does NOT redeploy individual campaign escrows — those are created
 * on-demand when a creator launches a DAO. Only NEW campaigns launched after
 * this script will use the updated contract bytecode.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying SynArcCrowdfund with account:", deployer.address);

  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

  // Read existing deployment data
  const deploymentsPath = path.join(__dirname, "../deployments/arcTestnet.json");
  let deploymentData: any = {};
  if (fs.existsSync(deploymentsPath)) {
    deploymentData = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  }

  const CREATOR   = deployer.address;        // placeholder for factory deploy
  const RECIPIENT = deployer.address;        // placeholder for factory deploy
  const GOAL      = ethers.parseUnits("1", 6); // 1 USDC minimum — placeholder
  const DURATION  = 1;                        // 1 day — placeholder
  const IS_AGENT  = false;

  console.log("Deploying SynArcCrowdfund (backer-voting version)...");
  const SynArcCrowdfund = await ethers.getContractFactory("SynArcCrowdfund");
  const crowdfund = await SynArcCrowdfund.deploy(
    CREATOR,
    RECIPIENT,
    USDC_ADDRESS,
    GOAL,
    DURATION,
    IS_AGENT,
    "Factory Template",
    "Implementation contract — not a live campaign",
    "Internal",
    ["Milestone 1"],
    [GOAL],
    ["Initial milestone"]
  );
  await crowdfund.waitForDeployment();
  const crowdfundAddress = await crowdfund.getAddress();
  console.log("SynArcCrowdfund deployed to:", crowdfundAddress);

  // Update deployments file
  deploymentData.crowdfund = crowdfundAddress;
  deploymentData.timestamp = new Date().toISOString();
  fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentData, null, 2));
  console.log("Updated deployments/arcTestnet.json with crowdfund address.");

  // Update lib/arc-config.ts NEXT_PUBLIC_CROWDFUND_ADDRESS fallback
  const arcConfigPath = path.join(__dirname, "../lib/arc-config.ts");
  let arcConfig = fs.readFileSync(arcConfigPath, "utf8");

  if (arcConfig.includes("get crowdfund()")) {
    // Replace existing fallback address
    arcConfig = arcConfig.replace(
      /get crowdfund\(\).*?as `0x\$\{string\}`\s*\}/,
      `get crowdfund() { return (process.env.NEXT_PUBLIC_CROWDFUND_ADDRESS || '${crowdfundAddress}') as \`0x\${string}\` }`
    );
  } else {
    // Add new getter after the eurc getter
    arcConfig = arcConfig.replace(
      `get eurc() { return (process.env.NEXT_PUBLIC_EURC_CONTRACT_ADDRESS || '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a') as \`0x\${string\`\` },`,
      `get eurc() { return (process.env.NEXT_PUBLIC_EURC_CONTRACT_ADDRESS || '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a') as \`0x\${string}\` },\n  get crowdfund() { return (process.env.NEXT_PUBLIC_CROWDFUND_ADDRESS || '${crowdfundAddress}') as \`0x\${string}\` },`
    );
  }
  fs.writeFileSync(arcConfigPath, arcConfig);
  console.log("Updated lib/arc-config.ts with new crowdfund address.");

  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("Crowdfund address:", crowdfundAddress);
  console.log("Add to .env.local: NEXT_PUBLIC_CROWDFUND_ADDRESS=" + crowdfundAddress);
  console.log("Also update synarc-agent-sdk if it references the crowdfund address.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
