const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });
if (fs.existsSync('.env')) dotenv.config({ path: '.env' });

const { createPublicClient, http, formatEther, formatUnits, parseAbi } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { defineChain } = require('viem');

const arcMainnet = defineChain({
  id: 5042,
  name: 'Arc',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mainnet.arc.io'] } },
});

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.io'] } },
});

function cleanKey(k) {
  if (!k) return null;
  let s = k.trim().replace(/^['"]|['"]$/g, '');
  if (!s.startsWith('0x')) s = '0x' + s;
  return s.length === 66 ? s : null;
}

const depKey = cleanKey(process.env.DEPLOYER_PRIVATE_KEY);
const agentKey = cleanKey(process.env.AGENT_PRIVATE_KEY);

const depAcc = depKey ? privateKeyToAccount(depKey) : null;
const agentAcc = agentKey ? privateKeyToAccount(agentKey) : null;

const TREASURY_ABI = parseAbi([
  'function owner() view returns (address)',
  'function governor() view returns (address)',
  'function agentAddress() view returns (address)',
  'function usdcBalance() view returns (uint256)',
  'function usdcToken() view returns (address)',
  'function agentReleaseCap() view returns (uint256)'
]);

const TOKEN_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function getVotes(address) view returns (uint256)',
  'function delegates(address) view returns (address)'
]);

async function main() {
  console.log('Deployer Address:', depAcc.address);
  console.log('Agent Address:', agentAcc.address);

  const mClient = createPublicClient({ chain: arcMainnet, transport: http() });
  const tClient = createPublicClient({ chain: arcTestnet, transport: http() });

  console.log('\n--- Arc Mainnet ---');
  const mDepBal = await mClient.getBalance({ address: depAcc.address });
  const mAgentBal = await mClient.getBalance({ address: agentAcc.address });
  console.log('Deployer Native USDC:', formatEther(mDepBal));
  console.log('Agent Native USDC:', formatEther(mAgentBal));

  const mTreasury = '0x8205e9782Fe54fD2aaD895b436B695db169F3d7B';
  const mOwner = await mClient.readContract({ address: mTreasury, abi: TREASURY_ABI, functionName: 'owner' });
  console.log('Mainnet Treasury Owner:', mOwner, '(Matches Deployer:', mOwner.toLowerCase() === depAcc.address.toLowerCase(), ')');
  const mCap = await mClient.readContract({ address: mTreasury, abi: TREASURY_ABI, functionName: 'agentReleaseCap' });
  console.log('Mainnet Agent Release Cap:', formatUnits(mCap, 6), 'USDC');

  const mToken = '0x8f4b429794ABa4607d177b100Cc5e481D22d0ad4';
  const mDepTokens = await mClient.readContract({ address: mToken, abi: TOKEN_ABI, functionName: 'balanceOf', args: [depAcc.address] });
  const mDepVotes = await mClient.readContract({ address: mToken, abi: TOKEN_ABI, functionName: 'getVotes', args: [depAcc.address] });
  const mDepDel = await mClient.readContract({ address: mToken, abi: TOKEN_ABI, functionName: 'delegates', args: [depAcc.address] });
  console.log('Deployer sARC Balance:', formatUnits(mDepTokens, 18));
  console.log('Deployer sARC Votes:', formatUnits(mDepVotes, 18));
  console.log('Deployer sARC Delegate:', mDepDel);

  console.log('\n--- Arc Testnet ---');
  const tDepBal = await tClient.getBalance({ address: depAcc.address });
  const tAgentBal = await tClient.getBalance({ address: agentAcc.address });
  console.log('Deployer Native USDC:', formatEther(tDepBal));
  console.log('Agent Native USDC:', formatEther(tAgentBal));

  const tToken = '0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e';
  const tDepTokens = await tClient.readContract({ address: tToken, abi: TOKEN_ABI, functionName: 'balanceOf', args: [depAcc.address] });
  const tDepVotes = await tClient.readContract({ address: tToken, abi: TOKEN_ABI, functionName: 'getVotes', args: [depAcc.address] });
  console.log('Deployer Testnet sARC Balance:', formatUnits(tDepTokens, 18));
  console.log('Deployer Testnet sARC Votes:', formatUnits(tDepVotes, 18));
}

main().catch(console.error);
