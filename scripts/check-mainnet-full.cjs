const { createPublicClient, http, parseAbi, formatUnits } = require('viem');

const client = createPublicClient({
  transport: http('https://rpc.mainnet.arc.io', { timeout: 20000 })
});

const TREASURY_ADDRESS = '0x8205e9782Fe54fD2aaD895b436B695db169F3d7B';
const GOVERNOR_ADDRESS = '0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025';
const TOKEN_ADDRESS = '0x8f4b429794ABa4607d177b100Cc5e481D22d0ad4';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const EURC_ADDRESS = '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1';
const CIRBTC_ADDRESS = '0x171A4217b86A807A64eB94757Db6849fb4bDbAA0';
const DEPLOYER_ADDRESS = '0xE819090D7810D89f2E86e167d0b58425dEd745D8';

const ESCROW_CONTRACTS = [
  { id: 'camp-main-001', name: 'Aura Synth Lab', address: '0x99955b487aE5519a2b1Ff677f9bed3A6145b750d' },
  { id: 'camp-main-002', name: 'ArcShield AI Sentinel', address: '0x2518d845C9d23AE52650f35C4E4E187BFD797f6B' },
  { id: 'camp-main-003', name: 'PixelVerse RPG', address: '0xC6BE1BCE9ADcad9d97a302D652839F399a699460' },
  { id: 'camp-main-004', name: 'Krypton Protocol Research', address: '0xd1e4F8dfBD1e7eC75Fa58561909706af223c5e34' },
  { id: 'camp-main-005', name: 'Veritas On-Chain Journal', address: '0x8eC5c246E976b512D7c157714e464D1A38CD59B6' },
  { id: 'camp-main-006', name: 'Solstice Generative Art', address: '0x11Ae69867785C36ADAcc40D383cd5f19d6288432' },
  { id: 'camp-main-007', name: 'Vanguard Liquidity Optimizer', address: '0x55bA23c48e3c5bE2A36a93A9124C3f7Cacac6B81' },
  { id: 'camp-main-008', name: 'Nexus SubDAO Creator Hub', address: '0x5821ACB8CD8601cCd3861dD66f459Cd9f0027Dd2' },
  { id: 'camp-main-009', name: 'Hyperion Motion Graphics', address: '0xC566D6E70e76886f2aB253f165E6Bd4A69145025' },
  { id: 'camp-main-010', name: 'Zenith Eco-Track AI Agent', address: '0x3b56457A3f647CDf04Db064BD6f1Da9e883C185c' },
];

const treasuryAbi = parseAbi([
  'function getTransactions() external view returns ((string txType, address party, uint256 amount, string tokenSymbol, string description, uint256 timestamp, string deliverableURI)[])',
  'function paused() external view returns (bool)',
  'function agentAddress() external view returns (address)',
  'function humanReviewThreshold() external view returns (uint256)',
  'function payeeChangeCooldown() external view returns (uint256)'
]);

const erc20Abi = parseAbi([
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)'
]);

const govAbi = parseAbi([
  'function proposalCount() external view returns (uint256)',
  'function state(uint256 proposalId) external view returns (uint8)',
  'function getProposal(uint256 proposalId) external view returns (uint256 id, address proposer, string title, string description, string category, uint256 votingDuration, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed, uint256 treasuryImpactValue, address executionTarget, string deliverableURI)'
]);

const crowdfundAbi = parseAbi([
  'function creator() external view returns (address)',
  'function goal() external view returns (uint256)',
  'function totalRaised() external view returns (uint256)',
  'function totalContributors() external view returns (uint256)'
]);

