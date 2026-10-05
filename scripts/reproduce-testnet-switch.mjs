import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA_DIR = path.resolve(process.cwd(), '.edge-debug-profile');

if (!fs.existsSync(USER_DATA_DIR)) {
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });
}

async function run() {
  console.log("Launching Edge...");
  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'about:blank'
  ]);

  // Wait for CDP to be ready
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

  if (!wsUrl) {
    console.error("Could not connect to Edge DevTools port");
    edge.kill();
    process.exit(1);
  }

  console.log("Connected to browser CDP:", wsUrl);
  const browserWs = new WebSocket(wsUrl);

  let idCounter = 1;
  const send = (ws, method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise(r => browserWs.onopen = r);

  // Create new target (page)
  const target = await send(browserWs, 'Target.createTarget', { url: 'http://localhost:3000' });
  const pageWsUrl = `ws://127.0.0.1:9222/devtools/page/${target.targetId}`;
  console.log("Target created:", pageWsUrl);

  const pageWs = new WebSocket(pageWsUrl);
  await new Promise(r => pageWs.onopen = r);

  const exceptions = [];
  const consoleMessages = [];
  const networkEvents = [];
  const failedRequests = [];

  pageWs.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Runtime.exceptionThrown') {
      console.log("\n🚨 [BROWSER EXCEPTION THROWN]:");
      console.log(JSON.stringify(msg.params, null, 2));
      exceptions.push(msg.params);
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const type = msg.params.type;
      const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      if (type === 'error') {
        console.log(`\n❌ [BROWSER CONSOLE.ERROR]: ${text}`);
      } else if (type === 'warning') {
        console.log(`⚠️ [BROWSER CONSOLE.WARN]: ${text}`);
      }
      consoleMessages.push({ type, text });
    }
    if (msg.method === 'Network.loadingFailed') {
      console.log(`\n⚠️ [NETWORK FAILED]: ${msg.params.requestId} errorText: ${msg.params.errorText}`);
      failedRequests.push(msg.params);
    }
    if (msg.method === 'Network.requestWillBeSent') {
      networkEvents.push(msg.params.request);
    }
  });

  await send(pageWs, 'Runtime.enable');
  await send(pageWs, 'Page.enable');
  await send(pageWs, 'Network.enable');

  console.log("Waiting 6s for initial mainnet page load...");
  await new Promise(r => setTimeout(r, 6000));

  console.log("\n--- TRIGGERING TESTNET SWITCH ---");
  // Evaluate network switch to testnet
  const switchResult = await send(pageWs, 'Runtime.evaluate', {
    expression: `(async () => {
      console.log("Current active network mode before switch:", localStorage.getItem('synarc_active_network_mode'));
      // Find the network switcher button or trigger
      const btns = Array.from(document.querySelectorAll('button'));
      const netBadge = btns.find(b => b.textContent && (b.textContent.includes('Arc') || b.textContent.includes('Mainnet')));
      if (netBadge) {
        console.log("Clicking network badge:", netBadge.textContent);
        netBadge.click();
        await new Promise(r => setTimeout(r, 500));
        const switchBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.toLowerCase().includes('switch'));
        if (switchBtn) {
          console.log("Clicking switch button:", switchBtn.textContent);
          switchBtn.click();
        } else {
          console.log("Switch button not found in dropdown, clicking badge or setting storage directly");
        }
      } else {
        console.log("Network badge button not found, switching via localStorage + CustomEvent");
        localStorage.setItem('synarc_active_network_mode', 'testnet');
        window.dispatchEvent(new CustomEvent('synarc_network_changed', { detail: { activeNetwork: 'testnet' } }));
      }
      return true;
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  console.log("Switch trigger execution result:", switchResult);

  console.log("Waiting 10s after switch to capture any crash / hang / unhandled rejection...");
  await new Promise(r => setTimeout(r, 10000));

  // Also test direct page load with testnet pre-set in localStorage (simulating reload or direct testnet visit)
  console.log("\n--- NAVIGATING TO TESTNET PRE-SET PAGE ---");
  await send(pageWs, 'Runtime.evaluate', {
    expression: `localStorage.setItem('synarc_active_network_mode', 'testnet'); location.reload();`
  });

  console.log("Waiting 10s after reload in testnet mode...");
  await new Promise(r => setTimeout(r, 10000));

  // Also navigate to other key pages: /daos, /proposals, /agent, /creator
  const pagesToTest = ['/daos', '/proposals', '/agent'];
  for (const p of pagesToTest) {
    console.log(`\n--- NAVIGATING TO ${p} (TESTNET) ---`);
    await send(pageWs, 'Page.navigate', { url: `http://localhost:3000${p}` });
    await new Promise(r => setTimeout(r, 6000));
  }

  console.log("\n=================== DIAGNOSTIC REPORT ===================");
  console.log(`Total Exceptions Caught: ${exceptions.length}`);
  console.log(`Total Failed Network Requests: ${failedRequests.length}`);
  console.log("=========================================================\n");

  edge.kill();
  process.exit(0);
}

run().catch(err => {
  console.error("Test script failed:", err);
  process.exit(1);
});
