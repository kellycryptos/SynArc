import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Starting fund migration using account:", deployer.address);

  const OLD_TREASURY_ADDRESS = "0x8Ab21363cB0319548B051f129e477393908be7c1";
  const NEW_TREASURY_ADDRESS = "0xFE0F6bF45D363d34CD5fC1781594a7471736dC18";

  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
  const EURC_ADDRESS = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";

  // Connect to the stablecoins
  const erc20Abi = [
    "function balanceOf(address account) external view returns (uint256)",
    "function symbol() external view returns (string)"
  ];
  const usdc = new ethers.Contract(USDC_ADDRESS, erc20Abi, deployer);
  const eurc = new ethers.Contract(EURC_ADDRESS, erc20Abi, deployer);

  // Query initial balances
  console.log("\n--- Checking Initial Balances ---");
  const oldUsdcBal = await usdc.balanceOf(OLD_TREASURY_ADDRESS);
  const oldEurcBal = await eurc.balanceOf(OLD_TREASURY_ADDRESS);
  console.log(`Old Treasury USDC Token Balance: ${ethers.formatUnits(oldUsdcBal, 6)} USDC`);
  console.log(`Old Treasury EURC Token Balance: ${ethers.formatUnits(oldEurcBal, 6)} EURC`);

  // Connect to Old Treasury
  const treasuryAbi = [
    "function setGovernor(address _governor) external",
    "function withdrawUSDC(address recipient, uint256 amount) external",
    "function withdrawEURC(address recipient, uint256 amount) external",
    "function withdraw(address recipient, uint256 amount) external",
    "function governor() external view returns (address)",
    "function owner() external view returns (address)",
    "function usdcBalance() external view returns (uint256)",
    "function eurcBalance() external view returns (uint256)",
    "function usdcToken() external view returns (address)",
    "function eurcToken() external view returns (address)"
  ];
  const oldTreasury = new ethers.Contract(OLD_TREASURY_ADDRESS, treasuryAbi, deployer);

  const internalUsdc = await oldTreasury.usdcBalance().catch(() => 0n);
  const internalEurc = await oldTreasury.eurcBalance().catch(() => 0n);
  const internalUsdcToken = await oldTreasury.usdcToken().catch(() => "unknown");
  const internalEurcToken = await oldTreasury.eurcToken().catch(() => "unknown");
  console.log(`Old Treasury Internal usdcBalance state: ${ethers.formatUnits(internalUsdc, 6)}`);
  console.log(`Old Treasury Internal eurcBalance state: ${ethers.formatUnits(internalEurc, 6)}`);
  console.log(`Old Treasury usdcToken address: ${internalUsdcToken}`);
  console.log(`Old Treasury eurcToken address: ${internalEurcToken}`);

  const owner = await oldTreasury.owner();
  const currentGovernor = await oldTreasury.governor();
  console.log(`\nOld Treasury Owner: ${owner}`);
  console.log(`Old Treasury Current Governor: ${currentGovernor}`);

  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error("Deployer is not the owner of the old Treasury!");
  }

  // Step 1: Set governor to deployer so we can call withdraw functions
  if (currentGovernor.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log("\nStep 1: Setting governor of old Treasury to deployer...");
    const tx = await oldTreasury.setGovernor(deployer.address, {
      gasLimit: 100000,
      maxFeePerGas: ethers.parseUnits("50", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("3", "gwei")
    });
    console.log(`Transaction submitted: ${tx.hash}`);
    await tx.wait();
    console.log("Governor set successfully!");
  }

  // Step 2: Withdraw USDC
  if (oldUsdcBal > 0n) {
    console.log(`\nStep 2: Migrating ${ethers.formatUnits(oldUsdcBal, 6)} USDC from old -> new Treasury...`);
    const tx = await oldTreasury.withdrawUSDC(NEW_TREASURY_ADDRESS, oldUsdcBal, {
      gasLimit: 1000000,
      maxFeePerGas: ethers.parseUnits("50", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("3", "gwei")
    });
    console.log(`Transaction submitted: ${tx.hash}`);
    await tx.wait();
    console.log("USDC migrated successfully!");
  }

  // Step 3: Withdraw EURC
  if (oldEurcBal > 0n) {
    console.log(`\nStep 3: Migrating ${ethers.formatUnits(oldEurcBal, 6)} EURC from old -> new Treasury...`);
    const tx = await oldTreasury.withdrawEURC(NEW_TREASURY_ADDRESS, oldEurcBal, {
      gasLimit: 1000000,
      maxFeePerGas: ethers.parseUnits("50", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("3", "gwei")
    });
    console.log(`Transaction submitted: ${tx.hash}`);
    await tx.wait();
    console.log("EURC migrated successfully!");
  }

  // Step 4: Restore governor of old Treasury to old Governor for hygiene
  console.log("\nStep 4: Restoring governor of old Treasury to old Governor...");
  const OLD_GOVERNOR_ADDRESS = "0x17D9d585CBB1AF6aa4a3C787116f7ba59651B702";
  const restoreTx = await oldTreasury.setGovernor(OLD_GOVERNOR_ADDRESS, {
    gasLimit: 100000,
    maxFeePerGas: ethers.parseUnits("50", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("3", "gwei")
  });
  console.log(`Transaction submitted: ${restoreTx.hash}`);
  await restoreTx.wait();
  console.log("Governor restored successfully!");

  // Query final balances
  console.log("\n--- Checking Final Balances ---");
  const oldUsdcBalFinal = await usdc.balanceOf(OLD_TREASURY_ADDRESS);
  const oldEurcBalFinal = await eurc.balanceOf(OLD_TREASURY_ADDRESS);
  console.log(`Old Treasury USDC Balance: ${ethers.formatUnits(oldUsdcBalFinal, 6)} USDC`);
  console.log(`Old Treasury EURC Balance: ${ethers.formatUnits(oldEurcBalFinal, 6)} EURC`);

  const newUsdcBalFinal = await usdc.balanceOf(NEW_TREASURY_ADDRESS);
  const newEurcBalFinal = await eurc.balanceOf(NEW_TREASURY_ADDRESS);
  console.log(`New Treasury USDC Balance: ${ethers.formatUnits(newUsdcBalFinal, 6)} USDC`);
  console.log(`New Treasury EURC Balance: ${ethers.formatUnits(newEurcBalFinal, 6)} EURC`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Migration Failed:", error);
    process.exit(1);
  });
