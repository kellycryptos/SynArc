const { createPublicClient, http, parseAbi } = require('viem');

const RPC_URL = 'https://rpc.testnet.arc-node.thecanteenapp.com/v1/swrm_104d24688adcae992878acabfd41b2ed5800817b20d57aa9b17a64d225c0bf8f';
const TREASURY_ADDRESS = '0x8Ab21363cB0319548B051f129e477393908be7c1';

const TREASURY_ABI = parseAbi([
  'function usdcToken() view returns (address)',
  'function eurcToken() view returns (address)',
  'function owner() view returns (address)',
  'function governor() view returns (address)'
]);

async function main() {
  const client = createPublicClient({
    transport: http(RPC_URL)
  });

  try {
    console.log('Querying Treasury contract at:', TREASURY_ADDRESS);
    
    const usdc = await client.readContract({
      address: TREASURY_ADDRESS,
      abi: TREASURY_ABI,
      functionName: 'usdcToken'
    });
    console.log('Treasury USDC address configured:', usdc);

    const eurc = await client.readContract({
      address: TREASURY_ADDRESS,
      abi: TREASURY_ABI,
      functionName: 'eurcToken'
    });
    console.log('Treasury EURC address configured:', eurc);

    const owner = await client.readContract({
      address: TREASURY_ADDRESS,
      abi: TREASURY_ABI,
      functionName: 'owner'
    });
    console.log('Treasury owner:', owner);

    const governor = await client.readContract({
      address: TREASURY_ADDRESS,
      abi: TREASURY_ABI,
      functionName: 'governor'
    });
    console.log('Treasury governor:', governor);

  } catch (error) {
    console.error('Failed to query Treasury contract:', error);
  }
}

main();
