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
    console.error('CIRCLE_API_KEY is not defined in environment.');
    return;
  }

  const userId = 'test_user_antigravity@example.com';

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
    const res = await fetch(`${CIRCLE_API_URL}/users/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ userId })
    });
    
    console.log('HTTP Status:', res.status);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch operation failed:', err);
  }
}

test();
