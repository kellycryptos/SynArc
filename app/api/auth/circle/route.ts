import { initiateUserControlledWalletsClient } from '@circle-fin/user-controlled-wallets';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      console.error('Missing CIRCLE_API_KEY environment variable');
      return NextResponse.json({ error: 'Authentication is currently unavailable. Please try again later.' }, { status: 500 });
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate a deterministic UUID-like string based on the email for this MVP
    const hash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
    const userId = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;

    const circleClient = initiateUserControlledWalletsClient({
      apiKey,
    });

    // 1. Ensure the user exists
    try {
      await circleClient.createUser({
        userId,
      });
    } catch {
      // Circle API throws an error if the user already exists. We can safely ignore.
      console.log('User might already exist in Circle. Proceeding...');
    }

    // 2. Create User Token
    const tokenResponse = await circleClient.createUserToken({
      userId,
    });

    const userToken = tokenResponse.data?.userToken;
    const encryptionKey = tokenResponse.data?.encryptionKey;

    if (!userToken || !encryptionKey) {
      return NextResponse.json({ error: 'Failed to generate Circle user token' }, { status: 500 });
    }

    // 3. Optional: Create a challenge to initialize the PIN/Wallet setup if they don't have one
    // For this MVP, we return the userToken. The frontend SDK handles PIN setup automatically if necessary.
    
    return NextResponse.json({
      userId,
      userToken,
      encryptionKey,
    });

  } catch (error: unknown) {
    console.error('Circle Auth Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
