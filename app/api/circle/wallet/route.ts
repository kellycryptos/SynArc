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
        // Fetch wallets for this user to get the walletId
        console.log(`[Circle API] Fetching wallets to generate verification challenge...`)
        const walletsRes = await fetch(`${CIRCLE_API_URL}/wallets`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-User-Token': userToken
          }
        })
        const walletsData = await walletsRes.json()
        const wallets = walletsData.data?.wallets || []
        const arcWallet = wallets.find((w: any) => w.blockchain === 'ARC-TESTNET') || wallets[0]

        if (!arcWallet) {
          return NextResponse.json({ error: 'No wallets found for user' }, { status: 404 })
        }

        // Generate a signature challenge to force PIN/OTP verification
        console.log(`[Circle API] Generating signMessage verification challenge for wallet ${arcWallet.id}...`)
        const signRes = await fetch(`${CIRCLE_API_URL}/user/sign/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-User-Token': userToken
          },
          body: JSON.stringify({
            idempotencyKey: crypto.randomUUID(),
            message: 'Circle Wallet requires verification for security',
            walletId: arcWallet.id
          })
        })
        const signData = await signRes.json()

        if (signRes.status !== 200 && signRes.status !== 201) {
          const signErrorMsg = signData.message || signData.error?.message || 'Failed to create verification challenge'
          return NextResponse.json({ error: signErrorMsg }, { status: signRes.status })
        }

        return NextResponse.json({
          success: true,
          challengeId: signData.data?.challengeId,
          alreadyInitialized: true
        })
      }
      return NextResponse.json({ error: errorMsg || 'Failed to initialize wallet' }, { status: res.status })
    }

    return NextResponse.json({ success: true, challengeId: data.data?.challengeId })

  } catch (error: any) {
    console.error('Circle wallet endpoint error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to initialize wallet' }, { status: 500 })
  }
}
