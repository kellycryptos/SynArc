const { JsonRpcProvider } = require('ethers');

const RPC_URL = "https://rpc.testnet.arc.network";
const TX_HASH = "0xffe0169550aa8f9016775c59d9d270aead555f66700bf81c3950facf5d9c997e";

async function main() {
  const provider = new JsonRpcProvider(RPC_URL);
  
  try {
    const tx = await provider.getTransaction(TX_HASH);
    if (!tx) {
      console.log("Transaction not found in mempool or history.");
      return;
    }
    
    console.log("Transaction found:");
    console.log(`Block Number: ${tx.blockNumber}`);
    console.log(`From: ${tx.from}`);
    console.log(`To: ${tx.to}`);
    console.log(`Gas Limit: ${tx.gasLimit.toString()}`);
    console.log(`Gas Price: ${tx.gasPrice?.toString()}`);
    console.log(`Max Fee Per Gas: ${tx.maxFeePerGas?.toString()}`);
    console.log(`Max Priority Fee Per Gas: ${tx.maxPriorityFeePerGas?.toString()}`);
    
    const receipt = await provider.getTransactionReceipt(TX_HASH);
    if (receipt) {
      console.log("Transaction is Confirmed!");
      console.log(`Block Number Confirmed: ${receipt.blockNumber}`);
      console.log(`Status: ${receipt.status === 1 ? "Success" : "Failed"}`);
      console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
    } else {
      console.log("Transaction is still PENDING.");
      const currentBlock = await provider.getBlockNumber();
      console.log(`Current Network Block: ${currentBlock}`);
      
      const feeData = await provider.getFeeData();
      console.log("\nCurrent Network Fee Data:");
      console.log(`Gas Price: ${feeData.gasPrice?.toString()} (${feeData.gasPrice ? Number(feeData.gasPrice)/1e6 : "N/A"} microUSDC)`);
      console.log(`Max Fee Per Gas: ${feeData.maxFeePerGas?.toString()} (${feeData.maxFeePerGas ? Number(feeData.maxFeePerGas)/1e6 : "N/A"} microUSDC)`);
      console.log(`Max Priority Fee Per Gas: ${feeData.maxPriorityFeePerGas?.toString()} (${feeData.maxPriorityFeePerGas ? Number(feeData.maxPriorityFeePerGas)/1e6 : "N/A"} microUSDC)`);
    }
  } catch (err) {
    console.error("Error checking transaction:", err);
  }
}

main();
