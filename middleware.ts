import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Extract Privy session/authentication cookies
  const privyToken = request.cookies.get('privy-token')?.value;

  // Paths requiring active governance authentication
  const protectedPaths = [
    '/proposals',
    '/treasury',
    '/analytics',
    '/members',
    '/settings'
  ];

  // Check if current path matches any of the protected root paths or subpaths
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  // If unauthenticated and trying to access a protected deep-linked route, redirect to /dashboard
  if (isProtectedPath && !privyToken) {
    const dashboardGateUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardGateUrl);
  }

  return NextResponse.next();
}

// Limit the middleware execution to only the relevant protected route directories
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/proposals/:path*',
    '/treasury/:path*',
    '/analytics/:path*',
    '/members/:path*',
    '/settings/:path*',
  ],
};
