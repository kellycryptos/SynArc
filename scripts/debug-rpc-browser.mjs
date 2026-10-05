async function test() {
  const list = await (await fetch('http://127.0.0.1:9222/json')).json();
  const page = list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => {
    const data = JSON.parse(e.data);
    if (data.id === 1) {
      console.log('EVAL RESULT:', JSON.stringify(data.result, null, 2));
      process.exit(0);
    }
  };
  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `(async () => {
        const results = {};
        try {
          const res = await fetch('/api/rpc/mainnet', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_blockNumber',params:[]})
          });
          results.mainnetFetch = { status: res.status, json: await res.json() };
        } catch(e) {
          results.mainnetFetch = { error: e.message };
        }

        try {
          const res = await fetch('/api/rpc/testnet', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_blockNumber',params:[]})
          });
          results.testnetFetch = { status: res.status, json: await res.json() };
        } catch(e) {
          results.testnetFetch = { error: e.message };
        }

        // Test ethers JsonRpcProvider
        try {
          // Check what ethers is exposed on window or import it
          results.hasEthers = typeof window.ethers !== 'undefined';
        } catch(e) {
          results.ethersError = e.message;
        }

        return results;
      })()`,
      awaitPromise: true,
      returnByValue: true
    }
  }));
}
test().catch(console.error);
