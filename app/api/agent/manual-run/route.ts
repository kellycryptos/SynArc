import { NextRequest, NextResponse } from 'next/server'
import { treasuryAgent } from '@/lib/agent/treasury-agent'
import { verifyMessage } from 'viem'

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { address, signature, message } = await req.json()
    if (!address || !signature || !message) {
      return NextResponse.json({ error: 'Missing address, signature, or message' }, { status: 400 })
    }

    // Verify the signature using viem's verifyMessage
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`
    })

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature authentication' }, { status: 401 })
    }

    // Execute the agent run cycle manually
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
      { error: error?.message || 'Agent manual execution failed' },
      { status: 500 }
    )
  }
}
