const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });
if (fs.existsSync('.env')) dotenv.config({ path: '.env' });

const {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  formatUnits,
  parseAbi
} = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { defineChain } = require('viem');

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.io'] } },
});

let fKey = (process.env.FAUCET_PRIVATE_KEY || '').trim();
if (fKey.startsWith('"') || fKey.startsWith("'")) fKey = fKey.slice(1, -1);
if (!fKey.startsWith('0x')) fKey = '0x' + fKey;
const faucetAcc = privateKeyToAccount(fKey);

let depKey = (process.env.DEPLOYER_PRIVATE_KEY || '').trim();
if (depKey.startsWith('"') || depKey.startsWith("'")) depKey = depKey.slice(1, -1);
if (!depKey.startsWith('0x')) depKey = '0x' + depKey;
const depAcc = privateKeyToAccount(depKey);

const client = createPublicClient({ chain: arcTestnet, transport: http() });
const faucetWallet = createWalletClient({ account: faucetAcc, chain: arcTestnet, transport: http() });

const GOV_ADDRESS = '0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e';
const TREASURY_ADDRESS = '0xFE0F6bF45D363d34CD5fC1781594a7471736dC18';
const TOKEN_ADDRESS = '0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e';

const GOV_ABI = parseAbi([
  'function propose(string title, string description, string category, uint256 votingDuration, uint256 treasuryImpactValue, address executionTarget) returns (uint256)',
  'function castVote(uint256 proposalId, uint8 support) returns (uint256)',
  'function execute(uint256 proposalId) payable',
  'function state(uint256 proposalId) view returns (uint8)',
  'function proposalCount() view returns (uint256)',
  'function executionDelay() view returns (uint256)'
]);

const STATE_NAMES = ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed'];

async function main() {
  console.log('=== TESTNET END-TO-END FLOW: PROPOSE -> VOTE -> PASS -> EXECUTE PAYOUT ===\n');
  console.log('Faucet Address (Voter & Owner):', faucetAcc.address);
  console.log('Contractor Address (Recipient):', depAcc.address);

  const faucetBal = await client.getBalance({ address: faucetAcc.address });
  const depBal = await client.getBalance({ address: depAcc.address });
  console.log(`Faucet USDC Balance: ${formatEther(faucetBal)}`);
  console.log(`Contractor USDC Balance before: ${formatEther(depBal)}`);

  // Ensure contractor has a tiny amount of gas if needed, or if recipient balance is checked
  const currentCount = await client.readContract({
    address: GOV_ADDRESS,
    abi: GOV_ABI,
    functionName: 'proposalCount'
  });
  console.log(`Current Governor proposal count: ${currentCount}`);

  // Step 1: Submit Contractor Proposal with reasonable voting duration (60s)
  const votingDuration = 60n; // 60 seconds
  const impactValue = 10000n; // 0.01 USDC (6 decimals)
  const deliverableURI = 'ipfs://QmPgvwkpDNgHSTx3V7NrLwCrQbppN39Zpji6o3TwbtVuiU';

  console.log('\nStep 1: Submitting Contractor Proposal to Governor...');
  const proposeTx = await faucetWallet.writeContract({
    address: GOV_ADDRESS,
    abi: GOV_ABI,
    functionName: 'propose',
    args: [
      'Contractor Payout: Security Sentinel & Agent Stack Infrastructure Milestone',
      'Payout 0.01 USDC for contractor deliverable verification and Sentinel node deployment.',
      'CONTRACTOR_PAYOUT',
      votingDuration,
      impactValue,
      depAcc.address
    ]
  });
  console.log(`Propose Tx submitted: ${proposeTx}`);
  const proposeReceipt = await client.waitForTransactionReceipt({ hash: proposeTx });
  console.log(`Confirmed in block ${proposeReceipt.blockNumber}!`);

  const newCount = await client.readContract({
    address: GOV_ADDRESS,
    abi: GOV_ABI,
    functionName: 'proposalCount'
  });
  const propId = newCount;
  console.log(`\nProposal Created! Assigned ID: #${propId}`);

  // Step 2: Cast Vote
  console.log('\nStep 2: Casting Vote "For" (support=1) with 14.8M sARC votes...');
  const voteTx = await faucetWallet.writeContract({
    address: GOV_ADDRESS,
    abi: GOV_ABI,
    functionName: 'castVote',
    args: [propId, 1] // 1 = For
  });
  console.log(`Vote Tx: ${voteTx}`);
  await client.waitForTransactionReceipt({ hash: voteTx });
  console.log('Vote confirmed on-chain!');

  // Step 3: Wait for voting period (60 seconds) to end
  console.log('\nStep 3: Waiting for voting period to close...');
  let currentState = await client.readContract({
    address: GOV_ADDRESS,
    abi: GOV_ABI,
    functionName: 'state',
    args: [propId]
  });
  console.log(`Current State: ${STATE_NAMES[currentState]} (${currentState})`);

  let waitCycles = 0;
  while (currentState === 1 && waitCycles < 20) { // while Active
    await new Promise(r => setTimeout(r, 5000));
    currentState = await client.readContract({
      address: GOV_ADDRESS,
      abi: GOV_ABI,
      functionName: 'state',
      args: [propId]
    });
    console.log(`Waited ${(waitCycles + 1) * 5}s -> State: ${STATE_NAMES[currentState]} (${currentState})`);
    waitCycles++;
  }

  // Step 4: Wait for executionDelay (60 seconds) if Queued
  if (currentState === 5) { // Queued
    console.log('\nStep 4: Waiting for timelock executionDelay (60 seconds)...');
    let attempts = 0;
    while (currentState === 5 && attempts < 20) {
      await new Promise(r => setTimeout(r, 5000));
      currentState = await client.readContract({
        address: GOV_ADDRESS,
        abi: GOV_ABI,
        functionName: 'state',
        args: [propId]
      });
      console.log(`Time elapsed: ${(attempts + 1) * 5}s -> State: ${STATE_NAMES[currentState]} (${currentState})`);
      attempts++;
    }
  }

  // Step 5: Execute proposal payout
  if (currentState === 4) { // Succeeded
    console.log('\nStep 5: Executing Proposal Payout on Governor...');
    const execTx = await faucetWallet.writeContract({
      address: GOV_ADDRESS,
      abi: GOV_ABI,
      functionName: 'execute',
      args: [propId]
    });
    console.log(`Execution Tx submitted: ${execTx}`);
    const execReceipt = await client.waitForTransactionReceipt({ hash: execTx });
    console.log(`Executed successfully in block ${execReceipt.blockNumber}!`);

    const finalState = await client.readContract({
      address: GOV_ADDRESS,
      abi: GOV_ABI,
      functionName: 'state',
      args: [propId]
    });
    console.log(`Final Proposal #${propId} State: ${STATE_NAMES[finalState]}`);

    const depBalAfter = await client.getBalance({ address: depAcc.address });
    console.log(`\nContractor USDC Balance after: ${formatEther(depBalAfter)}`);
    console.log('✅ TESTNET COMPLETE FLOW SUCCESSFUL!');
    console.log(`Explorer link: https://testnet.arcscan.app/tx/${execTx}`);
  } else {
    console.log(`Could not execute proposal in state: ${STATE_NAMES[currentState]}`);
  }
}

main().catch(console.error);
