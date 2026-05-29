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
    
    // Initialize wallet for user
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
      // Check if user already has a wallet initialized (e.g. error code or message)
      const errorMsg = data.message || data.error?.message || ''
      const isAlreadyInit = errorMsg.toLowerCase().includes('already') || data.code === 155118
      
      if (isAlreadyInit) {
        return NextResponse.json({ success: true, alreadyInitialized: true })
      }
      return NextResponse.json({ error: errorMsg || 'Failed to initialize wallet' }, { status: res.status })
    }

    return NextResponse.json({ success: true, challengeId: data.data?.challengeId })

  } catch (error: any) {
    console.error('Circle wallet endpoint error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to initialize wallet' }, { status: 500 })
  }
}
