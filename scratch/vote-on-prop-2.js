const { ethers } = require("hardhat");

async function main() {
  const GOVERNOR_ADDRESS = "0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e";
  const [deployer] = await ethers.getSigners();
  console.log(`Using deployer wallet: ${deployer.address}`);

  const governorAbi = [
    "function castVote(uint256 proposalId, uint8 support) external returns (uint256)",
    "function state(uint256 proposalId) external view returns (uint8)",
    "function getProposal(uint256 proposalId) external view returns (tuple(uint256 id, address proposer, string title, string description, string category, uint256 votingDuration, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed, uint256 treasuryImpactValue, address executionTarget))"
  ];
  const governor = new ethers.Contract(GOVERNOR_ADDRESS, governorAbi, deployer);

  const proposalId = 2;
  const currentState = await governor.state(proposalId);
  console.log(`Proposal state: ${currentState} (should be 1n for Active)`);

  console.log("\nCasting vote on proposal #2...");
  const txVote = await governor.castVote(proposalId, 1, { // 1 = For
    gasLimit: 300000,
    maxFeePerGas: ethers.parseUnits("50", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("3", "gwei")
  });
  console.log(`Vote Tx submitted: ${txVote.hash}`);
  const receiptVote = await txVote.wait();
  console.log("✅ Vote cast successfully on-chain!");
  console.log(`Vote Tx confirmed in block: ${receiptVote.blockNumber}`);

  // Query proposal status
  const propDetails = await governor.getProposal(proposalId);
  console.log(`For Votes on contract: ${ethers.formatUnits(propDetails.forVotes, 18)} sARC`);
}

main().catch(console.error);
