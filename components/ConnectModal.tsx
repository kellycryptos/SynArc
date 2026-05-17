"use client";

import { useState } from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { W3SSdk } from '@circle-fin/w3s-pw-web-sdk';
import { Mail, Wallet, X, Loader2 } from 'lucide-react';

export function ConnectModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { open } = useWeb3Modal();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleWalletConnect = () => {
    onClose();
    open();
  };

  const handleEmailConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      // 1. Authenticate with backend
      const response = await fetch('/api/auth/circle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID;
      if (!appId) {
        throw new Error('Circle App ID is not configured');
      }

      // 2. Initialize Circle Web SDK
      const sdk = new W3SSdk();
      sdk.setAppSettings({
        appId,
      });

      sdk.setAuthentication({
        userToken: data.userToken,
        encryptionKey: data.encryptionKey,
      });

      // 3. Execute challenge (if a challenge ID is returned)
      if (data.challengeId) {
        sdk.execute(data.challengeId, (error, result) => {
          if (error) {
            console.error('Circle SDK Error:', error);
            setError('Failed to complete wallet setup. ' + error.message);
          } else {
            console.log('Circle SDK Success:', result);
            onClose();
          }
        });
      } else {
        // Fallback if no challenge is needed or backend didn't provide one
        console.log('Authenticated successfully. No challenge required.');
        onClose();
      }

    } catch (err: unknown) {
      console.error('Circle Auth Error:', err);
      setError('Authentication is currently unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border border-border-thin rounded-2xl shadow-2xl p-6 overflow-hidden z-10 glass-elevated">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-muted hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-bold font-heading mb-2">Connect to SynArc</h2>
          <p className="text-muted text-sm">Join the agentic economy using your email or a Web3 wallet.</p>
        </div>

        <div className="space-y-6">
          {/* Email Flow */}
          <form onSubmit={handleEmailConnect} className="space-y-3">
            <label className="text-sm font-medium text-foreground">Sign in with Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface border border-border-thin rounded-xl outline-none focus:border-accent transition-colors text-sm"
                required
                disabled={loading}
              />
            </div>
            {error && <p className="text-danger text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 bg-foreground text-background rounded-xl font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue with Email'}
            </button>
          </form>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-border-thin"></div>
            <span className="flex-shrink-0 mx-4 text-muted text-sm">or</span>
            <div className="flex-grow border-t border-border-thin"></div>
          </div>

          {/* WalletConnect Flow */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Sign in with Wallet</label>
            <button
              onClick={handleWalletConnect}
              className="w-full py-3 bg-surface border border-border-thin hover:border-accent rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Wallet className="w-5 h-5 text-accent" />
              WalletConnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
