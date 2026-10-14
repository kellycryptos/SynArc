async function check() {
  const urls = [
    'https://rpc.mainnet.arc.io',
    'https://rpc.testnet.arc.network',
    'https://rpc.testnet.arc.io'
  ];
  for (const u of urls) {
    const start = Date.now();
    try {
      const res = await fetch(u, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
        signal: AbortSignal.timeout(6000)
      });
      const d = await res.json();
      console.log(`✅ ${u}: Block ${parseInt(d.result, 16)} (${Date.now() - start}ms)`);
    } catch (e) {
      console.log(`❌ ${u}: ${e.message} (${Date.now() - start}ms)`);
    }
  }
}
check();
