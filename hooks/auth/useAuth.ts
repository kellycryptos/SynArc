"use client";

import { useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
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
      user: null as any,
      login: deferred.mountWeb3AndLogin,
      logout: () => {},
      email: "",
      walletAddress: "",
      authMethod: "unknown" as "email" | "google" | "twitter" | "discord" | "wallet" | "circle" | "unknown",
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
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { circleConnected, circleAddress, disconnectCircleWallet, userEmail } = useCircleWallet();

  const ready = true;
  const isAuthenticated = wagmiConnected || circleConnected;

  // Sync session cookie with server whenever auth state changes
  useEffect(() => {
    if (!ready) return;
    if (isAuthenticated) {
      fetch('/api/auth/session-cookie', { method: 'POST' }).catch(() => {});
    } else {
      fetch('/api/auth/session-cookie', { method: 'DELETE' }).catch(() => {});
    }
  }, [ready, isAuthenticated]);

  // Get the primary connected wallet address (Circle or Wagmi fallback)
  const walletAddress = circleAddress || wagmiAddress || "";

  // Extract email address if user authenticated using Circle
  const email = userEmail || "";

  type AuthMethod = "email" | "google" | "twitter" | "discord" | "wallet" | "circle" | "unknown";
  let authMethod: AuthMethod = "unknown";
  if (circleConnected) {
    authMethod = "circle";
  } else if (wagmiConnected) {
    authMethod = "wallet";
  }

  const login = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  const logout = () => {
    fetch('/api/auth/session-cookie', { method: 'DELETE' }).catch(() => {});
    if (circleConnected) {
      disconnectCircleWallet();
    }
    if (wagmiConnected) {
      disconnect();
    }
  };

  return {
    ready,
    isAuthenticated,
    user: null as any,
    login,
    logout,
    email,
    walletAddress,
    authMethod,
    linkWallet: () => {},
    unlinkWallet: () => {},
    isCircle: circleConnected,
  };
}

