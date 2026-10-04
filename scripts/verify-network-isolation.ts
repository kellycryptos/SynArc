import * as path from 'path';
import * as dotenv from 'dotenv';

// Ensure environment variables are loaded in order: .env.local first, then .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import {
  CONTRACTS_MAINNET,
  CONTRACTS_TESTNET,
  ACTIVE_NETWORK,
  getActiveNetwork,
  CIRCLE_CCTP_MAINNET,
  CIRCLE_CCTP_TESTNET,
} from '../lib/arc-config';

interface CheckResult {
  network: 'mainnet' | 'testnet' | 'config';
  target: string;
  address: string;
  type: 'CONTRACT' | 'EOA' | 'CONFIG';
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

const MAINNET_RPC = 'https://rpc.mainnet.arc.io';
const TESTNET_RPC =
  process.env.ARC_TESTNET_RPC_URL ||
  process.env.NEXT_PUBLIC_ARC_RPC_URL ||
  'https://rpc.testnet.arc.network';

async function rpcCall(rpcUrl: string, method: string, params: any[]): Promise<any> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 100000),
      method,
      params,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`RPC HTTP error ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();
  if (json.error) {
    throw new Error(`RPC JSON error: ${json.error.message || JSON.stringify(json.error)}`);
  }
  return json.result;
}

async function getBytecode(rpcUrl: string, address: string): Promise<number> {
  const hex: string = await rpcCall(rpcUrl, 'eth_getCode', [address, 'latest']);
  if (!hex || hex === '0x' || hex === '0x0') {
    return 0;
  }
  return (hex.length - 2) / 2;
}

async function getLiveGovernor(rpcUrl: string, treasuryAddress: string): Promise<string> {
  // function selector for governor(): 0x0c340a24
  const result: string = await rpcCall(rpcUrl, 'eth_call', [
    { to: treasuryAddress, data: '0x0c340a24' },
    'latest',
  ]);
  if (!result || result === '0x') {
    throw new Error('governor() call returned empty result');
  }
  // Extract 20-byte address from 32-byte word
  const cleanHex = result.replace(/^0x/, '');
  const addrHex = '0x' + cleanHex.slice(cleanHex.length - 40);
  return addrHex;
}

async function main() {
  console.log('='.repeat(95));
  console.log('🔍 SYNARC PERMANENT NETWORK ISOLATION VERIFICATION SCRIPT');
  console.log('='.repeat(95));
  console.log(`Timestamp:   ${new Date().toISOString()}`);
  console.log(`Mainnet RPC: ${MAINNET_RPC}`);
  console.log(`Testnet RPC: ${TESTNET_RPC}`);
  console.log('-'.repeat(95));

  const results: CheckResult[] = [];

  // 1. Cold Load / ACTIVE_NETWORK Check
  console.log('\n[1/4] Verifying Default Active Network (Cold Load State)...');
  const coldActiveNetwork = ACTIVE_NETWORK;
  const getterActiveNetwork = getActiveNetwork();
  const envArcNetwork = process.env.NEXT_PUBLIC_ARC_NETWORK;

  const isColdLoadMainnet = coldActiveNetwork === 'mainnet' && getterActiveNetwork === 'mainnet';
  results.push({
    network: 'config',
    target: 'ACTIVE_NETWORK',
    address: 'N/A',
    type: 'CONFIG',
    expected: 'mainnet',
    actual: coldActiveNetwork,
    status: isColdLoadMainnet ? 'PASS' : 'FAIL',
    details: `env="${envArcNetwork}", getActiveNetwork()="${getterActiveNetwork}"`,
  });

  // 2. CONTRACTS_MAINNET Bytecode Verification against Mainnet RPC
  console.log('\n[2/4] Verifying CONTRACTS_MAINNET on Arc Mainnet (https://rpc.mainnet.arc.io)...');
  const mainnetItems: { name: string; address: string; type: 'CONTRACT' | 'EOA'; isCriticalContract: boolean }[] = [
    { name: 'governor', address: CONTRACTS_MAINNET.governor, type: 'CONTRACT', isCriticalContract: true },
    { name: 'treasury', address: CONTRACTS_MAINNET.treasury, type: 'CONTRACT', isCriticalContract: true },
    { name: 'treasuryGovernance', address: CONTRACTS_MAINNET.treasuryGovernance, type: 'CONTRACT', isCriticalContract: true },
    { name: 'treasuryAgent', address: CONTRACTS_MAINNET.treasuryAgent, type: 'EOA', isCriticalContract: false },
    { name: 'token (SYN)', address: CONTRACTS_MAINNET.token, type: 'CONTRACT', isCriticalContract: true },
    { name: 'tokenMessenger', address: CONTRACTS_MAINNET.tokenMessenger, type: 'CONTRACT', isCriticalContract: true },
    { name: 'usdc', address: CIRCLE_CCTP_MAINNET.arc.usdc, type: 'CONTRACT', isCriticalContract: true },
    { name: 'eurc', address: CONTRACTS_MAINNET.eurc, type: 'CONTRACT', isCriticalContract: true },
  ];

  // Optional contracts like crowdfund
  if (CONTRACTS_MAINNET.crowdfund) {
    mainnetItems.push({
      name: 'crowdfund',
      address: CONTRACTS_MAINNET.crowdfund,
      type: 'CONTRACT',
      isCriticalContract: false,
    });
  }

  await Promise.all(
    mainnetItems.map(async (item) => {
      try {
        const byteCount = await getBytecode(MAINNET_RPC, item.address);
        const hasCode = byteCount > 0;

        if (item.type === 'CONTRACT') {
          const pass = item.isCriticalContract ? hasCode : true;
          const status: 'PASS' | 'FAIL' = item.isCriticalContract
            ? (hasCode ? 'PASS' : 'FAIL')
            : (hasCode ? 'PASS' : 'FAIL'); // If crowdfund is specified, let's see its state

          results.push({
            network: 'mainnet',
            target: item.name,
            address: item.address,
            type: item.type,
            expected: 'HAS CODE (>0 bytes)',
            actual: hasCode ? `HAS CODE (${byteCount} B)` : 'NO CODE (0 B)',
            status: status,
            details: hasCode ? `${byteCount} bytes deployed` : (item.isCriticalContract ? 'CRITICAL: Contract not deployed on mainnet' : 'Optional contract not deployed on mainnet'),
          });
        } else {
          // EOA: Expected NO CODE
          const isEoa = !hasCode;
          results.push({
            network: 'mainnet',
            target: item.name,
            address: item.address,
            type: item.type,
            expected: 'NO CODE (EOA, 0 B)',
            actual: hasCode ? `HAS CODE (${byteCount} B)` : 'NO CODE (0 B)',
            status: isEoa ? 'PASS' : 'FAIL',
            details: isEoa ? 'Verified EOA (no code)' : 'WARNING: EOA has bytecode',
          });
        }
      } catch (err: any) {
        results.push({
          network: 'mainnet',
          target: item.name,
          address: item.address,
          type: item.type,
          expected: 'HAS CODE',
          actual: `RPC ERROR: ${err.message}`,
          status: 'FAIL',
        });
      }
    })
  );

  // 3. Cross-reference: treasury.governor() on Mainnet
  console.log('\n[3/4] Cross-referencing treasury.governor() live on Arc Mainnet...');
  try {
    const liveGovernor = await getLiveGovernor(MAINNET_RPC, CONTRACTS_MAINNET.treasury);
    const expectedGovernor = CONTRACTS_MAINNET.governor;
    const isGovMatch = liveGovernor.toLowerCase() === expectedGovernor.toLowerCase();

    results.push({
      network: 'mainnet',
      target: 'treasury.governor() match',
      address: CONTRACTS_MAINNET.treasury,
      type: 'CONTRACT',
      expected: expectedGovernor,
      actual: liveGovernor,
      status: isGovMatch ? 'PASS' : 'FAIL',
      details: isGovMatch
        ? `Live matches CONTRACTS_MAINNET (${liveGovernor})`
        : `MISMATCH! Live=${liveGovernor} vs Config=${expectedGovernor}`,
    });
  } catch (err: any) {
    results.push({
      network: 'mainnet',
      target: 'treasury.governor() match',
      address: CONTRACTS_MAINNET.treasury,
      type: 'CONTRACT',
      expected: CONTRACTS_MAINNET.governor,
      actual: `CALL ERROR: ${err.message}`,
      status: 'FAIL',
    });
  }

  // 4. CONTRACTS_TESTNET Bytecode Verification against Testnet RPC
  console.log(`\n[4/4] Verifying CONTRACTS_TESTNET on Arc Testnet (${TESTNET_RPC.slice(0, 35)}...)...`);
  const testnetItems: { name: string; address: string; type: 'CONTRACT' | 'EOA'; isCriticalContract: boolean }[] = [
    { name: 'governor', address: CONTRACTS_TESTNET.governor, type: 'CONTRACT', isCriticalContract: true },
    { name: 'treasury', address: CONTRACTS_TESTNET.treasury, type: 'CONTRACT', isCriticalContract: true },
    { name: 'treasuryGovernance', address: CONTRACTS_TESTNET.treasuryGovernance, type: 'CONTRACT', isCriticalContract: true },
    { name: 'treasuryAgent', address: CONTRACTS_TESTNET.treasuryAgent, type: 'CONTRACT', isCriticalContract: false }, // Contract on testnet
    { name: 'token (SYN)', address: CONTRACTS_TESTNET.token, type: 'CONTRACT', isCriticalContract: true },
    { name: 'tokenMessenger', address: CONTRACTS_TESTNET.tokenMessenger, type: 'CONTRACT', isCriticalContract: true },
    { name: 'usdc', address: CIRCLE_CCTP_TESTNET.arc.usdc, type: 'CONTRACT', isCriticalContract: true },
    { name: 'eurc', address: CONTRACTS_TESTNET.eurc, type: 'CONTRACT', isCriticalContract: true },
    { name: 'crowdfund', address: CONTRACTS_TESTNET.crowdfund, type: 'CONTRACT', isCriticalContract: true },
  ];

  await Promise.all(
    testnetItems.map(async (item) => {
      try {
        const byteCount = await getBytecode(TESTNET_RPC, item.address);
        const hasCode = byteCount > 0;

        results.push({
          network: 'testnet',
          target: item.name,
          address: item.address,
          type: item.type,
          expected: 'HAS CODE (>0 bytes)',
          actual: hasCode ? `HAS CODE (${byteCount} B)` : 'NO CODE (0 B)',
          status: hasCode ? 'PASS' : 'FAIL',
          details: hasCode ? `${byteCount} bytes deployed` : 'Contract not deployed on testnet',
        });
      } catch (err: any) {
        results.push({
          network: 'testnet',
          target: item.name,
          address: item.address,
          type: item.type,
          expected: 'HAS CODE',
          actual: `RPC ERROR: ${err.message}`,
          status: 'FAIL',
        });
      }
    })
  );

  // Summary Table
  console.log('\n' + '='.repeat(110));
  console.log('📊 VERIFICATION RESULTS SUMMARY TABLE');
  console.log('='.repeat(110));
  console.log(
    `${'NET'.padEnd(8)} | ${'TARGET'.padEnd(26)} | ${'TYPE'.padEnd(8)} | ${'STATUS'.padEnd(7)} | ${'ACTUAL / DETAILS'.padEnd(58)}`
  );
  console.log('-'.repeat(110));

  let failCount = 0;
  for (const r of results) {
    const statusFormatted = r.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    if (r.status === 'FAIL') failCount++;
    const detail = r.details ? `${r.actual} (${r.details})` : r.actual;
    console.log(
      `${r.network.padEnd(8)} | ${r.target.padEnd(26)} | ${r.type.padEnd(8)} | ${statusFormatted.padEnd(7)} | ${detail.slice(0, 58)}`
    );
  }

  console.log('='.repeat(110));
  console.log(`Total Checks: ${results.length} | Passed: ${results.length - failCount} | Failed: ${failCount}`);

  if (failCount > 0) {
    console.error(`\n❌ VERIFICATION FAILED: ${failCount} check(s) did not pass.\n`);
    process.exit(1);
  } else {
    console.log('\n✅ VERIFICATION PASSED: All network isolation checks passed cleanly.\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
