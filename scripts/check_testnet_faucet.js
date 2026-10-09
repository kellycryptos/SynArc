const fs = require('fs');
const dotenv = require('dotenv');
if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });
const { createPublicClient, http, formatEther } = require('viem');
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
if (fKey) {
  const acc = privateKeyToAccount(fKey.startsWith('0x') ? fKey : '0x' + fKey);
  const client = createPublicClient({ chain: arcTestnet, transport: http() });
  client.getBalance({ address: acc.address }).then(b => {
    console.log('Faucet address:', acc.address, 'Testnet balance:', formatEther(b));
  }).catch(e => console.error(e.message));
} else {
  console.log('No faucet key');
}
