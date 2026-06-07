import { ethers } from "hardhat";

async function main() {
  const GOVERNOR_ADDRESS = process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS || "0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e";
  
  // Proposal Metadata matching custom SynArcGovernor contract
  const title = "SIP-1: Optimize Core Protocol Treasury Target";
  const description = "This is the initial governance configuration proposal for SynArc DAO. Testing native stablecoin deployment threshold parameters and cross-chain CCTP bridging capabilities on Arc Testnet.";
  const category = "Governance Parameter";
  const votingDuration = 7 * 24 * 60 * 60; // 7 days in seconds
  const treasuryImpactValue = 0;
  const executionTarget = ethers.ZeroAddress;

  console.log("Connecting to SynArc Governor contract...");
  
  // Custom ABI matching SynArcGovernor.sol propose signature
  const governorAbi = [
    "function propose(string memory title, string memory description, string memory category, uint256 votingDuration, uint256 treasuryImpactValue, address executionTarget) external returns (uint256)"
  ];

  const [deployer] = await ethers.getSigners();
  console.log(`Using deployer wallet: ${deployer.address}`);

  const governor = new ethers.Contract(GOVERNOR_ADDRESS, governorAbi, deployer);

  console.log("Broadcasting custom propose transaction directly to Arc Testnet nodes...");

  // Explicitly passing manual gas configurations tailored for Arc's 18-decimal EVM gas representation
  const tx = await governor.propose(
    title,
    description,
    category,
    votingDuration,
    treasuryImpactValue,
    executionTarget,
    {
      gasLimit: 600000,
      maxFeePerGas: ethers.parseUnits("50", "gwei"),       // Configured for 18-decimal EVM native gas pricing (50 Gwei)
      maxPriorityFeePerGas: ethers.parseUnits("3", "gwei"), // 18-decimal priority tip setting (3 Gwei)
    }
  );

  console.log(`Transaction submitted! Hash: ${tx.hash}`);
  
  console.log("Waiting for block confirmation...");
  const receipt = await tx.wait();
  
  console.log("✅ Proposal Successfully Created on-chain!");
  console.log(`Block Number: ${receipt?.blockNumber ?? "Unknown"}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Execution Failed:", error);
    process.exit(1);
  });
