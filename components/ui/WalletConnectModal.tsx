"use client";

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useCircleWallet } from '@/hooks/useCircleWallet';
import { X, Mail, ArrowRight, Shield, Zap, AlertCircle } from 'lucide-react';
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
  const [circleConnError, setCircleConnError] = useState<string | null>(null);

  const handleCircleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setCircleConnError('Please enter a valid email address.');
      return;
    }
    setCircleConnError(null);
    try {
      await connectCircleWallet(emailInput);
      onClose();
    } catch (err: any) {
      setCircleConnError(err?.message || 'Failed to connect Circle wallet.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Sleek Overlay Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* Reduced Width Minimal Modal */}
      <div className="w-full max-w-sm bg-background-surface/90 border border-border-thin rounded-2xl shadow-2xl relative z-10 overflow-hidden glass p-6 animate-fade-in-up">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1 text-muted hover:text-white rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 mb-6 text-left pr-4">
          <h2 className="text-lg font-bold text-white tracking-tight">Choose how to continue</h2>
          <p className="text-xs text-muted leading-relaxed">
            Browse SynArc freely. Connect only when you want to participate.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4 mb-6">
          
          {/* Option 1: Circle Wallet (Primary) */}
          <div className="p-4 rounded-xl border border-pink-500/30 bg-pink-500/5 hover:border-pink-500/50 hover:bg-pink-500/10 transition-all duration-300 relative group overflow-hidden">
            <div className="absolute right-3 top-3">
              <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
                Recommended
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-pink-500/25 rounded-lg text-pink-400">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">Circle Wallet</h3>
              </div>
              
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Create a gasless Arc wallet using your email.
              </p>

              <AnimatePresence mode="wait">
                {!showCircleInput ? (
                  <button
                    onClick={() => setShowCircleInput(true)}
                    className="w-full py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all mt-2"
                  >
                    <span>Continue with Circle Wallet</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCircleSubmit}
                    className="space-y-2 mt-2"
                  >
                    <div className="relative">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="Enter your email"
                        required
                        disabled={loading}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-background border border-border-thin focus:border-pink-500 outline-none text-[11px] text-white placeholder:text-muted disabled:opacity-50 font-mono"
                      />
                      <Mail className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                    {circleConnError && (
                      <div className="flex items-center gap-1 text-[10px] text-danger bg-danger/10 border border-danger/20 p-2 rounded-lg">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{circleConnError}</span>
                      </div>
                    )}
                    <div className="flex gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setShowCircleInput(false)}
                        disabled={loading}
                        className="px-2.5 py-1.5 rounded-lg border border-border-thin text-muted hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? 'Connecting...' : 'Confirm'}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Option 2: Privy */}
          <div className="p-4 rounded-xl border border-border-thin bg-surface hover:border-primary/40 hover:bg-surface-elevated transition-all duration-300 group">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/15 rounded-lg text-primary">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">Privy Account</h3>
              </div>

              <p className="text-[11px] text-text-secondary leading-relaxed">
                Use Google, Email, or an existing wallet.
              </p>

              <button
                onClick={() => {
                  login();
                  onClose();
                }}
                className="w-full py-2 rounded-lg bg-surface-elevated border border-border-thin hover:border-primary/30 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all mt-2"
              >
                <span>Continue with Privy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <div className="border-t border-border-thin pt-4 space-y-2 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted/60">
            Wallet connection is only required for:
          </p>
          <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-muted/80 font-medium">
            <li className="flex items-center gap-1">
              <span className="text-primary">•</span> Creating proposals
            </li>
            <li className="flex items-center gap-1">
              <span className="text-primary">•</span> Voting
            </li>
            <li className="flex items-center gap-1">
              <span className="text-primary">•</span> Treasury actions
            </li>
            <li className="flex items-center gap-1">
              <span className="text-primary">•</span> Campaign contributions
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
