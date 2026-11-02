import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, parseAbi, formatUnits } from "viem";
import { CONTRACTS_MAINNET, CONTRACTS_TESTNET, CANTEEN_TESTNET_RPC } from "@/lib/arc-config";
import { Proposal, ProposalStatus, TimelineEvent } from "@/types/governance";

const GOVERNOR_ABI = parseAbi([
  "function proposalCount() view returns (uint256)",
  "function getProposal(uint256) view returns (uint256, address, string, string, string, uint256, uint256, uint256, uint256, uint256, uint256, bool, bool, uint256, address, string)",
  "function state(uint256) view returns (uint8)"
]);

const MULTICALL3_ADDRESS = "0xca11bde05977b3631167028862be2a173976ca11" as const;

interface CacheEntry {
  proposals: Proposal[];
  totalCount: number;
  timestamp: number;
}

const proposalCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 20_000; // 20-second server cache

function getClient(network: "mainnet" | "testnet") {
  const rpcUrl = network === "mainnet"
    ? (process.env.ARC_MAINNET_RPC_URL || process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL || "https://rpc.mainnet.arc.io")
    : (process.env.ARC_TESTNET_RPC_URL || CANTEEN_TESTNET_RPC || "https://rpc.testnet.arc.io");

  return createPublicClient({
    transport: http(rpcUrl, { timeout: 10_000, retryCount: 2 }),
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const network = (searchParams.get("network") === "testnet" ? "testnet" : "mainnet") as "mainnet" | "testnet";
  const force = searchParams.get("force") === "true";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : (network === "mainnet" ? 500 : 30);

  const now = Date.now();
  const cached = proposalCache.get(network);

  if (!force && cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      {
        success: true,
        network,
        source: "cache",
        totalCount: cached.totalCount,
        proposals: cached.proposals.slice(0, limit),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  try {
    const client = getClient(network);
    const governorAddress = network === "mainnet"
      ? (CONTRACTS_MAINNET.governor as `0x${string}`)
      : (CONTRACTS_TESTNET.governor as `0x${string}`);

    const countBigInt = await client.readContract({
      address: governorAddress,
      abi: GOVERNOR_ABI,
      functionName: "proposalCount",
    });

    const totalCount = Number(countBigInt);
    if (totalCount === 0) {
      return NextResponse.json({
        success: true,
        network,
        totalCount: 0,
        proposals: [],
      });
    }

    const fetchCount = Math.min(totalCount, limit);
    const proposalIds: number[] = [];
    for (let i = 0; i < fetchCount; i++) {
      proposalIds.push(totalCount - i); // Descending: newest proposals first
    }

    // Process in batches of 50 proposals (100 multicall calls per batch)
    const BATCH_SIZE = 50;
    const loadedProposals: Proposal[] = [];

    const statusMap: Record<number, string> = {
      0: "Pending",
      1: "Active",
      2: "Canceled",
      3: "Defeated",
      4: "Succeeded",
      5: "Queued",
      6: "Expired",
      7: "Executed",
    };

    for (let offset = 0; offset < proposalIds.length; offset += BATCH_SIZE) {
      const slice = proposalIds.slice(offset, offset + BATCH_SIZE);
      const calls: any[] = [];

      for (const id of slice) {
        calls.push({
          address: governorAddress,
          abi: GOVERNOR_ABI,
          functionName: "getProposal",
          args: [BigInt(id)],
        });
        calls.push({
          address: governorAddress,
          abi: GOVERNOR_ABI,
          functionName: "state",
          args: [BigInt(id)],
        });
      }

      const results = await client.multicall({
        contracts: calls,
        multicallAddress: MULTICALL3_ADDRESS,
      });

      for (let i = 0; i < slice.length; i++) {
        const id = slice[i];
        const propRes = results[i * 2];
        const stateRes = results[i * 2 + 1];

        if (propRes.status !== "success") continue;
        const p = propRes.result as any;
        const stateNum = stateRes.status === "success" ? Number(stateRes.result) : 1;

        const rawTitle = p[2] ? String(p[2]).trim() : "";
        const rawDesc = p[3] ? String(p[3]).trim() : "";

        // Filter out fuzz spam on testnet if any
        if (network === "testnet") {
          const isFuzz = /^Proposal \d+$/i.test(rawTitle) && (!rawDesc || rawDesc === "community" || rawDesc.length < 15);
          if (isFuzz) continue;
        }

        const forV = Number(formatUnits(p[8] || 0n, 18));
        const againstV = Number(formatUnits(p[9] || 0n, 18));
        const abstainV = Number(formatUnits(p[10] || 0n, 18));
        const total = forV + againstV + abstainV;
        const participation = total > 0 ? (total / 15_000_000) * 100 : 0;

        const status = statusMap[stateNum] || "Active";
        const startTimeSecs = p[6] ? Number(p[6]) : Math.floor(Date.now() / 1000);
        const endTimeSecs = p[7] ? Number(p[7]) : Math.floor(Date.now() / 1000) + 604800;
        const treasuryImpactVal = p[13] ? Number(formatUnits(p[13], 6)) : 0;
        const executionTarget = p[14] || "0x0000000000000000000000000000000000000000";
        const deliverableURI = p[15] ? String(p[15]) : "";

        const timeline: TimelineEvent[] = [
          { title: "Proposal Created", timestamp: new Date(startTimeSecs * 1000).toISOString(), status: "Proposed" },
        ];
        if (status === "Active") {
          timeline.push({ title: "Voting Phase Active", timestamp: new Date(startTimeSecs * 1000).toISOString(), status: "Active" });
        } else if (status === "Executed") {
          timeline.push({ title: "Transaction Executed", timestamp: new Date(endTimeSecs * 1000).toISOString(), status: "Executed" });
        } else if (status === "Canceled") {
          timeline.push({ title: "Proposal Canceled", timestamp: new Date(endTimeSecs * 1000).toISOString(), status: "Canceled" });
        } else if (status === "Defeated") {
          timeline.push({ title: "Voting Closed & Defeated", timestamp: new Date(endTimeSecs * 1000).toISOString(), status: "Defeated" });
        } else if (status === "Succeeded") {
          timeline.push({ title: "Voting Closed & Passed", timestamp: new Date(endTimeSecs * 1000).toISOString(), status: "Passed" });
        }

        loadedProposals.push({
          id: `SIP-${id}`,
          title: rawTitle || `Proposal #${id}`,
          description: rawDesc || "Governance Proposal",
          proposer: p[1] || "",
          category: p[4] || "General",
          status: status as ProposalStatus,
          forVotes: forV,
          againstVotes: againstV,
          abstainVotes: abstainV,
          totalVotes: total,
          participationPercentage: parseFloat(participation.toFixed(1)),
          treasuryImpactValue: -treasuryImpactVal,
          treasuryImpact: treasuryImpactVal > 0 ? `-${treasuryImpactVal.toLocaleString()} USDC` : "None",
          timeRemaining: status === "Active" ? `${Math.max(0, Math.ceil((endTimeSecs - Date.now() / 1000) / 86400))} days left` : "Ended",
          createdAt: new Date(startTimeSecs * 1000).toISOString(),
          votingStarts: new Date(startTimeSecs * 1000).toISOString(),
          votingEnds: new Date(endTimeSecs * 1000).toISOString(),
          executionTarget,
          votingDuration: p[5] ? Number(p[5]) / 86400 : 7,
          deliverableURI,
          timeline,
        });
      }
    }

    // Cache the proposals
    proposalCache.set(network, {
      proposals: loadedProposals,
      totalCount,
      timestamp: Date.now(),
    });

    return NextResponse.json(
      {
        success: true,
        network,
        source: "live",
        totalCount,
        proposals: loadedProposals,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch governance proposals in API:", error);
    // If cache exists even if expired, return it as fallback on error
    if (cached) {
      return NextResponse.json({
        success: true,
        network,
        source: "stale-cache",
        totalCount: cached.totalCount,
        proposals: cached.proposals.slice(0, limit),
      });
    }

    return NextResponse.json(
      {
        success: false,
        network,
        error: error?.message || "Failed to load proposals",
      },
      { status: 500 }
    );
  }
}
