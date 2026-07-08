import { createPublicClient, http, parseAbi } from 'viem';
import { arcTestnet } from '../lib/arc-config';

const TREASURY_EVENTS_ABI = parseAbi([
  'event Inflow(address indexed sender, uint256 amount, string tokenSymbol, string description, uint256 timestamp)',
  'event Outflow(address indexed recipient, uint256 amount, string tokenSymbol, string description, uint256 timestamp)'
]);

const treasuryAddress = '0xFE0F6bF45D363d34CD5fC1781594a7471736dC18';
const urls = [
  'https://rpc.testnet.arc.network',
  'https://rpc.testnet.arc.network',
  'https://arc-testnet.g.alchemy.com/v2/okKqIdABiZt8WuR2aDvev',
  'https://rpc.quicknode.testnet.arc.network',
  'https://arc-testnet.drpc.org'
];

async function main() {
  for (const url of urls) {
    const client = createPublicClient({
      chain: arcTestnet,
      transport: http(url),
    });

    console.log(`\nTesting RPC URL: ${url}`);
    const start = Date.now();
    try {
      const logs = await client.getLogs({
        address: treasuryAddress,
        events: TREASURY_EVENTS_ABI,
        fromBlock: 0n,
      });
      console.log(`  -> SUCCESS from block 0n in ${Date.now() - start}ms. Found ${logs.length} logs.`);
    } catch (err: any) {
      console.error(`  -> FAILED from block 0n after ${Date.now() - start}ms. Error: ${err.message}`);
    }
  }
}

main().catch(console.error);
