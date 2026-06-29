import { NextRequest, NextResponse } from 'next/server'
import { treasuryAgent } from '@/lib/agent/treasury-agent'
import { gatewayPayments } from '@/lib/agent/gateway-payments'

export async function GET() {
  try {
    const treasury = await treasuryAgent.checkTreasury()
    const recentActions = treasuryAgent.getRecentActions()
    const paymentHistory = gatewayPayments.getPaymentHistory()

    return NextResponse.json({
      success: true,
      agentAddress: treasuryAgent.getAgentAddress(),
      treasury: {
        usdc: treasury.usdc,
        eurc: treasury.eurc,
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
  try {
    const action = await treasuryAgent.run()
    const treasury = await treasuryAgent.checkTreasury()
    
    return NextResponse.json({
      success: true,
      action,
      treasury: {
        usdc: treasury.usdc,
        eurc: treasury.eurc,
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

