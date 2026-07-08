import { treasuryAgent } from '../lib/agent/treasury-agent';

async function test() {
  try {
    const res = await treasuryAgent.checkTreasury();
    console.log('checkTreasury result:', res);
  } catch (err) {
    console.error('checkTreasury thrown:', err);
  }
}

test().catch(console.error);
