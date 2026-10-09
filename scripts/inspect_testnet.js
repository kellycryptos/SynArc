const fs = require('fs');
const dotenv = require('dotenv');
if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });
const { createPublicClient, http, formatEther, parseAbi } = require('viem');
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
  const tokenAddr = '0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e';

  console.log('Inspecting Testnet Contracts:');
  const tBal = await client.getBalance({ address: treasuryAddr });
  console.log('Treasury Native Balance:', formatEther(tBal));

  // Check what methods treasury supports
  const testAbis = [
    'function owner() view returns (address)',
    'function governor() view returns (address)',
    'function usdcToken() view returns (address)',
    'function usdcBalance() view returns (uint256)',
    'function balance() view returns (uint256)'
  ];

  for (const fn of testAbis) {
    try {
      const res = await client.readContract({
        address: treasuryAddr,
        abi: parseAbi([fn]),
        functionName: fn.split(' ')[1].split('(')[0]
      });
      console.log(`${fn} -> ${res}`);
    } catch (e) {
      console.log(`${fn} -> REVERTED: ${e.shortMessage || e.message}`);
    }
  }

  // Check Governor proposal count
  try {
    const pCount = await client.readContract({
      address: govAddr,
      abi: parseAbi(['function proposalCount() view returns (uint256)']),
      functionName: 'proposalCount'
    });
    console.log('Governor Proposal Count:', pCount.toString());
  } catch (e) {
    console.log('Governor proposalCount error:', e.message);
  }
}

main().catch(console.error);
