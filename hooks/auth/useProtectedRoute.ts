"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './useAuth';

export function useProtectedRoute() {
  const { isAuthenticated, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // List of routes requiring active authentication
  const protectedRoutes = [
    '/dashboard',
    '/proposals',
    '/treasury',
    '/analytics',
    '/members',
    '/settings'
  ];

  const isProtected = protectedRoutes.some(route => 
    pathname === route || pathname?.startsWith(`${route}/`)
  );

  useEffect(() => {
    if (ready && !isAuthenticated && isProtected) {
      // If unauthorized, redirect to /dashboard which presents the inline Auth Gate
      if (pathname !== '/dashboard') {
        router.replace('/dashboard');
      }
    }
  }, [ready, isAuthenticated, isProtected, pathname, router]);

  return {
    isChecking: !ready,
    isProtected,
    isAuthenticated,
  };
}
