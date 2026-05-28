const { JsonRpcProvider } = require('ethers');

const RPC_URL = "https://rpc.testnet.arc.network";

async function main() {
  const provider = new JsonRpcProvider(RPC_URL);
  try {
    const feeData = await provider.getFeeData();
    console.log("Fee Data:");
    console.log(`Gas Price: ${feeData.gasPrice?.toString()} (${feeData.gasPrice ? Number(feeData.gasPrice)/1e6 : "N/A"} microUSDC)`);
    console.log(`Max Fee Per Gas: ${feeData.maxFeePerGas?.toString()} (${feeData.maxFeePerGas ? Number(feeData.maxFeePerGas)/1e6 : "N/A"} microUSDC)`);
    console.log(`Max Priority Fee Per Gas: ${feeData.maxPriorityFeePerGas?.toString()} (${feeData.maxPriorityFeePerGas ? Number(feeData.maxPriorityFeePerGas)/1e6 : "N/A"} microUSDC)`);
  } catch (err) {
    console.error("Error getting gas data:", err);
  }
}

main();
