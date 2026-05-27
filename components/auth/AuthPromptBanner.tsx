"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { Wallet, X, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AuthPromptBannerProps {
  /** What action requires auth — shown in the banner copy */
  action?: string;
}

/**
 * AuthPromptBanner — Non-blocking onboarding prompt for unauthenticated users.
 *
 * Shown at the top of action-heavy pages (Proposals, Treasury).
 * Users can dismiss it and continue browsing freely.
 * Disappears automatically once the user connects.
 */
export function AuthPromptBanner({ action = "vote or create proposals" }: AuthPromptBannerProps) {
  const { isAuthenticated, login, ready } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if authenticated, not ready, or dismissed
  if (!ready || isAuthenticated || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between gap-4 px-4 py-3 mb-6 rounded-2xl bg-primary/5 border border-primary/15 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Globe className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              Public Governance Explorer
            </p>
            <p className="text-xs text-muted mt-0.5 truncate">
              You're browsing freely. Connect your wallet to {action}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={login}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all shadow-[0_0_12px_rgba(124,58,237,0.2)] cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5" />
            Connect to Participate
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
