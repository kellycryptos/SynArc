import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy SynArcToken
  console.log("Deploying SynArcToken...");
  const SynArcToken = await ethers.getContractFactory("SynArcToken");
  const token = await SynArcToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("SynArcToken deployed to:", tokenAddress);

  // 2. Deploy SynArcTreasury (USDC and EURC addresses on Arc Testnet)
  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
  const EURC_ADDRESS = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";
  console.log("Deploying SynArcTreasury...");
  const SynArcTreasury = await ethers.getContractFactory("SynArcTreasury");
  const treasury = await SynArcTreasury.deploy(USDC_ADDRESS, EURC_ADDRESS);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("SynArcTreasury deployed to:", treasuryAddress);

  // 3. Deploy SynArcGovernor
  console.log("Deploying SynArcGovernor...");
  const SynArcGovernor = await ethers.getContractFactory("SynArcGovernor");
  const EXECUTION_DELAY_SECONDS = 60; // 1 minute execution delay for testnet
  const governor = await SynArcGovernor.deploy(tokenAddress, treasuryAddress, EXECUTION_DELAY_SECONDS);
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  console.log("SynArcGovernor deployed to:", governorAddress);

  // 4. Set Governor address in Treasury
  console.log("Setting governor in Treasury contract...");
  const tx = await treasury.setGovernor(governorAddress);
  await tx.wait();
  console.log("Governor successfully set in Treasury!");

  // 5. Transfer token ownership to governor (so governor can mint if needed)
  console.log("Transferring token ownership to Governor...");
  const tokenTx = await token.transferOwnership(governorAddress);
  await tokenTx.wait();
  console.log("Token ownership successfully transferred to Governor!");

  // 6. Save addresses to deployments/arcTestnet.json
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentData = {
    network: "arcTestnet",
    chainId: 5042002,
    token: tokenAddress,
    treasury: treasuryAddress,
    governor: governorAddress,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(deploymentsDir, "arcTestnet.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  console.log("Deployments saved to deployments/arcTestnet.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
