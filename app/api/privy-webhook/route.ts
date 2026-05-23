import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  console.log('Privy webhook received:', body);
  
  // Handle the event
  const { type, data } = body;
  
  if (type === 'user.created') {
    // do something when a new user signs up
  }
  
  return NextResponse.json({ received: true });
}
