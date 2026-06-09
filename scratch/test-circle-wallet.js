const fs = require('fs');

function loadEnvLocal() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*["']?([^"'\n]+)["']?/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    });
  } catch (err) {
    console.warn('Could not read .env.local:', err.message);
  }
}

loadEnvLocal();

const apiKey = process.env.CIRCLE_API_KEY;
const CIRCLE_API_URL = 'https://api.circle.com/v1/w3s';

async function test() {
  if (!apiKey) {
    console.error('CIRCLE_API_KEY is not defined.');
    return;
  }

  const userId = 'test_user_antigravity_wallet@example.com';

  try {
    console.log('1. Checking user registration...');
    await fetch(`${CIRCLE_API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ userId })
    });

    console.log('2. Requesting user session token...');
    const tokenRes = await fetch(`${CIRCLE_API_URL}/users/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ userId })
    });
    
    const tokenData = await tokenRes.json();
    const userToken = tokenData.data?.userToken;
    console.log('User Token fetched:', !!userToken);

    if (!userToken) {
      console.error('Failed to fetch token:', tokenData);
      return;
    }

    console.log('3. Initializing wallet on ARC-TESTNET...');
    const initRes = await fetch(`${CIRCLE_API_URL}/user/initialize`, {
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

    console.log('Init Status:', initRes.status);
    const initData = await initRes.json();
    console.log('Init Response:', JSON.stringify(initData, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

test();
