import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Clearing stuck transactions for deployer:", deployer.address);
  
  const provider = ethers.provider;
  const currentGasPrice = (await provider.getFeeData()).gasPrice;
  // Use 50 gwei to ensure instant overrides
  const speedupGasPrice = ethers.parseUnits("50", "gwei");
  console.log("Current network gas price:", currentGasPrice?.toString());
  console.log("Override gas price:", speedupGasPrice.toString());

  const noncesToClear = [127, 128, 129];
  
  for (const nonce of noncesToClear) {
    console.log(`Sending cancel transaction for nonce ${nonce}...`);
    try {
      const tx = await deployer.sendTransaction({
        to: deployer.address,
        value: 0,
        nonce: nonce,
        gasPrice: speedupGasPrice,
        gasLimit: 100000
      });
      console.log(`Transaction sent! Hash: ${tx.hash}`);
      console.log(`Waiting for confirmation...`);
      await tx.wait(1);
      console.log(`Confirmed!`);
    } catch (err: any) {
      console.error(`Failed to clear nonce ${nonce}:`, err.message);
    }
  }

  console.log("Diagnostics after clear:");
  const currentNonce = await provider.getTransactionCount(deployer.address);
  const pendingNonce = await provider.getTransactionCount(deployer.address, "pending");
  console.log("Current confirmed nonce:", currentNonce);
  console.log("Current pending nonce:", pendingNonce);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
