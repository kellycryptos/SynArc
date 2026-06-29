import { NextRequest, NextResponse } from 'next/server'

const CIRCLE_API_URL = 'https://api.circle.com/v1/w3s'

export async function POST(req: NextRequest) {
  try {
    const headerToken = req.headers.get('x-user-token')
    const body = await req.json().catch(() => ({}))
    const userToken = headerToken || body.userToken
    const { contractAddress, callData, value, feeLevel = 'HIGH' } = body

    const apiKey = process.env.CIRCLE_API_KEY || process.env.NEXT_PUBLIC_CIRCLE_API_KEY || ''

    if (!userToken) {
      return NextResponse.json({ error: 'Missing userToken parameter' }, { status: 400 })
    }

    if (!contractAddress || !callData) {
      return NextResponse.json({ error: 'Missing contractAddress or callData' }, { status: 400 })
    }

    // 1. Get the wallet list first to locate the ARC-TESTNET wallet ID
    console.log(`[Circle API Execute] Fetching wallets...`)
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
      return NextResponse.json({ error: 'Wallet ID not found for ARC-TESTNET' }, { status: 404 });
    }

    // 2. Parse native amount value if present
    let amount: string | undefined;
    if (value && value !== '0x0' && value !== '0x') {
      try {
        const weiVal = BigInt(value);
        if (weiVal > 0n) {
          // Arc Testnet uses USDC with 6 decimals as native gas token
          amount = (Number(weiVal) / 1e6).toFixed(6);
        }
      } catch (err) {
        console.warn('[Circle API Execute] Failed to parse value to BigInt:', err);
      }
    }

    console.log(`[Circle API Execute] Creating contract execution challenge:`, {
      walletId,
      contractAddress,
      feeLevel,
      amount
    });

    // 3. Initiate contract execution challenge
    const executionRes = await fetch(`${CIRCLE_API_URL}/user/transactions/contractExecution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-User-Token': userToken
      },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        walletId,
        contractAddress,
        callData,
        amount,
        feeLevel
      })
    });

    const executionData = await executionRes.json();

    if (!executionRes.ok) {
      console.error('[Circle API Execute] execution failed:', executionData);
      return NextResponse.json({ error: executionData?.message || 'Contract execution challenge creation failed' }, { status: executionRes.status });
    }

    return NextResponse.json({
      success: true,
      challengeId: executionData.data?.challengeId,
      txId: executionData.data?.id
    });

  } catch (error: any) {
    console.error('Circle contract execution route error:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error during contract execution' }, { status: 500 })
  }
}
