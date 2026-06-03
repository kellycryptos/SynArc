const { createPublicClient, http } = require('viem');

const RPC_URL = 'https://rpc.testnet.arc.network';
const MESSAGE_TRANSMITTER = '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275';

const MESSAGE_TRANSMITTER_ABI = [
  {
    name: 'MessageReceived',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'caller', type: 'address' },
      { indexed: false, name: 'sourceDomain', type: 'uint32' },
      { indexed: true, name: 'nonce', type: 'uint64' },
      { indexed: false, name: 'messageHash', type: 'bytes32' },
      { indexed: false, name: 'message', type: 'bytes' }
    ]
  }
];

async function main() {
  console.log('Querying CCTP events on public RPC:', RPC_URL);
  
  const client = createPublicClient({
    transport: http(RPC_URL)
  });

  try {
    const blockNumber = await client.getBlockNumber();
    console.log('Current Block Number:', blockNumber.toString());

    // Query last 500,000 blocks in chunks of 100,000 blocks
    let currentBlock = blockNumber;
    let events = [];
    const chunkSize = 100000n;
    
    for (let i = 0; i < 5; i++) {
      const fromBlock = currentBlock - chunkSize > 0n ? currentBlock - chunkSize : 0n;
      console.log(`Querying from block ${fromBlock} to ${currentBlock}...`);
      
      const logs = await client.getLogs({
        address: MESSAGE_TRANSMITTER,
        event: MESSAGE_TRANSMITTER_ABI[0],
        fromBlock: fromBlock,
        toBlock: currentBlock
      });
      
      console.log(`Found ${logs.length} events in this chunk.`);
      events.push(...logs);
      currentBlock = fromBlock - 1n;
      if (currentBlock <= 0n) break;
    }

    console.log(`Total events found in last 500,000 blocks: ${events.length}`);
    
    events.forEach((log, idx) => {
      const messageHex = log.message || log.args?.message;
      if (!messageHex) return;
      
      // Decode mintRecipient
      const mintRecipientHex = messageHex.slice(298, 298 + 64);
      const recipientAddress = "0x" + mintRecipientHex.slice(24);
      
      // Decode amount
      const amountHex = messageHex.slice(362, 362 + 64);
      const amount = Number(BigInt("0x" + amountHex)) / 1_000_000;
      
      console.log(`Log #${idx + 1}: txHash = ${log.transactionHash}`);
      console.log(`  caller = ${log.args?.caller}, sourceDomain = ${log.args?.sourceDomain}, nonce = ${log.args?.nonce}`);
      console.log(`  recipientAddress = ${recipientAddress}, amount = ${amount} USDC`);
    });
  } catch (err) {
    console.error('❌ Query Failed:', err.message || err);
  }
}

main();
