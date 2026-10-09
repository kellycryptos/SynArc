"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { TokenIcon } from "@/components/ui/TokenIcon";
import {
  Coins,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  FilePlus2,
  Vote,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useToken } from "@/hooks/useToken";
import { useUSDCBalance, invalidateUSDCBalance } from "@/hooks/useUSDCBalance";
import { useEURCBalance } from "@/hooks/useEURCBalance";
import { useWallets } from "@/hooks/useWallets";
import { getAuthenticatedClient, getAggressiveGasParams, waitForTransaction } from "@/lib/tx-helper";
import { ARC_CHAIN, CONTRACTS } from "@/lib/arc-config";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { BridgeModal } from "@/components/BridgeModal";
import { toast } from "react-hot-toast";

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
  const { isArcMainnet, isArcTestnet, explorerUrl, networkName } = useArcNetwork();

  const [sarcStatus, setSarcStatus] = useState<ClaimStatus>("idle");
  const [sarcMsg, setSarcMsg] = useState("");
  const [sarcTxHash, setSarcTxHash] = useState("");
  const [nextClaimAt, setNextClaimAt] = useState<string | null>(null);
  const [showBridgeModal, setShowBridgeModal] = useState(false);

  const { needsDelegation, sarcBalance, votingPower, refetch: refetchToken } = useToken(walletAddress);
  const { balance: usdcBalance, loading: usdcLoading, refetch: refetchUSDC } = useUSDCBalance(walletAddress);
  const { balance: eurcBalance, loading: eurcLoading, refetch: refetchEURC } = useEURCBalance(walletAddress);
  const { wallets } = useWallets();
  const [delegating, setDelegating] = useState(false);

  const currentNetwork = isArcMainnet ? "mainnet" : "testnet";
  const claimAmount = isArcMainnet ? 10 : 1000;

  const handleDelegate = async () => {
    if (!walletAddress) return;
    setDelegating(true);
    try {
      const { walletClient, publicClient, address } = await getAuthenticatedClient(wallets, ARC_CHAIN.id, walletAddress);

      const SARC_DELEGATE_ABI = [{
        name: "delegate",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "delegatee", type: "address" }],
        outputs: []
      }] as const;

      const SARC_ADDRESS = CONTRACTS.token;
      const gasParams = await getAggressiveGasParams(publicClient);

      toast.loading("Activating voting power (self-delegating)...");
      const tx = await walletClient.writeContract({
        address: SARC_ADDRESS,
        abi: SARC_DELEGATE_ABI,
        functionName: "delegate",
        args: [address],
        gas: 150000n,
        ...gasParams
      });

      await waitForTransaction(publicClient, tx);
      toast.dismiss();
      toast.success("Voting power activated! You are ready to create proposals and vote.");
      await refetchToken();
    } catch (err: any) {
      console.error("Delegation failed:", err);
      toast.dismiss();
      toast.error(err.message || "Failed to delegate voting power");
    } finally {
      setDelegating(false);
    }
  };

  // ─── Check localStorage cooldown on mount ─────────────────────────────────
  useEffect(() => {
    if (!walletAddress) return;
    const storageKey = `${COOLDOWN_KEY}_${currentNetwork}_${walletAddress.toLowerCase()}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const nextAt = new Date(parseInt(stored) + COOLDOWN_MS).toISOString();
      if (new Date(nextAt).getTime() > Date.now()) {
        setSarcStatus("cooldown");
        setNextClaimAt(nextAt);
      } else {
        setSarcStatus("idle");
        setNextClaimAt(null);
      }
    } else {
      setSarcStatus("idle");
      setNextClaimAt(null);
    }
  }, [walletAddress, currentNetwork]);

  // ─── Fetch server-side cooldown status ────────────────────────────────────
  useEffect(() => {
    if (!walletAddress) return;
    fetch(`/api/faucet?wallet=${walletAddress}&network=${currentNetwork}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.eligible && data.nextClaimAt) {
          setSarcStatus("cooldown");
          setNextClaimAt(data.nextClaimAt);
        }
      })
      .catch(() => {});
  }, [walletAddress, currentNetwork]);

  // ─── Claim sARC Token ──────────────────────────────────────────────────────
  const handleClaimSarc = async () => {
    if (!walletAddress) {
      login();
      return;
    }
    setSarcStatus("loading");
    setSarcMsg("");
    setSarcTxHash("");

    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          wallet: walletAddress,
          network: currentNetwork,
        }),
      });
      const data = await res.json();

      if (res.status === 429) {
        setSarcStatus("cooldown");
        setNextClaimAt(data.nextClaimAt || null);
        setSarcMsg(data.cooldown ? `Next claim in ${data.cooldown}` : "Already claimed today.");
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Faucet claim failed.");
      }

      // Store in localStorage
      const storageKey = `${COOLDOWN_KEY}_${currentNetwork}_${walletAddress.toLowerCase()}`;
      localStorage.setItem(storageKey, String(Date.now()));
      setNextClaimAt(new Date(Date.now() + COOLDOWN_MS).toISOString());
      setSarcStatus("success");
      setSarcMsg(data.message || `${claimAmount} sARC sent to your wallet!`);
      setSarcTxHash(data.txHash || "");
      invalidateUSDCBalance();
      await Promise.allSettled([
        refetchToken(),
        refetchUSDC(),
        refetchEURC(),
      ]).catch(() => {});

    } catch (err: any) {
      setSarcStatus("error");
      setSarcMsg(err.message || "Something went wrong. Please try again.");
      toast.error(err.message || "Failed to claim sARC");
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
          <Zap className="w-3.5 h-3.5" />
          <span>{isArcMainnet ? "Arc Mainnet Community Faucet" : "Arc Testnet Faucet"}</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {isArcMainnet ? "Claim 10 sARC for Mainnet Governance" : "Get Testnet Tokens"}
        </h1>
        <p className="text-muted leading-relaxed max-w-2xl">
          {isArcMainnet
            ? "Claim 10 sARC tokens to create proposals and vote on Arc Mainnet. Hold and delegate sARC to unlock full DAO participation."
            : "Fund your wallet with testnet tokens to participate in Syn DAO governance on Arc Testnet."}
        </p>
      </div>

      {/* Mainnet Active Notice */}
      {isArcMainnet ? (
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-300">Arc Mainnet (Chain 5042) Active</p>
              <p className="text-xs text-emerald-200/80">
                You can claim 10 sARC tokens once every 24 hours to participate in mainnet governance, open proposals, and vote.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/proposals/create"
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs transition-colors flex items-center gap-1"
            >
              <FilePlus2 className="w-3.5 h-3.5" /> Create Proposal
            </Link>
          </div>
        </div>
      ) : null}

      {/* Token Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* ── SynDAO Token (sARC) ─────────────────────────────────────────── */}
        <GlassCard className="p-6 flex flex-col gap-5 border border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent relative overflow-hidden">
          {/* Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center p-2 shadow-[0_0_20px_rgba(124,58,237,0.2)]">
              <TokenIcon symbol="sARC" size={32} />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-lg leading-tight">Syn DAO Token</h2>
              <p className="text-xs text-muted font-mono">
                sARC · {claimAmount} per claim ({isArcMainnet ? "Mainnet" : "Testnet"})
              </p>
            </div>
          </div>

          <p className="text-sm text-muted leading-relaxed flex-1">
            sARC is the governance token for Syn DAO. Hold and self-delegate sARC to unlock voting power and proposal creation rights.
          </p>

          {/* Current balance indicator */}
          {isAuthenticated && (
            <div className="p-3 rounded-xl bg-surface border border-border-thin flex items-center justify-between text-xs">
              <span className="text-muted">Your Holdings:</span>
              <span className="font-mono font-bold text-white">
                {sarcBalance.toLocaleString()} sARC
                {votingPower > 0 ? (
                  <span className="text-emerald-400 ml-1.5 font-sans font-semibold">({votingPower} votes active)</span>
                ) : sarcBalance > 0 ? (
                  <span className="text-amber-400 ml-1.5 font-sans font-semibold">(Not delegated)</span>
                ) : null}
              </span>
            </div>
          )}

          {/* Status messages */}
          {sarcStatus === "success" && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-success/10 border border-success/20 text-success text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p>{sarcMsg}</p>
                {sarcTxHash && (
                  <a
                    href={`${explorerUrl}/tx/${sarcTxHash}`}
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

          {sarcStatus === "error" && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{sarcMsg}</p>
            </div>
          )}

          {sarcStatus === "cooldown" && nextClaimAt && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-elevated border border-border-thin text-xs">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-muted font-medium">Next claim in</span>
                <CooldownTimer nextClaimAt={nextClaimAt} />
              </div>
            </div>
          )}

          {/* Delegation Action Notice */}
          {sarcBalance > 0 && needsDelegation && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold flex flex-col gap-2.5 animate-fade-in-up">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-300">Activate Voting Power</p>
                  <p className="text-[11px] text-muted leading-relaxed font-medium">
                    You have {sarcBalance.toLocaleString()} sARC! Run 1-click self-delegation so the Governor contract can count your votes.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDelegate}
                disabled={delegating}
                className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {delegating ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3" />
                    Activate Voting Power (Self-Delegate)
                  </>
                )}
              </button>
            </div>
          )}

          {/* Quick Actions if already has voting power */}
          {votingPower > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/proposals/create"
                className="py-2 px-3 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary font-bold text-xs flex items-center justify-center gap-1 text-center transition-all"
              >
                <FilePlus2 className="w-3.5 h-3.5" /> New Proposal
              </Link>
              <Link
                href="/proposals"
                className="py-2 px-3 rounded-lg bg-surface border border-border-thin hover:border-primary/40 text-text-primary font-bold text-xs flex items-center justify-center gap-1 text-center transition-all"
              >
                <Vote className="w-3.5 h-3.5" /> Vote Now
              </Link>
            </div>
          )}

          {/* CTA Button */}
          {sarcStatus === "cooldown" ? (
            <button
              disabled
              className="w-full py-3 rounded-xl bg-surface border border-border-thin text-muted font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
            >
              <Clock className="w-4 h-4" />
              Claimed Today
            </button>
          ) : sarcStatus === "success" ? (
            <button
              disabled
              className="w-full py-3 rounded-xl bg-success/10 border border-success/20 text-success font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              {claimAmount} sARC Sent!
            </button>
          ) : (
            <button
              id="faucet-sarc-btn"
              onClick={handleClaimSarc}
              disabled={sarcStatus === "loading"}
              className="w-full py-3 rounded-xl bg-accent-purple text-white-keep font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent-purple/90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {sarcStatus === "loading" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending {claimAmount} sARC...
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4" />
                  {isAuthenticated ? `Claim ${claimAmount} sARC Tokens` : "Connect Wallet to Claim"}
                </>
              )}
            </button>
          )}
        </GlassCard>

        {/* ── USDC Card ────────────────────────────────────────────────── */}
        <GlassCard className="p-6 flex flex-col gap-5 border border-arc-blue/20 bg-gradient-to-br from-arc-blue/[0.03] to-transparent relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-arc-blue/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-400/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              <TokenIcon symbol="USDC" size={32} />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-lg leading-tight">
                {isArcMainnet ? "USDC Gas & Treasury" : "USDC Testnet"}
              </h2>
              <p className="text-xs text-muted font-mono">
                {isArcMainnet ? "Arc Native Currency" : "Circle Faucet"}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted leading-relaxed flex-1">
            {isArcMainnet
              ? "On Arc Mainnet, USDC functions as the native gas token. You can bridge USDC seamlessly to fund proposal execution or treasury deposits."
              : "Get free testnet USDC from Circle's official faucet. Use it to deposit into the Syn DAO treasury and participate in treasury governance."}
          </p>

          {/* Current balance indicator */}
          {isAuthenticated && (
            <div className="p-3 rounded-xl bg-surface border border-border-thin flex items-center justify-between text-xs">
              <span className="text-muted">Your Holdings:</span>
              <span className="font-mono font-bold text-white">
                {usdcLoading && (!usdcBalance || usdcBalance === "0.00") ? "..." : `${parseFloat(usdcBalance || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`}
              </span>
            </div>
          )}

          {isArcMainnet ? (
            <button
              onClick={() => {
                if (!isAuthenticated) login();
                else setShowBridgeModal(true);
              }}
              className="w-full py-3 rounded-xl bg-blue-500/10 border border-blue-400/20 text-blue-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-500/20 hover:border-blue-400/40 transition-all cursor-pointer"
            >
              Bridge USDC to Arc
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <a
              id="faucet-usdc-btn"
              href="https://faucet.circle.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-blue-500/10 border border-blue-400/20 text-blue-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-500/20 hover:border-blue-400/40 transition-all cursor-pointer"
            >
              Claim USDC from Circle
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </GlassCard>

        {/* ── EURC Card ─────────────────────────────────────────────────── */}
        <GlassCard className="p-6 flex flex-col gap-5 border border-purple-400/20 bg-gradient-to-br from-purple-500/[0.03] to-transparent relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-400/20 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              <TokenIcon symbol="EURC" size={32} />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-lg leading-tight">EURC Stablecoin</h2>
              <p className="text-xs text-muted font-mono">{isArcMainnet ? "Treasury Currency" : "Circle Faucet"}</p>
            </div>
          </div>

          <p className="text-sm text-muted leading-relaxed flex-1">
            {isArcMainnet
              ? "EURC is the Euro-pegged stablecoin accepted by the Syn DAO Treasury for multi-currency grants and international payouts."
              : "Get free testnet EURC from Circle's official faucet. EURC is the Euro-pegged stablecoin accepted by the Syn DAO treasury."}
          </p>

          {/* Current balance indicator */}
          {isAuthenticated && (
            <div className="p-3 rounded-xl bg-surface border border-border-thin flex items-center justify-between text-xs">
              <span className="text-muted">Your Holdings:</span>
              <span className="font-mono font-bold text-white">
                {eurcLoading && (!eurcBalance || eurcBalance === "0.00") ? "..." : `${parseFloat(eurcBalance || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EURC`}
              </span>
            </div>
          )}

          {isArcMainnet ? (
            <Link
              href="/treasury"
              className="w-full py-3 rounded-xl bg-purple-500/10 border border-purple-400/20 text-purple-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-purple-500/20 hover:border-purple-400/40 transition-all cursor-pointer"
            >
              View Treasury Holdings
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <a
              id="faucet-eurc-btn"
              href="https://faucet.circle.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-purple-500/10 border border-purple-400/20 text-purple-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-purple-500/20 hover:border-purple-400/40 transition-all cursor-pointer"
            >
              Claim EURC from Circle
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </GlassCard>
      </div>

      {/* Info Banner */}
      <GlassCard className="p-5 border border-border-thin">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">
              {isArcMainnet ? "Arc Mainnet Governance Rules" : "These are testnet tokens only"}
            </p>
            <p className="text-sm text-muted leading-relaxed">
              {isArcMainnet
                ? "A minimum of 1 sARC token is required to submit a governance proposal. To vote on an active proposal, your voting power must be delegated. Use the 'Activate Voting Power' button after claiming 10 sARC to ensure your votes are counted on-chain."
                : "All tokens here are for Arc Testnet and have no real-world monetary value. They exist purely for testing and governance participation during the testnet phase."}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Bridge Modal */}
      {showBridgeModal && (
        <BridgeModal
          isOpen={showBridgeModal}
          onClose={() => setShowBridgeModal(false)}
          onSuccess={refetchToken}
        />
      )}
    </div>
  );
}
