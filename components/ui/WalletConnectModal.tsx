"use client";

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useCircleWallet } from '@/hooks/useCircleWallet';
import { X, Shield, Zap, Mail, ArrowRight, Wallet, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { login } = usePrivy();
  const { connectCircleWallet, loading, error } = useCircleWallet();
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
      {/* Overlay Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="w-full max-w-xl bg-background-surface border border-border rounded-2xl shadow-2xl relative z-10 overflow-hidden glass-card p-6 md:p-8 animate-fade-in-up">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-muted hover:text-white hover:bg-white/5 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Connect Your Wallet</h2>
          <p className="text-sm text-muted max-w-sm mx-auto">
            Choose how you want to connect and participate in SynArc DAO governance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Privy Wallet Option */}
          <div className="flex flex-col justify-between p-5 rounded-2xl border border-border-thin bg-surface hover:border-primary/40 hover:bg-surface-elevated transition-all duration-300 group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface border border-border-thin text-muted">
                  Standard
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">Privy Account</h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Log in securely using Google, your email, or any external Web3 wallet (MetaMask, Rabby, Coinbase).
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                login();
                onClose();
              }}
              className="mt-6 w-full py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(124,58,237,0.15)] group-hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all"
            >
              <Wallet className="w-4 h-4" />
              Connect Privy
            </button>
          </div>

          {/* Circle Wallet Option */}
          <div className="flex flex-col justify-between p-5 rounded-2xl border border-border-thin bg-surface hover:border-pink-500/40 hover:bg-surface-elevated transition-all duration-300 group">
            <div className="space-y-4 w-full">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-pink-500/10 rounded-xl border border-pink-500/20 text-pink-400 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-pink-500/15 border border-pink-500/25 text-pink-400 animate-pulse">
                  ⚡ Gasless
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-pink-400 transition-colors">Circle Wallet</h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Create a secure, gasless programmable wallet. No gas tokens required for actions and CCTP bridge transfers.
                </p>
              </div>
            </div>

            <div className="mt-6 w-full">
              <AnimatePresence mode="wait">
                {!showCircleInput ? (
                  <motion.button
                    layoutId="circle-btn"
                    onClick={() => setShowCircleInput(true)}
                    className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    Connect Circle Wallet
                  </motion.button>
                ) : (
                  <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleCircleSubmit}
                    className="space-y-3"
                  >
                    <div className="relative">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="Enter email to connect"
                        required
                        disabled={loading}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background border border-border-thin focus:border-pink-500 outline-none text-xs text-white placeholder:text-muted disabled:opacity-50"
                      />
                      <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    {circleConnError && (
                      <div className="flex items-center gap-1.5 text-[10px] text-danger bg-danger/10 border border-danger/20 p-2 rounded-lg">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{circleConnError}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCircleInput(false)}
                        disabled={loading}
                        className="px-3 py-2 rounded-xl border border-border-thin text-muted text-xs hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? 'Connecting...' : 'Connect'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="border border-border-thin rounded-2xl overflow-hidden bg-surface/30">
          <div className="px-4 py-2.5 border-b border-border-thin bg-surface/50 text-[10px] uppercase font-bold text-muted tracking-wider text-center">
            Feature Comparison
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-thin/50 text-text-tertiary font-semibold">
                <th className="p-3 text-[10px] uppercase tracking-wider pl-4">Governance Feature</th>
                <th className="p-3 text-center text-primary font-bold">Privy Wallet</th>
                <th className="p-3 text-center text-pink-400 font-bold pr-4">Circle Wallet</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-thin/30 hover:bg-white/2 transition-colors">
                <td className="p-3 text-text-secondary pl-4">Gasless Governance Actions</td>
                <td className="p-3 text-center text-muted">Partial (sARC only)</td>
                <td className="p-3 text-center text-success font-bold flex justify-center items-center gap-1 pr-4">
                  <Check className="w-4 h-4" /> Full Gasless
                </td>
              </tr>
              <tr className="border-b border-border-thin/30 hover:bg-white/2 transition-colors">
                <td className="p-3 text-text-secondary pl-4">Native CCTP USDC Bridge</td>
                <td className="p-3 text-center text-muted">Bridge Kit Setup</td>
                <td className="p-3 text-center text-success font-bold flex justify-center items-center gap-1 pr-4">
                  <Check className="w-4 h-4" /> Native Gasless
                </td>
              </tr>
              <tr className="border-b border-border-thin/30 hover:bg-white/2 transition-colors">
                <td className="p-3 text-text-secondary pl-4">External Extensions (MetaMask)</td>
                <td className="p-3 text-center text-success font-bold flex justify-center items-center gap-1">
                  <Check className="w-4 h-4" /> Supported
                </td>
                <td className="p-3 text-center text-muted pr-4">❌ No</td>
              </tr>
              <tr className="hover:bg-white/2 transition-colors">
                <td className="p-3 text-text-secondary pl-4">Social/Email Login</td>
                <td className="p-3 text-center text-success font-bold flex justify-center items-center gap-1">
                  <Check className="w-4 h-4" /> Google/Email
                </td>
                <td className="p-3 text-center text-success font-bold flex justify-center items-center gap-1 pr-4">
                  <Check className="w-4 h-4" /> Email PIN
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
