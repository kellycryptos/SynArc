const { createPublicClient, http, parseAbi, formatUnits } = require('viem');

const RPC_URL = 'https://rpc.mainnet.arc.io';
const GOVERNOR_ADDRESS = '0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025';
const TREASURY_ADDRESS = '0x8205e9782Fe54fD2aaD895b436B695db169F3d7B';
const TOKEN_ADDRESS = '0x8f4b429794ABa4607d177b100Cc5e481D22d0ad4';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';

const client = createPublicClient({
  transport: http(RPC_URL, { timeout: 15000 })
});

const govAbi = parseAbi([
  'function proposalCount() external view returns (uint256)',
  'function getProposal(uint256 proposalId) external view returns (uint256, address, string, string, string, uint256, uint256, uint256, uint256, uint256, uint256, bool, bool, uint256, address, string)',
  'function state(uint256 proposalId) external view returns (uint8)'
]);

const erc20Abi = parseAbi([
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)'
]);

async function main() {
  console.log('=== ARC MAINNET ON-CHAIN TRACTION REPORT ===');
  try {
    const blockNumber = await client.getBlockNumber();
    console.log('Arc Mainnet Current Block:', blockNumber.toString());

    // 1. Total Proposals
    const proposalCount = await client.readContract({
      address: GOVERNOR_ADDRESS,
      abi: govAbi,
      functionName: 'proposalCount'
    });
    console.log('Governor Total Proposals:', proposalCount.toString());

    // 2. Proposal Breakdown
    const stateNames = ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed'];
    const count = Number(proposalCount);
    const sampleIds = [1, Math.floor(count / 2), count - 2, count - 1, count].filter((v, i, a) => v > 0 && a.indexOf(v) === i);

    console.log('\n--- Sampled Proposals ---');
    for (const id of sampleIds) {
      try {
        const p = await client.readContract({
          address: GOVERNOR_ADDRESS,
          abi: govAbi,
          functionName: 'getProposal',
          args: [BigInt(id)]
        });
        const st = await client.readContract({
          address: GOVERNOR_ADDRESS,
          abi: govAbi,
          functionName: 'state',
          args: [BigInt(id)]
        });
        console.log(`Proposal #${id} [${stateNames[st] || st}]: "${p[2]}"`);
        console.log(`  Amount: ${formatUnits(p[13], 6)} USDC | Category: ${p[4]}`);
        console.log(`  Proposer: ${p[1]}`);
        console.log(`  Deliverable URI: ${p[15]}`);
      } catch (err) {
        console.log(`  Error on proposal #${id}: ${err.message}`);
      }
    }

    // 3. Treasury Balances
    const usdcBalance = await client.readContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [TREASURY_ADDRESS]
    });
    console.log('\n--- Treasury State ---');
    console.log('Treasury USDC Balance:', formatUnits(usdcBalance, 6), 'USDC');

    // 4. Governance Token
    const tokenSupply = await client.readContract({
      address: TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: 'totalSupply'
    });
    console.log('sARC Total Supply:', formatUnits(tokenSupply, 18), 'sARC');

  } catch (e) {
    console.error('Query error:', e);
  }
}

main();
