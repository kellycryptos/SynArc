const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });
if (fs.existsSync('.env')) dotenv.config({ path: '.env' });

const {
  createWalletClient,
  createPublicClient,
  http,
  formatEther,
  parseAbi
} = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { defineChain } = require('viem');

const arcMainnetChain = defineChain({
  id: 5042,
  name: 'Arc',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mainnet.arc.io'] } },
});

const GOVERNOR_ABI = parseAbi([
  'function propose(string title, string description, string category, uint256 votingDuration, uint256 treasuryImpactValue, address executionTarget, string deliverableURI) returns (uint256)',
  'function proposalCount() view returns (uint256)',
  'function getProposal(uint256) view returns (uint256, address, string, string, string, uint256, uint256, uint256, uint256, uint256, uint256, bool, bool, uint256, address, string)'
]);

const PROPOSALS = [
  {
    action: 'yield_allocation',
    title: 'Proposed by Treasury Agent — Yield Allocation: Deploy 50 USDC to Circle Yield Strategy',
    description: 'AUTONOMOUS AGENT PROPOSAL\nAction: yield_allocation\nAmount: 50 USDC\nCategory: TREASURY_REBALANCE\nObjective: Allocate idle treasury stablecoin reserves into verified Circle yield strategies to earn annualized treasury returns for SynArc DAO.',
    category: 'TREASURY_REBALANCE',
    impactUSDC: 50,
  },
  {
    action: 'bridge_to_ethereum',
    title: 'Proposed by Treasury Agent — Bridge 35 USDC to Ethereum Mainnet via CCTP',
    description: 'AUTONOMOUS AGENT PROPOSAL\nAction: bridge_to_ethereum\nAmount: 35 USDC\nCategory: TREASURY_REBALANCE\nObjective: Execute cross-chain liquidity rebalancing to maintain operational reserves on Ethereum Mainnet via native Circle CCTP mint-and-burn attestation.',
    category: 'TREASURY_REBALANCE',
    impactUSDC: 35,
  },
  {
    action: 'liquidity_provision',
    title: 'Proposed by Treasury Agent — Ecosystem Liquidity Provision: Seed sARC/USDC DEX Pool',
    description: 'AUTONOMOUS AGENT PROPOSAL\nAction: liquidity_provision\nAmount: 40 USDC\nCategory: TREASURY_REBALANCE\nObjective: Deposit liquidity into automated market maker pairs to deepen secondary market depth and minimize slippage for community token holders.',
    category: 'TREASURY_REBALANCE',
    impactUSDC: 40,
  },
  {
    action: 'emergency_funding',
    title: 'Proposed by Treasury Agent — Risk Reserve Backstop: Establish 25 USDC Emergency Buffer',
    description: 'AUTONOMOUS AGENT PROPOSAL\nAction: emergency_funding\nAmount: 25 USDC\nCategory: TREASURY_REBALANCE\nObjective: Allocate a segregated emergency safety backstop fund within the governance treasury to absorb extreme market volatility.',
    category: 'TREASURY_REBALANCE',
    impactUSDC: 25,
  },
  {
    action: 'forensic_audit',
    title: 'Proposed by Treasury Agent — AI Security Mesh: Deploy Forensic Sentinel Node',
    description: 'AUTONOMOUS AGENT PROPOSAL\nAction: forensic_audit\nAmount: 30 USDC\nCategory: GOVERNANCE_UPGRADE\nObjective: Fund autonomous compute infrastructure for real-time mempool scanning and dual-agent adversarial transaction simulation.',
    category: 'TREASURY_REBALANCE',
    impactUSDC: 30,
  },
  {
    action: 'rebalance_eurc',
    title: 'Proposed by Treasury Agent — FX Rebalance: Acquire EURC Multi-Currency Reserve',
    description: 'AUTONOMOUS AGENT PROPOSAL\nAction: rebalance_eurc\nAmount: 20 USDC\nCategory: TREASURY_REBALANCE\nObjective: Diversify treasury holdings into Circle EURC to hedge currency concentration and enable multi-currency payroll disbursements.',
    category: 'TREASURY_REBALANCE',
    impactUSDC: 20,
  },
  {
    action: 'developer_grants',
    title: 'Proposed by Treasury Agent — Ecosystem Growth: Developer Grant Allocation Round 1',
    description: 'AUTONOMOUS AGENT PROPOSAL\nAction: developer_grants\nAmount: 45 USDC\nCategory: ECOSYSTEM_GROWTH\nObjective: Fund builder incentives and micro-grants for autonomous AI agent development on Arc Network.',
    category: 'TREASURY_REBALANCE',
    impactUSDC: 45,
  },
  {
    action: 'return_funds',
    title: 'Proposed by Treasury Agent — Reverse Bridge: Return 42.50 USDC from Sepolia via CCTP',
    description: 'AUTONOMOUS AGENT PROPOSAL\nAction: return_funds\nAmount: 42.5 USDC\nCategory: TREASURY_REBALANCE\nObjective: Trigger reverse Circle CCTP burn on foreign domain to repatriate bridged capital back into primary SynArc Governance Treasury.',
    category: 'TREASURY_REBALANCE',
    impactUSDC: 42,
  },
  {
    action: 'oracle_integration',
    title: 'Proposed by Treasury Agent — Infrastructure: Subsidize On-Chain Oracle Feeds',
    description: 'AUTONOMOUS AGENT PROPOSAL\nAction: oracle_integration\nAmount: 15 USDC\nCategory: PROTOCOL_INFRASTRUCTURE\nObjective: Finance real-time price feed and attestation data subscriptions powering automated treasury rebalancing algorithms.',
    category: 'TREASURY_REBALANCE',
    impactUSDC: 15,
  },
  {
    action: 'staking_rewards',
    title: 'Proposed by Treasury Agent — Community Rewards: Top Up Staking Emission Pool',
    description: 'AUTONOMOUS AGENT PROPOSAL\nAction: staking_rewards\nAmount: 50 USDC\nCategory: STAKING_INCENTIVES\nObjective: Replenish sARC staking pool yield emissions to incentivize long-term governance locking and voter participation.',
    category: 'TREASURY_REBALANCE',
    impactUSDC: 50,
  }
];

