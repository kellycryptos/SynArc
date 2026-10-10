import { NextRequest, NextResponse } from 'next/server'
import { treasuryAgent } from '@/lib/agent/treasury-agent'

export const dynamic = 'force-dynamic';

function verifyCronSecret(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false; // expected not set -> fail closed!

  const authHeader = req.headers.get('authorization');
  if (authHeader && (authHeader === `Bearer ${expected}` || authHeader === expected)) {
    return true;
  }

  const incoming = req.headers.get('x-cron-secret');
  if (incoming && incoming === expected) {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const networkParam = searchParams.get('network');

  if (!networkParam || (networkParam !== 'mainnet' && networkParam !== 'testnet')) {
    return NextResponse.json(
      { error: 'Missing or invalid network parameter. Must specify ?network=mainnet or ?network=testnet' },
      { status: 400 }
    );
  }

  try {
    console.log(`[API Cron] Automated run triggered for ${networkParam} via GET request.`);
    const actionResult = await treasuryAgent.run(networkParam);

    // Detailed execution telemetry logged server-side
    console.log(`[API Cron] ${networkParam} execution finished:`, {
      action: actionResult.action,
      status: actionResult.status,
      reasoning: actionResult.reasoning,
      txHash: actionResult.txHash,
      usdcAmount: actionResult.usdcAmount,
    });

    const actionsExecuted = (actionResult.status === 'executed' && actionResult.action !== 'monitoring') ? 1 : 0;

    // Minimal response returned to cron caller to stay far below buffer thresholds
    return NextResponse.json({
      status: 'ok',
      network: networkParam,
      actionsExecuted,
      action: actionResult.action,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`[API Cron] Error during GET /api/agent/run for ${networkParam}:`, error?.message || error);
    return NextResponse.json(
      {
        status: 'error',
        network: networkParam,
        error: error?.message || 'Failed to process agent state',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let networkParam = searchParams.get('network');
  let forcedAction: { action: string; reasoning: string; proposedAmount?: number } | undefined;

  if (!networkParam) {
    try {
      const body = await req.json();
      if (body?.network) networkParam = body.network;
      if (body?.action && body?.reasoning) {
        forcedAction = {
          action: body.action,
          reasoning: body.reasoning,
          proposedAmount: body.proposedAmount,
        };
      }
    } catch {}
  }

  if (!networkParam || (networkParam !== 'mainnet' && networkParam !== 'testnet')) {
    return NextResponse.json(
      { error: 'Missing or invalid network parameter. Must specify network=mainnet or network=testnet' },
      { status: 400 }
    );
  }

  try {
    console.log(`[API Cron] Automated run triggered for ${networkParam} via POST request.`);
    const actionResult = await treasuryAgent.run(networkParam, forcedAction);

    console.log(`[API Cron] ${networkParam} POST execution finished:`, {
      action: actionResult.action,
      status: actionResult.status,
      reasoning: actionResult.reasoning,
      txHash: actionResult.txHash,
      usdcAmount: actionResult.usdcAmount,
    });

    const actionsExecuted = (actionResult.status === 'executed' && actionResult.action !== 'monitoring') ? 1 : 0;

    return NextResponse.json({
      status: 'ok',
      network: networkParam,
      actionsExecuted,
      action: actionResult.action,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`[API Cron] Error during POST /api/agent/run for ${networkParam}:`, error?.message || error);
    return NextResponse.json(
      {
        status: 'error',
        network: networkParam,
        error: error?.message || 'Agent execution failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
