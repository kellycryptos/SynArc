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
      '--window-size=1280,800',
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

  console.log("Waiting for NetworkStatusBadge to mount...");
  let badgeInfo = null;
  for (let i = 0; i < 30; i++) {
    const check = await send(pageWs, 'Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => 
          b.getAttribute('aria-haspopup') === 'true' || 
          (b.title && b.title.includes('Arc')) ||
          (b.textContent && b.textContent.includes('Arc'))
        );
        return btn ? { found: true, text: btn.textContent?.trim(), title: btn.title } : null;
      })()`,
      returnByValue: true
    });
    if (check.result?.value?.found) {
      badgeInfo = check.result.value;
      console.log(`Badge button found after ${i * 500}ms:`, badgeInfo);
      break;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  if (!badgeInfo) {
    console.error("❌ NetworkStatusBadge did not appear in DOM within 15s");
    process.exit(1);
  }

  // 1. Initial State Check (should be mainnet)
  console.log("\n[Test 1] Checking Initial Cold Load State (Mainnet)...");
  const initCheck = await send(pageWs, 'Runtime.evaluate', {
    expression: `({
      url: window.location.href,
      mode: localStorage.getItem('synarc_active_network_mode'),
      badgeText: Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-haspopup') === 'true')?.textContent?.trim()
    })`,
    returnByValue: true
  });
  console.log("Initial state:", initCheck.result.value);

  // 2. Open dropdown and switch to Testnet
  console.log("\n[Test 2] Clicking visible badge to open dropdown...");
  const clickOpenRes = await send(pageWs, 'Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => {
        const isBadge = b.getAttribute('aria-haspopup') === 'true' || b.title?.includes('Arc') || b.textContent?.includes('Arc');
        if (!isBadge) return false;
        const rect = b.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      if (!btn) return { success: false, reason: "Visible badge button not found" };
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      return { success: true, text: btn.textContent?.trim() };
    })()`,
    returnByValue: true
  });
  console.log("Click visible badge result:", clickOpenRes.result.value);

  console.log("Waiting for dropdown switch button to appear...");
  let switchTestnetRes = null;
  for (let i = 0; i < 20; i++) {
    const check = await send(pageWs, 'Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Switch to Testnet'));
        if (!btn) return null;
        btn.click();
        return { success: true, text: btn.textContent?.trim() };
      })()`,
      returnByValue: true
    });
    if (check.result?.value?.success) {
      switchTestnetRes = check.result.value;
      console.log(`Clicked 'Switch to Testnet' after ${i * 200}ms:`, switchTestnetRes);
      break;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  if (!switchTestnetRes) {
    console.log("Switch to testnet click result: NOT FOUND");
  }

  // Wait 4 seconds for testnet transition
  console.log("Waiting 4s for Testnet state to settle...");
  await new Promise(r => setTimeout(r, 4000));

  const testnetCheck = await send(pageWs, 'Runtime.evaluate', {
    expression: `({
      url: window.location.href,
      mode: localStorage.getItem('synarc_active_network_mode'),
      badgeText: Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-haspopup') === 'true' && b.getBoundingClientRect().width > 0)?.textContent?.trim()
    })`,
    returnByValue: true
  });
  console.log("State after switching to testnet:", testnetCheck.result.value);

  // 3. Switch back to Mainnet
  console.log("\n[Test 3] Clicking visible badge to open dropdown again...");
  await send(pageWs, 'Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => {
        const isBadge = b.getAttribute('aria-haspopup') === 'true' || b.title?.includes('Arc') || b.textContent?.includes('Arc');
        if (!isBadge) return false;
        const rect = b.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    })()`,
  });

  console.log("Waiting for dropdown switch back button to appear...");
  let switchMainnetRes = null;
  for (let i = 0; i < 20; i++) {
    const check = await send(pageWs, 'Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Switch to Mainnet'));
        if (!btn) return null;
        btn.click();
        return { success: true, text: btn.textContent?.trim() };
      })()`,
      returnByValue: true
    });
    if (check.result?.value?.success) {
      switchMainnetRes = check.result.value;
      console.log(`Clicked 'Switch to Mainnet' after ${i * 200}ms:`, switchMainnetRes);
      break;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  console.log("Waiting 4s for Mainnet state to settle...");
  await new Promise(r => setTimeout(r, 4000));

  const mainnetFinalCheck = await send(pageWs, 'Runtime.evaluate', {
    expression: `({
      url: window.location.href,
      mode: localStorage.getItem('synarc_active_network_mode'),
      badgeText: Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-haspopup') === 'true' && b.getBoundingClientRect().width > 0)?.textContent?.trim()
    })`,
    returnByValue: true
  });
  console.log("State after switching back to mainnet:", mainnetFinalCheck.result.value);

  console.log(`\n--- Error Summary: Total Errors Recorded = ${errors.length} ---`);
  if (errors.length > 0) {
    console.log("Errors encountered:", errors);
  } else {
    console.log("✅ Zero fatal errors or unhandled exceptions encountered during full two-way network switch!");
  }

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
