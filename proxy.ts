import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Production Domain Handling & SEO canonical redirection
  const host = request.headers.get('host');
  if (host && (host === 'synarc-dao.vercel.app' || host === 'synarcdao.xyz')) {
    const canonicalUrl = new URL(pathname + request.nextUrl.search, 'https://www.synarcdao.xyz');
    return NextResponse.redirect(canonicalUrl, 301);
  }

  // 2. Authentication & Protected Routes
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

// Route matcher configuration: Run on all document pages, exclude api, _next static assets, images, icons, sitemaps, and images
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.svg|.*\\.png|.*\\.jpeg|.*\\.jpg).*)',
  ],
};
