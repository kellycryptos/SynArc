import { NextResponse } from 'next/server';

/**
 * API Route: /api/auth/session-cookie
 *
 * Sets or clears the lightweight, non-sensitive `synarc_has_session` cookie.
 * Used exclusively by the Server Component layout (`app/(dashboard)/layout.tsx`)
 * to determine whether to mount `Web3Provider` immediately during SSR,
 * eliminating hydration mismatches and visual guest flashes for returning users.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('synarc_has_session', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('synarc_has_session');
  return response;
}
