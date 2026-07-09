import { NextRequest, NextResponse } from 'next/server'
import { treasuryAgent } from '@/lib/agent/treasury-agent'

export const dynamic = 'force-dynamic';

function verifyCronSecret(req: NextRequest): boolean {
  const incoming = req.headers.get('x-cron-secret');
  if (!incoming) return false; // missing header -> fail closed!
  const expected = process.env.CRON_SECRET;
  if (!expected) return false; // expected not set -> fail closed!
  return incoming === expected;
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[API Cron] Automated run triggered via GET request.');
    const actionResult = await treasuryAgent.run();

    // checkTreasury() may throw if the RPC is down — wrap it so a contract
    // read failure never crashes a healthy cron execution into a 500.
    let treasury: { usdc: number; eurc: number; usedFallback: boolean } | null = null;
    let treasuryError: string | null = null;
    try {
      treasury = await treasuryAgent.checkTreasury();
    } catch (err: any) {
      treasuryError = err?.message || 'Treasury read failed';
      console.error('[API Cron] Post-run checkTreasury() failed (non-fatal):', treasuryError);
    }

    // getSepoliaBalance() already handles its own errors internally, but guard anyway
    let sepoliaUsdc = 0;
    try {
      sepoliaUsdc = await treasuryAgent.getSepoliaBalance();
    } catch (err: any) {
      console.error('[API Cron] Post-run getSepoliaBalance() failed (non-fatal):', err?.message);
    }

    return NextResponse.json({
      success: true,
      agentAddress: treasuryAgent.getAgentAddress(),
      cronExecuted: true,
      action: actionResult,
      treasury: treasury
        ? { usdc: treasury.usdc, eurc: treasury.eurc, sepoliaUsdc }
        : { usdc: null, eurc: null, sepoliaUsdc },
      treasurySource: treasury
        ? (treasury.usedFallback ? 'fallback' : 'live')
        : 'unavailable',
      treasuryError: treasuryError ?? undefined,
      recentActions: treasuryAgent.getRecentActions(),
      isRunning: true,
      lastCheck: new Date().toISOString(),
    })
  } catch (error: any) {
    // Only truly unrecoverable errors reach here (e.g. rate-limit or missing key)
    console.error('[API Cron] Unrecoverable error in GET /api/agent/run:', error?.message || error);
    return NextResponse.json(
      {
        success: false,
        cronExecuted: false,
        error: error?.message || 'Failed to process agent state',
        lastCheck: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const action = await treasuryAgent.run();

    // checkTreasury() may throw if the RPC is down — wrap it so a contract
    // read failure never crashes the route into a 500.
    let treasury: { usdc: number; eurc: number; usedFallback: boolean } | null = null;
    let treasuryError: string | null = null;
    try {
      treasury = await treasuryAgent.checkTreasury();
    } catch (err: any) {
      treasuryError = err?.message || 'Treasury read failed';
      console.error('[API Cron] Post-run checkTreasury() failed (non-fatal):', treasuryError);
    }

    let sepoliaUsdc = 0;
    try {
      sepoliaUsdc = await treasuryAgent.getSepoliaBalance();
    } catch (err: any) {
      console.error('[API Cron] Post-run getSepoliaBalance() failed (non-fatal):', err?.message);
    }

    return NextResponse.json({
      success: true,
      action,
      treasury: treasury
        ? { usdc: treasury.usdc, eurc: treasury.eurc, sepoliaUsdc }
        : { usdc: null, eurc: null, sepoliaUsdc },
      treasurySource: treasury
        ? (treasury.usedFallback ? 'fallback' : 'live')
        : 'unavailable',
      treasuryError: treasuryError ?? undefined,
      recentActions: treasuryAgent.getRecentActions(),
    })
  } catch (error: any) {
    console.error('[API Cron] Unrecoverable error in POST /api/agent/run:', error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Agent execution failed',
        lastCheck: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
