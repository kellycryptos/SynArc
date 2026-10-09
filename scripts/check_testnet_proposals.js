const fs = require('fs');
const dotenv = require('dotenv');
if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });
const { createPublicClient, http, parseAbi } = require('viem');
const { defineChain } = require('viem');

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.io'] } },
});

const client = createPublicClient({ chain: arcTestnet, transport: http() });

async function main() {
  const treasuryAddr = '0xFE0F6bF45D363d34CD5fC1781594a7471736dC18';
  const govAddr = '0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e';

  // Check governor bytecode and state
  const govCode = await client.getBytecode({ address: govAddr });
  console.log('Governor bytecode length:', govCode.length);

  // Check last proposals on governor
  const pCount = await client.readContract({
    address: govAddr,
    abi: parseAbi(['function proposalCount() view returns (uint256)']),
    functionName: 'proposalCount'
  });
  console.log('Testnet proposal count:', pCount.toString());

  // Check last proposal details
  try {
    const lastP = await client.readContract({
      address: govAddr,
      abi: parseAbi(['function getProposal(uint256) view returns (uint256, address, string, string, string, uint256, uint256, uint256, uint256, uint256, uint256, bool, bool, uint256, address, string)']),
      functionName: 'getProposal',
      args: [pCount]
    });
    console.log('Last proposal title:', lastP[2], 'executed:', lastP[12], 'impact:', lastP[13].toString());
  } catch (e) {
    console.log('Error reading last proposal:', e.shortMessage || e.message);
  }
}

main().catch(console.error);
