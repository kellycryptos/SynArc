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

const TESTNET_PROPOSALS = [
  {
    title: 'Proposed by Treasury Agent — Yield Allocation: Deploy 50 USDC to Circle Yield Strategy',
    description: 'AUTONOMOUS AGENT PROPOSAL\nAction: yield_allocation\nAmount: 50 USDC\nCategory: TREASURY_REBALANCE\nObjective: Allocate idle treasury stablecoin reserves into verified Circle yield strategies to earn annualized treasury returns for SynArc DAO on Arc Testnet.',
    category: 'TREASURY_REBALANCE',
    votingDuration: 604800n, // 7 days (Active)
    impact: 50000000n, // 50 USDC
    target: faucetAcc.address,
    voteFor: true
  },
  {
    title: 'Proposed by Treasury Agent — Ecosystem Liquidity Provision: Seed sARC/USDC DEX Pool',
    description: 'AUTONOMOUS AGENT PROPOSAL\nAction: liquidity_provision\nAmount: 40 USDC\nCategory: TREASURY_REBALANCE\nObjective: Deposit liquidity into automated market maker pairs to deepen secondary market depth and minimize slippage for community token holders on Arc Testnet.',
    category: 'TREASURY_REBALANCE',
    votingDuration: 604800n, // 7 days (Active)
    impact: 40000000n, // 40 USDC
    target: faucetAcc.address,
    voteFor: true
  },
  {
    title: 'Proposed by Treasury Agent — AI Security Mesh: Deploy Forensic Sentinel Node',
    description: 'AUTONOMOUS AGENT PROPOSAL\nAction: forensic_audit\nAmount: 30 USDC\nCategory: GOVERNANCE_UPGRADE\nObjective: Fund autonomous compute infrastructure for real-time mempool scanning and dual-agent adversarial transaction simulation.',
    category: 'TREASURY_REBALANCE',
    votingDuration: 604800n, // 7 days (Active)
    impact: 30000000n, // 30 USDC
    target: faucetAcc.address,
    voteFor: true
  },
  {
    title: 'Proposed by Treasury Agent — FX Rebalance: Acquire EURC Multi-Currency Reserve',
    description: 'AUTONOMOUS AGENT PROPOSAL\nAction: rebalance_eurc\nAmount: 20 USDC\nCategory: TREASURY_REBALANCE\nObjective: Diversify treasury holdings into Circle EURC to hedge currency concentration and enable multi-currency payroll disbursements on Arc Testnet.',
    category: 'TREASURY_REBALANCE',
    votingDuration: 604800n, // 7 days (Active)
    impact: 20000000n, // 20 USDC
    target: faucetAcc.address,
    voteFor: true
  },
  {
    title: 'Proposed by Treasury Agent — Risk Reserve Backstop: Establish 25 USDC Emergency Buffer',
    description: 'AUTONOMOUS AGENT PROPOSAL\nAction: emergency_funding\nAmount: 25 USDC\nCategory: TREASURY_REBALANCE\nObjective: Allocate a segregated emergency safety backstop fund within the governance treasury to absorb extreme market volatility on Arc Testnet.',
    category: 'TREASURY_REBALANCE',
    votingDuration: 604800n, // 7 days (Active)
    impact: 25000000n, // 25 USDC
    target: faucetAcc.address,
    voteFor: true
  }
];

async function main() {
  console.log('Using faucet account:', faucetAcc.address);
  const countBefore = await client.readContract({ address: GOV_ADDRESS, abi: GOV_ABI_6, functionName: 'proposalCount' });
  console.log('Current proposalCount:', countBefore.toString());

  const posted = [];
  for (const p of TESTNET_PROPOSALS) {
    console.log(`\nSubmitting: "${p.title}"...`);
    try {
      const hash = await wallet.writeContract({
        address: GOV_ADDRESS,
        abi: GOV_ABI_6,
        functionName: 'propose',
        args: [
          p.title,
          p.description,
          p.category,
          p.votingDuration,
          p.impact,
          p.target
        ]
      });
      console.log('Tx sent:', hash);
      const receipt = await client.waitForTransactionReceipt({ hash });
      console.log(`Confirmed in block ${receipt.blockNumber}`);
      
      const newCount = await client.readContract({ address: GOV_ADDRESS, abi: GOV_ABI_6, functionName: 'proposalCount' });
      const newPropId = Number(newCount);
      console.log(`New Proposal ID: ${newPropId}`);

      if (p.voteFor) {
        console.log(`Casting FOR vote on Proposal #${newPropId}...`);
        try {
          const vHash = await wallet.writeContract({
            address: GOV_ADDRESS,
            abi: GOV_ABI_6,
            functionName: 'castVote',
            args: [BigInt(newPropId), 1] // 1 = For
          });
          await client.waitForTransactionReceipt({ hash: vHash });
          console.log(`Vote confirmed! Tx: ${vHash}`);
        } catch (vErr) {
          console.warn('Vote failed or not required:', vErr.shortMessage || vErr.message);
        }
      }

      posted.push({
        id: `SIP-${newPropId}`,
        rawId: newPropId,
        title: p.title,
        description: p.description,
        category: p.category,
        txHash: hash
      });
    } catch (err) {
      console.error('Failed to submit proposal:', err.shortMessage || err.message);
    }
  }

  console.log('\nAll posted proposals:', JSON.stringify(posted, null, 2));
  fs.writeFileSync('agent_proposals_testnet.json', JSON.stringify(posted, null, 2));
}

main().catch(console.error);
