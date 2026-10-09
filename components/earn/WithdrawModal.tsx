"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ArrowDownCircle, AlertCircle, ShieldCheck } from "lucide-react";
import type { EarnPosition, WithdrawalQuote } from "@/types/earn";

interface WithdrawModalProps {
  position: EarnPosition | null;
  isOpen: boolean;
  onClose: () => void;
  onWithdraw: (vaultAddress: string, amount: string) => Promise<any>;
  onGetQuote: (vaultAddress: string, amount: string) => Promise<WithdrawalQuote | null>;
  isTransacting: boolean;
}

export function WithdrawModal({
  position,
  isOpen,
  onClose,
  onWithdraw,
  onGetQuote,
  isTransacting,
}: WithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<WithdrawalQuote | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setQuote(null);
      setQuoteError(null);
    }
  }, [isOpen]);

  // Debounced quote fetch
  useEffect(() => {
    if (!position || !amount || parseFloat(amount) <= 0 || isNaN(Number(amount))) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    const parts = amount.split(".");
    if (parts.length > 1 && parts[1].length > 6) {
      setQuoteError("Maximum 6 decimal places allowed");
      setQuote(null);
      return;
    }

    let active = true;
    setIsQuoting(true);
    setQuoteError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await onGetQuote(position.vaultAddress, amount);
        if (active) setQuote(res);
      } catch (err: any) {
        if (active) setQuoteError(err?.message || "Unable to fetch withdrawal quote");
      } finally {
        if (active) setIsQuoting(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [amount, position, onGetQuote]);

  if (!isOpen || !position) return null;

  const handleMax = () => {
    const bal = parseFloat(position.currentBalance);
    if (!isNaN(bal) && bal > 0) {
      setAmount(bal.toFixed(6).replace(/\.?0+$/, ""));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || isTransacting) return;
    try {
      await onWithdraw(position.vaultAddress, amount);
      onClose();
    } catch {
      // Error handled in hook toast
    }
  };

  const circleFee = quote?.fees?.find((f) => f.type === "circle");

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
              <h3 className="text-lg font-semibold text-[#F8FAFC]">Withdraw from Vault</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">{position.vaultName || "Morpho Vault"}</p>
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
                <span>Withdraw Amount ({position.asset})</span>
                <span className="cursor-pointer hover:text-primary transition-colors" onClick={handleMax}>
                  Deposited: <span className="text-[#F8FAFC] font-medium">{position.currentBalance} {position.asset}</span> (Max)
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
                <div className={`flex items-center gap-1.5 text-xs mt-1.5 ${quoteError.includes("exceeds") ? "text-amber-400" : "text-rose-400"}`}>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{quoteError}</span>
                </div>
              )}
            </div>

            {/* Live Quote Breakdown */}
            <div className="bg-[#05080F] border border-[#1E293B] rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span>Vault Shares to Redeem</span>
                <span className="text-[#F8FAFC] font-mono">
                  {isQuoting ? "Calculating..." : quote?.sharesToRedeem?.amount ? parseFloat(quote.sharesToRedeem.amount).toFixed(4) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span>Expected USDC Payout</span>
                <span className="text-emerald-400 font-semibold font-mono">
                  {quote?.withdrawal?.amount || amount || "0.00"} USDC
                </span>
              </div>
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span>Circle Protocol Fee</span>
                <span className="text-[#F8FAFC]">
                  {circleFee ? `${circleFee.amount} ${circleFee.symbol}` : "0 USDC (0%)"}
                </span>
              </div>
              {position.pnl?.totalYieldEarned && (
                <div className="flex items-center justify-between text-[#94A3B8] pt-1 border-t border-[#1E293B]">
                  <span>Accrued Yield So Far</span>
                  <span className="text-emerald-400 font-medium">
                    +{position.pnl.totalYieldEarned} USDC
                  </span>
                </div>
              )}
            </div>

            {/* Note */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-xs text-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                First-time vault redemption requires a share approval transaction automatically submitted alongside the withdrawal.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isTransacting || isQuoting || !amount || parseFloat(amount) <= 0}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isTransacting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Withdrawal...</span>
                </>
              ) : isQuoting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching Quote...</span>
                </>
              ) : (
                <>
                  <ArrowDownCircle className="w-4 h-4" />
                  <span>Redeem {amount ? `${amount} USDC` : ""}</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
