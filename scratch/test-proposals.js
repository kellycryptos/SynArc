const { JsonRpcProvider, Contract, formatUnits } = require('ethers');

const RPC_URL = "https://rpc.testnet.arc-node.thecanteenapp.com/v1/swrm_104d24688adcae992878acabfd41b2ed5800817b20d57aa9b17a64d225c0bf8f";
const GOVERNOR_ADDRESS = "0x17D9d585CBB1AF6aa4a3C787116f7ba59651B702";

const GOVERNOR_ABI = [
  "function proposalCount() external view returns (uint256)",
  "function getProposal(uint256 proposalId) external view returns (uint256 id, address proposer, string title, string description, string category, uint256 votingDuration, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed, uint256 treasuryImpactValue, address executionTarget)",
  "function state(uint256 proposalId) external view returns (uint8)"
];

async function main() {
  const provider = new JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true, batchMaxCount: 1 });
  const governor = new Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, provider);
  
  try {
    const count = await governor.proposalCount();
    console.log(`Current on-chain Proposal Count: ${count.toString()}`);
    
    const totalCount = Number(count);
    const indices = Array.from({ length: totalCount }, (_, i) => i + 1);
    
    console.log(`Querying ${totalCount} proposals in parallel...`);
    const settled = await Promise.allSettled(
      indices.map(async (i) => {
        const [p, proposalStateNum] = await Promise.all([
          governor.getProposal(i),
          governor.state(i)
        ]);
        return { i, p, proposalStateNum };
      })
    );
    
    let successCount = 0;
    let failCount = 0;
    
    for (const result of settled) {
      if (result.status === 'rejected') {
        console.error(`Failed to load proposal:`, result.reason);
        failCount++;
      } else {
        successCount++;
        const { i, p, proposalStateNum } = result.value;
        if (i <= 5 || i >= totalCount - 5) {
          console.log(`Loaded proposal #${i}: Title="${p.title}", State=${proposalStateNum}`);
        }
      }
    }
    
    console.log(`\nSummary: Success=${successCount}, Failed=${failCount}`);
  } catch (err) {
    console.error("Error in main:", err);
  }
}

main();
