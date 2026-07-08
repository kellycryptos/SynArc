import { NextRequest, NextResponse } from 'next/server'

const CIRCLE_API_URL = 'https://api.circle.com/v1/w3s'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    const apiKey = process.env.CIRCLE_API_KEY || ''

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    // 1. Create or get Circle user
    console.log(`[Circle API] Creating/getting user: ${userId}`)
    await fetch(`${CIRCLE_API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ userId })
    })

    // 2. Get user token and encryption key
    console.log(`[Circle API] Fetching session token for user: ${userId}`)
    const tokenRes = await fetch(`${CIRCLE_API_URL}/users/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ userId })
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.data?.userToken) {
      console.error('[Circle API] Failed to fetch token data:', tokenData)
      return NextResponse.json({ error: tokenData.message || 'Failed to fetch user token' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      userToken: tokenData.data.userToken,
      encryptionKey: tokenData.data.encryptionKey,
    })

  } catch (error: any) {
    console.error('Circle user endpoint error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to create Circle user' }, { status: 500 })
  }
}
