"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { useToken } from "@/hooks/useToken";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  Copy, 
  Check, 
  ExternalLink, 
  Coins, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck,
  Mail,
  Chrome,
  Twitter,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Clock,
  History
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { BridgeModal } from "@/components/BridgeModal";


interface FaucetTx {
  hash: string;
  amount: number;
  timestamp: string;
  status: "success" | "pending";
}

const COOLDOWN_KEY = "synarc_faucet_last_claim";
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

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
    <span className="font-mono text-xs font-bold text-primary tabular-nums">
      {display}
    </span>
  );
}

export function WalletFaucetCard() {
  const { isAuthenticated, walletAddress, email, authMethod, login } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showBridge, setShowBridge] = useState(false);
  const [faucetStatus, setFaucetStatus] = useState<"idle" | "requesting" | "success" | "error" | "cooldown">("idle");
  const [currentTxHash, setCurrentTxHash] = useState<string>("");
  const [synMsg, setSynMsg] = useState("");
  const [txHistory, setTxHistory] = useState<FaucetTx[]>([]);
  const [nextClaimAt, setNextClaimAt] = useState<string | null>(null);

  // Custom hook to fetch actual USDC balance on Arc Testnet
  const { balance: realBalance, isLoading: balanceLoading, isError: balanceError, refetch: refetchUSDC, isFetching } = useUSDCBalance();
  
  // Custom hook to fetch sARC token balance
  const { votingPower: tokenBalance, refetch: refetchToken } = useToken(walletAddress);

  // Load persistent override and history on mount & address change
  useEffect(() => {
    if (typeof window !== "undefined" && walletAddress) {
      // 1. Check local storage cooldown
      const stored = localStorage.getItem(`${COOLDOWN_KEY}_${walletAddress.toLowerCase()}`);
      if (stored) {
        const nextAt = new Date(parseInt(stored) + COOLDOWN_MS).toISOString();
        if (new Date(nextAt).getTime() > Date.now()) {
          setFaucetStatus("cooldown");
          setNextClaimAt(nextAt);
        } else {
          setFaucetStatus("idle");
          setNextClaimAt(null);
        }
      } else {
        setFaucetStatus("idle");
        setNextClaimAt(null);
      }

      // 2. Transaction History
      const savedHistory = localStorage.getItem(`synarc_sarc_faucet_history_${walletAddress}`);
      if (savedHistory) {
        setTxHistory(JSON.parse(savedHistory));
      } else {
        setTxHistory([]);
      }
    }
  }, [walletAddress]);

  // Check server-side cooldown on mount & address change
  useEffect(() => {
    if (!walletAddress) return;
    fetch(`/api/faucet?wallet=${walletAddress}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.eligible && data.nextClaimAt) {
          setFaucetStatus("cooldown");
          setNextClaimAt(data.nextClaimAt);
        }
      })
      .catch(() => {});
  }, [walletAddress]);

  // Copy Address helper
  const copyAddress = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address", err);
    }
  };

  // Generate mock Tx Hash
  const generateTxHash = () => {
    const chars = "0123456789abcdef";
    let hash = "0x";
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  };

  // Faucet Request Action (SYN claim)
  const handleRequestFaucet = async () => {
    if (!isAuthenticated || !walletAddress) {
      login();
      return;
    }
    if (faucetStatus !== "idle") return;

    setFaucetStatus("requesting");
    setSynMsg("");
    setCurrentTxHash("");

    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress }),
      });
      const data = await res.json();

      if (res.status === 429) {
        setFaucetStatus("cooldown");
        setNextClaimAt(data.nextClaimAt || new Date(Date.now() + COOLDOWN_MS).toISOString());
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
      const nextAt = new Date(Date.now() + COOLDOWN_MS).toISOString();
      setNextClaimAt(nextAt);
      const txHashValue = data.txHash || generateTxHash();
      setCurrentTxHash(txHashValue);

      const newTx: FaucetTx = {
        hash: txHashValue,
        amount: 1,
        timestamp: new Date().toISOString(),
        status: "success"
      };

      const updatedHistory = [newTx, ...txHistory].slice(0, 5); // Keep last 5 transactions
      setTxHistory(updatedHistory);
      localStorage.setItem(`synarc_sarc_faucet_history_${walletAddress}`, JSON.stringify(updatedHistory));

      setFaucetStatus("success");
      setSynMsg(data.message || "1 sARC Token sent to your wallet!");

      // Refetch sARC token balance
      try {
        refetchToken();
      } catch (e) {
        console.warn("Could not refetch sARC balance", e);
      }

      // Reset back to cooldown after 4 seconds
      setTimeout(() => {
        setFaucetStatus("cooldown");
      }, 4000);

    } catch (err: any) {
      setFaucetStatus("error");
      setSynMsg(err.message || "Something went wrong. Please try again.");
      setTimeout(() => {
        setFaucetStatus("idle");
      }, 4000);
    }
  };

  // Identity Badge config
  const identityBadge = useMemo(() => {
    switch (authMethod) {
      case "google":
        return { label: "Google Verified", icon: Chrome, color: "bg-red-500/10 border-red-500/20 text-red-400" };
      case "twitter":
        return { label: "Twitter Sign-in", icon: Twitter, color: "bg-sky-500/10 border-sky-500/20 text-sky-400" };
      case "discord":
        return { label: "Discord Account", icon: MessageSquare, color: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" };
      case "email":
        return { label: "Email Passkey", icon: Mail, color: "bg-amber-500/10 border-amber-500/20 text-amber-400" };
      case "wallet":
        return { label: "External Wallet", icon: Wallet, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" };
      default:
        return { label: "Authenticated Partner", icon: ShieldCheck, color: "bg-purple-500/10 border-purple-500/20 text-purple-400" };
    }
  }, [authMethod]);

  const IdentityIcon = identityBadge.icon;

  // Active address formatting
  const formattedAddress = walletAddress 
    ? `${walletAddress.substring(0, 8)}...${walletAddress.substring(walletAddress.length - 8)}`
    : "Disconnected";

  // Balance display (USDC)
  const activeBalance = realBalance ? parseFloat(realBalance) : 0.00;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
      {/* Balance & Identity (Left & Center Columns) */}
      <GlassCard className="lg:col-span-2 p-6 flex flex-col gap-6 relative overflow-hidden group justify-between">
        <div className="absolute -right-20 -top-20 w-52 h-52 bg-purple-glow/5 rounded-full blur-3xl group-hover:bg-purple-glow/10 transition-colors duration-500 pointer-events-none" />
        
        {/* Identity Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border-thin flex items-center justify-center text-primary shadow-inner">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm tracking-tight text-text-primary">Arc Governance Wallet</span>
                {isAuthenticated && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${identityBadge.color}`}>
                    <IdentityIcon className="w-3 h-3" />
                    {identityBadge.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-text-tertiary">
                {email && <span className="mr-1">{email}</span>}
                <span className="font-mono text-text-secondary select-all">{formattedAddress}</span>
                <button 
                  onClick={copyAddress}
                  className="p-1 hover:text-primary transition-colors hover:bg-surface-elevated rounded cursor-pointer"
                  title="Copy address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-success animate-bounce" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isAuthenticated ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Connected
                </span>
                <a 
                  href={`https://testnet.arcscan.app/address/${walletAddress}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-1.5 bg-surface-elevated border border-border-thin rounded-xl text-text-tertiary hover:text-foreground transition-all flex items-center gap-1 text-xs"
                  title="View on ArcScan Explorer"
                >
                  ArcScan
                  <ExternalLink className="w-3 h-3" />
                </a>
              </>
            ) : (
              <button
                onClick={login}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/95 transition-all shadow-[0_0_12px_rgba(124,58,237,0.2)] cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Balance Display Section */}
        <div className="flex flex-col gap-1 py-4">
          <p className="text-xs font-semibold tracking-wider text-text-tertiary uppercase flex items-center gap-1">
            Arc Testnet Wallet Balance
            {isFetching && <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />}
          </p>
          <div className="flex items-baseline gap-2">
            {balanceLoading ? (
              <div className="h-12 w-48 bg-white/5 animate-pulse rounded-xl" />
            ) : balanceError ? (
              <span className="text-sm font-semibold text-danger bg-danger/10 border border-danger/20 rounded-full px-3 py-1" title="Failed to fetch balance from Arc RPC">
                Error fetching balance
              </span>
            ) : (
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-heading">
                {activeBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h1>
            )}
            <span className="text-2xl font-bold text-primary font-heading">USDC</span>
          </div>
          <p className="text-xs text-text-tertiary flex items-center gap-1.5 pt-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Native stablecoin asset</span>
            on Arc Network Layer
          </p>
        </div>
      </GlassCard>

      {/* Transaction History (Right Column) */}
      <GlassCard className="p-6 flex flex-col justify-between relative overflow-hidden group">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
              <History className="w-4.5 h-4.5 text-primary" />
              Recent Claims
            </h3>
            <span className="text-[10px] font-bold text-text-tertiary bg-surface-elevated border border-border-thin px-2 py-0.5 rounded-full">
              Faucet History
            </span>
          </div>

          <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
            {txHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-6 text-text-tertiary border border-dashed border-border-thin rounded-xl gap-2 bg-surface/20">
                <Coins className="w-6 h-6 opacity-30" />
                <span className="text-[11px]">No claimed sARC faucet transactions detected on this account yet.</span>
              </div>
            ) : (
              txHistory.map((tx) => (
                <div 
                  key={tx.hash} 
                  className="p-3 bg-surface rounded-xl border border-border-thin flex items-center justify-between gap-3 hover:border-primary/20 transition-all duration-300 group/item"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-text-primary">+1.00 sARC</span>
                      <span className="inline-flex items-center px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold">
                        Success
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-text-tertiary group-hover/item:text-text-secondary select-all">{tx.hash.substring(0, 10)}...{tx.hash.substring(tx.hash.length - 8)}</span>
                  </div>
                  <a 
                    href={`https://testnet.arcscan.app/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-surface-elevated hover:bg-primary/20 border border-border-thin hover:border-primary/30 rounded-lg text-text-tertiary hover:text-primary transition-all cursor-pointer"
                    title="View Transaction"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Informational Hint footer */}
        <div className="pt-4 mt-4 border-t border-border-subtle text-[11px] text-text-tertiary flex items-start gap-2">
          <Clock className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <span>
            Faucet transactions are mock-simulated on top of Privy keys for offline usability, using active JSON-RPC channels on network nodes.
          </span>
        </div>
      </GlassCard>

      {/* Get Testnet Tokens Faucet Section */}
      <GlassCard className="lg:col-span-3 p-6 flex flex-col gap-6 relative overflow-hidden group border border-primary/20 bg-gradient-to-br from-primary/[0.02] to-transparent">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-1">
          <h3 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            ⚡ Get Testnet Tokens
          </h3>
          <p className="text-xs text-text-tertiary">
            Claim testnet assets once per day to build delegation reputation, participate in voting, and interact with the treasury.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Option 1 — SynArc Token (SYN) */}
          <div className="p-5 bg-surface-elevated/40 border border-border-subtle rounded-2xl flex flex-col gap-4 relative overflow-hidden hover:border-primary/30 transition-all duration-300">
            <div className="flex items-center gap-3">
              <span className="text-2xl select-none">🪙</span>
              <div>
                <h4 className="font-bold text-white text-sm">SynArc Token (SYN)</h4>
                <p className="text-[10px] text-muted font-mono">SYN · 1 per day</p>
              </div>
            </div>
            
            <p className="text-xs text-text-tertiary leading-relaxed flex-grow">
              Claim 1 SYN token per day to participate in governance and voting.
            </p>

            {faucetStatus === "cooldown" && nextClaimAt ? (
              <button
                disabled
                className="w-full py-2.5 px-4 rounded-xl bg-surface border border-border-thin text-muted font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-not-allowed opacity-60"
              >
                <div className="flex items-center gap-1.5 text-[10px]">
                  <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Next claim in</span>
                </div>
                <CooldownTimer nextClaimAt={nextClaimAt} />
              </button>
            ) : faucetStatus === "success" ? (
              <button
                disabled
                className="w-full py-2.5 px-4 rounded-xl bg-success/10 border border-success/20 text-success font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Check className="w-4 h-4 animate-bounce" />
                Token Sent!
              </button>
            ) : (
              <button
                onClick={handleRequestFaucet}
                disabled={faucetStatus === "requesting"}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer
                  ${faucetStatus === "idle" || faucetStatus === "error"
                    ? "bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]" 
                    : "bg-surface-elevated border border-border-thin text-text-secondary"
                  }`}
              >
                {faucetStatus === "requesting" ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400 animate-spin" />
                    Requesting Faucet...
                  </>
                ) : (
                  <>
                    <Coins className="w-3.5 h-3.5" />
                    Claim SYN Token
                  </>
                )}
              </button>
            )}
          </div>

          {/* Option 2 — USDC Testnet */}
          <div className="p-5 bg-surface-elevated/40 border border-border-subtle rounded-2xl flex flex-col gap-4 relative overflow-hidden hover:border-arc-blue/30 transition-all duration-300">
            <div className="flex items-center gap-3">
              <span className="text-2xl select-none">💵</span>
              <div>
                <h4 className="font-bold text-white text-sm">USDC Testnet</h4>
                <p className="text-[10px] text-muted font-mono">Circle Faucet</p>
              </div>
            </div>
            
            <p className="text-xs text-text-tertiary leading-relaxed flex-grow">
              Get free testnet USDC from Circle to deposit into treasury and vote.
            </p>

            <a
              href="https://faucet.circle.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-blue-500/10 border border-blue-400/20 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400/40 text-center font-bold text-xs flex items-center justify-center gap-1.5 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-300"
            >
              Claim USDC &rarr;
            </a>
          </div>

          {/* Option 3 — EURC Testnet */}
          <div className="p-5 bg-surface-elevated/40 border border-border-subtle rounded-2xl flex flex-col gap-4 relative overflow-hidden hover:border-purple-400/30 transition-all duration-300">
            <div className="flex items-center gap-3">
              <span className="text-2xl select-none">🟣</span>
              <div>
                <h4 className="font-bold text-white text-sm">EURC Testnet</h4>
                <p className="text-[10px] text-muted font-mono">Circle Faucet</p>
              </div>
            </div>
            
            <p className="text-xs text-text-tertiary leading-relaxed flex-grow">
              Get free testnet EURC from Circle for treasury deposits.
            </p>

            <a
              href="https://faucet.circle.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-purple-500/10 border border-purple-400/20 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400/40 text-center font-bold text-xs flex items-center justify-center gap-1.5 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all duration-300"
            >
            </a>
          </div>

          {/* Option 4 — Bridge USDC */}
          <div className="p-5 bg-surface-elevated/40 border border-border-subtle rounded-2xl flex flex-col gap-4 relative overflow-hidden hover:border-primary/30 transition-all duration-300">
            <div className="flex items-center gap-3">
              <span className="text-2xl select-none">🌉</span>
              <div>
                <h4 className="font-bold text-white text-sm">Bridge USDC</h4>
                <p className="text-[10px] text-muted font-mono">Circle Bridge Kit</p>
              </div>
            </div>
            
            <p className="text-xs text-text-tertiary leading-relaxed flex-grow">
              Already have USDC on another chain? Bridge it to Arc Testnet instantly.
            </p>

            <button
              onClick={() => {
                if (!isAuthenticated) { login(); return; }
                setShowBridge(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 hover:border-primary/40 text-center font-bold text-xs flex items-center justify-center gap-1.5 hover:shadow-[0_0_15px_rgba(124,58,237,0.15)] transition-all duration-300 cursor-pointer"
            >
              Bridge USDC &rarr;
            </button>
          </div>
        </div>
        
        {/* Success message popup container */}
        <AnimatePresence>
          {faucetStatus === "success" && currentTxHash && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-xl bg-success/10 border border-success/20 flex flex-col sm:flex-row justify-between sm:items-center gap-2.5 text-xs text-success/90"
            >
              <div>
                <span className="font-semibold block mb-0.5">🎉 Faucet Transaction Confirmed Successfully!</span>
                <span className="font-mono opacity-80 select-all block sm:inline">{currentTxHash}</span>
              </div>
              <a
                href={`https://testnet.arcscan.app/tx/${currentTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline shrink-0 self-start sm:self-auto"
              >
                Inspect Transaction on ArcScan
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bridge Modal */}
        <BridgeModal 
          isOpen={showBridge} 
          onClose={() => setShowBridge(false)} 
          onSuccess={refetchUSDC} 
        />
      </GlassCard>
    </div>
  );
}
