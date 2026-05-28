const { JsonRpcProvider, Contract, ZeroAddress } = require('ethers');

const RPC_URL = "https://rpc.testnet.arc.network";
const GOVERNOR_ADDRESS = "0x17D9d585CBB1AF6aa4a3C787116f7ba59651B702";
const SENDER_ADDRESS = "0x35630dFE2592AB19d979ec1B173697aEa554b66b"; // Token holder with native balance

const GOVERNOR_ABI = [
  "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) external returns (uint256)"
];

async function main() {
  const provider = new JsonRpcProvider(RPC_URL);
  const governor = new Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, provider);
  
  const targets = [ZeroAddress];
  const values = [0n];
  const calldatas = ["0x"];
  
  const descriptions = [
    "Short description",
    "Medium description with some details and category info. This is a bit longer.",
    "Long description: " + "A".repeat(1000),
    "Very long description: " + "A".repeat(5000)
  ];
  
  for (const desc of descriptions) {
    try {
      console.log(`\nEstimating for description length: ${desc.length} chars...`);
      
      const txData = await governor.propose.populateTransaction(targets, values, calldatas, desc);
      
      // Override from to SENDER_ADDRESS
      txData.from = SENDER_ADDRESS;
      
      const gasEst = await provider.estimateGas(txData);
      console.log("Estimated Gas Limit:", gasEst.toString());
      
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || 20000000000n;
      const totalCostWei = gasEst * gasPrice;
      console.log("Gas Price:", gasPrice.toString());
      console.log(`Estimated Cost: ${totalCostWei.toString()} wei (${totalCostWei / 10n**12n} microUSDC / ${Number(totalCostWei) / 1e18} USDC)`);
    } catch (err) {
      console.error(`Failed to estimate gas for length ${desc.length}:`, err);
    }
  }
}

main();
