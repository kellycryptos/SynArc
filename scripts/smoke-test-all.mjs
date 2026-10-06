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

  const errors = [];
  const warnings = [];
  pageWs.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Runtime.exceptionThrown') {
      const desc = msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text;
      errors.push({ type: 'exception', text: desc, url: currentUrl });
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const type = msg.params.type;
      const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      if (type === 'error') {
        errors.push({ type: 'console.error', text, url: currentUrl });
      } else if (type === 'warning') {
        warnings.push({ type: 'console.warn', text, url: currentUrl });
      }
    }
  };

  await send(pageWs, 'Runtime.enable');
  await send(pageWs, 'Page.enable');

  let currentUrl = '';
  const results = {};

  const testPage = async (network, route) => {
    const fullUrl = `http://localhost:3000${route}`;
    currentUrl = `[${network}] ${route}`;
    console.log(`\nTesting ${currentUrl}...`);

    // Set network in localStorage first
    await send(pageWs, 'Runtime.evaluate', {
      expression: `localStorage.setItem('synarc_active_network_mode', '${network}');`
    });

    await send(pageWs, 'Page.navigate', { url: fullUrl });
    await new Promise(r => setTimeout(r, 4000));

    // Capture DOM info
    const domInfo = await send(pageWs, 'Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText.trim());
        const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
        const hasCrash = text.includes('Application error') || text.includes('Unhandled Runtime Error');
        const hasEmptyState = text.includes('No proposals') || text.includes('No transactions') || text.includes('0.00');
        return {
          title: document.title,
          headings: headings.slice(0, 8),
          buttonCount: buttons.length,
          sampleButtons: buttons.slice(0, 6),
          hasCrash,
          textLength: text.length
        };
      })()`,
      returnByValue: true
    });

    results[currentUrl] = {
      dom: domInfo.result?.value,
      errors: errors.filter(e => e.url === currentUrl)
    };
    console.log(`Result for ${currentUrl}:`, results[currentUrl]);
  };

  const routes = [
    '/dashboard',
    '/proposals',
    '/proposals/create',
    '/treasury',
    '/bridge',
    '/earn',
    '/agent',
    '/analytics'
  ];

  for (const net of ['mainnet', 'testnet']) {
    for (const route of routes) {
      await testPage(net, route);
    }
  }

  // Also test a proposal detail page if one exists
  // First find if there's any proposal ID in proposals page
  console.log("\nChecking for proposals detail link...");
  await send(pageWs, 'Runtime.evaluate', {
    expression: `localStorage.setItem('synarc_active_network_mode', 'testnet');`
  });
  await send(pageWs, 'Page.navigate', { url: 'http://localhost:3000/proposals' });
  await new Promise(r => setTimeout(r, 4000));

  const proposalLink = await send(pageWs, 'Runtime.evaluate', {
    expression: `(() => {
      const a = Array.from(document.querySelectorAll('a')).find(el => el.href && el.href.includes('/proposals/'));
      return a ? a.href : null;
    })()`,
    returnByValue: true
  });
  console.log("Found proposal link:", proposalLink.result?.value);

  if (proposalLink.result?.value) {
    const propPath = new URL(proposalLink.result.value).pathname;
    await testPage('testnet', propPath);
    await testPage('mainnet', propPath);
  }

  console.log("\n=================== FULL TEST SUMMARY ===================");
  console.log(JSON.stringify(results, null, 2));
  console.log(`Total Errors Logged: ${errors.length}`);
  console.log("=========================================================\n");

  edge.kill();
  process.exit(0);
}

run().catch(err => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
