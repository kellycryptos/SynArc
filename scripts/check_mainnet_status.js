const fs = require('fs');
const dotenv = require('dotenv');
const { createPublicClient, http, formatEther, formatUnits, parseAbi } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { defineChain } = require('viem');

if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });
if (fs.existsSync('.env')) dotenv.config({ path: '.env' });

const arcMainnet = defineChain({
  id: 5042,
  name: 'Arc',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mainnet.arc.io'] } },
});

let key = (process.env.AGENT_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY || '').trim();
if (key.startsWith('"') || key.startsWith("'")) key = key.slice(1, -1);
if (!key.startsWith('0x')) key = '0x' + key;

const acc = privateKeyToAccount(key);
console.log('Deployer/Agent Wallet Address:', acc.address);

const client = createPublicClient({
  chain: arcMainnet,
  transport: http('https://rpc.mainnet.arc.io')
});

const GOV_ADDRESS = '0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025';
const TREASURY_ADDRESS = '0x8205e9782Fe54fD2aaD895b436B695db169F3d7B';
const TOKEN_ADDRESS = '0x8f4b429794ABa4607d177b100Cc5e481D22d0ad4';

const TREASURY_ABI = parseAbi([
  'function usdcBalance() view returns (uint256)',
  'function agentReleaseCap() view returns (uint256)',
  'function humanReviewThreshold() view returns (uint256)',
  'function isAuthorizedAgent(address) view returns (bool)',
  'function isAuthorizedReviewer(address) view returns (bool)',
]);

const GOV_ABI = parseAbi([
  'function proposalCount() view returns (uint256)',
]);

async function check() {
  const balance = await client.getBalance({ address: acc.address });
  console.log('Deployer/Agent Native Balance on Arc Mainnet:', formatEther(balance), 'USDC');

  const treasuryBalance = await client.getBalance({ address: TREASURY_ADDRESS });
  console.log('Treasury Native Balance on Arc Mainnet:', formatEther(treasuryBalance), 'USDC');

  try {
    const trUsdc = await client.readContract({
      address: TREASURY_ADDRESS,
      abi: TREASURY_ABI,
      functionName: 'usdcBalance'
    });
    console.log('Treasury Tracked USDC Balance:', formatUnits(trUsdc, 6), 'USDC');
  } catch (e) {
    console.log('Could not read treasury usdcBalance:', e.message);
  }

  try {
    const pCount = await client.readContract({
      address: GOV_ADDRESS,
      abi: GOV_ABI,
      functionName: 'proposalCount'
    });
    console.log('Mainnet Governor Proposal Count:', pCount.toString());
  } catch (e) {
    console.log('Could not read proposalCount:', e.message);
  }

  try {
    const isAg = await client.readContract({
      address: TREASURY_ADDRESS,
      abi: TREASURY_ABI,
      functionName: 'isAuthorizedAgent',
      args: [acc.address]
    });
    console.log(`Is ${acc.address} an authorized agent on Treasury?`, isAg);
  } catch (e) {
    console.log('Could not check isAuthorizedAgent:', e.message);
  }
}

check().catch(console.error);
