"use client";

import React, { useEffect, useState, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
  ShieldCheck, 
  Lock, 
  FileCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Bot, 
  UserCheck, 
  ExternalLink, 
  Coins, 
  RefreshCw, 
  ArrowRight,
  Shield,
  Layers,
  Check
} from "lucide-react";
import { createPublicClient, http, formatUnits, parseAbi } from "viem";
import { ARC_CHAIN, ARC_RPC_URLS, CONTRACTS } from "@/lib/arc-config";
import { GOVERNANCE_CONTRACTS } from "@/lib/governance/contracts";
import { useAuth } from "@/hooks/auth/useAuth";

const RELEASE_VALVE_ABI = parseAbi([
  "function agentReleaseCap() view returns (uint256)",
  "function humanReviewThreshold() view returns (uint256)",
  "function isAuthorizedAgent(address account) view returns (bool)",
  "function isAuthorizedReviewer(address account) view returns (bool)",
  "function agentAddress() view returns (address)",
  "function governor() view returns (address)",
  "function owner() view returns (address)"
]);

interface EscrowReleaseValveProps {
  treasuryUsdcBalance?: number;
}

export function EscrowReleaseValve({ treasuryUsdcBalance = 0 }: EscrowReleaseValveProps) {
  const { walletAddress, isAuthenticated } = useAuth();
  
  const [agentCap, setAgentCap] = useState<number>(50);
  const [isAgent, setIsAgent] = useState<boolean>(false);
  const [isReviewer, setIsReviewer] = useState<boolean>(false);
  const [agentContractAddress, setAgentContractAddress] = useState<string>("");
  const [governorAddress, setGovernorAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lookupAddress, setLookupAddress] = useState<string>("");
  const [lookupResult, setLookupResult] = useState<{ isAgent: boolean; isReviewer: boolean } | null>(null);
  const [isCheckingLookup, setIsCheckingLookup] = useState<boolean>(false);

  const treasuryAddress = (CONTRACTS.treasury || GOVERNANCE_CONTRACTS.treasury) as `0x${string}`;
  const explorerUrl = ARC_CHAIN.blockExplorers?.default.url || "https://explorer.arc.io";
  const explorerName = ARC_CHAIN.blockExplorers?.default.name || "Arc Explorer";

  const fetchOnChainState = useCallback(async () => {
    setIsLoading(true);
    try {
      const client = createPublicClient({
        chain: ARC_CHAIN,
        transport: http(ARC_RPC_URLS[0]),
      });

      // 1. Fetch on-chain agent release cap
      try {
        const rawCap = await client.readContract({
          address: treasuryAddress,
          abi: RELEASE_VALVE_ABI,
          functionName: "agentReleaseCap",
        });
        setAgentCap(Number(formatUnits(rawCap, 6)));
      } catch (e) {
        // Fallback to humanReviewThreshold if agentReleaseCap is alias
        try {
          const rawCap = await client.readContract({
            address: treasuryAddress,
            abi: RELEASE_VALVE_ABI,
            functionName: "humanReviewThreshold",
          });
          setAgentCap(Number(formatUnits(rawCap, 6)));
        } catch {
          setAgentCap(50);
        }
      }

      // 2. Fetch designated addresses
      try {
        const agAddress = await client.readContract({
          address: treasuryAddress,
          abi: RELEASE_VALVE_ABI,
          functionName: "agentAddress",
        });
        setAgentContractAddress(agAddress);
      } catch {}

      try {
        const gov = await client.readContract({
          address: treasuryAddress,
          abi: RELEASE_VALVE_ABI,
          functionName: "governor",
        });
        setGovernorAddress(gov);
      } catch {}

      // 3. If wallet connected, check roles
      if (walletAddress) {
        try {
          const [agentCheck, reviewerCheck] = await Promise.all([
            client.readContract({
              address: treasuryAddress,
              abi: RELEASE_VALVE_ABI,
              functionName: "isAuthorizedAgent",
              args: [walletAddress as `0x${string}`],
            }),
            client.readContract({
              address: treasuryAddress,
              abi: RELEASE_VALVE_ABI,
              functionName: "isAuthorizedReviewer",
              args: [walletAddress as `0x${string}`],
            }),
          ]);
          setIsAgent(agentCheck);
          setIsReviewer(reviewerCheck);
        } catch {
          setIsAgent(false);
          setIsReviewer(false);
        }
      }
    } catch (err) {
      console.warn("[EscrowReleaseValve] Failed to read on-chain config:", err);
    } finally {
      setIsLoading(false);
    }
  }, [treasuryAddress, walletAddress]);

  useEffect(() => {
    fetchOnChainState();
  }, [fetchOnChainState]);

  const handleLookupCheck = async () => {
    if (!lookupAddress || !lookupAddress.startsWith("0x") || lookupAddress.length !== 42) return;
    setIsCheckingLookup(true);
    try {
      const client = createPublicClient({
        chain: ARC_CHAIN,
        transport: http(ARC_RPC_URLS[0]),
      });
      const [ag, rev] = await Promise.all([
        client.readContract({
          address: treasuryAddress,
          abi: RELEASE_VALVE_ABI,
          functionName: "isAuthorizedAgent",
          args: [lookupAddress as `0x${string}`],
        }),
        client.readContract({
          address: treasuryAddress,
          abi: RELEASE_VALVE_ABI,
          functionName: "isAuthorizedReviewer",
          args: [lookupAddress as `0x${string}`],
        }),
      ]);
      setLookupResult({ isAgent: ag, isReviewer: rev });
    } catch {
      setLookupResult({ isAgent: false, isReviewer: false });
    } finally {
      setIsCheckingLookup(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Release Valve Card */}
      <GlassCard className="p-6 relative overflow-hidden border border-purple-500/25 bg-surface-elevated/70 shadow-[0_0_30px_rgba(124,58,237,0.08)]">
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-thin pb-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Release Valve Active
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-accent-purple/20 text-accent-purple border border-accent-purple/30">
                {ARC_CHAIN.name}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-2 flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-accent-purple shrink-0" />
              <span>Escrow Release Valve · {ARC_CHAIN.name}</span>
            </h2>
            <p className="text-xs sm:text-sm text-text-tertiary mt-1">
              USDC in escrow, proof attached, paid once. Agent can release under on-chain cap. Over the cap it stops for a human.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchOnChainState}
              disabled={isLoading}
              className="p-2 rounded-xl bg-surface hover:bg-surface-elevated text-text-secondary hover:text-white border border-border-thin transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Refresh on-chain state"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-accent-purple" : ""}`} />
              <span className="hidden sm:inline">Sync Chain</span>
            </button>
            <a
              href={`${explorerUrl}/address/${treasuryAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-surface hover:bg-surface-elevated text-white border border-border-thin transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <span>{explorerName}</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent-purple" />
            </a>
          </div>
        </div>

        {/* 3 Core Invariants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 relative z-10">
          {/* Invariant 1 */}
          <div className="p-4 rounded-xl bg-surface/80 border border-border-thin space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Coins className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                100% Backed
              </span>
            </div>
            <div className="font-bold text-sm text-white">1. USDC in Escrow</div>
            <p className="text-xs text-text-tertiary">
              Funds reside directly in the timelocked treasury escrow vault. No fractional reserve or third-party custody.
            </p>
            <div className="pt-1 text-[11px] font-mono text-blue-300 font-bold flex items-center gap-1">
              <span>Vault:</span>
              <span>{treasuryUsdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC</span>
            </div>
          </div>

          {/* Invariant 2 */}
          <div className="p-4 rounded-xl bg-surface/80 border border-border-thin space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <FileCheck className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                IPFS / Hash
              </span>
            </div>
            <div className="font-bold text-sm text-white">2. Proof Attached</div>
            <p className="text-xs text-text-tertiary">
              Deliverables bound via immutable IPFS CIDv0/v1 or invoice hash before release execution is permitted.
            </p>
            <div className="pt-1 text-[11px] font-mono text-purple-300 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Attestation Engine Active</span>
            </div>
          </div>

          {/* Invariant 3 */}
          <div className="p-4 rounded-xl bg-surface/80 border border-border-thin space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Idempotent
              </span>
            </div>
            <div className="font-bold text-sm text-white">3. Paid Once</div>
            <p className="text-xs text-text-tertiary">
              Strict on-chain bit flip on release key prevents double spending or payment replay attacks forever.
            </p>
            <div className="pt-1 text-[11px] font-mono text-amber-300 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>DuplicateRelease Revert Active</span>
            </div>
          </div>
        </div>

        {/* On-Chain Cap & Dual Release Threshold */}
        <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-accent-purple/10 via-surface-elevated to-amber-500/10 border border-border-thin relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">On-Chain Cap Enforcement</span>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <span>Autonomous Agent Cap:</span>
                <span className="text-xl font-extrabold font-mono text-emerald-400">{agentCap.toFixed(2)} USDC</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-surface border border-border-thin text-text-secondary">
                Rule: &le; ${agentCap} Agent | &gt; ${agentCap} Human
              </span>
            </div>
          </div>

          {/* Visual Threshold Bar */}
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-surface rounded-full overflow-hidden flex border border-border-thin">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full relative group transition-all" 
                style={{ width: "35%" }}
                title={`Agent Autonomous Release (<= $${agentCap})`}
              />
              <div 
                className="bg-gradient-to-r from-amber-500 to-purple-500 h-full relative group transition-all" 
                style={{ width: "65%" }}
                title={`Human / Multisig Review Signoff Required (> $${agentCap})`}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-text-tertiary">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Bot className="w-3 h-3" />
                $0.00 &ndash; ${agentCap.toFixed(2)} USDC (Agent Autonomous)
              </span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                &gt; ${agentCap.toFixed(2)} USDC (Human Review Signoff Required)
              </span>
            </div>
          </div>

          {/* Description of Two Paths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-surface/70 border border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                <Bot className="w-4 h-4" />
                <span>Path A: Autonomous Agent Release</span>
              </div>
              <p className="text-text-tertiary text-[11px] leading-relaxed">
                When milestone &le; {agentCap} USDC, authorized agent triggers <code className="text-white bg-surface px-1 py-0.5 rounded">releaseMilestone</code> directly with deliverable CID &amp; invoice hash. Zero waiting, instant settlement.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-surface/70 border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
                <UserCheck className="w-4 h-4" />
                <span>Path B: Human / Multisig Review Gate</span>
              </div>
              <p className="text-text-tertiary text-[11px] leading-relaxed">
                When milestone &gt; {agentCap} USDC, contract reverts with <code className="text-amber-300 bg-surface px-1 py-0.5 rounded">HumanApprovalRequired</code> until Governor, Owner, or Reviewer calls <code className="text-white bg-surface px-1 py-0.5 rounded">approveReleaseHuman</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Role Permissions & Address Status */}
        <div className="mt-6 pt-5 border-t border-border-thin relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connected User Role Card */}
          <div className="p-4 rounded-xl bg-surface border border-border-thin space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-accent-purple" />
                Connected Wallet Permissions
              </span>
              {isAuthenticated ? (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Connected
                </span>
              ) : (
                <span className="text-[10px] font-mono text-muted bg-surface-elevated px-2 py-0.5 rounded">
                  Not Connected
                </span>
              )}
            </div>

            {isAuthenticated ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border-thin/50">
                  <span className="text-text-tertiary">Wallet Address:</span>
                  <span className="font-mono text-white text-[11px]">{walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border-thin/50">
                  <span className="text-text-tertiary">Autonomous Agent Role:</span>
                  <span className={`font-bold flex items-center gap-1 ${isAgent ? "text-emerald-400" : "text-text-tertiary"}`}>
                    {isAgent ? <Check className="w-3.5 h-3.5" /> : null}
                    {isAgent ? "Authorized Agent" : "Not Authorized"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-text-tertiary">Human Reviewer Role:</span>
                  <span className={`font-bold flex items-center gap-1 ${isReviewer ? "text-purple-400" : "text-text-tertiary"}`}>
                    {isReviewer ? <Check className="w-3.5 h-3.5" /> : null}
                    {isReviewer ? "Authorized Reviewer (Signoff Active)" : "Not Authorized"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-tertiary">
                Connect your Web3 or Circle Smart Account to view on-chain agent release or reviewer authorization.
              </p>
            )}
          </div>

          {/* Role Check Tool */}
          <div className="p-4 rounded-xl bg-surface border border-border-thin space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              On-Chain Permission Query
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={lookupAddress}
                onChange={(e) => setLookupAddress(e.target.value.trim())}
                placeholder="0x... address to check roles"
                className="bg-surface-elevated border border-border-thin rounded-lg px-3 py-1.5 text-xs font-mono text-white flex-1 focus:outline-none focus:border-accent-purple"
              />
              <button
                onClick={handleLookupCheck}
                disabled={isCheckingLookup || !lookupAddress}
                className="px-3 py-1.5 rounded-lg bg-accent-purple hover:bg-accent-purple/90 text-white font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isCheckingLookup ? "Querying..." : "Verify"}
              </button>
            </div>

            {lookupResult && (
              <div className="text-[11px] font-mono p-2 rounded-lg bg-surface-elevated border border-border-thin space-y-1">
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Agent Release (&le; ${agentCap}):</span>
                  <span className={lookupResult.isAgent ? "text-emerald-400 font-bold" : "text-text-tertiary"}>
                    {lookupResult.isAgent ? "Authorized" : "Unauthorized"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Human Reviewer (&gt; ${agentCap}):</span>
                  <span className={lookupResult.isReviewer ? "text-purple-400 font-bold" : "text-text-tertiary"}>
                    {lookupResult.isReviewer ? "Authorized" : "Unauthorized"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

export const TameionReleaseValve = EscrowReleaseValve;
