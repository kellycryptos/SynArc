import { createPublicClient, http } from 'viem';
import { arcTestnet } from '../lib/arc-config';

const treasuryAddress = '0xFE0F6bF45D363d34CD5fC1781594a7471736dC18';
const primaryUrl = 'https://rpc.testnet.arc.network';

async function main() {
  const client = createPublicClient({
    chain: arcTestnet,
    transport: http(primaryUrl),
  });

  const currentBlock = await client.getBlockNumber();
  console.log('Current block:', currentBlock);

  // Binary search for deployment block of the contract address
  let low = 0n;
  let high = currentBlock;
  let deploymentBlock = currentBlock;

  console.log('Binary searching for contract deployment block...');
  while (low <= high) {
    const mid = (low + high) / 2n;
    try {
      const code = await client.getBytecode({
        address: treasuryAddress,
        blockNumber: mid,
      });

      if (code && code !== '0x') {
        deploymentBlock = mid;
        high = mid - 1n; // Look for earlier
      } else {
        low = mid + 1n; // Look later
      }
    } catch (err: any) {
      const msg = err.message || '';
      // If pruned state or pruned history, we know deployment is after mid block
      if (msg.includes('pruned') || msg.includes('32603') || msg.includes('InternalRpcError')) {
        low = mid + 1n;
      } else {
        console.error('Unhandled error during binary search:', err);
        throw err;
      }
    }
  }

  console.log('Deployment block of Treasury contract:', deploymentBlock);
}

main().catch(console.error);
