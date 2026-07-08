import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const agentTreasuryAddress = '0x302D7cba3553e22E24C7A5C9aFee3942EBC6ea63';
  
  const treasury = await ethers.getContractAt("SynArcTreasury", agentTreasuryAddress);
  
  console.log("Simulating syncBalance() via ethers callStatic...");
  try {
    const tx = await treasury.syncBalance.populateTransaction();
    const result = await deployer.call(tx);
    console.log("Static call succeeded! Result:", result);
  } catch (err: any) {
    console.log("Static call failed!");
    console.log(err);
  }
}

main().catch(console.error);
