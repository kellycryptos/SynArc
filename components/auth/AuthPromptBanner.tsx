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
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:px-4 sm:py-3 mb-6 rounded-2xl bg-primary/5 border border-primary/15 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                Public Governance Explorer
              </p>
              <p className="text-xs text-muted mt-0.5 hidden sm:block truncate">
                You're browsing freely. Connect your wallet to {action}.
              </p>
            </div>
          </div>

          {/* Dismiss button visible on top right on mobile */}
          <button
            onClick={() => setDismissed(true)}
            className="sm:hidden p-1.5 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtitle visible on mobile */}
        <p className="text-xs text-muted sm:hidden leading-relaxed">
          You're browsing freely. Connect your wallet to {action}.
        </p>

        {/* Action button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={login}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 rounded-lg bg-gradient-to-r from-[#2F6FFF] to-[#4F8BFF] text-white text-xs font-semibold font-space hover:opacity-95 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(47,111,255,0.25)] cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Connect to Participate</span>
          </button>

          {/* Dismiss button visible on desktop */}
          <button
            onClick={() => setDismissed(true)}
            className="hidden sm:inline-flex p-1.5 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
