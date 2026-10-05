import { spawn } from 'child_process';
import * as path from 'path';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA_DIR = path.resolve(process.cwd(), '.edge-debug-profile');

async function test() {
  let wsUrl = null;
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    if (res.ok) wsUrl = (await res.json()).webSocketDebuggerUrl;
  } catch {}

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

  await send(pageWs, 'Page.enable');
  await send(pageWs, 'Runtime.enable');

  const loadPromise = new Promise((resolve) => {
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Page.loadEventFired') {
        pageWs.removeEventListener('message', handler);
        resolve();
      }
    };
    pageWs.addEventListener('message', handler);
  });

  await send(pageWs, 'Page.navigate', { url: 'http://localhost:3000/dashboard' });
  await loadPromise;
  await new Promise(r => setTimeout(r, 2000));

  const res = await send(pageWs, 'Runtime.evaluate', {
    expression: `(async () => {
      const rTestnet = await fetch('/api/rpc/testnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 })
      });
      const dataTestnet = await rTestnet.json();

      const rMainnet = await fetch('/api/rpc/mainnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 })
      });
      const dataMainnet = await rMainnet.json();

      return {
        href: window.location.href,
        testnetChainId: dataTestnet.result,
        mainnetChainId: dataMainnet.result
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Fetch test results in browser:', JSON.stringify(res, null, 2));

  process.exit(0);
}
test().catch(console.error);
