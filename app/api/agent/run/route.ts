import { NextRequest, NextResponse } from 'next/server'
import { treasuryAgent } from '@/lib/agent/treasury-agent'
import { gatewayPayments } from '@/lib/agent/gateway-payments'

// ─── Auth helper ──────────────────────────────────────────────────────────────
// Requests that arrive with an x-cron-secret header must match CRON_SECRET.
// Requests without the header (e.g. from the dashboard UI) are passed through
// so the existing UX is not broken.
function verifyCronSecret(req: NextRequest): boolean {
  const incoming = req.headers.get('x-cron-secret');
  if (!incoming) return true; // no header → internal/dashboard call, allow
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // secret not configured yet → allow (fail-open during dev)
  return incoming === expected;
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const treasury = await treasuryAgent.checkTreasury()
    const recentActions = treasuryAgent.getRecentActions()
    const paymentHistory = gatewayPayments.getPaymentHistory()
    const sepoliaUsdc = await treasuryAgent.getSepoliaBalance()

    return NextResponse.json({
      success: true,
      agentAddress: treasuryAgent.getAgentAddress(),
      treasury: {
        usdc: treasury.usdc,
        eurc: treasury.eurc,
        sepoliaUsdc,
      },
      treasurySource: treasury.usedFallback ? 'fallback' : 'live',
      recentActions,
      isRunning: true,
      lastCheck: new Date().toISOString(),
      payments: {
        history: paymentHistory.slice(0, 10),
        totalSpent: gatewayPayments.getTotalSpent(),
        callCount: gatewayPayments.getCallCount(),
        avgCost: gatewayPayments.getAverageCost(),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to get agent state' },
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

