const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) {
    console.log("No DEPLOYER_PRIVATE_KEY found in env");
    return;
  }
  const wallet = new ethers.Wallet(pk);
  console.log("Deployer Address:", wallet.address);
}

main();
