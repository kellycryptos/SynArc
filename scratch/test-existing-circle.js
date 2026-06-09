const CIRCLE_API_URL = 'https://api.circle.com/v1/w3s';
const apiKey = 'TEST_API_KEY:80b9021de4258fa6e9509336d30c8ff8:e450d7c9750fa48dac763ec3f2166e69';
const testEmail = 'sundersltd1@gmail.com';

async function runTest() {
  try {
    console.log(`1. Fetching session token for existing user ${testEmail}...`);
    let res = await fetch(`${CIRCLE_API_URL}/users/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ userId: testEmail })
    });
    console.log(`Status: ${res.status}`);
    let data = await res.json();
    console.log(`Response:`, JSON.stringify(data, null, 2));
    const userToken = data.data?.userToken;

    if (!userToken) {
      console.log('No userToken received. Stopping.');
      return;
    }

    console.log(`\n2. Attempting to initialize wallets on ARC-TESTNET (should fail with already initialized)...`);
    res = await fetch(`${CIRCLE_API_URL}/user/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-User-Token': userToken
      },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        blockchains: ['ARC-TESTNET']
      })
    });
    console.log(`Status: ${res.status}`);
    data = await res.json();
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    const errorMsg = data.message || data.error?.message || '';
    const isAlreadyInit = errorMsg.toLowerCase().includes('already') || data.code === 155118;

    if (isAlreadyInit) {
      console.log(`\n3. Fetching wallets...`);
      res = await fetch(`${CIRCLE_API_URL}/wallets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-User-Token': userToken
        }
      });
      console.log(`Status: ${res.status}`);
      data = await res.json();
      console.log(`Response:`, JSON.stringify(data, null, 2));
      const wallets = data.data?.wallets || [];
      const arcWallet = wallets.find(w => w.blockchain === 'ARC-TESTNET') || wallets[0];

      if (!arcWallet) {
        console.log('No wallets found.');
        return;
      }

      console.log(`\n4. Generating signMessage challenge for wallet ID: ${arcWallet.id} (${arcWallet.blockchain})...`);
      res = await fetch(`${CIRCLE_API_URL}/user/sign/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-User-Token': userToken
        },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          message: 'Circle Wallet requires verification for security',
          walletId: arcWallet.id
        })
      });
      console.log(`Status: ${res.status}`);
      data = await res.json();
      console.log(`Response:`, JSON.stringify(data, null, 2));
    } else {
      console.log('Not already initialized. Skipping.');
    }

  } catch (err) {
    console.error('Error during test:', err);
  }
}

runTest();
