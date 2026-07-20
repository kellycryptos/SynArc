"use client";

import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { useCircleWallet } from '@/hooks/useCircleWallet';
import { useDeferredWeb3 } from '@/providers/DeferredWeb3Provider';

export function useAuth() {
  const deferred = useDeferredWeb3();

  // If Web3Provider has not been mounted yet (guest mode before idle/interaction),
  // return safe stub methods so calling useAuth() in guest UI components
  // never throws a React context error or triggers early Web3 SDK execution.
  if (deferred && !deferred.isMounted) {
    return {
      ready: true,
      isAuthenticated: false,
      user: null,
      login: deferred.mountWeb3AndLogin,
      logout: () => {},
      email: "",
      walletAddress: "",
      authMethod: "unknown" as const,
      linkWallet: () => {},
      unlinkWallet: () => {},
      isCircle: false,
    };
  }

  return useActiveAuth();
}

/**
 * Inner hook called only when Web3Provider is mounted in the React tree.
 */
function useActiveAuth() {
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

  // Sync session cookie with server whenever auth state changes
  useEffect(() => {
    if (!ready) return;
    if (isAuthenticated) {
      fetch('/api/auth/session-cookie', { method: 'POST' }).catch(() => {});
    } else {
      fetch('/api/auth/session-cookie', { method: 'DELETE' }).catch(() => {});
    }
  }, [ready, isAuthenticated]);

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
    fetch('/api/auth/session-cookie', { method: 'DELETE' }).catch(() => {});
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
