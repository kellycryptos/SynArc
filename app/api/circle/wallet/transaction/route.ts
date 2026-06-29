import { NextRequest, NextResponse } from 'next/server'

const CIRCLE_API_URL = 'https://api.circle.com/v1/w3s'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const userToken = req.headers.get('x-user-token')
    const apiKey = process.env.CIRCLE_API_KEY || process.env.NEXT_PUBLIC_CIRCLE_API_KEY || ''

    if (!id) {
      return NextResponse.json({ error: 'Missing transaction id parameter' }, { status: 400 })
    }

    if (!userToken) {
      return NextResponse.json({ error: 'Missing x-user-token header' }, { status: 400 })
    }

    console.log(`[Circle API Get Transaction] Querying transaction ${id}...`)

    const res = await fetch(`${CIRCLE_API_URL}/transactions/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-User-Token': userToken
      }
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[Circle API Get Transaction] failed:', data);
      return NextResponse.json({ error: data?.message || 'Failed to retrieve transaction details' }, { status: res.status });
    }

    return NextResponse.json({
      success: true,
      transaction: data.data?.transaction
    });

  } catch (error: any) {
    console.error('Circle get transaction route error:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
