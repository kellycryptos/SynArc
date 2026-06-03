"use client";

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useCircleWallet } from '@/hooks/useCircleWallet';
import { X, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { login } = usePrivy();
  const { connectCircleWallet, loading, loadingStep } = useCircleWallet();
  const [emailInput, setEmailInput] = useState('');
  const [showCircleInput, setShowCircleInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [circleError, setCircleError] = useState(false);

  // Check Circle App ID configuration on mount/open, and reset previous error/input states
  useEffect(() => {
    if (isOpen) {
      setCircleError(false);
      setErrorMessage(null);
      setShowCircleInput(false);

      const rawAppId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID;
      const appId = !rawAppId || rawAppId === 'mock_circle_app_id_123456' || rawAppId.includes('your_')
        ? '21fe3b25-388d-5cbc-a14a-e62d92a6d2d8' // Resilient fallback to configured real App ID
        : rawAppId;

      if (!appId) {
        setCircleError(true);
      }
    }
  }, [isOpen]);

  const handleCircleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const rawAppId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID;
    const appId = !rawAppId || rawAppId === 'mock_circle_app_id_123456' || rawAppId.includes('your_')
      ? '21fe3b25-388d-5cbc-a14a-e62d92a6d2d8'
      : rawAppId;

    if (!appId) {
      console.error('[Circle Auth] App ID environment variable is missing.');
      setCircleError(true);
      setErrorMessage('Circle Wallet temporarily unavailable — use Privy instead.');
      return;
    }

    if (!emailInput || !emailInput.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    try {
      await connectCircleWallet(emailInput);
      if (typeof window !== 'undefined') {
        localStorage.setItem('synarc_wallet_type', 'circle');
      }
      onClose();
    } catch (err: any) {
      console.error('[Circle SDK Connection Error]:', err);
      setCircleError(true);
      setErrorMessage('Circle Wallet temporarily unavailable — use Privy instead.');
    }
  };

  const handleCircleInitCheck = () => {
    setErrorMessage(null);
    
    const rawAppId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID;
    const appId = !rawAppId || rawAppId === 'mock_circle_app_id_123456' || rawAppId.includes('your_')
      ? '21fe3b25-388d-5cbc-a14a-e62d92a6d2d8'
      : rawAppId;

    if (!appId) {
      console.error('[Circle Auth] Initialization Check Failed: App ID is missing.');
      setCircleError(true);
      setErrorMessage('Circle Wallet temporarily unavailable — use Privy instead.');
      return;
    }
    
    setShowCircleInput(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Sleek Overlay Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 dark:bg-background/90 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* Reduced Width Centered Modal (max-w-[520px]) */}
      <div className="w-full max-w-[520px] bg-card border border-card-border rounded-2xl shadow-2xl relative z-10 overflow-hidden glass-card p-6 md:p-8 animate-fade-in-up text-left">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-muted hover:text-foreground rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 mb-8">
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">Connect Wallet</h2>
          <p className="text-xs text-muted leading-relaxed font-semibold">
            Choose how you want to participate in SynArc governance.
          </p>
        </div>

        {/* Dynamic Error Messaging (No raw API leakage, clean and user-friendly) */}
        {errorMessage && errorMessage !== 'Circle Wallet temporarily unavailable — use Privy instead.' && (
          <div className="p-3.5 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger flex items-start gap-2 mb-6 animate-fade-in-up">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="break-words w-full font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Two Options with Privy Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
          
          {/* Option 1 (Recommended & Primary): Privy Wallet */}
          <div className="flex flex-col justify-between p-5 rounded-xl border-2 border-primary/40 bg-gradient-to-b from-primary/[0.04] to-transparent relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />

            <div className="space-y-3">
              <div className="flex items-center">
                <span className="px-2 py-0.5 rounded bg-primary/20 border border-primary/30 text-[9px] font-extrabold uppercase text-purple-300 tracking-wider select-none">
                  Recommended
                </span>
              </div>

              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="text-primary">🔐</span>
                <span>Continue with Privy</span>
              </h3>

              <p className="text-[11px] text-muted leading-relaxed font-medium">
                The fastest and most reliable way to sign in. Supports:
              </p>

              <div className="flex flex-wrap gap-1 pt-1">
                {['📧 Email', '🌐 Google', '🦊 MetaMask', '🔗 WalletConnect'].map((badge) => (
                  <span key={badge} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-border-thin text-text-secondary font-medium">
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                login();
                onClose();
              }}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all mt-6 shadow-[0_0_15px_rgba(124,58,237,0.2)]"
            >
              <span>Connect with Privy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Option 2: Circle Wallet */}
          <div className={`flex flex-col justify-between p-5 rounded-xl border ${circleError ? 'border-amber-500/20 bg-amber-500/[0.01]' : 'border-card-border hover:border-primary/30'} bg-surface transition-all duration-300 group`}>
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>⭕</span>
                <span>Circle Developer Wallet</span>
              </h3>
              
              <p className="text-[11px] text-muted leading-relaxed font-medium">
                Gasless governance actions and native USDC stablecoin allocations built on Arc.
              </p>

              {/* Circle Down User Warning */}
              {circleError && (
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] text-amber-400 leading-normal flex items-start gap-1.5 animate-fade-in-up mt-2 font-medium">
                  <span className="shrink-0">⚠️</span>
                  <span>Circle temporarily unavailable — use Privy instead.</span>
                </div>
              )}
            </div>

            <div className="mt-6">
              <AnimatePresence mode="wait">
                {circleError ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-lg bg-surface-elevated border border-border-thin text-muted text-[11px] font-bold flex items-center justify-center gap-1 cursor-not-allowed opacity-50"
                  >
                    <span>Temporarily Offline</span>
                  </button>
                ) : !showCircleInput ? (
                  <button
                    onClick={handleCircleInitCheck}
                    className="w-full py-2.5 rounded-lg bg-pink-600/10 border border-pink-500/20 hover:bg-pink-600/20 text-pink-400 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <span>Continue with Circle</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCircleSubmit}
                    className="space-y-2"
                  >
                    <div className="relative">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="Enter email"
                        required
                        disabled={loading}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-background border border-card-border focus:border-pink-500 outline-none text-[11px] text-foreground placeholder:text-muted disabled:opacity-50 font-mono"
                      />
                      <Mail className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                    {loading && (
                      <div className="text-[9px] text-pink-400 font-semibold flex items-center gap-1.5 animate-pulse py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping shrink-0" />
                        <span>{loadingStep || 'Connecting to Circle...'}</span>
                      </div>
                    )}
                    <div className="flex gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setShowCircleInput(false)}
                        disabled={loading}
                        className="px-2 py-1.5 rounded-lg border border-card-border text-muted hover:text-foreground transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {loading ? 'Processing...' : 'Confirm'}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
