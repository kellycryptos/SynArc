const fs = require('fs');
const dotenv = require('dotenv');
if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });
if (fs.existsSync('.env')) dotenv.config({ path: '.env' });

const { createPublicClient, createWalletClient, http, parseAbi } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { defineChain } = require('viem');

const CANTEEN_RPC = process.env.NEXT_PUBLIC_CANTEEN_TESTNET_RPC || 
  process.env.ARC_TESTNET_RPC_URL || 
  'https://rpc.testnet.arc-node.thecanteenapp.com/v1/swrm_0009d65decffd41513652bd6eea966abc868aaacbbe84897e13c724d8fbf1be2';

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: [CANTEEN_RPC] } },
});

let fKey = (process.env.FAUCET_PRIVATE_KEY || '').trim().replace(/^["']|["']$/g, '');
if (!fKey.startsWith('0x')) fKey = '0x' + fKey;
const faucetAcc = privateKeyToAccount(fKey);

const client = createPublicClient({ chain: arcTestnet, transport: http(CANTEEN_RPC) });
const wallet = createWalletClient({ account: faucetAcc, chain: arcTestnet, transport: http(CANTEEN_RPC) });

const GOV_ADDRESS = '0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e';
const GOV_ABI_6 = parseAbi([
  'function propose(string title, string description, string category, uint256 votingDuration, uint256 treasuryImpactValue, address executionTarget) returns (uint256)',
  'function proposalCount() view returns (uint256)',
  'function castVote(uint256 proposalId, uint8 support) returns (uint256)'
]);

const PROPS = [
  {
    title: 'Proposed by Treasury Agent — FX Rebalance: Acquire EURC Multi-Currency Reserve',
    description: 'AUTONOMOUS AGENT PROPOSAL\nAction: rebalance_eurc\nAmount: 20 USDC\nCategory: TREASURY_REBALANCE\nObjective: Diversify treasury holdings into Circle EURC to hedge currency concentration and enable multi-currency payroll disbursements on Arc Testnet.',
    category: 'TREASURY_REBALANCE',
    votingDuration: 604800n,
    impact: 20000000n,
    target: faucetAcc.address
  },
  {
    title: 'Proposed by Treasury Agent — Risk Reserve Backstop: Establish 25 USDC Emergency Buffer',
    description: 'AUTONOMOUS AGENT PROPOSAL\nAction: emergency_funding\nAmount: 25 USDC\nCategory: TREASURY_REBALANCE\nObjective: Allocate a segregated emergency safety backstop fund within the governance treasury to absorb extreme market volatility on Arc Testnet.',
    category: 'TREASURY_REBALANCE',
    votingDuration: 604800n,
    impact: 25000000n,
    target: faucetAcc.address
  },
  {
    title: 'Proposed by Treasury Agent — Ecosystem Growth: Developer Grant Allocation Round 1',
    description: 'AUTONOMOUS AGENT PROPOSAL\nAction: developer_grants\nAmount: 45 USDC\nCategory: ECOSYSTEM_GROWTH\nObjective: Fund builder incentives and micro-grants for autonomous AI agent development on Arc Testnet.',
    category: 'ECOSYSTEM_GROWTH',
    votingDuration: 604800n,
    impact: 45000000n,
    target: faucetAcc.address
  }
];

async function run() {
  for (const p of PROPS) {
    console.log('\nProposing:', p.title);
    try {
      const hash = await wallet.writeContract({
        address: GOV_ADDRESS,
        abi: GOV_ABI_6,
        functionName: 'propose',
        args: [p.title, p.description, p.category, p.votingDuration, p.impact, p.target],
        gas: 600000n
      });
      console.log('Tx sent:', hash);
      const rc = await client.waitForTransactionReceipt({ hash });
      console.log('Confirmed in block:', rc.blockNumber);
      const newCount = await client.readContract({ address: GOV_ADDRESS, abi: GOV_ABI_6, functionName: 'proposalCount' });
      console.log('New ID:', newCount.toString());
      const vHash = await wallet.writeContract({
        address: GOV_ADDRESS,
        abi: GOV_ABI_6,
        functionName: 'castVote',
        args: [newCount, 1],
        gas: 300000n
      });
      await client.waitForTransactionReceipt({ hash: vHash });
      console.log('Voted FOR on Proposal #', newCount.toString());
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.error('Error on', p.title, ':', e.shortMessage || e.message);
    }
  }
}
run().catch(console.error);
