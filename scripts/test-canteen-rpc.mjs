import { JsonRpcProvider, Contract } from 'ethers';

const canteenSwarmRpc = process.env.NEXT_PUBLIC_CANTEEN_TESTNET_RPC || process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.io";
const canteenPublicRpc = "https://rpc.testnet.arc.io";

const governorAddress = '0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e';
const GovernorABI = [
  'function proposalCount() external view returns (uint256)',
  'function proposals(uint256) external view returns (uint256 id, address proposer, uint256 eta, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed)'
];

async function testRpc(name, rpcUrl) {
  console.log(`\n--- Testing ${name} ---`);
  console.log(`URL: ${rpcUrl}`);
  try {
    const provider = new JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
    
    const startBlockTime = Date.now();
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ getBlockNumber SUCCESS: ${blockNumber} (${Date.now() - startBlockTime}ms)`);

    const governor = new Contract(governorAddress, GovernorABI, provider);
    const startCountTime = Date.now();
    const count = await governor.proposalCount();
    console.log(`✅ proposalCount SUCCESS: ${count.toString()} (${Date.now() - startCountTime}ms)`);

    // Test a batch of 5 proposal queries to check rate limits
    console.log('Testing batch of 5 calls on contract...');
    const proposalsBatch = await Promise.all(
      [941, 940, 939, 938, 937].map(id => governor.proposals(id))
    );
    console.log(`✅ 5 proposal calls SUCCESS! Returned ${proposalsBatch.length} proposals.`);

  } catch (err) {
    console.error(`❌ ${name} FAILED!`);
    console.error(`Error Code:`, err.code);
    console.error(`Error Message:`, err.message);
    if (err.info) {
      console.error(`Error Info:`, JSON.stringify(err.info, null, 2));
    }
  }
}

async function main() {
  await testRpc("Canteen Swarm RPC", canteenSwarmRpc);
  await testRpc("Canteen Public RPC", canteenPublicRpc);
}

main().catch(console.error);
