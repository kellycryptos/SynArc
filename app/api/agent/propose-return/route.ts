import { NextRequest, NextResponse } from 'next/server'
import { treasuryAgent } from '@/lib/agent/treasury-agent'

export async function POST(req: NextRequest) {
  const incoming = req.headers.get('x-cron-secret');
  const expected = process.env.CRON_SECRET;
  if (!incoming || !expected || incoming !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const txHash = await treasuryAgent.proposeReturnFunds()
    return NextResponse.json({
      success: true,
      txHash,
      message: 'Governance proposal to return funds from Ethereum Sepolia created successfully.'
    })
  } catch (error: any) {
    console.error('[Propose Return API] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to propose return of funds' },
      { status: 500 }
    )
  }
}
