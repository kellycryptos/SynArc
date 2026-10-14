const fs = require('fs');
const dotenv = require('dotenv');
const { createPublicClient, http, parseAbi, formatUnits } = require('viem');
const { defineChain } = require('viem');

if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });

const arcMainnet = defineChain({
  id: 5042,
  name: 'Arc',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mainnet.arc.io'] } },
});

const client = createPublicClient({ chain: arcMainnet, transport: http('https://rpc.mainnet.arc.io') });
const TREASURY_ADDRESS = '0x8205e9782Fe54fD2aaD895b436B695db169F3d7B';

const abi = parseAbi([
  'function usdcBalance() view returns (uint256)',
  'function syncBalance() external',
  'function owner() view returns (address)'
]);

async function check() {
  const trUsdc = await client.readContract({
    address: TREASURY_ADDRESS,
    abi,
    functionName: 'usdcBalance'
  });
  console.log('Treasury internal tracked usdcBalance:', formatUnits(trUsdc, 6), 'USDC');
}

check().catch(console.error);
