const { createPublicClient, http, formatEther, parseAbi } = require('viem');
const { defineChain } = require('viem');

const arcMainnetChain = defineChain({
  id: 5042,
  name: 'Arc',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mainnet.arc.io'] } },
});

const client = createPublicClient({ chain: arcMainnetChain, transport: http('https://rpc.mainnet.arc.io') });
const GOVERNOR_ABI = parseAbi([
  'function proposalCount() view returns (uint256)',
  'function getProposal(uint256) view returns (uint256, address, string, string, string, uint256, uint256, uint256, uint256, uint256, uint256, bool, bool, uint256, address, string)'
]);

async function run() {
  const deployer = '0xE819090D7810D89f2E86e167d0b58425dEd745D8';
  const user = '0x1BDA1797E1839861C1CF539359246e2bb77c8E53';
  const depBal = await client.getBalance({ address: deployer });
  const userBal = await client.getBalance({ address: user });
  console.log('Deployer Gas Balance:', formatEther(depBal), 'USDC');
  console.log('User Gas Balance:', formatEther(userBal), 'USDC');

  const count = await client.readContract({
    address: '0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025',
    abi: GOVERNOR_ABI,
    functionName: 'proposalCount'
  });
  console.log('\nTotal Proposals on Governor:', count.toString());

  for (let i = 1; i <= Number(count); i++) {
    const p = await client.readContract({
      address: '0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025',
      abi: GOVERNOR_ABI,
      functionName: 'getProposal',
      args: [BigInt(i)]
    });
    console.log(`[SIP-${i}] Title: ${p[2]}`);
    console.log(`         Category: ${p[4]}`);
    console.log(`         Proposer: ${p[1]}`);
  }
}

run().catch(console.error);
