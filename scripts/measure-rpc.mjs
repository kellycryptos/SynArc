import { spawn } from 'child_process';
import * as path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const USER_DATA_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\21bc08bc-c4db-414e-a078-1f63702101eb\\edge-profile';

async function run() {
  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--window-size=1440,900',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) throw new Error("Could not connect to Edge DevTools");

  const browserWs = new WebSocket(wsUrl);
  await new Promise(r => browserWs.onopen = r);

  let id = 1;
  const send = (ws, method, params = {}) => new Promise((resolve, reject) => {
    const cur = id++;
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === cur) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error); else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: cur, method, params }));
  });

  const target = await send(browserWs, 'Target.createTarget', { url: 'about:blank' });
  const pageWs = new WebSocket(`ws://127.0.0.1:9222/devtools/page/${target.targetId}`);
  await new Promise(r => pageWs.onopen = r);

  const networkRequests = [];
  pageWs.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Network.requestWillBeSent') {
      const req = msg.params.request;
      networkRequests.push({
        url: req.url,
        method: req.method,
        postData: req.postData ? req.postData.slice(0, 100) : undefined,
        timestamp: msg.params.wallTime
      });
    }
  };

  await send(pageWs, 'Runtime.enable');
  await send(pageWs, 'Page.enable');
  await send(pageWs, 'Network.enable');

  console.log("Measuring /dashboard network and RPC calls...");
  networkRequests.length = 0;
  await send(pageWs, 'Page.navigate', { url: 'http://localhost:3000/dashboard' });
  await new Promise(r => setTimeout(r, 6000));

  const dashboardRequests = [...networkRequests];
  const rpcRequests = dashboardRequests.filter(r => r.url.includes('/api/rpc') || r.url.includes('arc.io') || r.url.includes('canteen'));

  console.log(`Total Requests on /dashboard: ${dashboardRequests.length}`);
  console.log(`RPC Requests on /dashboard: ${rpcRequests.length}`);
  console.log("RPC Endpoints contacted:", rpcRequests.map(r => r.url));

  console.log("\nMeasuring /treasury network and RPC calls...");
  networkRequests.length = 0;
  await send(pageWs, 'Page.navigate', { url: 'http://localhost:3000/treasury' });
  await new Promise(r => setTimeout(r, 6000));

  const treasuryRequests = [...networkRequests];
  const treasuryRpc = treasuryRequests.filter(r => r.url.includes('/api/rpc') || r.url.includes('arc.io') || r.url.includes('canteen'));

  console.log(`Total Requests on /treasury: ${treasuryRequests.length}`);
  console.log(`RPC Requests on /treasury: ${treasuryRpc.length}`);
  console.log("RPC Endpoints contacted on /treasury:", treasuryRpc.map(r => r.url));

  edge.kill();
  process.exit(0);
}

run().catch(err => {
  console.error("Measurement error:", err);
  process.exit(1);
});
