const fs = require('fs');
const dotenv = require('dotenv');
if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });
const { createPublicClient, http, formatUnits, parseAbi } = require('viem');
const { defineChain } = require('viem');

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.io'] } },
});

const client = createPublicClient({ chain: arcTestnet, transport: http() });

const TOKEN_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function getVotes(address) view returns (uint256)'
]);

async function main() {
  const token = '0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e';
  const addrs = [
    '0x35630dFE2592AB19d979ec1B173697aEa554b66b',
    '0xE819090D7810D89f2E86e167d0b58425dEd745D8',
    '0xE6bAC65d7f060B805B8dd6f1c4DBfa6571905f28',
    '0x88BdF819466C1802ce6C780a9fbdF3A314cab07D'
  ];

  for (const a of addrs) {
    try {
      const b = await client.readContract({ address: token, abi: TOKEN_ABI, functionName: 'balanceOf', args: [a] });
      const v = await client.readContract({ address: token, abi: TOKEN_ABI, functionName: 'getVotes', args: [a] });
      console.log(a, 'balance:', formatUnits(b, 18), 'votes:', formatUnits(v, 18));
    } catch(e) {
      console.log(a, 'error:', e.message);
    }
  }
}

main().catch(console.error);
