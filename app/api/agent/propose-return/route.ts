import { NextRequest, NextResponse } from 'next/server'
import { treasuryAgent } from '@/lib/agent/treasury-agent'

export async function POST(req: NextRequest) {
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
