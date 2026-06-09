const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) {
    console.error("No DEPLOYER_PRIVATE_KEY found");
    return;
  }
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc-node.thecanteenapp.com/v1/swrm_104d24688adcae992878acabfd41b2ed5800817b20d57aa9b17a64d225c0bf8f");
  const wallet = new ethers.Wallet(pk, provider);
  console.log("Wallet:", wallet.address);

  const tokenAddress = "0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e";
  const tokenAbi = [
    "function delegates(address account) external view returns (address)",
    "function delegate(address delegatee) external"
  ];
  const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, wallet);

  console.log("Delegating votes to self...");
  const tx = await tokenContract.delegate(wallet.address, {
    gasLimit: 100000,
    maxFeePerGas: ethers.parseUnits("50", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("3", "gwei")
  });
  console.log(`Transaction hash: ${tx.hash}`);
  await tx.wait();
  console.log("Delegation completed!");

  const delegatee = await tokenContract.delegates(wallet.address);
  console.log("New Delegatee:", delegatee);
}

main().catch(console.error);
