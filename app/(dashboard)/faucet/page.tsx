"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Coins,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";

// ─── Constants ────────────────────────────────────────────────────────────────
const COOLDOWN_KEY = "synarc_faucet_last_claim";
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

type ClaimStatus = "idle" | "loading" | "success" | "error" | "cooldown";

// ─── Cooldown Timer Component ─────────────────────────────────────────────────
function CooldownTimer({ nextClaimAt }: { nextClaimAt: string }) {
  const [display, setDisplay] = useState("--:--:--");

  useEffect(() => {
    const update = () => {
      const remaining = new Date(nextClaimAt).getTime() - Date.now();
      if (remaining <= 0) {
        setDisplay("00:00:00");
        return;
      }
      const h = Math.floor(remaining / 3_600_000);
      const m = Math.floor((remaining % 3_600_000) / 60_000);
      const s = Math.floor((remaining % 60_000) / 1000);
      setDisplay(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [nextClaimAt]);

  return (
    <span className="font-mono text-sm font-bold text-primary tabular-nums">
      {display}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FaucetPage() {
  const { isAuthenticated, walletAddress, login } = useAuth();

  const [synStatus, setSynStatus] = useState<ClaimStatus>("idle");
  const [synMsg, setSynMsg] = useState("");
  const [synTxHash, setSynTxHash] = useState("");
  const [nextClaimAt, setNextClaimAt] = useState<string | null>(null);

  // ─── Check localStorage cooldown on mount ─────────────────────────────────
  useEffect(() => {
    if (!walletAddress) return;
    const stored = localStorage.getItem(`${COOLDOWN_KEY}_${walletAddress.toLowerCase()}`);
    if (stored) {
      const nextAt = new Date(parseInt(stored) + COOLDOWN_MS).toISOString();
      if (new Date(nextAt).getTime() > Date.now()) {
        setSynStatus("cooldown");
        setNextClaimAt(nextAt);
      }
    }
  }, [walletAddress]);

  // ─── Also fetch server-side cooldown status ────────────────────────────────
  useEffect(() => {
    if (!walletAddress) return;
    fetch(`/api/faucet?wallet=${walletAddress}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.eligible && data.nextClaimAt) {
          setSynStatus("cooldown");
          setNextClaimAt(data.nextClaimAt);
        }
      })
      .catch(() => {});
  }, [walletAddress]);

  // ─── Claim SYN Token ──────────────────────────────────────────────────────
  const handleClaimSYN = async () => {
    if (!walletAddress) {
      login();
      return;
    }
    setSynStatus("loading");
    setSynMsg("");
    setSynTxHash("");

    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress }),
      });
      const data = await res.json();

      if (res.status === 429) {
        // Already claimed
        setSynStatus("cooldown");
        setNextClaimAt(data.nextClaimAt || null);
        setSynMsg(data.cooldown ? `Next claim in ${data.cooldown}` : "Already claimed today.");
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Faucet request failed.");
      }

      // Success — store timestamp in localStorage
      localStorage.setItem(
        `${COOLDOWN_KEY}_${walletAddress.toLowerCase()}`,
        String(Date.now())
      );
      setNextClaimAt(new Date(Date.now() + COOLDOWN_MS).toISOString());
      setSynStatus("success");
      setSynMsg(data.message || "1 SYN Token sent to your wallet!");
      setSynTxHash(data.txHash || "");
    } catch (err: any) {
      setSynStatus("error");
      setSynMsg(err.message || "Something went wrong. Please try again.");
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
          <Zap className="w-3.5 h-3.5" />
          <span>Testnet Faucet</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Get Testnet Tokens
        </h1>
        <p className="text-muted leading-relaxed max-w-2xl">
          Fund your wallet with testnet tokens to participate in SynArc governance.
          SYN tokens give you voting power; USDC and EURC let you deposit into the treasury.
        </p>
      </div>

      {/* Token Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* ── SynArc Token (SYN) ─────────────────────────────────────────── */}
        <GlassCard className="p-6 flex flex-col gap-5 border border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent relative overflow-hidden">
          {/* Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center text-xl font-extrabold text-purple-300 shadow-[0_0_20px_rgba(124,58,237,0.2)]">
              ⚡
            </div>
            <div>
              <h2 className="font-extrabold text-white text-lg leading-tight">SynArc Token</h2>
              <p className="text-xs text-muted font-mono">SYN · 1 per day</p>
            </div>
          </div>

          <p className="text-sm text-muted leading-relaxed flex-1">
            SYN is the governance token for SynArc. Hold SYN to earn voting power on proposals.
          </p>

          {/* Status messages */}
          {synStatus === "success" && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-success/10 border border-success/20 text-success text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p>{synMsg}</p>
                {synTxHash && (
                  <a
                    href={`https://testnet.arcscan.app/tx/${synTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-success/80 hover:text-success underline underline-offset-2"
                  >
                    View on explorer <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {synStatus === "error" && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{synMsg}</p>
            </div>
          )}

          {synStatus === "cooldown" && nextClaimAt && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-elevated border border-border-thin text-xs">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-muted font-medium">Next claim in</span>
                <CooldownTimer nextClaimAt={nextClaimAt} />
              </div>
            </div>
          )}

          {/* CTA Button */}
          {synStatus === "cooldown" ? (
            <button
              disabled
              className="w-full py-3 rounded-xl bg-surface border border-border-thin text-muted font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
            >
              <Clock className="w-4 h-4" />
              Claimed Today
            </button>
          ) : synStatus === "success" ? (
            <button
              disabled
              className="w-full py-3 rounded-xl bg-success/10 border border-success/20 text-success font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              Token Sent!
            </button>
          ) : (
            <button
              id="faucet-syn-btn"
              onClick={handleClaimSYN}
              disabled={synStatus === "loading"}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {synStatus === "loading" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending Token...
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4" />
                  {isAuthenticated ? "Claim 1 SYN Token" : "Connect Wallet to Claim"}
                </>
              )}
            </button>
          )}
        </GlassCard>

        {/* ── USDC Testnet ────────────────────────────────────────────────── */}
        <GlassCard className="p-6 flex flex-col gap-5 border border-arc-blue/20 bg-gradient-to-br from-arc-blue/[0.03] to-transparent relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-arc-blue/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-400/20 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              💵
            </div>
            <div>
              <h2 className="font-extrabold text-white text-lg leading-tight">USDC Testnet</h2>
              <p className="text-xs text-muted font-mono">Circle Faucet</p>
            </div>
          </div>

          <p className="text-sm text-muted leading-relaxed flex-1">
            Get free testnet USDC from Circle's official faucet. Use it to deposit into the
            SynArc treasury and participate in treasury governance.
          </p>

          <div className="p-3 rounded-xl bg-surface-elevated border border-border-thin text-xs text-muted space-y-1">
            <p className="font-semibold text-foreground/70">How to claim USDC:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-muted/80">
              <li>Visit faucet.circle.com</li>
              <li>Connect your wallet</li>
              <li>Select Arc Testnet &amp; USDC</li>
              <li>Request tokens</li>
            </ol>
          </div>

          <a
            id="faucet-usdc-btn"
            href="https://faucet.circle.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl bg-blue-500/10 border border-blue-400/20 text-blue-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-500/20 hover:border-blue-400/40 transition-all cursor-pointer"
          >
            Claim USDC
            <ArrowRight className="w-4 h-4" />
          </a>
        </GlassCard>

        {/* ── EURC Testnet ─────────────────────────────────────────────────── */}
        <GlassCard className="p-6 flex flex-col gap-5 border border-purple-400/20 bg-gradient-to-br from-purple-500/[0.03] to-transparent relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-400/20 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              🟣
            </div>
            <div>
              <h2 className="font-extrabold text-white text-lg leading-tight">EURC Testnet</h2>
              <p className="text-xs text-muted font-mono">Circle Faucet</p>
            </div>
          </div>

          <p className="text-sm text-muted leading-relaxed flex-1">
            Get free testnet EURC from Circle's official faucet. EURC is the Euro-pegged stablecoin
            accepted by the SynArc treasury.
          </p>

          <div className="p-3 rounded-xl bg-surface-elevated border border-border-thin text-xs text-muted space-y-1">
            <p className="font-semibold text-foreground/70">How to claim EURC:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-muted/80">
              <li>Visit faucet.circle.com</li>
              <li>Connect your wallet</li>
              <li>Select Arc Testnet &amp; EURC</li>
              <li>Request tokens</li>
            </ol>
          </div>

          <a
            id="faucet-eurc-btn"
            href="https://faucet.circle.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl bg-purple-500/10 border border-purple-400/20 text-purple-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-purple-500/20 hover:border-purple-400/40 transition-all cursor-pointer"
          >
            Claim EURC
            <ArrowRight className="w-4 h-4" />
          </a>
        </GlassCard>
      </div>

      {/* Info Banner */}
      <GlassCard className="p-5 border border-border-thin">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">These are testnet tokens only</p>
            <p className="text-sm text-muted leading-relaxed">
              All tokens here are for Arc Testnet and have no real-world monetary value.
              They exist purely for testing and governance participation during the testnet phase.
              SYN tokens reset whenever the contracts are redeployed.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
