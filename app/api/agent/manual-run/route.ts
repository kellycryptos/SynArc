import { NextRequest, NextResponse } from 'next/server'
import { treasuryAgent } from '@/lib/agent/treasury-agent'
import { verifyMessage } from 'viem'

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { address, signature, message, actionType, proposedAmount } = await req.json()
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

    let forcedAction: { action: string; reasoning: string; proposedAmount?: number } | undefined;
    if (actionType === 'yield_allocation') {
      forcedAction = {
        action: 'yield_allocation',
        reasoning: 'Community-triggered yield optimization: Deploying idle treasury liquidity to maximize automated yield generation on Arc Mainnet.',
        proposedAmount: proposedAmount || 50
      };
    } else if (actionType === 'emergency_funding') {
      forcedAction = {
        action: 'emergency_funding',
        reasoning: 'Community-triggered emergency reserve funding request for operational DAO liquidity maintenance.',
        proposedAmount: proposedAmount || 50
      };
    }

    // Execute the agent run cycle manually
    const action = await treasuryAgent.run(forcedAction)
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
