import { spawn } from 'child_process';
import * as path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const USER_DATA_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\21bc08bc-c4db-414e-a078-1f63702101eb\\edge-profile';

async function run() {
  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--window-size=1280,800',
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

  const target = await send(browserWs, 'Target.createTarget', { url: 'http://localhost:3000/dashboard' });
  const pageWs = new WebSocket(`ws://127.0.0.1:9222/devtools/page/${target.targetId}`);
  await new Promise(r => pageWs.onopen = r);

  const errors = [];
  pageWs.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Runtime.exceptionThrown') {
      const desc = msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text;
      console.log("\n🚨 [EXCEPTION]:", desc);
      errors.push(desc);
    }
  };

  await send(pageWs, 'Runtime.enable');
  await send(pageWs, 'Page.enable');

  console.log("===================================================================");
  console.log("🧪 SYNARC LIVE NETWORK SWITCHING TEST (MAINNET ⇄ TESTNET)");
  console.log("===================================================================");

  // Step 0: Ensure fresh mainnet state
  await send(pageWs, 'Runtime.evaluate', {
    expression: `localStorage.removeItem('synarc_active_network_mode')`
  });
  console.log("Navigating to /dashboard...");
  await send(pageWs, 'Page.navigate', { url: 'http://localhost:3000/dashboard' });
  await new Promise(r => setTimeout(r, 4000));

  console.log("\n[Phase 1] Waiting for fresh cold load (Mainnet default)...");
  let mainnetBadge = null;
  for (let i = 0; i < 30; i++) {
    const res = await send(pageWs, 'Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => 
          b.getAttribute('aria-haspopup') === 'true' && b.getBoundingClientRect().width > 0
        );
        if (!btn) return null;
        const text = btn.textContent.trim();
        const nav = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
        const hasFaucet = nav.includes('Faucet');
        return { text, hasFaucet };
      })()`,
      returnByValue: true
    });
    if (res.result?.value?.text?.includes('Arc')) {
      mainnetBadge = res.result.value;
      console.log(`Mainnet loaded in ${i * 500}ms:`, mainnetBadge);
      break;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  const passPhase1 = mainnetBadge?.text?.includes('Arc') && !mainnetBadge?.text?.includes('Testnet') && !mainnetBadge.hasFaucet;
  console.log(`Phase 1 Result (Cold load is Mainnet, Faucet hidden): ${passPhase1 ? '✅ PASS' : '❌ FAIL'}`);

  // Step 2: Open badge and switch to Testnet
  console.log("\n[Phase 2] Opening dropdown and switching to Testnet...");
  await send(pageWs, 'Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => 
        b.getAttribute('aria-haspopup') === 'true' && b.getBoundingClientRect().width > 0
      );
      if (btn) btn.click();
    })()`
  });

  await new Promise(r => setTimeout(r, 600));

  // Find and click "Switch to Testnet"
  const clickSwitchRes = await send(pageWs, 'Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent && b.textContent.includes('Switch to Testnet')
      );
      if (!btn) return { found: false };
      btn.click();
      return { found: true };
    })()`,
    returnByValue: true
  });
  console.log("Clicked 'Switch to Testnet':", clickSwitchRes?.result?.value);

  console.log("Waiting 3s for Testnet state to settle...");
  await new Promise(r => setTimeout(r, 3000));

  const testnetState = await send(pageWs, 'Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => 
        b.getAttribute('aria-haspopup') === 'true' && b.getBoundingClientRect().width > 0
      );
      const nav = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
      const hasFaucet = nav.includes('Faucet');
      const hasSettings = nav.includes('Settings');
      const hasDocs = nav.includes('Docs');
      const mode = localStorage.getItem('synarc_active_network_mode');
      return { badge: btn?.textContent?.trim(), hasFaucet, hasSettings, hasDocs, mode };
    })()`,
    returnByValue: true
  });
  console.log("Testnet state observed:", testnetState?.result?.value);

  const observedTestnet = testnetState?.result?.value;
  const passPhase2 = observedTestnet?.badge?.includes('Arc Testnet') &&
    observedTestnet?.hasFaucet &&
    observedTestnet?.mode === 'testnet';
  console.log(`Phase 2 Result (Switched to Testnet cleanly, Faucet visible): ${passPhase2 ? '✅ PASS' : '❌ FAIL'}`);

  // Step 3: Open badge and switch back to Mainnet
  console.log("\n[Phase 3] Opening dropdown and switching back to Mainnet...");
  await send(pageWs, 'Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => 
        b.getAttribute('aria-haspopup') === 'true' && b.getBoundingClientRect().width > 0
      );
      if (btn) btn.click();
    })()`
  });

  await new Promise(r => setTimeout(r, 600));

  const clickBackRes = await send(pageWs, 'Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent && b.textContent.includes('Switch to Mainnet')
      );
      if (!btn) return { found: false };
      btn.click();
      return { found: true };
    })()`,
    returnByValue: true
  });
  console.log("Clicked 'Switch to Mainnet':", clickBackRes.result.value);

  console.log("Waiting 3s for Mainnet state to settle...");
  await new Promise(r => setTimeout(r, 3000));

  const mainnetFinalState = await send(pageWs, 'Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => 
        b.getAttribute('aria-haspopup') === 'true' && b.getBoundingClientRect().width > 0
      );
      const nav = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
      const hasFaucet = nav.includes('Faucet');
      const mode = localStorage.getItem('synarc_active_network_mode');
      return { badge: btn?.textContent?.trim(), hasFaucet, mode };
    })()`,
    returnByValue: true
  });
  console.log("Mainnet final state observed:", mainnetFinalState.result.value);

  const passPhase3 = mainnetFinalState.result.value?.badge?.includes('Arc') &&
    !mainnetFinalState.result.value?.badge?.includes('Testnet') &&
    !mainnetFinalState.result.value?.hasFaucet &&
    mainnetFinalState.result.value?.mode === 'mainnet';
  console.log(`Phase 3 Result (Switched back to Mainnet cleanly, Faucet hidden): ${passPhase3 ? '✅ PASS' : '❌ FAIL'}`);

  console.log("\n===================================================================");
  console.log(`TOTAL UNCAUGHT ERRORS / EXCEPTIONS: ${errors.length}`);
  console.log("===================================================================");

  if (edge) edge.kill();
  const allPassed = passPhase1 && passPhase2 && passPhase3 && errors.length === 0;
  process.exit(allPassed ? 0 : 1);
}

run().catch((err) => {
  console.error("FATAL TEST ERROR:", err);
  process.exit(1);
});
