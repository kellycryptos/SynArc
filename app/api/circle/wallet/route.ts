import { NextRequest, NextResponse } from 'next/server'

const CIRCLE_API_URL = 'https://api.circle.com/v1/w3s'

export async function POST(req: NextRequest) {
  try {
    const { userToken } = await req.json()
    const apiKey = process.env.CIRCLE_API_KEY || process.env.NEXT_PUBLIC_CIRCLE_API_KEY || ''

    if (!userToken) {
      return NextResponse.json({ error: 'Missing userToken parameter' }, { status: 400 })
    }

    console.log(`[Circle API] Initializing user controlled wallet on ARC-TESTNET...`)
    
    // Initialize wallet for user (idempotent — safe to call again for existing users)
    const res = await fetch(`${CIRCLE_API_URL}/user/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-User-Token': userToken
      },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        blockchains: ['ARC-TESTNET']
      })
    })

    const data = await res.json()
    
    if (res.status !== 200 && res.status !== 201) {
      console.warn('[Circle API] Non-2xx initialize result:', data)
      const errorMsg = data.message || data.error?.message || ''
      const isAlreadyInit = errorMsg.toLowerCase().includes('already') || data.code === 155118
      
      if (isAlreadyInit) {
        // Wallet already exists — no need to challenge again.
        // Return without a challengeId so the client skips the SDK execute() call
        // and proceeds directly to fetching the wallet address.
        console.log('[Circle API] Wallet already initialized — skipping verification challenge.')
        return NextResponse.json({
          success: true,
          challengeId: null,
          alreadyInitialized: true
        })
      }
      return NextResponse.json({ error: errorMsg || 'Failed to initialize wallet' }, { status: res.status })
    }

    // New wallet — challengeId triggers the one-time security setup (OTP per Console config)
    return NextResponse.json({ success: true, challengeId: data.data?.challengeId, alreadyInitialized: false })

  } catch (error: any) {
    console.error('Circle wallet endpoint error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to initialize wallet' }, { status: 500 })
  }
}

