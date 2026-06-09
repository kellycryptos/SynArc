import { NextRequest, NextResponse } from 'next/server'

const CIRCLE_API_URL = 'https://api.circle.com/v1/w3s'

export async function GET(req: NextRequest) {
  try {
    const userToken = req.headers.get('x-user-token')
    const apiKey = process.env.CIRCLE_API_KEY || process.env.NEXT_PUBLIC_CIRCLE_API_KEY || ''

    if (!userToken) {
      return NextResponse.json({ error: 'Missing X-User-Token header' }, { status: 400 })
    }

    // 1. Get the wallet list first to locate the ARC-TESTNET wallet ID
    const walletsRes = await fetch(`${CIRCLE_API_URL}/wallets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-User-Token': userToken
      }
    });

    if (!walletsRes.ok) {
      const walletsData = await walletsRes.json().catch(() => ({}));
      return NextResponse.json({ error: walletsData?.message || 'Failed to fetch wallets' }, { status: walletsRes.status });
    }

    const walletsData = await walletsRes.json();
    const wallets = walletsData.data?.wallets || [];
    if (wallets.length === 0) {
      return NextResponse.json({ error: 'No wallets found for user' }, { status: 404 });
    }

    const arcWallet = wallets.find((w: any) => w.blockchain === 'ARC-TESTNET') || wallets[0];
    const walletId = arcWallet.id;

    if (!walletId) {
      return NextResponse.json({ error: 'Wallet ID not found' }, { status: 404 });
    }

    // 2. Fetch balances for the specific wallet ID
    const balancesRes = await fetch(`${CIRCLE_API_URL}/wallets/${walletId}/balances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-User-Token': userToken
      }
    });

    if (!balancesRes.ok) {
      const balancesData = await balancesRes.json().catch(() => ({}));
      return NextResponse.json({ error: balancesData?.message || 'Failed to fetch balances' }, { status: balancesRes.status });
    }

    const balancesData = await balancesRes.json();
    return NextResponse.json({ success: true, balances: balancesData.data?.tokenBalances || [] });

  } catch (error: any) {
    console.error('Circle wallet balances endpoint error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to retrieve wallet balances' }, { status: 500 })
  }
}
