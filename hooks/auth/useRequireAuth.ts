"use client";

import { useAuth } from './useAuth';

/**
 * useRequireAuth — Action-level authentication gate.
 *
 * Use this to wrap governance actions (vote, create proposal, deposit).
 * If the user is not authenticated, it opens the Privy modal instead
 * of performing the action. If they are authenticated, the action runs.
 *
 * Usage:
 *   const { requireAuth } = useRequireAuth();
 *   <button onClick={() => requireAuth(() => castVote('For'))}>Vote For</button>
 */
export function useRequireAuth() {
  const { isAuthenticated, login, ready } = useAuth();

  /**
   * Wraps a governance action with an auth check.
   * - If authenticated: calls action() immediately.
   * - If not authenticated: opens Privy login modal.
   */
  const requireAuth = (action: () => void) => {
    if (!ready) return;
    if (!isAuthenticated) {
      login();
      return;
    }
    action();
  };

  /**
   * Async variant for async governance actions.
   */
  const requireAuthAsync = async (action: () => Promise<void>) => {
    if (!ready) return;
    if (!isAuthenticated) {
      login();
      return;
    }
    await action();
  };

  return {
    requireAuth,
    requireAuthAsync,
    isAuthenticated,
    ready,
  };
}
