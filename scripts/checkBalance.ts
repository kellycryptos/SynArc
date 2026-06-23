import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account address:", deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "native tokens");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
