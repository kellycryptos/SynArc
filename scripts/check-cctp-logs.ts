import { createPublicClient, http } from "viem";

const arcTestnet = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
    public: { http: ["https://rpc.testnet.arc.network"] }
  }
};

async function main() {
  const rpcUrl = "https://rpc.testnet.arc.network";
  const client = createPublicClient({
    chain: arcTestnet as any,
    transport: http(rpcUrl),
  });

  const tokenMessengerAddress = "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA";
  const messageTransmitterAddress = "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275";

  const latestBlock = await client.getBlockNumber();
  console.log("Latest block:", latestBlock);

  // Let's get logs for the last 5000 blocks for MessageTransmitter
  console.log("Fetching logs for MessageTransmitter...");
  const logs = await client.getLogs({
    address: messageTransmitterAddress,
    fromBlock: latestBlock - 5000n,
    toBlock: "latest",
  });

  console.log(`Found ${logs.length} logs for MessageTransmitter.`);
  for (const log of logs) {
    console.log("Log index:", log.logIndex);
    console.log("Transaction hash:", log.transactionHash);
    console.log("Topics:", log.topics);
    console.log("Data:", log.data);
  }

  // Let's also check TokenMessenger logs
  console.log("Fetching logs for TokenMessenger...");
  const tmLogs = await client.getLogs({
    address: tokenMessengerAddress,
    fromBlock: latestBlock - 5000n,
    toBlock: "latest",
  });

  console.log(`Found ${tmLogs.length} logs for TokenMessenger.`);
  for (const log of tmLogs) {
    console.log("Log index:", log.logIndex);
    console.log("Transaction hash:", log.transactionHash);
    console.log("Topics:", log.topics);
    console.log("Data:", log.data);
  }
}

main().catch(console.error);
