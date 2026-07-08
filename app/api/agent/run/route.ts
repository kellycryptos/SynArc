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
    const treasury = await treasuryAgent.checkTreasury()
    const sepoliaUsdc = await treasuryAgent.getSepoliaBalance()

    return NextResponse.json({
      success: true,
      agentAddress: treasuryAgent.getAgentAddress(),
      cronExecuted: true,
      action: actionResult,
      treasury: {
        usdc: treasury.usdc,
        eurc: treasury.eurc,
        sepoliaUsdc,
      },
      treasurySource: treasury.usedFallback ? 'fallback' : 'live',
      recentActions: treasuryAgent.getRecentActions(),
      isRunning: true,
      lastCheck: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to process agent state' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const action = await treasuryAgent.run()
    const treasury = await treasuryAgent.checkTreasury()
    const sepoliaUsdc = await treasuryAgent.getSepoliaBalance()
    
    return NextResponse.json({
      success: true,
      action,
      treasury: {
        usdc: treasury.usdc,
        eurc: treasury.eurc,
        sepoliaUsdc,
      },
      treasurySource: treasury.usedFallback ? 'fallback' : 'live',
      recentActions: treasuryAgent.getRecentActions(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Agent execution failed' },
      { status: 500 }
    )
  }
}
