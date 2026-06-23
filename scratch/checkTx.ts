import { ethers } from "hardhat";

async function main() {
  const deployer = "0x35630dFE2592AB19d979ec1B173697aEa554b66b";
  const provider = ethers.provider;
  
  const currentNonce = await provider.getTransactionCount(deployer);
  const pendingNonce = await provider.getTransactionCount(deployer, "pending");
  const feeData = await provider.getFeeData();
  
  console.log("Deployer account:", deployer);
  console.log("Current confirmed nonce:", currentNonce);
  console.log("Current pending nonce:", pendingNonce);
  console.log("Current gas price:", feeData.gasPrice?.toString());
  console.log("Current maxFeePerGas:", feeData.maxFeePerGas?.toString());
  console.log("Current maxPriorityFeePerGas:", feeData.maxPriorityFeePerGas?.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
