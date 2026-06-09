const CIRCLE_API_URL = 'https://api.circle.com/v1/w3s';
const apiKey = 'TEST_API_KEY:80b9021de4258fa6e9509336d30c8ff8:e450d7c9750fa48dac763ec3f2166e69';

async function listUsers() {
  try {
    console.log('Fetching users from Circle API...');
    const res = await fetch(`${CIRCLE_API_URL}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error fetching users:', err);
  }
}

listUsers();
