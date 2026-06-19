import { ethers, run } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy MockUSDC
  console.log("Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("MockUSDC deployed to:", mockUSDCAddress);

  // 2. Deploy CanteenUSDC
  console.log("Deploying CanteenUSDC...");
  const CanteenUSDC = await ethers.getContractFactory("CanteenUSDC");
  const canteenUSDC = await CanteenUSDC.deploy(mockUSDCAddress);
  await canteenUSDC.waitForDeployment();
  const canteenUSDCAddress = await canteenUSDC.getAddress();
  console.log("CanteenUSDC deployed to:", canteenUSDCAddress);

  // 3. Wait for block confirmations to ensure ArcScan has indexed the contracts
  console.log("Waiting for block confirmations (5 blocks)...");
  await mockUSDC.deploymentTransaction()?.wait(5);
  await canteenUSDC.deploymentTransaction()?.wait(5);
  console.log("Confirmations complete. Proceeding to verification.");

  // 4. Verify MockUSDC
  console.log("Verifying MockUSDC on ArcScan...");
  try {
    await run("verify:verify", {
      address: mockUSDCAddress,
      constructorArguments: [],
    });
    console.log("MockUSDC verified successfully!");
  } catch (e: any) {
    console.error("MockUSDC verification failed:", e.message);
  }

  // 5. Verify CanteenUSDC
  console.log("Verifying CanteenUSDC on ArcScan...");
  try {
    await run("verify:verify", {
      address: canteenUSDCAddress,
      constructorArguments: [mockUSDCAddress],
    });
    console.log("CanteenUSDC verified successfully!");
  } catch (e: any) {
    console.error("CanteenUSDC verification failed:", e.message);
  }

  console.log("Deployment and Verification sequence completed!");
  console.log(`USDC Address: ${mockUSDCAddress}`);
  console.log(`CanteenUSDC Address: ${canteenUSDCAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
