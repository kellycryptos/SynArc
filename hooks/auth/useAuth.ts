"use client";

import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { useCircleWallet } from '@/hooks/useCircleWallet';

export function useAuth() {
  const { 
    ready: privyReady, 
    authenticated: privyAuthenticated, 
    user: privyUser, 
    login: privyLogin, 
    logout: privyLogout,
    linkWallet,
    unlinkWallet,
  } = usePrivy();

  const { address: wagmiAddress } = useAccount();
  const { circleConnected, circleAddress, disconnectCircleWallet, userEmail } = useCircleWallet();

  const ready = privyReady;
  const isAuthenticated = privyAuthenticated || circleConnected;

  // Get the primary connected wallet address (Circle, Privy embedded, external, or Wagmi fallback)
  const walletAddress = circleAddress || privyUser?.wallet?.address || wagmiAddress || "";

  // Extract email address if user authenticated using social, email, or Circle
  const email = userEmail || privyUser?.email?.address || privyUser?.google?.email || "";

  // Determine primary authentication method
  let authMethod: "email" | "google" | "twitter" | "discord" | "wallet" | "circle" | "unknown" = "unknown";
  if (circleConnected) {
    authMethod = "circle";
  } else if (privyUser) {
    if (privyUser.google) authMethod = "google";
    else if (privyUser.twitter) authMethod = "twitter";
    else if (privyUser.discord) authMethod = "discord";
    else if (privyUser.email) authMethod = "email";
    else if (privyUser.wallet) authMethod = "wallet";
  }

  const logout = () => {
    if (circleConnected) {
      disconnectCircleWallet();
    } else {
      privyLogout();
    }
  };

  return {
    ready,
    isAuthenticated,
    user: privyUser,
    login: privyLogin,
    logout,
    email,
    walletAddress,
    authMethod,
    linkWallet,
    unlinkWallet,
    isCircle: circleConnected,
  };
}
