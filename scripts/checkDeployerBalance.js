// Balance check script for Arc Mainnet
const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.arc.io');
  const rawKey = (process.env.DEPLOYER_PRIVATE_KEY || '').trim().replace(/'/g, '').replace(/"/g, '').trim();
  if (!rawKey || rawKey.length < 10) {
    console.error('No DEPLOYER_PRIVATE_KEY found in .env.local');
    process.exit(1);
  }
  const key = rawKey.startsWith('0x') ? rawKey : '0x' + rawKey;
  const wallet = new ethers.Wallet(key, provider);
  const bal = await wallet.getBalance();
  const network = await provider.getNetwork();
  console.log('Deployer address:', wallet.address);
  console.log('Balance:', ethers.formatEther(bal), 'ARC');
  console.log('Chain ID:', network.chainId.toString());
}
main().catch(e => { console.error(e.message); process.exit(1); });
