import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Treasury contract with the account:", deployer.address);

  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
  const EURC_ADDRESS = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";
  const GOVERNOR_ADDRESS = "0x17D9d585CBB1AF6aa4a3C787116f7ba59651B702";

  console.log("Deploying SynArcTreasury...");
  const SynArcTreasury = await ethers.getContractFactory("SynArcTreasury");
  const treasury = await SynArcTreasury.deploy(USDC_ADDRESS, EURC_ADDRESS);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("SynArcTreasury deployed to:", treasuryAddress);

  console.log("Setting governor in new Treasury contract...");
  const tx = await treasury.setGovernor(GOVERNOR_ADDRESS);
  await tx.wait();
  console.log("Governor successfully set in new Treasury!");

  // Read existing deployments/arcTestnet.json if it exists and update it
  const deploymentsPath = path.join(__dirname, "../deployments/arcTestnet.json");
  let deploymentData = {
    network: "arcTestnet",
    chainId: 5042002,
    token: "0x637cA7788aBC956832F389A7BB895D5249FE757B",
    treasury: treasuryAddress,
    governor: GOVERNOR_ADDRESS,
    timestamp: new Date().toISOString(),
  };

  if (fs.existsSync(deploymentsPath)) {
    try {
      const raw = fs.readFileSync(deploymentsPath, "utf8");
      const current = JSON.parse(raw);
      deploymentData.token = current.token || deploymentData.token;
      deploymentData.governor = current.governor || deploymentData.governor;
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
