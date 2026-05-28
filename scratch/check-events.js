const { JsonRpcProvider, Contract } = require('ethers');

const RPC_URL = "https://rpc.testnet.arc.network";
const GOVERNOR_ADDRESS = "0x17D9d585CBB1AF6aa4a3C787116f7ba59651B702";

const GOVERNOR_ABI = [
  "event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title, string description, string category, uint256 startTime, uint256 endTime, uint256 treasuryImpactValue, address executionTarget)"
];

async function main() {
  const provider = new JsonRpcProvider(RPC_URL);
  const governor = new Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, provider);
  
  try {
    const filter = governor.filters.ProposalCreated();
    console.log("Querying events...");
    const events = await governor.queryFilter(filter);
    console.log(`Found ${events.length} ProposalCreated events!`);
    
    events.forEach((event, idx) => {
      console.log(`\nEvent #${idx + 1}:`);
      console.log("Args:", event.args);
    });
  } catch (err) {
    console.error("Error querying events:", err);
  }
}

main();
