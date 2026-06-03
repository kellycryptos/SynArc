import { NextRequest, NextResponse } from 'next/server'

const CIRCLE_API_URL = 'https://api.circle.com/v1/w3s'

export async function GET(req: NextRequest) {
  try {
    const userToken = req.headers.get('x-user-token')
    const apiKey = process.env.CIRCLE_API_KEY || process.env.NEXT_PUBLIC_CIRCLE_API_KEY || ''

    if (!userToken) {
      return NextResponse.json({ error: 'Missing X-User-Token header' }, { status: 400 })
    }

    let attempts = 0;
    let data: any = null;
    let res: any = null;
    const maxAttempts = 6; // Up to 6 seconds total wait time for background DB/chain sync

    while (attempts < maxAttempts) {
      console.log(`[Circle API] Listing wallets attempt ${attempts + 1}...`);
      res = await fetch(`${CIRCLE_API_URL}/wallets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-User-Token': userToken
        }
      });

      if (res.status === 200) {
        data = await res.json();
        const wallets = data.data?.wallets || [];
        const hasArcWallet = wallets.some((w: any) => w.blockchain === 'ARC-TESTNET' && w.address);
        
        if (wallets.length > 0 && hasArcWallet) {
          break;
        }
      }

      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!data || res.status !== 200 || !data.data?.wallets || data.data.wallets.length === 0) {
      console.error('[Circle API] Failed to fetch wallets after retries:', data);
      return NextResponse.json({ error: data?.message || 'Wallet is still deploying on-chain. Please try reopening the modal.' }, { status: res?.status === 200 ? 404 : (res?.status || 500) });
    }

    // Find the wallet address on ARC-TESTNET or return the first wallet
    const arcWallet = data.data.wallets.find((w: any) => w.blockchain === 'ARC-TESTNET' && w.address) || data.data.wallets[0];
    
    return NextResponse.json({ success: true, address: arcWallet.address })

  } catch (error: any) {
    console.error('Circle wallet address endpoint error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to retrieve wallet address' }, { status: 500 })
  }
}
