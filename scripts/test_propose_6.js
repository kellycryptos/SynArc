const fs = require('fs');
const dotenv = require('dotenv');
if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });

const { createPublicClient, createWalletClient, http, parseAbi } = require('viem');
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
const wallet = createWalletClient({ account: faucetAcc, chain: arcTestnet, transport: http() });

const GOV_ADDRESS = '0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e';

const GOV_ABI_6 = parseAbi([
  'function propose(string title, string description, string category, uint256 votingDuration, uint256 treasuryImpactValue, address executionTarget) returns (uint256)'
]);

async function main() {
  console.log('Testing 6-arg propose on Testnet Governor...');
  try {
    const hash = await wallet.writeContract({
      address: GOV_ADDRESS,
      abi: GOV_ABI_6,
      functionName: 'propose',
      args: [
        'Contractor Payout: Security Sentinel Node Test',
        'Testing testnet payout flow',
        'CONTRACTOR_PAYOUT',
        10n,
        10000n,
        depAcc.address
      ]
    });
    console.log('Tx sent:', hash);
    const receipt = await client.waitForTransactionReceipt({ hash });
    console.log('Confirmed in block:', receipt.blockNumber);
  } catch (e) {
    console.error('Error with 6-arg propose:', e.shortMessage || e.message);
  }
}

main().catch(console.error);
