const { JsonRpcProvider, Contract } = require('ethers');

const RPC_URL = "https://rpc.testnet.arc.network";
const GOVERNOR_ADDRESS = "0x17D9d585CBB1AF6aa4a3C787116f7ba59651B702";

const GOVERNOR_ABI = [
  "function proposalCount() external view returns (uint256)",
  "function getProposal(uint256 proposalId) external view returns (uint256 id, address proposer, string title, string description, string category, uint256 votingDuration, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed, uint256 treasuryImpactValue, address executionTarget)"
];

async function main() {
  const provider = new JsonRpcProvider(RPC_URL);
  const governor = new Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, provider);
  
  try {
    const count = await governor.proposalCount();
    console.log(`Current on-chain Proposal Count: ${count.toString()}`);
    
    if (count > 0n) {
      console.log("\nProposals found:");
      for (let i = 1n; i <= count; i++) {
        try {
          const prop = await governor.getProposal(i);
          console.log(`\nProposal #${i}:`);
          console.log(`  Proposer: ${prop.proposer}`);
          console.log(`  Title: ${prop.title}`);
          console.log(`  Description Snippet: ${prop.description.substring(0, 80)}...`);
          console.log(`  Category: ${prop.category}`);
        } catch (e) {
          console.error(`  Failed to read proposal #${i}:`, e.message);
        }
      }
    }
  } catch (err) {
    console.error("Error querying Governor:", err);
  }
}

main();