async function main() {
  const rawKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.AGENT_PRIVATE_KEY;
  if (!rawKey) throw new Error('Missing deployer private key');

  const account = privateKeyToAccount(rawKey.startsWith('0x') ? rawKey : '0x' + rawKey);
  console.log('Agent Account:', account.address);

  const client = createPublicClient({
    chain: arcMainnetChain,
    transport: http('https://rpc.mainnet.arc.io')
  });

  const wallet = createWalletClient({
    account,
    chain: arcMainnetChain,
    transport: http('https://rpc.mainnet.arc.io')
  });

  const govAddress = '0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025';
  const deliverableURI = 'ipfs://QmPgvwkpDNgHSTx3V7NrLwCrQbppN39Zpji6o3TwbtVuiU';
  const votingDuration = 604800n; // 7 days

  let initialBal = await client.getBalance({ address: account.address });
  console.log('Agent Initial Gas Balance:', formatEther(initialBal), 'USDC\n');

  const actionsDbPath = path.join(process.cwd(), 'data/agent-actions.json');
  let actionsDb = [];
  if (fs.existsSync(actionsDbPath)) {
    try {
      actionsDb = JSON.parse(fs.readFileSync(actionsDbPath, 'utf8'));
    } catch (e) {
      actionsDb = [];
    }
  }

  const existingCount = await client.readContract({
    address: govAddress,
    abi: GOVERNOR_ABI,
    functionName: 'proposalCount'
  });
  console.log(`Current on-chain proposal count: ${existingCount}`);
  const existingTitles = new Set();
  for (let c = 1; c <= Number(existingCount); c++) {
    const pData = await client.readContract({
      address: govAddress,
      abi: GOVERNOR_ABI,
      functionName: 'getProposal',
      args: [BigInt(c)]
    });
    existingTitles.add(pData[2]);
  }

  const results = [];
  let successful = 0;

  for (let i = 0; i < PROPOSALS.length; i++) {
    const p = PROPOSALS[i];
    if (existingTitles.has(p.title)) {
      console.log(`[SKIP] Proposal "${p.title}" already exists on-chain.`);
      continue;
    }
    const currentGas = await client.getBalance({ address: account.address });
    console.log(`[${i + 1}/${PROPOSALS.length}] Gas remaining: ${formatEther(currentGas)} USDC`);

    if (currentGas < 12000000000000000n) { // < ~0.012 USDC
      console.warn(`[WARNING] Gas balance too low (${formatEther(currentGas)} USDC) to safely broadcast "${p.title}". Needs funding.`);
      break;
    }

    try {
      console.log(`  Proposing: "${p.title}"...`);
      const impactWei = BigInt(Math.floor(p.impactUSDC * 1_000_000));

      const hash = await wallet.writeContract({
        address: govAddress,
        abi: GOVERNOR_ABI,
        functionName: 'propose',
        args: [
          p.title,
          p.description,
          p.category,
          votingDuration,
          impactWei,
          account.address,
          deliverableURI
        ]
      });

      console.log(`  Tx sent: ${hash}. Awaiting confirmation...`);
      const receipt = await client.waitForTransactionReceipt({ hash, timeout: 60000 });
      console.log(`  Confirmed in block ${receipt.blockNumber}! Gas used: ${receipt.gasUsed}`);

      const proposalCount = await client.readContract({
        address: govAddress,
        abi: GOVERNOR_ABI,
        functionName: 'proposalCount'
      });

      const proposalId = `SIP-${proposalCount.toString()}`;
      console.log(`  Assigned on-chain ID: ${proposalId}\n`);

      // Log action
      const actionRecord = {
        timestamp: new Date().toISOString(),
        action: p.action,
        reasoning: `${p.description.split('\n')[0]} On-chain Governance ${proposalId} submitted.`,
        txHash: hash,
        status: 'executed',
        usdcAmount: p.impactUSDC,
        proposalId
      };
      actionsDb.unshift(actionRecord);
      if (actionsDb.length > 50) actionsDb.pop();
      fs.writeFileSync(actionsDbPath, JSON.stringify(actionsDb, null, 2), 'utf8');

      results.push({
        proposalId,
        title: p.title,
        category: p.category,
        amount: p.impactUSDC,
        txHash: hash,
        block: Number(receipt.blockNumber)
      });
      successful++;

      // Brief wait between transactions
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  Error creating proposal #${i + 1}:`, err.message || err);
      break;
    }
  }

  const finalBal = await client.getBalance({ address: account.address });
  console.log('\n====================================');
  console.log(`       SUMMARY: ${successful}/${PROPOSALS.length} POSTED`);
  console.log('====================================');
  console.log('Agent Remaining Gas:', formatEther(finalBal), 'USDC');
  console.log('Proposals summary:');
  console.table(results);

  fs.writeFileSync('agent_proposals_mainnet.json', JSON.stringify(results, null, 2));
}

main().catch(console.error);
