"use client";

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useCircleWallet } from '@/hooks/useCircleWallet';
import { X, Loader2 } from 'lucide-react';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { login } = usePrivy();
  const { connectCircleWallet, loading, loadingStep } = useCircleWallet();
  const [emailInput, setEmailInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<'privy' | 'circle'>('privy');

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setEmailInput('');
      setTab('privy');
    }
  }, [isOpen]);

  const handleCircleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!emailInput || !emailInput.includes('@')) {
      setErrorMessage('Enter a valid email address.');
      return;
    }

    try {
      await connectCircleWallet(emailInput);
      if (typeof window !== 'undefined') {
        localStorage.setItem('synarc_wallet_type', 'circle');
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Connection failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-background-surface border border-border-thin rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Connect Wallet</h2>
            <p className="text-xs text-text-muted mt-0.5">Choose how to join SynArc</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-foreground/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="px-6 pb-4">
          <div className="flex rounded-lg bg-background-primary p-0.5 gap-0.5 border border-border-thin/40">
            <button
              onClick={() => setTab('privy')}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === 'privy'
                  ? 'bg-primary text-white shadow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Privy
            </button>
            <button
              onClick={() => setTab('circle')}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === 'circle'
                  ? 'bg-foreground/10 text-text-primary shadow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Circle Wallet
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {tab === 'privy' ? (
            <div className="space-y-4">
              <p className="text-xs text-text-secondary leading-relaxed">
                Sign in with email, Google, Twitter, Discord, or an existing wallet. Fast and secure.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['Email', 'Google', 'MetaMask', 'WalletConnect', 'Discord'].map((m) => (
                  <span
                    key={m}
                    className="px-2 py-0.5 rounded-full bg-foreground/5 border border-border-thin text-[10px] text-text-secondary font-medium"
                  >
                    {m}
                  </span>
                ))}
              </div>
              <button
                onClick={() => { login(); onClose(); }}
                className="w-full py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6d2fe0] text-white text-sm font-semibold transition-colors shadow-lg shadow-purple-900/30"
              >
                Continue with Privy
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-text-secondary leading-relaxed">
                Gasless governance with a native USDC wallet on Arc. Enter your email to connect.
              </p>

              {/* Error */}
              {errorMessage && (
                <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleCircleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-foreground/5 border border-border-thin focus:border-primary/50 outline-none text-sm text-text-primary placeholder:text-text-muted disabled:opacity-50 transition-colors"
                />

                {/* Loading state */}
                {loading && (
                  <div className="flex items-center gap-2 px-1 py-0.5">
                    <Loader2 className="w-3.5 h-3.5 text-text-muted animate-spin shrink-0" />
                    <span className="text-[11px] text-text-secondary">
                      {loadingStep || 'Connecting...'}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 border border-border-thin text-text-primary text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Connecting...' : 'Connect Circle Wallet'}
                </button>
              </form>

              <p className="text-[10px] text-text-muted text-center">
                First time? A wallet will be created on Arc Testnet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
