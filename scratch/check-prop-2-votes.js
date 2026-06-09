const { ethers } = require("hardhat");

async function main() {
  const GOVERNOR_ADDRESS = "0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e";
  const [deployer] = await ethers.getSigners();

  const governorAbi = [
    "function getProposal(uint256 proposalId) external view returns (uint256 id, address proposer, string memory title, string memory description, string memory category, uint256 votingDuration, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed, uint256 treasuryImpactValue, address executionTarget)"
  ];
  const governor = new ethers.Contract(GOVERNOR_ADDRESS, governorAbi, deployer);

  const proposalId = 2;
  const propDetails = await governor.getProposal(proposalId);
  
  console.log(`\nProposal #${proposalId} Details:`);
  console.log(`Title: ${propDetails[2]}`);
  console.log(`Proposer: ${propDetails[1]}`);
  console.log(`For Votes: ${ethers.formatUnits(propDetails[8], 18)} sARC`);
  console.log(`Against Votes: ${ethers.formatUnits(propDetails[9], 18)} sARC`);
  console.log(`Abstain Votes: ${ethers.formatUnits(propDetails[10], 18)} sARC`);
  console.log(`Executed: ${propDetails[12]}`);
}

main().catch(console.error);
