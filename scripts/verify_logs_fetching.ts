import { createPublicClient, http, parseAbi } from "viem";
import { arcTestnet } from "../lib/arc-config";

const TREASURY_EVENTS_ABI = parseAbi([
  "event Inflow(address indexed sender, uint256 amount, string tokenSymbol, string description, uint256 timestamp)",
  "event Outflow(address indexed recipient, uint256 amount, string tokenSymbol, string description, uint256 timestamp)"
]);

const treasuryAddress = "0xFE0F6bF45D363d34CD5fC1781594a7471736dC18";

async function main() {
  console.log("Using Arc Testnet Chain config:", arcTestnet.name);
  
  const publicClient = createPublicClient({
    chain: arcTestnet,
    transport: http()
  });

  try {
    const currentBlock = await publicClient.getBlockNumber();
    console.log("Current block number:", currentBlock);

    if (currentBlock > 0n) {
      // 1. Try 100k blocks (primary canteen rpc)
      const fromBlock = currentBlock - 99999n > 0n ? currentBlock - 99999n : 0n;
      console.log(`Querying events from block ${fromBlock} to ${currentBlock} (100k range)...`);

      let logs: any[] = [];
      try {
        logs = await publicClient.getLogs({
          address: treasuryAddress,
          events: TREASURY_EVENTS_ABI,
          fromBlock,
        });
        console.log(`Successfully fetched ${logs.length} logs in 100k range!`);
      } catch (err: any) {
        console.warn(`getLogs failed for 100k range: ${err.message || err}. Retrying with 10k range...`);
        // 2. Try 10k blocks (public rpc)
        const fallbackFromBlock = currentBlock - 9999n > 0n ? currentBlock - 9999n : 0n;
        logs = await publicClient.getLogs({
          address: treasuryAddress,
          events: TREASURY_EVENTS_ABI,
          fromBlock: fallbackFromBlock,
        });
        console.log(`Successfully fetched ${logs.length} logs in 10k range!`);
      }

      if (logs.length > 0) {
        console.log("Sample Log transactionHash:", logs[0].transactionHash);
      }
    } else {
      console.error("Invalid block number: 0");
    }
  } catch (err: any) {
    console.error("Error fetching logs:", err.message || err);
  }
}

main().catch(console.error);
