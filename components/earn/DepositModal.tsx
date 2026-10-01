"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Sparkles, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import type { EarnVault, DepositQuote } from "@/types/earn";

interface DepositModalProps {
  vault: EarnVault | null;
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (vaultAddress: string, amount: string) => Promise<any>;
  onGetQuote: (vaultAddress: string, amount: string) => Promise<DepositQuote | null>;
  isTransacting: boolean;
}

export function DepositModal({
  vault,
  isOpen,
  onClose,
  onDeposit,
  onGetQuote,
  isTransacting,
}: DepositModalProps) {
  const { balance: usdcBalance } = useUSDCBalance();
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<DepositQuote | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Reset state when vault changes or modal closes
  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setQuote(null);
      setQuoteError(null);
    }
  }, [isOpen]);

  // Debounced quote fetch
  useEffect(() => {
    if (!vault || !amount || parseFloat(amount) <= 0 || isNaN(Number(amount))) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    // Format check for App Kit (max 6 decimal places)
    const parts = amount.split(".");
    if (parts.length > 1 && parts[1].length > 6) {
      setQuoteError("Maximum 6 decimal places allowed for USDC");
      setQuote(null);
      return;
    }

    let active = true;
    setIsQuoting(true);
    setQuoteError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await onGetQuote(vault.vaultAddress, amount);
        if (active) setQuote(res);
      } catch (err: any) {
        if (active) setQuoteError(err?.message || "Unable to fetch deposit quote");
      } finally {
        if (active) setIsQuoting(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [amount, vault, onGetQuote]);

  if (!isOpen || !vault) return null;

  const handleMax = () => {
    if (!usdcBalance || usdcBalance === "0") return;
    // Format to max 6 decimals
    const num = parseFloat(usdcBalance);
    if (!isNaN(num) && num > 0) {
      setAmount(num.toFixed(6).replace(/\.?0+$/, ""));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || isTransacting) return;
    try {
      await onDeposit(vault.vaultAddress, amount);
      onClose();
    } catch {
      // Error handled via toast in useEarn
    }
  };

  const apyPercent = (vault.currentApy * 100).toFixed(2);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-[#0A0E17] border border-[#1E293B] rounded-2xl shadow-2xl p-6 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-[#F8FAFC]">Deposit into Vault</h3>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {apyPercent}% APY
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">{vault.name} ({vault.protocol})</p>
            </div>
            <button
              onClick={onClose}
              disabled={isTransacting}
              className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] rounded-lg hover:bg-[#1E293B] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Amount input */}
            <div>
              <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1.5">
                <span>Deposit Amount ({vault.asset})</span>
                <span className="cursor-pointer hover:text-primary transition-colors" onClick={handleMax}>
                  Wallet: <span className="text-[#F8FAFC] font-medium">{usdcBalance || "0.00"} {vault.asset}</span> (Max)
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  disabled={isTransacting}
                  className="w-full bg-[#05080F] border border-[#1E293B] rounded-xl px-4 py-3 text-lg font-mono text-[#F8FAFC] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all pr-20"
                />
                <button
                  type="button"
                  onClick={handleMax}
                  disabled={isTransacting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-1 rounded bg-[#1E293B] text-primary hover:bg-primary/20 transition-colors"
                >
                  MAX
                </button>
              </div>
              {quoteError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{quoteError}</span>
                </div>
              )}
            </div>

            {/* Live Quote Breakdown */}
            <div className="bg-[#05080F] border border-[#1E293B] rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span>Underlying Asset</span>
                <span className="text-[#F8FAFC] font-medium">{vault.asset}</span>
              </div>
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span>Current APY</span>
                <span className="text-emerald-400 font-semibold">{apyPercent}%</span>
              </div>
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span>Vault Share Price</span>
                <span className="text-[#F8FAFC] font-mono">
                  {isQuoting ? "Calculating..." : quote?.sharePrice ? `${quote.sharePrice} USDC` : "1.000000 USDC"}
                </span>
              </div>
              {quote?.expectedShares && (
                <div className="flex items-center justify-between text-[#94A3B8] pt-1 border-t border-[#1E293B]">
                  <span>Est. Vault Shares</span>
                  <span className="text-primary font-mono font-medium">
                    {parseFloat(quote.expectedShares.amount).toFixed(4)} shares
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span>Arc Gas Token</span>
                <span className="text-[#F8FAFC]">USDC (sub-second finality)</span>
              </div>
            </div>

            {/* Non-custodial security note */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10 text-xs text-blue-300">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Non-custodial: Your USDC deposits directly into the smart contract vault on Arc. You retain share ownership and can withdraw anytime.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isTransacting || isQuoting || !amount || parseFloat(amount) <= 0}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-semibold text-sm transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isTransacting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Deposit...</span>
                </>
              ) : isQuoting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching Quote...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Deposit {amount ? `${amount} USDC` : ""}</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
