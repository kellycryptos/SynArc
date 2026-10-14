import fs from 'fs';
import dotenv from 'dotenv';
import { createPublicClient, http, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });
if (fs.existsSync('.env')) dotenv.config({ path: '.env' });

const client = createPublicClient({ transport: http('https://rpc.mainnet.arc.io') });

const keys = {
  DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY,
  AGENT_PRIVATE_KEY: process.env.AGENT_PRIVATE_KEY,
  FAUCET_PRIVATE_KEY: process.env.FAUCET_PRIVATE_KEY,
};

async function check() {
  for (const [name, k] of Object.entries(keys)) {
    if (!k) {
      console.log(name, ': undefined');
      continue;
    }
    let clean = k.trim().replace(/^['"]|['"]$/g, '');
    if (!clean.startsWith('0x')) clean = '0x' + clean;
    try {
      const acc = privateKeyToAccount(clean);
      const bal = await client.getBalance({ address: acc.address });
      console.log(`${name} -> Address: ${acc.address}, Mainnet USDC Balance: ${formatUnits(bal, 18)} USDC`);
    } catch (err) {
      console.log(`${name} -> Invalid key:`, err.message);
    }
  }
}
check().catch(console.error);
