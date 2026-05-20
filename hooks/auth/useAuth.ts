"use client";

import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';

export function useAuth() {
  const { 
    ready, 
    authenticated, 
    user, 
    login, 
    logout,
    linkWallet,
    unlinkWallet,
  } = usePrivy();

  const { address: wagmiAddress } = useAccount();

  // Get the primary connected wallet address (Privy embedded, external, or Wagmi fallback)
  const walletAddress = user?.wallet?.address || wagmiAddress || "";

  // Extract email address if user authenticated using social or email
  const email = user?.email?.address || user?.google?.email || "";

  // Determine primary authentication method
  let authMethod: "email" | "google" | "twitter" | "discord" | "wallet" | "unknown" = "unknown";
  if (user) {
    if (user.google) authMethod = "google";
    else if (user.twitter) authMethod = "twitter";
    else if (user.discord) authMethod = "discord";
    else if (user.email) authMethod = "email";
    else if (user.wallet) authMethod = "wallet";
  }

  return {
    ready,
    isAuthenticated: authenticated,
    user,
    login,
    logout,
    email,
    walletAddress,
    authMethod,
    linkWallet,
    unlinkWallet,
  };
}
