"use client";

import { ReactNode } from "react";

/**
 * WalletGuard — Demo/Frontend Phase
 *
 * Auth enforcement is temporarily disabled so users can freely browse
 * the governance dashboard without mandatory wallet connection.
 *
 * Privy infrastructure remains installed. The Connect button in the
 * navbar is still available as an optional action.
 *
 * To re-enable auth gating, restore the full WalletGuard logic here.
 */
export function WalletGuard({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
