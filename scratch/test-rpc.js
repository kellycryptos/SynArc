const { createPublicClient, http } = require('viem');

// Test connection to the provided Canteen RPC URL
const RPC_URL = 'https://rpc.testnet.arc-node.thecanteenapp.com/v1/swrm_104d24688adcae992878acabfd41b2ed5800817b20d57aa9b17a64d225c0bf8f';

async function main() {
  console.log('Testing connection to RPC URL:', RPC_URL);
  
  const client = createPublicClient({
    transport: http(RPC_URL)
  });

  try {
    const blockNumber = await client.getBlockNumber();
    console.log('✅ Connection Successful!');
    console.log('Current Block Number:', blockNumber.toString());
  } catch (err) {
    console.error('❌ Connection Failed:', err.message || err);
  }
}

main();
