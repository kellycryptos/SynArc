import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const SynArcCrowdfund = await ethers.getContractFactory("SynArcCrowdfund");
  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

  const deployTx = await SynArcCrowdfund.getDeployTransaction(
    deployer.address,
    deployer.address,
    USDC_ADDRESS,
    ethers.parseUnits("1500", 6),
    30,
    false,
    "Aura Synth Lab",
    "Decentralized audio synthesis studio creating open-source web3 sound kits",
    "music",
    ["Initial Synth Pack", "Live Stem Player", "Community Sample Pack"],
    [ethers.parseUnits("500", 6), ethers.parseUnits("500", 6), ethers.parseUnits("500", 6)],
    ["Release of 50 open-source serum presets", "Web-based player", "Final compilation"]
  );

  const gasEst = await ethers.provider.estimateGas(deployTx);
  console.log("Estimated Gas Units per deployment:", gasEst.toString());

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? 20000000000n;
  console.log("Gas Price:", gasPrice.toString(), "wei");

  const costPerDeploy = gasEst * gasPrice;
  console.log("Cost per deployment:", ethers.formatEther(costPerDeploy), "ARC/USDC");

  const totalCost = costPerDeploy * 10n;
  console.log("Estimated cost for 10 deployments:", ethers.formatEther(totalCost), "ARC/USDC");

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Current Deployer Balance:", ethers.formatEther(balance), "ARC/USDC");
  console.log("Deployer Address:", deployer.address);

  if (balance < totalCost) {
    console.log("INSUFFICIENT GAS: Need at least", ethers.formatEther(totalCost - balance), "more gas");
  } else {
    console.log("SUFFICIENT GAS AVAILABLE!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
