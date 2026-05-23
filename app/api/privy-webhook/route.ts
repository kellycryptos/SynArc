import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('privy-signature');
  
  // Verify the request is from Privy
  const hmac = createHmac('sha256', process.env.PRIVY_WEBHOOK_SIGNING_KEY!)
    .update(body)
    .digest('hex');
  
  if (hmac !== signature) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const event = JSON.parse(body);
  console.log('Verified Privy event:', event.type);

  return NextResponse.json({ received: true });
}
