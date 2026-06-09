const { ethers } = require("ethers");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) {
    console.error("No DEPLOYER_PRIVATE_KEY found");
    return;
  }
  
  const wallet = new ethers.Wallet(pk);
  console.log("Signing with address:", wallet.address);

  const message = `ArcLens contract registration

project: synarc-dao
contract: 0xfe0f6bf45d363d34cd5fc1781594a7471736dc18
role: tvl
label: SynArcTreasury

issued_at: 2026-06-07T15:03:49.181Z
expires_at: 2026-06-07T15:13:49.181Z
issued_to_wallet: 0xdd9c30d5f5875ca22d29532bd51678c6a5158fdd
nonce: 2ab4ac98a64503cd01ce7548cf51146a

By signing this message you authorize ArcLens to display the contract's
USDC/stablecoin metrics under this project. No on-chain action taken.`;

  const signature = await wallet.signMessage(message);
  console.log("\nMessage:");
  console.log("-----------------------------------------");
  console.log(message);
  console.log("-----------------------------------------");
  console.log("\nSignature:");
  console.log(signature);
}

main();
