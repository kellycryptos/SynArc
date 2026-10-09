import { ethers } from "hardhat";

async function main() {
  const treasuryAddress = "0x8205e9782Fe54fD2aaD895b436B695db169F3d7B";
  const provider = ethers.provider;
  const treasuryAbi = [
    "function getTransactions() view returns (tuple(string txType, address party, uint256 amount, string tokenSymbol, string description, uint256 timestamp, string deliverableURI)[])",
  ];
  const treasuryContract = new ethers.Contract(treasuryAddress, treasuryAbi, provider);
  const txs = await treasuryContract.getTransactions();
  console.log("Found", txs.length, "transactions:");
  for (let i = 0; i < txs.length; i++) {
    const t = txs[i];
    console.log({
      index: i,
      txType: t.txType,
      party: t.party,
      amount: Number(t.amount) / 1e6,
      tokenSymbol: t.tokenSymbol,
      description: t.description,
      timestamp: Number(t.timestamp),
      date: new Date(Number(t.timestamp) * 1000).toISOString(),
      deliverableURI: t.deliverableURI
    });
  }
}

main().catch(console.error);
