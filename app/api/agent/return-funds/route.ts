import { NextRequest, NextResponse } from 'next/server'
import { treasuryAgent } from '@/lib/agent/treasury-agent'

export async function POST(req: NextRequest) {
  const incoming = req.headers.get('x-cron-secret');
  const expected = process.env.CRON_SECRET;
  if (!incoming || !expected || incoming !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fire and forget returnFunds process in background so we don't time out the HTTP request.
    // Progress will be tracked via agent actions database file.
    treasuryAgent.triggerReturnFunds().catch((err) => {
      console.error('[Return Funds API] Background return process failed:', err)
    })

    return NextResponse.json({
      success: true,
      message: 'Return funds process initiated successfully in the background.'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to trigger return process' },
      { status: 500 }
    )
  }
}
