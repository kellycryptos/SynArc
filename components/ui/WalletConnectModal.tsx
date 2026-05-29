"use client";

import { useState } from 'react';
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
  const { connectCircleWallet, loading } = useCircleWallet();
  const [emailInput, setEmailInput] = useState('');
  const [showCircleInput, setShowCircleInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCircleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Verify App ID and environment variables exist
    const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID;
    if (!appId || appId === 'mock_circle_app_id_123456' || appId.includes('your_')) {
      console.error('[Circle Auth] App ID environment variable is missing or unconfigured.');
      setErrorMessage('Circle Wallet is temporarily unavailable. Please try again later.');
      return;
    }

    if (!emailInput || !emailInput.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    try {
      // 2. Attempt usercontrolled wallet creation & session setup
      await connectCircleWallet(emailInput);
      
      // 3. Save explicitly on success
      if (typeof window !== 'undefined') {
        localStorage.setItem('synarc_wallet_type', 'circle');
      }
      
      onClose();
    } catch (err: any) {
      // 4. Log raw errors strictly in console & display clean fallback to user
      console.error('[Circle SDK Connection Error]:', err);
      setErrorMessage('Circle Wallet is temporarily unavailable. Please try again later.');
    }
  };

  const handleCircleInitCheck = () => {
    setErrorMessage(null);
    
    // Check App ID environment variables configuration
    const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID;
    if (!appId || appId === 'mock_circle_app_id_123456' || appId.includes('your_')) {
      console.error('[Circle Auth] Initialization Check Failed: App ID is unconfigured.');
      setErrorMessage('Circle Wallet is temporarily unavailable. Please try again later.');
      return;
    }
    
    setShowCircleInput(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Sleek Overlay Backdrop supporting light/dark theme opacity */}
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

        {/* Dynamic Error Messaging (No raw API leakage) */}
        {errorMessage && (
          <div className="p-3.5 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger flex items-start gap-2 mb-6 animate-fade-in-up">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="break-words w-full font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Two Options with Equal Card Sizes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
          
          {/* Option 1: Circle Wallet */}
          <div className="flex flex-col justify-between p-5 rounded-xl border border-card-border bg-surface hover:border-primary/30 transition-all duration-300 group">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>⭕</span>
                <span>Continue with Circle Wallet</span>
              </h3>
              
              <p className="text-[11px] text-muted leading-relaxed font-medium">
                Gasless governance and native USDC experience on Arc.
              </p>
            </div>

            <div className="mt-6">
              <AnimatePresence mode="wait">
                {!showCircleInput ? (
                  <button
                    onClick={handleCircleInitCheck}
                    className="w-full py-2.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
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
                        {loading ? 'Wait...' : 'Confirm'}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Option 2: Privy Wallet */}
          <div className="flex flex-col justify-between p-5 rounded-xl border border-card-border bg-surface hover:border-primary/30 transition-all duration-300 group">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>🔐</span>
                <span>Continue with Privy</span>
              </h3>

              <p className="text-[11px] text-muted leading-relaxed font-medium">
                Continue with email, Google, or an external wallet.
              </p>
            </div>

            <button
              onClick={() => {
                login();
                onClose();
              }}
              className="w-full py-2.5 rounded-lg bg-surface-elevated border border-card-border hover:border-primary/30 text-foreground text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all mt-6"
            >
              <span>Continue with Privy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
