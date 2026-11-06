"use client";

import { useEffect, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useCircleWallet } from '@/hooks/useCircleWallet';

export const DEMO_WALLET_ADDRESS = "0x71C83893F37a57a15152a5EcebEAf5f8841B981e" as const;
export const DEMO_USER_EMAIL = "evaluator@synarc.io";

export function useAuth() {
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { circleConnected, circleAddress, disconnectCircleWallet, userEmail } = useCircleWallet();

  const [demoActive, setDemoActive] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDemoActive(localStorage.getItem("synarc_demo_wallet_active") === "true");
      const handler = () => {
        setDemoActive(localStorage.getItem("synarc_demo_wallet_active") === "true");
      };
      window.addEventListener("synarc_demo_wallet_changed", handler);
      return () => window.removeEventListener("synarc_demo_wallet_changed", handler);
    }
  }, []);

  const simulateDemoWallet = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("synarc_demo_wallet_active", "true");
      setDemoActive(true);
      window.dispatchEvent(new CustomEvent("synarc_demo_wallet_changed"));
      window.dispatchEvent(new CustomEvent("synarc_usdc_changed"));
    }
  };

  const disconnectDemoWallet = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("synarc_demo_wallet_active");
      setDemoActive(false);
      window.dispatchEvent(new CustomEvent("synarc_demo_wallet_changed"));
      window.dispatchEvent(new CustomEvent("synarc_usdc_changed"));
    }
  };

  const ready = true;
  const isAuthenticated = wagmiConnected || circleConnected || demoActive;

  // Sync session cookie with server whenever auth state changes
  useEffect(() => {
    if (!ready) return;
    if (isAuthenticated) {
      fetch('/api/auth/session-cookie', { method: 'POST' }).catch(() => {});
    } else {
      fetch('/api/auth/session-cookie', { method: 'DELETE' }).catch(() => {});
    }
  }, [ready, isAuthenticated]);

  // Get the primary connected wallet address (Circle, Wagmi, or Demo fallback)
  const walletAddress = circleAddress || wagmiAddress || (demoActive ? DEMO_WALLET_ADDRESS : "");

  // Extract email address if user authenticated using Circle or Demo
  const email = userEmail || (demoActive ? DEMO_USER_EMAIL : "");

  type AuthMethod = "email" | "google" | "twitter" | "discord" | "wallet" | "circle" | "unknown";
  let authMethod: AuthMethod = "unknown";
  if (circleConnected) {
    authMethod = "circle";
  } else if (wagmiConnected || demoActive) {
    authMethod = "wallet";
  }

  const login = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  const logout = () => {
    fetch('/api/auth/session-cookie', { method: 'DELETE' }).catch(() => {});
    if (demoActive) {
      disconnectDemoWallet();
    }
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
    isDemo: demoActive,
    simulateDemoWallet,
    disconnectDemoWallet,
    user: null as any,
    login,
    logout,
    email,
    walletAddress,
    authMethod: authMethod as AuthMethod,
    linkWallet: () => {},
    unlinkWallet: () => {},
    isCircle: circleConnected,
  };
}
