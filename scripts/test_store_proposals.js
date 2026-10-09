const { ethers, JsonRpcProvider, Contract, formatUnits } = require('ethers');

const GovernorABI = [
  'function proposalCount() view returns (uint256)',
  'function getProposal(uint256) view returns (uint256, address, string, string, string, uint256, uint256, uint256, uint256, uint256, uint256, bool, bool, uint256, address, string)',
  'function state(uint256) view returns (uint8)'
];

async function main() {
  const provider = new JsonRpcProvider('https://rpc.mainnet.arc.io');
  const govAddress = '0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025';
  const govContract = new Contract(govAddress, GovernorABI, provider);

  const count = await govContract.proposalCount();
  console.log('Mainnet proposal count:', count.toString());

  const total = Number(count);
  for (let i = 1; i <= total; i++) {
    try {
      const [p, s] = await Promise.all([
        govContract.getProposal(i),
        govContract.state(i)
      ]);
      const statusMap = ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed'];
      console.log(`[SIP-${i}] State: ${statusMap[Number(s)]} | Title: ${p[2].substring(0, 50)}... | For: ${formatUnits(p[8], 18)}`);
    } catch (e) {
      console.error(`Error loading proposal #${i}:`, e.message);
    }
  }
}

main().catch(console.error);
