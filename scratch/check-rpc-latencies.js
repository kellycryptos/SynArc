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

const CANTEEN_RPC = 'https://rpc.testnet.arc-node.thecanteenapp.com/v1/swrm_104d24688adcae992878acabfd41b2ed5800817b20d57aa9b17a64d225c0bf8f';
const envRpc = process.env.NEXT_PUBLIC_ARC_RPC_URL;

const rpcList = [
  { name: 'NEXT_PUBLIC_ARC_RPC_URL (Custom)', url: envRpc },
  { name: 'Canteen Primary RPC (Hardcoded)', url: CANTEEN_RPC },
  { name: 'Official Public RPC', url: 'https://rpc.testnet.arc.network' },
  { name: 'Alchemy Fallback RPC', url: 'https://arc-testnet.g.alchemy.com/v2/okKqIdABiZt8WuR2aDvev' },
  { name: 'QuickNode Fallback RPC', url: 'https://rpc.quicknode.testnet.arc.network' },
  { name: 'dRPC Fallback RPC', url: 'https://arc-testnet.drpc.org' }
].filter(item => item.url);

async function checkLatency(url) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      return { healthy: false, latency: Date.now() - start, error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    if (data.result !== undefined && !data.error) {
      return { healthy: true, latency: Date.now() - start };
    } else {
      return { healthy: false, latency: Date.now() - start, error: data.error?.message || 'RPC Error' };
    }
  } catch (err) {
    return { healthy: false, latency: Date.now() - start, error: err.message || 'Timeout/Network Error' };
  }
}

async function run() {
  console.log('Measuring RPC latencies (averaging 3 runs per node)...');
  const results = [];

  for (const node of rpcList) {
    const latencies = [];
    let healthyCount = 0;
    let errors = [];

    // Run 3 times to get a stable average
    for (let i = 0; i < 3; i++) {
      const check = await checkLatency(node.url);
      if (check.healthy) {
        latencies.push(check.latency);
        healthyCount++;
      } else {
        errors.push(check.error);
      }
      // brief pause between requests
      await new Promise(r => setTimeout(r, 100));
    }

    const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : Infinity;

    results.push({
      name: node.name,
      url: node.url,
      healthy: healthyCount > 0,
      successRate: `${healthyCount}/3`,
      avgLatency,
      error: errors.length > 0 ? errors[0] : null
    });
  }

  // Sort by health and then average latency
  results.sort((a, b) => {
    if (a.healthy !== b.healthy) {
      return a.healthy ? -1 : 1;
    }
    return a.avgLatency - b.avgLatency;
  });

  console.log('\n--- RPC Latency Results ---');
  console.log(JSON.stringify(results, null, 2));
}

run();
