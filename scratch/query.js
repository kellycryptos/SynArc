const { JsonRpcProvider, Contract } = require('ethers');

const RPC_URL = "https://rpc.testnet.arc.network";
const TOKEN_ADDRESS = "0x637cA7788aBC956832F389A7BB895D5249FE757B";
const HOLDER = "0x35630dFE2592AB19d979ec1B173697aEa554b66b";

async function main() {
  const provider = new JsonRpcProvider(RPC_URL);
  
  const testFunctions = [
    { name: "balanceOf", abi: "function balanceOf(address owner) view returns (uint256)", args: [HOLDER] },
    { name: "delegates", abi: "function delegates(address account) view returns (address)", args: [HOLDER] },
    { name: "getVotes", abi: "function getVotes(address account) view returns (uint256)", args: [HOLDER] },
    { name: "numCheckpoints", abi: "function numCheckpoints(address account) view returns (uint32)", args: [HOLDER] }
  ];
  
  for (const fn of testFunctions) {
    try {
      const contract = new Contract(TOKEN_ADDRESS, [fn.abi], provider);
      const res = await contract[fn.name](...fn.args);
      console.log(`Success calling ${fn.name}:`, res.toString());
    } catch (err) {
      console.log(`Failed calling ${fn.name}:`, err.shortMessage || err.message);
    }
  }
}

main();
