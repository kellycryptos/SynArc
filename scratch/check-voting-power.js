const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) {
    console.error("No DEPLOYER_PRIVATE_KEY found");
    return;
  }
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc-node.thecanteenapp.com/v1/swrm_104d24688adcae992878acabfd41b2ed5800817b20d57aa9b17a64d225c0bf8f");
  const wallet = new ethers.Wallet(pk, provider);
  console.log("Deployer Wallet:", wallet.address);

  const tokenAddress = "0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e";
  const tokenAbi = [
    "function balanceOf(address account) external view returns (uint256)",
    "function delegates(address account) external view returns (address)",
    "function getVotes(address account) external view returns (uint256)",
    "function getPastVotes(address account, uint256 blockNumber) external view returns (uint256)"
  ];
  const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, wallet);

  const balance = await tokenContract.balanceOf(wallet.address);
  const delegatee = await tokenContract.delegates(wallet.address);
  const currentVotes = await tokenContract.getVotes(wallet.address);
  const currentBlock = await provider.getBlockNumber();

  console.log(`sARC Token Balance: ${ethers.formatUnits(balance, 18)} sARC`);
  console.log(`Delegated To: ${delegatee}`);
  console.log(`Current Voting Power (getVotes): ${ethers.formatUnits(currentVotes, 18)}`);
  console.log(`Current Block: ${currentBlock}`);
}

main().catch(console.error);
