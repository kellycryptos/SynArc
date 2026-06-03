/**
 * useConnectedWallet — Unified wallet connection hook
 *
 * Treats both Privy and Circle Wallet as valid "connected" states.
 * Use this instead of usePrivy() directly in pages/components that
 * need to work for ALL wallet types (Privy embedded, external wallets,
 * and Circle Wallet).
 *
 * Circle Wallet does not register with wagmi or Privy, so hooks like
 * useAccount(), useWallets(), and usePrivy().authenticated will return
 * false/empty even when the user is connected via Circle. This hook
 * correctly unifies both states.
 */

"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useCircleWallet } from "./useCircleWallet";

export function useConnectedWallet() {
  // Privy authentication state
  const { authenticated, user, ready: privyReady } = usePrivy();
  const { wallets } = useWallets();

  // Circle Wallet state (stored in localStorage + React state)
  const { circleAddress, circleConnected, userEmail } = useCircleWallet();

  // Either Privy OR Circle Wallet counts as fully connected
  const isConnected = authenticated || circleConnected;
  const isPrivy = authenticated;
  const isCircle = circleConnected;

  // Resolve wallet address — Circle takes priority if active
  const walletAddress: string =
    circleAddress ||
    user?.wallet?.address ||
    wallets?.[0]?.address ||
    "";

  // Resolve display email
  const email =
    userEmail ||
    user?.email?.address ||
    user?.google?.email ||
    "";

  // Auth method label
  type AuthMethod = "circle" | "privy" | "unknown";
  let authMethod: AuthMethod = "unknown";
  if (circleConnected) {
    authMethod = "circle";
  } else if (authenticated) {
    authMethod = "privy";
  }

  return {
    /** True when either Privy OR Circle Wallet is connected */
    isConnected,
    /** True when connected via Privy (embedded or external wallet) */
    isPrivy,
    /** True when connected via Circle Wallet */
    isCircle,
    /** Resolved wallet address from whichever provider is active */
    walletAddress,
    /** Display email (Circle account email or Privy social email) */
    email,
    /** Which auth provider is active */
    authMethod,
    /** Privy user object (null for Circle users) */
    privyUser: user,
    /** Privy wallet list (empty for Circle users) */
    wallets,
    /** Whether Privy SDK has finished initializing */
    privyReady,
  };
}
