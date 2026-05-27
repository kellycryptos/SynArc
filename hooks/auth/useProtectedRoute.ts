"use client";

import { useAuth } from './useAuth';

/**
 * useProtectedRoute — Auth state reader (no redirects).
 *
 * All dashboard routes are publicly accessible for browsing.
 * Auth is only required at the action level (vote, create proposal, deposit).
 *
 * This hook is kept for backward compatibility — components that previously
 * used it for isChecking/isAuthenticated still work without modification.
 */
export function useProtectedRoute() {
  const { isAuthenticated, ready } = useAuth();

  return {
    isChecking: !ready,
    isProtected: false, // All routes are public — no hard gating
    isAuthenticated,
  };
}