async function run() {
  console.log('===============================================================');
  console.log('            SYN DAO — ARC MAINNET TRACTION REPORT              ');
  console.log('===============================================================');
  
  const block = await client.getBlockNumber();
  const deployerNonce = await client.getTransactionCount({ address: DEPLOYER_ADDRESS });
  console.log(`Arc Mainnet Current Block : ${block.toString()}`);
  console.log(`Deployer Total On-Chain Tx: ${deployerNonce}`);
  console.log(`DeFiLlama Profile         : https://defillama.com/protocol/syn-dao`);
  console.log(`Circle Alliance Directory : https://partners.circle.com/partner/syn-dao`);

  // 1. Treasury Configuration and State
  try {
    const isPaused = await client.readContract({ address: TREASURY_ADDRESS, abi: treasuryAbi, functionName: 'paused' });
    const agent = await client.readContract({ address: TREASURY_ADDRESS, abi: treasuryAbi, functionName: 'agentAddress' });
    const cap = await client.readContract({ address: TREASURY_ADDRESS, abi: treasuryAbi, functionName: 'humanReviewThreshold' });
    const cooldown = await client.readContract({ address: TREASURY_ADDRESS, abi: treasuryAbi, functionName: 'payeeChangeCooldown' });
    console.log('\n--- Central Treasury State & Safety Parameters ---');
    console.log(`Contract Address     : ${TREASURY_ADDRESS}`);
    console.log(`Status               : ${isPaused ? 'PAUSED' : 'ACTIVE'}`);
    console.log(`Operating Agent      : ${agent}`);
    console.log(`Agent Release Cap    : ${formatUnits(cap, 6)} USDC (Autonomous ≤ 50 USDC, > 50 USDC Multisig)`);
    console.log(`Payee Cooldown Period: ${cooldown.toString()} seconds (${Number(cooldown)/3600} hours)`);
  } catch (e) {
    console.log('Treasury params read error:', e.message);
  }

  // 2. Balances in Treasury
  console.log('\n--- Central Treasury Multi-Token Holdings ---');
  for (const [sym, addr, dec] of [['USDC', USDC_ADDRESS, 6], ['EURC', EURC_ADDRESS, 6], ['cirBTC', CIRBTC_ADDRESS, 8]]) {
    try {
      const b = await client.readContract({ address: addr, abi: erc20Abi, functionName: 'balanceOf', args: [TREASURY_ADDRESS] });
      console.log(`${sym.padEnd(8)}: ${formatUnits(b, dec)} ${sym}`);
    } catch (e) {
      console.log(`${sym} Balance error:`, e.message);
    }
  }
  const sArcSupply = await client.readContract({ address: TOKEN_ADDRESS, abi: erc20Abi, functionName: 'totalSupply' });
  console.log(`sARC Supply: ${formatUnits(sArcSupply, 18)} sARC`);

  // 3. Treasury On-Chain Ledger
  console.log('\n--- Treasury Three-Way Match On-Chain Ledger ---');
  try {
    const txs = await client.readContract({ address: TREASURY_ADDRESS, abi: treasuryAbi, functionName: 'getTransactions' });
    console.log(`Total On-Chain Settlements / Records: ${txs.length}`);
    for (let i = 0; i < txs.length; i++) {
      const t = txs[i];
      const dateStr = new Date(Number(t.timestamp) * 1000).toISOString().split('T')[0];
      console.log(`  [#${i + 1}] ${t.txType.padEnd(7)} | ${formatUnits(t.amount, 6).padStart(5)} ${t.tokenSymbol} | Date: ${dateStr} | ${t.description}`);
      if (t.deliverableURI) console.log(`        └ Deliverable CID: ${t.deliverableURI}`);
    }
  } catch (e) {
    console.log('Ledger read error:', e.message);
  }

  // 4. Governor Proposal Traction
  console.log('\n--- SynArcGovernor On-Chain Governance ---');
  try {
    const pCount = await client.readContract({ address: GOVERNOR_ADDRESS, abi: govAbi, functionName: 'proposalCount' });
    const count = Number(pCount);
    console.log(`Total Proposals Created: ${count}`);
    
    // Sample state stats for the latest 30 proposals
    const stateNames = ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed'];
    const sampleSize = Math.min(count, 30);
    const states = {};
    for (let id = count - sampleSize + 1; id <= count; id++) {
      try {
        const s = await client.readContract({ address: GOVERNOR_ADDRESS, abi: govAbi, functionName: 'state', args: [BigInt(id)] });
        const name = stateNames[s] || `State_${s}`;
        states[name] = (states[name] || 0) + 1;
      } catch (err) {}
    }
    console.log(`Recent ${sampleSize} Proposals Distribution:`, states);
  } catch (e) {
    console.log('Governor read error:', e.message);
  }

  // 5. Creator DAO Escrow Contracts
  console.log('\n--- Verified Creator DAO Escrow Contracts (10 Deployed) ---');
  let totalEscrowUsdc = 0n;
  for (const esc of ESCROW_CONTRACTS) {
    try {
      const usdcBal = await client.readContract({ address: USDC_ADDRESS, abi: erc20Abi, functionName: 'balanceOf', args: [esc.address] });
      totalEscrowUsdc += usdcBal;
      const raised = await client.readContract({ address: esc.address, abi: crowdfundAbi, functionName: 'totalRaised' });
      const goal = await client.readContract({ address: esc.address, abi: crowdfundAbi, functionName: 'goal' });
      console.log(`  • ${esc.name.padEnd(28)} | Goal: ${formatUnits(goal, 6).padStart(5)} USDC | Raised: ${formatUnits(raised, 6)} USDC | Escrow: ${esc.address}`);
    } catch (e) {
      console.log(`  • ${esc.name} error:`, e.message);
    }
  }
  console.log(`Total Escrow USDC TVL: ${formatUnits(totalEscrowUsdc, 6)} USDC`);
  console.log('===============================================================\n');
}

run().catch(console.error);
