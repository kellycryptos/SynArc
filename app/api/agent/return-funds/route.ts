import { NextRequest, NextResponse } from 'next/server'
import { treasuryAgent } from '@/lib/agent/treasury-agent'

export async function POST(req: NextRequest) {
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
