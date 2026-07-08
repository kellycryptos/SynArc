import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying New Agent Operating Treasury contract with the account:", deployer.address);

  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
  const EURC_ADDRESS = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";
  const GOVERNOR_ADDRESS = process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS || "0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e";
  const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS || "0x88BdF819466C1802ce6C780a9fbdF3A314cab07D";

  console.log("Deploying SynArcTreasury...");
  const SynArcTreasury = await ethers.getContractFactory("SynArcTreasury");
  const treasury = await SynArcTreasury.deploy(USDC_ADDRESS, EURC_ADDRESS);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("New SynArcTreasury deployed to:", treasuryAddress);

  console.log("Setting governor in new Treasury contract...");
  const tx = await treasury.setGovernor(GOVERNOR_ADDRESS);
  await tx.wait();
  console.log("Governor successfully set in new Treasury!");

  console.log("Setting Agent address in new Treasury contract:", AGENT_ADDRESS);
  const txAgent = await treasury.setAgentAddress(AGENT_ADDRESS);
  await txAgent.wait();
  console.log("Agent address successfully set in new Treasury!");

  // Update deployments/arcTestnet.json
  const deploymentsPath = path.join(__dirname, "../deployments/arcTestnet.json");
  let deploymentData: any = {
    network: "arcTestnet",
    chainId: 5042002,
    token: "0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e",
    treasury: "0xFE0F6bF45D363d34CD5fC1781594a7471736dC18",
    governor: GOVERNOR_ADDRESS,
    timestamp: new Date().toISOString(),
    crowdfund: "0xd5374DFC4B01F60115A52Df027704062506b3030",
    treasuryAgent: treasuryAddress
  };

  if (fs.existsSync(deploymentsPath)) {
    try {
      const raw = fs.readFileSync(deploymentsPath, "utf8");
      const current = JSON.parse(raw);
      deploymentData = { ...current, treasuryAgent: treasuryAddress };
    } catch (err) {
      console.warn("Failed to parse existing deployments file, overwriting...", err);
    }
  }

  fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentData, null, 2));
  console.log("Updated deployments saved to deployments/arcTestnet.json!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
