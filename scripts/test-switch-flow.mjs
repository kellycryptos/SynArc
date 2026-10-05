import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA_DIR = path.resolve(process.cwd(), '.edge-debug-profile');

async function run() {
  console.log("Connecting to Edge or launching new instance...");
  let wsUrl = null;
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    if (res.ok) {
      const data = await res.json();
      wsUrl = data.webSocketDebuggerUrl;
    }
  } catch {}

  let edge = null;
  if (!wsUrl) {
    edge = spawn(EDGE_PATH, [
      '--headless=new',
      '--remote-debugging-port=9222',
      `--user-data-dir=${USER_DATA_DIR}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      'about:blank'
    ]);
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
  }

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

  const target = await send(browserWs, 'Target.createTarget', { url: 'http://localhost:3000/dashboard' });
  const pageWs = new WebSocket(`ws://127.0.0.1:9222/devtools/page/${target.targetId}`);
  await new Promise(r => pageWs.onopen = r);

  const pendingRequests = new Map();
  const errors = [];

  pageWs.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Runtime.exceptionThrown') {
      console.log("\n🚨 [EXCEPTION THROWN]:");
      console.log(JSON.stringify(msg.params.exceptionDetails, null, 2));
      errors.push(msg.params.exceptionDetails);
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const type = msg.params.type;
      const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      if (type === 'error') {
        console.log(`\n❌ [CONSOLE.ERROR]: ${text}`);
        errors.push(text);
      } else if (type === 'warn' || type === 'warning') {
        console.log(`⚠️ [CONSOLE.WARN]: ${text}`);
      } else {
        console.log(`ℹ️ [CONSOLE.LOG]: ${text}`);
      }
    }
    if (msg.method === 'Network.requestWillBeSent') {
      pendingRequests.set(msg.params.requestId, {
        url: msg.params.request.url,
        method: msg.params.request.method,
        startTime: Date.now()
      });
    }
    if (msg.method === 'Network.responseReceived') {
      const req = pendingRequests.get(msg.params.requestId);
      if (req) {
        const duration = Date.now() - req.startTime;
        if (msg.params.response.status >= 400) {
          console.log(`❌ [HTTP ${msg.params.response.status}] ${req.method} ${req.url} (${duration}ms)`);
        } else if (req.url.includes('/api/')) {
          console.log(`✅ [HTTP ${msg.params.response.status}] ${req.method} ${req.url} (${duration}ms)`);
        }
        pendingRequests.delete(msg.params.requestId);
      }
    }
    if (msg.method === 'Network.loadingFailed') {
      const req = pendingRequests.get(msg.params.requestId);
      console.log(`🚨 [NETWORK FAIL] ${req?.url || msg.params.requestId}: ${msg.params.errorText}`);
      pendingRequests.delete(msg.params.requestId);
    }
  });

  await send(pageWs, 'Runtime.enable');
  await send(pageWs, 'Page.enable');
  await send(pageWs, 'Network.enable');

  console.log("Waiting for page buttons to render...");
  let buttonsFound = false;
  for (let i = 0; i < 30; i++) {
    const check = await send(pageWs, 'Runtime.evaluate', {
      expression: `document.querySelectorAll('button').length`,
      returnByValue: true
    });
    if (check.result?.value > 0) {
      buttonsFound = true;
      console.log(`Page rendered with ${check.result.value} buttons after ${i * 500}ms`);
      break;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  await new Promise(r => setTimeout(r, 1000));

  console.log("\nAttempting to find and click the NetworkStatusBadge...");
  const clickBadgeRes = await send(pageWs, 'Runtime.evaluate', {
    expression: `(() => {
      // Find button that contains network status (ChevronDown, ChainIcon, etc.)
      const buttons = Array.from(document.querySelectorAll('button'));
      const badgeBtn = buttons.find(b => b.getAttribute('aria-haspopup') === 'true' || (b.textContent && (b.textContent.includes('Arc') || b.textContent.includes('ms'))));
      if (!badgeBtn) {
        return { 
          success: false, 
          reason: "Badge button not found. Total buttons: " + buttons.length,
          allButtons: buttons.map(b => ({
            text: b.textContent?.trim()?.slice(0, 50),
            aria: b.getAttribute('aria-haspopup'),
            title: b.title
          }))
        };
      }
      badgeBtn.click();
      return { success: true, text: badgeBtn.textContent };
    })()`,
    returnByValue: true
  });
  console.log("Click badge result:", clickBadgeRes);

  await new Promise(r => setTimeout(r, 600));

  console.log("\nAttempting to find and click 'Switch to Testnet' button...");
  const clickSwitchRes = await send(pageWs, 'Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const switchBtn = buttons.find(b => b.textContent && b.textContent.includes('Switch to Testnet'));
      if (!switchBtn) {
        return { success: false, reason: "Switch button not found", buttonsText: buttons.map(b => b.textContent?.trim()) };
      }
      switchBtn.click();
      return { success: true, text: switchBtn.textContent };
    })()`,
    returnByValue: true
  });
  console.log("Click switch result:", clickSwitchRes);

  console.log("\nWatching network and console for 15s after switch click...");
  await new Promise(r => setTimeout(r, 15000));

  console.log("\n--- Checking Pending Requests ---");
  for (const [id, req] of pendingRequests.entries()) {
    const elapsed = Date.now() - req.startTime;
    console.log(`⏳ PENDING (${elapsed}ms): ${req.method} ${req.url}`);
  }

  console.log("\n--- Checking Current Page State ---");
  const stateRes = await send(pageWs, 'Runtime.evaluate', {
    expression: `({
      url: window.location.href,
      localStorage_mode: localStorage.getItem('synarc_active_network_mode'),
      documentTitle: document.title,
      badgeText: Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-haspopup') === 'true')?.textContent
    })`,
    returnByValue: true
  });
  console.log("Page state:", stateRes.result.value);

  if (edge) edge.kill();
  process.exit(0);
}

run().catch(console.error);
