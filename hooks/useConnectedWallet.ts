/**
 * useConnectedWallet — Unified wallet connection hook
 *
 * Treats both Wagmi (RainbowKit / Injected) and Circle Wallet as valid "connected" states.
 * Use this instead of useAccount() directly in pages/components that
 * need to work for ALL wallet types (Circle Wallet and Web3 wallets).
 */

"use client";

import { useAccount } from "wagmi";
import { useWallets } from "./useWallets";
import { useCircleWallet } from "./useCircleWallet";

export function useConnectedWallet() {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { wallets } = useWallets();

  // Circle Wallet state (stored in localStorage + React state)
  const { circleAddress, circleConnected, userEmail } = useCircleWallet();

  // Either Web3 Wallet OR Circle Wallet counts as fully connected
  const isConnected = wagmiConnected || circleConnected;
  const isCircle = circleConnected;
  const isWagmi = wagmiConnected;

  // Resolve wallet address — Circle takes priority if active
  const walletAddress: string =
    circleAddress ||
    wagmiAddress ||
    wallets?.[0]?.address ||
    "";

  // Resolve display email
  const email = userEmail || "";

  // Auth method label
  type AuthMethod = "circle" | "wallet" | "unknown";
  let authMethod: AuthMethod = "unknown";
  if (circleConnected) {
    authMethod = "circle";
  } else if (wagmiConnected) {
    authMethod = "wallet";
  }

  return {
    /** True when either Web3 Wallet OR Circle Wallet is connected */
    isConnected,
    /** True when connected via Web3 Wallet */
    isWagmi,
    /** Kept for backwards-compatibility */
    isPrivy: false,
    /** True when connected via Circle Wallet */
    isCircle,
    /** Resolved wallet address from whichever provider is active */
    walletAddress,
    /** Display email (Circle account email) */
    email,
    /** Which auth provider is active */
    authMethod,
    /** Kept for backwards-compatibility */
    privyUser: null,
    /** Wallet list */
    wallets,
    /** Ready state */
    privyReady: true,
  };
}
