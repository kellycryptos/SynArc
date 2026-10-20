"use client";

import { useEffect, useState } from "react";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { getCachedPublicClient } from "@/lib/rpc/provider-cache";
import { CONTRACTS_MAINNET } from "@/lib/arc-config";
import { parseAbiItem, formatUnits } from "viem";
import { ExternalLink, CheckCircle2 } from "lucide-react";

interface LatestReleaseData {
  amount: string;
  payee: string;
  proposalId: string;
  timestamp: string;
  txHash: string;
}

const OUTFLOW_EVENT = parseAbiItem(
  "event Outflow(address indexed recipient, uint256 amount, string tokenSymbol, string description, uint256 timestamp, string deliverableURI)"
);
const THREE_WAY_MATCH_EVENT = parseAbiItem(
  "event ThreeWayMatchSuccess(bytes32 indexed releaseKey, uint256 indexed proposalId, uint256 milestoneId, bytes32 documentHash, bytes32 invoiceHash, address recipient, uint256 amount)"
);
const WITHDRAWAL_EXECUTED_EVENT = parseAbiItem(
  "event WithdrawalExecuted(uint256 indexed id, address indexed recipient, uint256 amount, address token)"
);

export function LatestReleaseStrip() {
  const { isArcMainnet } = useArcNetwork();
  const [release, setRelease] = useState<LatestReleaseData | null>(null);

  useEffect(() => {
    if (!isArcMainnet) return;

    let cancelled = false;

    async function fetchLatestRelease() {
      try {
        const client = getCachedPublicClient(5042);
        const currentBlock = await client.getBlockNumber();
        const CHUNK_SIZE = 5000n;
        const MAX_SCAN = 50000n;
        const minBlock = currentBlock > MAX_SCAN ? currentBlock - MAX_SCAN : 0n;

        for (let to = currentBlock; to >= minBlock; to -= CHUNK_SIZE) {
          const from = to >= CHUNK_SIZE ? to - CHUNK_SIZE + 1n : 0n;

          // Check ThreeWayMatchSuccess
          try {
            const matchLogs = await client.getLogs({
              address: CONTRACTS_MAINNET.treasuryGovernance,
              event: THREE_WAY_MATCH_EVENT,
              fromBlock: from,
              toBlock: to,
            });

            if (matchLogs.length > 0) {
              const latest = matchLogs[matchLogs.length - 1];
              const block = await client.getBlock({ blockNumber: latest.blockNumber });
              const date = new Date(Number(block.timestamp) * 1000).toLocaleDateString();
              const args = latest.args as any;
              const formattedAmt = `${Number(formatUnits(args.amount || 0n, 6)).toLocaleString()} USDC`;
              const payee = args.recipient ? `${args.recipient.slice(0, 6)}...${args.recipient.slice(-4)}` : "—";
              if (!cancelled) {
                setRelease({
                  amount: formattedAmt,
                  payee,
                  proposalId: args.proposalId ? `#${args.proposalId.toString()}` : "—",
                  timestamp: date,
                  txHash: latest.transactionHash || "",
                });
              }
              return;
            }
          } catch {
            // continue fallback scan
          }

          // Check Outflow event
          try {
            const outflowLogs = await client.getLogs({
              address: CONTRACTS_MAINNET.treasuryGovernance,
              event: OUTFLOW_EVENT,
              fromBlock: from,
              toBlock: to,
            });

            if (outflowLogs.length > 0) {
              const latest = outflowLogs[outflowLogs.length - 1];
              const args = latest.args as any;
              const timeSec = args.timestamp ? Number(args.timestamp) : 0;
              const date = timeSec > 0 ? new Date(timeSec * 1000).toLocaleDateString() : "Recent";
              const formattedAmt = `${Number(formatUnits(args.amount || 0n, 6)).toLocaleString()} ${args.tokenSymbol || "USDC"}`;
              const payee = args.recipient ? `${args.recipient.slice(0, 6)}...${args.recipient.slice(-4)}` : "—";
              if (!cancelled) {
                setRelease({
                  amount: formattedAmt,
                  payee,
                  proposalId: "Treasury",
                  timestamp: date,
                  txHash: latest.transactionHash || "",
                });
              }
              return;
            }
          } catch {
            // continue fallback scan
          }

          if (from === 0n) break;
        }
      } catch {
        // Silently fail and render nothing
      }
    }

    fetchLatestRelease();
    return () => {
      cancelled = true;
    };
  }, [isArcMainnet]);

  // If not mainnet, or no matching release found, render nothing
  if (!isArcMainnet || !release) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] text-xs font-mono">
      <div className="flex items-center gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="text-[#8B93A5]">Latest release:</span>
        <span className="text-white font-semibold">{release.amount}</span>
        <span className="text-[#8B93A5]">to</span>
        <span className="text-[#F5F7FA] font-medium">{release.payee}</span>
        {release.proposalId !== "—" && (
          <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-[11px] text-[#8B93A5]">
            {release.proposalId}
          </span>
        )}
        <span className="text-[#6B7385] text-[11px] hidden md:inline">({release.timestamp})</span>
      </div>

      {release.txHash && (
        <a
          href={`https://explorer.arc.io/tx/${release.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium shrink-0"
        >
          <span>View on Explorer</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}
