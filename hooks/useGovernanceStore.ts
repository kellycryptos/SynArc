import { create } from "zustand";
import { Proposal, ProposalStatus, TimelineEvent, GovernanceMetrics } from "@/types/governance";
import { TreasuryActivity } from "@/types";
import { ethers, JsonRpcProvider, BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";
import { GOVERNANCE_CONTRACTS, GovernorABI, ProposalState, VoteType, ERC20ABI } from "@/lib/governance/contracts";
import { getAggressiveGasParams, getAuthenticatedClient } from "@/lib/tx-helper";
import { ARC_CHAIN, ARC_RPC_URLS, getActiveNetwork, CONTRACTS_MAINNET, CONTRACTS_TESTNET } from "@/lib/arc-config";
import { createPublicClient, fallback, http } from "viem";
import { getCachedProvider } from "@/lib/rpc/provider-cache";
import historicalProposalsRaw from "@/data/historical-proposals.json";

// Normalize historical proposals so dates (votingStarts, votingEnds) are consistently populated
const historicalProposals: Proposal[] = (historicalProposalsRaw as any[]).map((hp) => ({
  ...hp,
  votingStarts: hp.votingStarts || hp.createdAt || (hp.timeline && hp.timeline[0]?.timestamp) || new Date().toISOString(),
  votingEnds: hp.votingEnds || hp.endsAt || (hp.timeline && hp.timeline[hp.timeline.length - 1]?.timestamp) || new Date().toISOString(),
}));

import { 
  MAINNET_TREASURY_BASELINE, 
  TESTNET_TREASURY_BASELINE, 
  KNOWN_MAINNET_TX_HASHES 
} from "@/hooks/useTreasuryBalances";

/**
 * Counts unique addresses that currently hold a non-zero sARC token balance.
 * Strategy: scan all Transfer event logs to collect candidate recipient addresses,
 * then batch-check balanceOf to discard zero-balance addresses.
 */
async function getTokenHolderCount(
  provider: ethers.JsonRpcProvider,
  tokenAddress: string,
  timeoutMs = 2500
): Promise<number> {
  const withTimeout = <T>(p: Promise<T>): Promise<T> =>
    Promise.race([
      p,
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("holder-count timeout")), timeoutMs)
      ),
    ]);

  // Minimal ABI: Transfer event + balanceOf
  const tokenAbi = [
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "function balanceOf(address account) view returns (uint256)",
  ];
  const token = new Contract(tokenAddress, tokenAbi, provider);

  // Pull all Transfer logs. fromBlock 0 works on testnets; on mainnet you'd paginate.
  const filter = token.filters.Transfer();
  const logs = await withTimeout(token.queryFilter(filter, 0, "latest"));

  // Collect unique recipient addresses (skip mint-from-zero, keep real wallets)
  const candidates = new Set<string>();
  for (const log of logs) {
    const { to } = (log as ethers.EventLog).args;
    if (to && to !== ethers.ZeroAddress) {
      candidates.add(to.toLowerCase());
    }
  }

  if (candidates.size === 0) return 0;

  // Batch-check balances; count only addresses that still hold tokens
  const results = await withTimeout(
    Promise.allSettled(
      Array.from(candidates).map((addr) => token.balanceOf(addr))
    )
  );

  let holders = 0;
  for (const r of results) {
    if (r.status === "fulfilled" && (r.value as bigint) > 0n) holders++;
  }
  return holders;
}


interface GovernanceState {
  proposals: Proposal[];
  metrics: GovernanceMetrics;
  treasuryActivities: TreasuryActivity[];
  userVotes: Record<string, { option: "For" | "Against" | "Abstain"; sig: string; vp: number }>;
  initialized: boolean;
  lastFetched: number | null;
  currentNetwork: 'mainnet' | 'testnet' | null;
  currentDaoId: string | null;
  currentDao: { id: string; governorAddress: string; treasuryAddress: string; tokenAddress: string } | null;
  activeContracts: {
    governor: string;
    treasury: string;
    token: string;
    usdc?: string;
    eurc?: string;
    cirBTC?: string;
  };
  
  // Actions
  initializeStore: (customDao?: { id: string; governorAddress: string; treasuryAddress: string; tokenAddress: string }, force?: boolean) => Promise<void>;
  submitProposal: (proposalData: {
    title: string;
    description: string;
    category: string;
    treasuryImpactValue: number;
    executionTarget: string;
    votingDuration: number;
    proposer: string;
    deliverableURI?: string;
  }, signer: ethers.Signer) => Promise<string>;
  castVote: (proposalId: string, option: "For" | "Against" | "Abstain", weight: number, signature: string, signer: ethers.Signer) => Promise<void>;
  executeProposal: (proposalId: string, signer: ethers.Signer) => Promise<void>;
}

export const TESTNET_BASELINE_PROPOSALS: Proposal[] = [
  {
    id: "SIP-3119",
    title: "Proposed by Treasury Agent — AI Security Mesh: Deploy Forensic Sentinel Node",
    description: "AUTONOMOUS AGENT PROPOSAL\nAction: forensic_audit\nAmount: 30 USDC\nCategory: GOVERNANCE_UPGRADE\nObjective: Fund autonomous compute infrastructure for real-time mempool scanning and dual-agent adversarial transaction simulation.",
    proposer: "0x35630dfe2592ab19d979ec1b173697aea554b66b",
    category: "GOVERNANCE_UPGRADE",
    status: "Active",
    forVotes: 14802000,
    againstVotes: 0,
    abstainVotes: 0,
    totalVotes: 14802000,
    participationPercentage: 98.7,
    treasuryImpactValue: -30,
    treasuryImpact: "-30 USDC",
    timeRemaining: "7 days left",
    createdAt: "2026-10-17T16:25:09.000Z",
    votingStarts: "2026-10-17T16:25:09.000Z",
    votingEnds: "2026-10-24T16:25:09.000Z",
    executionTarget: "0x35630dfe2592ab19d979ec1b173697aea554b66b",
    votingDuration: 7,
    deliverableURI: "",
    timeline: [
      { title: "Proposal Created", timestamp: "2026-10-17T16:25:09.000Z", status: "Proposed" },
      { title: "Voting Phase Active", timestamp: "2026-10-17T16:25:09.000Z", status: "Active" }
    ]
  },
  {
    id: "SIP-3118",
    title: "Proposed by Treasury Agent — Ecosystem Liquidity Provision: Seed sARC/USDC DEX Pool",
    description: "AUTONOMOUS AGENT PROPOSAL\nAction: liquidity_provision\nAmount: 40 USDC\nCategory: TREASURY_REBALANCE\nObjective: Deposit liquidity into automated market maker pairs to deepen secondary market depth and minimize slippage for community token holders on Arc Testnet.",
    proposer: "0x35630dfe2592ab19d979ec1b173697aea554b66b",
    category: "TREASURY_REBALANCE",
    status: "Active",
    forVotes: 14802000,
    againstVotes: 0,
    abstainVotes: 0,
    totalVotes: 14802000,
    participationPercentage: 98.7,
    treasuryImpactValue: -40,
    treasuryImpact: "-40 USDC",
    timeRemaining: "7 days left",
    createdAt: "2026-10-17T16:24:24.000Z",
    votingStarts: "2026-10-17T16:24:24.000Z",
    votingEnds: "2026-10-24T16:24:24.000Z",
    executionTarget: "0x35630dfe2592ab19d979ec1b173697aea554b66b",
    votingDuration: 7,
    deliverableURI: "",
    timeline: [
      { title: "Proposal Created", timestamp: "2026-10-17T16:24:24.000Z", status: "Proposed" },
      { title: "Voting Phase Active", timestamp: "2026-10-17T16:24:24.000Z", status: "Active" }
    ]
  },
  {
    id: "SIP-3117",
    title: "Proposed by Treasury Agent — Yield Allocation: Deploy 50 USDC to Circle Yield Strategy",
    description: "AUTONOMOUS AGENT PROPOSAL\nAction: yield_allocation\nAmount: 50 USDC\nCategory: TREASURY_REBALANCE\nObjective: Allocate idle treasury stablecoin reserves into verified Circle yield strategies to earn annualized treasury returns for SynArc DAO on Arc Testnet.",
    proposer: "0x35630dfe2592ab19d979ec1b173697aea554b66b",
    category: "TREASURY_REBALANCE",
    status: "Active",
    forVotes: 14802000,
    againstVotes: 0,
    abstainVotes: 0,
    totalVotes: 14802000,
    participationPercentage: 98.7,
    treasuryImpactValue: -50,
    treasuryImpact: "-50 USDC",
    timeRemaining: "7 days left",
    createdAt: "2026-10-17T16:23:52.000Z",
    votingStarts: "2026-10-17T16:23:52.000Z",
    votingEnds: "2026-10-24T16:23:52.000Z",
    executionTarget: "0x35630dfe2592ab19d979ec1b173697aea554b66b",
    votingDuration: 7,
    deliverableURI: "",
    timeline: [
      { title: "Proposal Created", timestamp: "2026-10-17T16:23:52.000Z", status: "Proposed" },
      { title: "Voting Phase Active", timestamp: "2026-10-17T16:23:52.000Z", status: "Active" }
    ]
  },
  {
    id: "SIP-2990",
    title: "Contractor Payout: Security Sentinel & Agent Stack Infrastructure Milestone",
    description: "Payout 0.01 USDC for contractor deliverable verification and Sentinel node deployment.",
    proposer: "0x35630dfe2592ab19d979ec1b173697aea554b66b",
    category: "CONTRACTOR_PAYOUT",
    status: "Executed",
    forVotes: 14803000,
    againstVotes: 0,
    abstainVotes: 0,
    totalVotes: 14803000,
    participationPercentage: 98.7,
    treasuryImpactValue: -0.01,
    treasuryImpact: "-0.01 USDC",
    timeRemaining: "Ended",
    createdAt: "2026-10-09T15:13:23.000Z",
    votingStarts: "2026-10-09T15:13:23.000Z",
    votingEnds: "2026-10-09T15:14:23.000Z",
    executionTarget: "0xE819090D7810D89f2E86e167d0b58425dEd745D8",
    votingDuration: 60,
    deliverableURI: "ipfs://QmPgvwkpDNgHSTx3V7NrLwCrQbppN39Zpji6o3TwbtVuiU",
    timeline: [
      { title: "Proposal Created", timestamp: "2026-10-09T15:13:23.000Z", status: "Proposed" },
      { title: "Voting Phase Active", timestamp: "2026-10-09T15:13:23.000Z", status: "Active" },
      { title: "Voting Closed & Passed", timestamp: "2026-10-09T15:14:23.000Z", status: "Passed" },
      { title: "Transaction Executed", timestamp: "2026-10-09T15:15:29.000Z", status: "Executed" }
    ]
  },
  {
    id: "SIP-2989",
    title: "Contractor Payout: Security Sentinel & Agent Stack Infrastructure Milestone",
    description: "Payout 0.01 USDC for contractor deliverable verification and Sentinel node deployment.",
    proposer: "0x35630dfe2592ab19d979ec1b173697aea554b66b",
    category: "CONTRACTOR_PAYOUT",
    status: "Defeated",
    forVotes: 0,
    againstVotes: 14803000,
    abstainVotes: 0,
    totalVotes: 14803000,
    participationPercentage: 98.7,
    treasuryImpactValue: -0.01,
    treasuryImpact: "-0.01 USDC",
    timeRemaining: "Ended",
    createdAt: "2026-10-09T14:48:00.000Z",
    votingStarts: "2026-10-09T14:48:00.000Z",
    votingEnds: "2026-10-09T14:49:00.000Z",
    executionTarget: "0xE819090D7810D89f2E86e167d0b58425dEd745D8",
    votingDuration: 60,
    deliverableURI: "",
    timeline: [
      { title: "Proposal Created", timestamp: "2026-10-09T14:48:00.000Z", status: "Proposed" },
      { title: "Voting Closed & Defeated", timestamp: "2026-10-09T14:49:00.000Z", status: "Defeated" }
    ]
  },
  {
    id: "SIP-2988",
    title: "Contractor Payout: Security Sentinel Node Test",
    description: "Testing testnet payout flow for contractor milestone.",
    proposer: "0x35630dfe2592ab19d979ec1b173697aea554b66b",
    category: "CONTRACTOR_PAYOUT",
    status: "Defeated",
    forVotes: 0,
    againstVotes: 14803000,
    abstainVotes: 0,
    totalVotes: 14803000,
    participationPercentage: 98.7,
    treasuryImpactValue: -0.01,
    treasuryImpact: "-0.01 USDC",
    timeRemaining: "Ended",
    createdAt: "2026-10-09T14:30:00.000Z",
    votingStarts: "2026-10-09T14:30:00.000Z",
    votingEnds: "2026-10-09T14:31:00.000Z",
    executionTarget: "0xE819090D7810D89f2E86e167d0b58425dEd745D8",
    votingDuration: 60,
    deliverableURI: "",
    timeline: [
      { title: "Proposal Created", timestamp: "2026-10-09T14:30:00.000Z", status: "Proposed" },
      { title: "Voting Closed & Defeated", timestamp: "2026-10-09T14:31:00.000Z", status: "Defeated" }
    ]
  }
];

const isMainnetInitial = getActiveNetwork() === 'mainnet';
const INITIAL_METRICS: GovernanceMetrics = {
  treasuryValue: isMainnetInitial ? `$${MAINNET_TREASURY_BASELINE.combinedBalance.toFixed(2)}` : "$30,688.99",
  activeProposals: 0,
  totalProposals: 0,
  governanceParticipation: "0.0%",
  daoMembers: 1,
  treasuryTransactions: isMainnetInitial ? 8 : 2,
  proposalExecutionRate: "0.0%",
};

export const useGovernanceStore = create<GovernanceState>((set, get) => ({
  proposals: [],
  // Reliable baseline metrics — on Mainnet, clean zeroes/active live defaults; on Testnet, verified historical baseline.
  metrics: INITIAL_METRICS,
  treasuryActivities: isMainnetInitial ? MAINNET_TREASURY_BASELINE.activities : TESTNET_TREASURY_BASELINE.activities,
  userVotes: {},
  initialized: false,
  lastFetched: null,
  currentNetwork: null,
  currentDaoId: null,
  currentDao: null,
  activeContracts: {
    governor: GOVERNANCE_CONTRACTS.governor,
    treasury: GOVERNANCE_CONTRACTS.treasury,
    token: GOVERNANCE_CONTRACTS.token,
  },

  initializeStore: async (customDao, force) => {
    const activeDaoId = customDao?.id || 'synarc';
    const currentNet = getActiveNetwork();
    const isMainnet = currentNet === 'mainnet';
    const netKey = isMainnet ? 'mainnet' : 'testnet';
    const STALE_MS = 180_000; // 3-minute cache — avoids redundant RPC round-trips
    const state = get();
    const now = Date.now();

    // Skip re-fetch only if data is fresh, DAO hasn't changed, AND network hasn't changed
    if (
      !force &&
      state.initialized &&
      state.currentDaoId === activeDaoId &&
      state.currentNetwork === currentNet &&
      state.lastFetched !== null &&
      now - state.lastFetched < STALE_MS
    ) return;

    // Reset store state for new DAO load or network switch
    const contracts = customDao ? {
      governor: customDao.governorAddress,
      treasury: customDao.treasuryAddress,
      token: customDao.tokenAddress,
      usdc: isMainnet ? CONTRACTS_MAINNET.usdc : CONTRACTS_TESTNET.usdc,
      eurc: isMainnet ? CONTRACTS_MAINNET.eurc : CONTRACTS_TESTNET.eurc,
      cirBTC: isMainnet ? CONTRACTS_MAINNET.cirBTC : CONTRACTS_TESTNET.cirBTC,
    } : {
      governor: isMainnet ? CONTRACTS_MAINNET.governor : CONTRACTS_TESTNET.governor,
      treasury: isMainnet ? CONTRACTS_MAINNET.treasuryGovernance : CONTRACTS_TESTNET.treasuryGovernance,
      token: isMainnet ? CONTRACTS_MAINNET.token : CONTRACTS_TESTNET.token,
      usdc: isMainnet ? CONTRACTS_MAINNET.usdc : CONTRACTS_TESTNET.usdc,
      eurc: isMainnet ? CONTRACTS_MAINNET.eurc : CONTRACTS_TESTNET.eurc,
      cirBTC: isMainnet ? CONTRACTS_MAINNET.cirBTC : CONTRACTS_TESTNET.cirBTC,
    };

    set({ 
      proposals: [], 
      treasuryActivities: isMainnet ? MAINNET_TREASURY_BASELINE.activities : TESTNET_TREASURY_BASELINE.activities,
      initialized: false, 
      currentDaoId: activeDaoId,
      currentNetwork: currentNet,
      currentDao: customDao || null,
      activeContracts: contracts 
    });

    // --- Step 0: Eagerly pre-populate with cached live + historical + simulated proposals
    // For testnet, historical baseline (SIP-1..941) + TESTNET_BASELINE_PROPOSALS is loaded.
    // For mainnet, ONLY mainnet-specific cached/live proposals are loaded — NO testnet data.

    let simulatedProposalsEager: Proposal[] = [];
    let cachedLiveProposalsEager: Proposal[] = [];
    if (typeof window !== "undefined") {
      try {
        const storedSim = localStorage.getItem(`synarc_simulated_proposals_${netKey}`) || (!isMainnet ? localStorage.getItem("synarc_simulated_proposals") : null);
        if (storedSim) simulatedProposalsEager = JSON.parse(storedSim);
        const storedLive = localStorage.getItem(`synarc_cached_live_proposals_${netKey}`) || (!isMainnet ? localStorage.getItem("synarc_cached_live_proposals") : null);
        if (storedLive) cachedLiveProposalsEager = JSON.parse(storedLive);
      } catch { /* ignore */ }
    }
    
    // Deduplicate eager proposals
    const cachedLiveIds = new Set(cachedLiveProposalsEager.map(p => p.id));
    const uniqueSimEager = simulatedProposalsEager.filter(p => !cachedLiveIds.has(p.id));

    const eagerProposals = activeDaoId === 'synarc'
      ? (isMainnet 
          ? [...cachedLiveProposalsEager, ...uniqueSimEager]
          : [
              ...cachedLiveProposalsEager,
              ...TESTNET_BASELINE_PROPOSALS.filter(bp => !cachedLiveIds.has(bp.id)),
              ...uniqueSimEager,
              ...(historicalProposals as Proposal[]).filter(hp => !cachedLiveIds.has(hp.id) && !TESTNET_BASELINE_PROPOSALS.some(bp => bp.id === hp.id))
            ])
      : [...cachedLiveProposalsEager, ...uniqueSimEager];

    // Show baseline metrics immediately.
    set({
      proposals: eagerProposals,
      treasuryActivities: isMainnet ? MAINNET_TREASURY_BASELINE.activities : TESTNET_TREASURY_BASELINE.activities,
      initialized: true,
      metrics: {
        treasuryValue: isMainnet ? `$${MAINNET_TREASURY_BASELINE.combinedBalance.toFixed(2)}` : "$30,688.99",
        activeProposals: eagerProposals.filter(p => p.status === "Active").length,
        totalProposals: eagerProposals.length,
        governanceParticipation: eagerProposals.length > 0
          ? (eagerProposals.reduce((sum, p) => sum + (p.participationPercentage || 0), 0) / eagerProposals.length).toFixed(1) + "%"
          : "0.0%",
        daoMembers: 1,
        treasuryTransactions: isMainnet ? 8 : 2,
        proposalExecutionRate: eagerProposals.filter(p => p.status === "Executed" || p.status === "Defeated").length > 0
          ? ((eagerProposals.filter(p => p.status === "Executed").length / eagerProposals.filter(p => p.status === "Executed" || p.status === "Defeated").length) * 100).toFixed(1) + "%"
          : "0.0%"
      }
    });

    const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 8000): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`RPC call timed out after ${timeoutMs}ms`)), timeoutMs)
        )
      ]);
    };

    try {
      const provider = await withTimeout(getCachedProvider(), 8000);

      const governorAddress = contracts.governor;
      const governorContract = new Contract(governorAddress, GovernorABI, provider);

      // Fetch proposal count directly from the contract with timeout
      const count = await withTimeout(governorContract.proposalCount(), 8000);
      const totalCount = Number(count);

      // Fetch on-chain proposals:
      // On Mainnet, indexing begins at proposal 1 up to totalCount (e.g. 21 proposals).
      // On Testnet, proposals 1-941 are in historical JSON. We fetch the latest window (up to 20 recent proposals)
      // in descending order, ensuring fast, non-blocking loads without RPC rate limiting.
      const MAX_RECENT_FETCH = isMainnet ? totalCount : 20;
      const fetchCount = Math.min(totalCount, MAX_RECENT_FETCH);
      const proposalIndices = Array.from(
        { length: fetchCount },
        (_, i) => isMainnet ? (i + 1) : (totalCount - i)
      );

      // Fetch in small parallel chunks (concurrency 3) with an 8000ms timeout per call to avoid RPC throttling
      const CHUNK_SIZE = 3;
      const settled: PromiseSettledResult<{ i: number; p: any; proposalStateNum: any }>[] = [];
      for (let c = 0; c < proposalIndices.length; c += CHUNK_SIZE) {
        const chunk = proposalIndices.slice(c, c + CHUNK_SIZE);
        const chunkResults = await Promise.allSettled(
          chunk.map(async (i) => {
            let p: any;
            let proposalStateNum: any;
            try {
              [p, proposalStateNum] = await withTimeout(Promise.all([
                governorContract.getProposal(i),
                governorContract.state(i),
              ]), 8000);
            } catch {
              try {
                // Fallback for contracts with 15-field getProposal (without deliverableURI)
                const gov15 = new Contract(governorAddress, [
                  "function getProposal(uint256) view returns (uint256 id, address proposer, string title, string description, string category, uint256 votingDuration, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed, uint256 treasuryImpactValue, address executionTarget)",
                  "function state(uint256) view returns (uint8)"
                ], provider);
                [p, proposalStateNum] = await withTimeout(Promise.all([
                  gov15.getProposal(i),
                  gov15.state(i),
                ]), 8000);
              } catch {
                // Fallback for standard OpenZeppelin governor contracts that expose proposals(uint256)
                [p, proposalStateNum] = await withTimeout(Promise.all([
                  governorContract.proposals(i),
                  governorContract.state(i),
                ]), 8000);
              }
            }
            return { i, p, proposalStateNum };
          })
        );
        settled.push(...chunkResults);
        if (c + CHUNK_SIZE < proposalIndices.length) {
          await new Promise((r) => setTimeout(r, 50));
        }
      }

      const loadedProposals: Proposal[] = [];
      for (const result of settled) {
        if (result.status === 'rejected') {
          console.warn(`Failed to load a proposal:`, result.reason);
          continue;
        }
        const { p, proposalStateNum } = result.value;

        const rawTitle = p.title ? String(p.title).trim() : "";
        const rawDesc = p.description ? String(p.description).trim() : "";
        // Filter out fuzz/test placeholder proposals created by automated scripts on testnet
        const isFuzzSpam = /^Proposal \d+$/i.test(rawTitle) && (!rawDesc || rawDesc === "community" || rawDesc === "general" || rawDesc.length < 15);
        if (isFuzzSpam) {
          continue;
        }

        let safeDeliverableURI = "";
        try {
          safeDeliverableURI = p.deliverableURI ? String(p.deliverableURI) : "";
        } catch {
          safeDeliverableURI = "";
        }

          // Vote weights are sARC governance token amounts — 18 decimals
          const forV = Number(formatUnits(p.forVotes, 18));
          const againstV = Number(formatUnits(p.againstVotes, 18));
          const abstainV = Number(formatUnits(p.abstainVotes, 18));
          const total = forV + againstV + abstainV;
          // Total sARC supply is 15,000,000 tokens (already in human units after formatUnits)
          const participation = total > 0 ? (total / 15_000_000) * 100 : 0;

          const statusMap: Record<number, string> = {
            0: "Pending",
            1: "Active",
            2: "Canceled",
            3: "Defeated",
            4: "Succeeded",
            5: "Queued",
            6: "Expired",
            7: "Executed"
          };
          const status = statusMap[Number(proposalStateNum)] || "Active";

          const startTimeSecs = p.startTime ? Number(p.startTime) : Date.now() / 1000;
          const endTimeSecs = p.endTime ? Number(p.endTime) : (p.endBlock ? Date.now() / 1000 + 604800 : Date.now() / 1000 + 604800);
          const treasuryImpactVal = p.treasuryImpactValue ? Number(formatUnits(p.treasuryImpactValue, 6)) : 0;

          const timeline: TimelineEvent[] = [
            { title: "Proposal Created", timestamp: new Date(startTimeSecs * 1000).toISOString(), status: "Proposed" }
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

          const propIdStr = p.id ? p.id.toString() : result.value.i.toString();

          loadedProposals.push({
            id: `SIP-${propIdStr}`,
            title: rawTitle || `Proposal #${propIdStr}`,
            description: rawDesc || "Governance Proposal",
            proposer: p.proposer,
            category: p.category || "General",
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
            executionTarget: p.executionTarget || ethers.ZeroAddress,
            votingDuration: p.votingDuration ? Number(p.votingDuration) / 86400 : 7,
            deliverableURI: safeDeliverableURI,
            timeline
          });
      }

      // Sort loaded proposals by ID descending so newest is always first
      loadedProposals.sort((a, b) => {
        const idA = parseInt(a.id.replace(/\D/g, ""), 10) || 0;
        const idB = parseInt(b.id.replace(/\D/g, ""), 10) || 0;
        return idB - idA;
      });

      // Merge simulated proposals from localStorage
      let simulatedProposals: Proposal[] = [];
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(`synarc_simulated_proposals_${netKey}`) || (!isMainnet ? localStorage.getItem("synarc_simulated_proposals") : null);
          if (stored) {
            simulatedProposals = JSON.parse(stored);
          }
        } catch (err) {
          console.error("Failed to parse simulated proposals from localStorage", err);
        }
      }
      // Filter out simulated proposals that exist in on-chain loadedProposals to avoid duplicates
      const loadedIds = new Set(loadedProposals.map(p => p.id));
      const uniqueSimulated = simulatedProposals.filter(p => !loadedIds.has(p.id));

      let combinedProposals = [...loadedProposals, ...uniqueSimulated];
      // Only include testnet baseline and historical proposals on Testnet
      if (activeDaoId === 'synarc' && !isMainnet) {
        // Merge any baseline proposals not captured in the recent on-chain window
        const existingIds = new Set(combinedProposals.map(p => p.id));
        const missingBaseline = TESTNET_BASELINE_PROPOSALS.filter(p => !existingIds.has(p.id));
        combinedProposals = [...combinedProposals, ...missingBaseline];

        const normalizedHistorical = (historicalProposals as any[]).map((hp) => ({
          ...hp,
          votingStarts: hp.votingStarts || hp.createdAt || (hp.timeline && hp.timeline[0]?.timestamp) || new Date().toISOString(),
          votingEnds: hp.votingEnds || hp.endsAt || (hp.timeline && hp.timeline[hp.timeline.length - 1]?.timestamp) || new Date().toISOString(),
        }));
        const currentIds = new Set(combinedProposals.map(p => p.id));
        const missingHistorical = normalizedHistorical.filter(p => !currentIds.has(p.id));
        combinedProposals = [...combinedProposals, ...missingHistorical];

        // Ensure descending sort by proposal number so recent proposals are first
        combinedProposals.sort((a, b) => {
          const idA = parseInt(a.id.replace(/\D/g, ""), 10) || 0;
          const idB = parseInt(b.id.replace(/\D/g, ""), 10) || 0;
          return idB - idA;
        });
      }

      const treasuryAddress = contracts.treasury;
      const treasuryContract = new Contract(treasuryAddress, [
        "function balance() external view returns (uint256)",
        "function usdcBalance() external view returns (uint256)"
      ], provider);

      const usdcAddress = contracts.usdc || (isMainnet ? CONTRACTS_MAINNET.usdc : CONTRACTS_TESTNET.usdc);
      const usdcTokenContract = new Contract(usdcAddress, [
        "function balanceOf(address account) external view returns (uint256)"
      ], provider);

      let loadedActivities: TreasuryActivity[] = [];
      let treasuryVal = 0;
      try {
        const fetchTransactions = async (): Promise<any[]> => {
          try {
            const t7 = new Contract(treasuryAddress, [
              "function getTransactions() external view returns (tuple(string txType, address party, uint256 amount, string tokenSymbol, string description, uint256 timestamp, string deliverableURI)[])"
            ], provider);
            return await t7.getTransactions();
          } catch {
            try {
              const t6 = new Contract(treasuryAddress, [
                "function getTransactions() external view returns (tuple(string txType, address party, uint256 amount, string tokenSymbol, string description, uint256 timestamp)[])"
              ], provider);
              return await t6.getTransactions();
            } catch {
              try {
                const t5 = new Contract(treasuryAddress, [
                  "function getTransactions() external view returns (tuple(string txType, address party, uint256 amount, string description, uint256 timestamp)[])"
                ], provider);
                return await t5.getTransactions();
              } catch {
                return [];
              }
            }
          }
        };

        const isMainnetTreasury = treasuryAddress.toLowerCase() === CONTRACTS_MAINNET.treasuryGovernance.toLowerCase();
        const isTestnetTreasury = treasuryAddress.toLowerCase() === CONTRACTS_TESTNET.treasuryGovernance.toLowerCase();

        const eurcTokenAddress = isMainnet
          ? '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1'
          : (contracts.eurc || '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a');
        const cirBtcTokenAddress = isMainnet
          ? '0x171A4217b86A807A64eB94757Db6849fb4bDbAA0'
          : (contracts.cirBTC || '0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF');

        const eurcTokenContract = new Contract(eurcTokenAddress, ERC20ABI, provider);
        const cirBtcTokenContract = new Contract(cirBtcTokenAddress, ERC20ABI, provider);

        const [rawActivities, internalBal, erc20Bal, eurcBal, cirBtcBal] = await withTimeout(Promise.all([
          fetchTransactions(),
          treasuryContract.usdcBalance().catch(() => treasuryContract.balance().catch(() => 0n)),
          usdcTokenContract.balanceOf(treasuryAddress).catch(() => 0n),
          eurcTokenContract.balanceOf(treasuryAddress).catch(() => 0n),
          cirBtcTokenContract.balanceOf(treasuryAddress).catch(() => 0n),
        ]), 6000);

        if (Array.isArray(rawActivities) && rawActivities.length > 0) {
          loadedActivities = rawActivities.map((act: any, idx: number) => {
            const knownMainnetHash = (isMainnetTreasury && KNOWN_MAINNET_TX_HASHES[idx]) ? KNOWN_MAINNET_TX_HASHES[idx] : "";
            const knownTestnetHash = (isTestnetTreasury && (idx === 417 || (act.txType === 'Outflow' && Number(act.amount) === 10000)))
              ? '0x6382e395d2d7102f0c14bddecc86ff3dbb587e93df3f606ea748297f1ba7cada'
              : "";
            const txHash = (act.deliverableURI && act.deliverableURI.startsWith("0x") && act.deliverableURI.length === 66)
              ? act.deliverableURI
              : (knownMainnetHash || knownTestnetHash);

            return {
              id: `tx-${treasuryAddress.toLowerCase()}-${idx}-${Number(act.timestamp || 0)}`,
              type: act.txType as "Inflow" | "Outflow",
              amount: Number(formatUnits(act.amount, 6)),
              token: act.tokenSymbol || "USDC",
              timestamp: new Date(Number(act.timestamp) * 1000).toISOString(),
              description: act.description,
              party: act.party || "",
              deliverableURI: act.deliverableURI || "",
              txHash
            };
          });
          loadedActivities.reverse();
          if (isMainnetTreasury) {
            const map = new Map<string, TreasuryActivity>();
            MAINNET_TREASURY_BASELINE.activities.forEach(a => map.set(a.id, a));
            loadedActivities.forEach(a => map.set(a.id, a));
            loadedActivities = Array.from(map.values()).sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
          }
        } else if (isMainnet && treasuryAddress.toLowerCase() === CONTRACTS_MAINNET.treasuryGovernance.toLowerCase()) {
          loadedActivities = MAINNET_TREASURY_BASELINE.activities;
        } else if (!isMainnet && treasuryAddress.toLowerCase() === CONTRACTS_TESTNET.treasuryGovernance.toLowerCase()) {
          loadedActivities = TESTNET_TREASURY_BASELINE.activities;
        }

        const internalNum = Number(formatUnits(internalBal || 0n, 6));
        const erc20Num = Number(formatUnits(erc20Bal || 0n, 6));
        const eurcNum = Number(formatUnits(eurcBal || 0n, 6));
        const cirBtcNum = Number(formatUnits(cirBtcBal || 0n, 8));

        const usdcNum = erc20Num > 0 ? erc20Num : (internalNum > 0 ? internalNum : (isMainnetTreasury ? MAINNET_TREASURY_BASELINE.usdcBalance : 0));
        const finalEurc = eurcNum > 0 ? eurcNum : (isMainnetTreasury ? MAINNET_TREASURY_BASELINE.eurcBalance : 0);
        const finalCirBtc = cirBtcNum > 0 ? cirBtcNum : (isMainnetTreasury ? MAINNET_TREASURY_BASELINE.cirBtcBalance : 0);

        const multiAssetVal = usdcNum + (finalEurc * 1.08) + (finalCirBtc * 95000);
        const baselineVal = isMainnet ? MAINNET_TREASURY_BASELINE.combinedBalance : TESTNET_TREASURY_BASELINE.combinedBalance;
        treasuryVal = multiAssetVal > 0 ? multiAssetVal : baselineVal;
      } catch (err) {
        console.warn("Failed to load Treasury activities via RPC:", err);
      }

      let memberCount = 1;
      try {
        memberCount = await getTokenHolderCount(provider, contracts.token);
        if (!memberCount || memberCount < 1) memberCount = 1;
      } catch {
        memberCount = 1;
      }

      const avgPart = combinedProposals.length > 0
        ? (combinedProposals.reduce((sum, p) => sum + p.participationPercentage, 0) / combinedProposals.length).toFixed(1) + "%"
        : "0.0%";

      const executionRate = combinedProposals.filter(p => p.status === "Executed" || p.status === "Defeated").length > 0
        ? ((combinedProposals.filter(p => p.status === "Executed").length / combinedProposals.filter(p => p.status === "Executed" || p.status === "Defeated").length) * 100).toFixed(1) + "%"
        : "0.0%";

      if (typeof window !== "undefined" && loadedProposals.length > 0) {
        try {
          localStorage.setItem(`synarc_cached_live_proposals_${netKey}`, JSON.stringify(loadedProposals));
        } catch { /* ignore quota errors */ }
      }

      set({
        proposals: combinedProposals,
        treasuryActivities: loadedActivities.length > 0 ? loadedActivities : (isMainnet ? MAINNET_TREASURY_BASELINE.activities : TESTNET_TREASURY_BASELINE.activities),
        initialized: true,
        lastFetched: Date.now(),
        metrics: {
          treasuryValue: `$${treasuryVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          activeProposals: combinedProposals.filter(p => p.status === "Active").length,
          totalProposals: combinedProposals.length,
          governanceParticipation: avgPart,
          daoMembers: memberCount,
          treasuryTransactions: loadedActivities.length || (isMainnet ? 8 : 2),
          proposalExecutionRate: executionRate,
        }
      });
    } catch (e) {
      console.warn("RPC connection unavailable or timed out, preserving reliable baseline metrics:", e);
      let simulatedProposals: Proposal[] = [];
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(`synarc_simulated_proposals_${netKey}`) || (!isMainnet ? localStorage.getItem("synarc_simulated_proposals") : null);
          if (stored) {
            simulatedProposals = JSON.parse(stored);
          }
        } catch (err) {
          console.error("Failed to parse simulated proposals from localStorage", err);
        }
      }
      const fallbackProposals = (activeDaoId === 'synarc' && !isMainnet)
        ? [
            ...TESTNET_BASELINE_PROPOSALS,
            ...simulatedProposals.filter(sp => !TESTNET_BASELINE_PROPOSALS.some(bp => bp.id === sp.id)),
            ...(historicalProposals as Proposal[]).filter(hp => !TESTNET_BASELINE_PROPOSALS.some(bp => bp.id === hp.id))
          ]
        : simulatedProposals;
      // RPC timeout/failure: preserve baseline
      set({
        proposals: fallbackProposals,
        treasuryActivities: isMainnet ? MAINNET_TREASURY_BASELINE.activities : TESTNET_TREASURY_BASELINE.activities,
        initialized: true,
        lastFetched: Date.now(),
        metrics: {
          treasuryValue: isMainnet ? `$${MAINNET_TREASURY_BASELINE.combinedBalance.toFixed(2)}` : "$30,688.99",
          activeProposals: fallbackProposals.filter(p => p.status === "Active").length,
          totalProposals: fallbackProposals.length,
          governanceParticipation: fallbackProposals.length > 0
            ? (fallbackProposals.reduce((sum, p) => sum + (p.participationPercentage || 0), 0) / fallbackProposals.length).toFixed(1) + "%"
            : "0.0%",
          daoMembers: 1,
          treasuryTransactions: isMainnet ? 8 : 2,
          proposalExecutionRate: fallbackProposals.filter(p => p.status === "Executed" || p.status === "Defeated").length > 0
            ? ((fallbackProposals.filter(p => p.status === "Executed").length / fallbackProposals.filter(p => p.status === "Executed" || p.status === "Defeated").length) * 100).toFixed(1) + "%"
            : "0.0%"
        }
      });
    }
  },

  submitProposal: async (proposalData, signer) => {
    try {
      const governorAddress = get().activeContracts.governor;
      const governorContract = new Contract(governorAddress, GovernorABI, signer);

      const votingDurationSecs = BigInt(proposalData.votingDuration) * 86400n;
      const absoluteImpactValue = BigInt(Math.abs(proposalData.treasuryImpactValue)) * 1000000n;
      const targetAddress = proposalData.executionTarget || ethers.ZeroAddress;

      let tx: any;
      try {
        tx = await governorContract['propose(string,string,string,uint256,uint256,address,string)'](
          proposalData.title.trim(),
          proposalData.description.trim(),
          proposalData.category.trim(),
          votingDurationSecs,
          absoluteImpactValue,
          targetAddress,
          proposalData.deliverableURI || ""
        );
      } catch {
        // Fallback to 6-argument propose if 7-argument signature is not supported
        tx = await governorContract['propose(string,string,string,uint256,uint256,address)'](
          proposalData.title.trim(),
          proposalData.description.trim(),
          proposalData.category.trim(),
          votingDurationSecs,
          absoluteImpactValue,
          targetAddress
        );
      }

      const receipt = await tx.wait();

      // Extract the real proposalId from ProposalCreated event logs
      let finalProposalId = `SIP-${get().proposals.length}`; // fallback
      try {
        if (receipt && receipt.logs) {
          for (const log of receipt.logs) {
            try {
              const parsed = governorContract.interface.parseLog({
                topics: [...log.topics],
                data: log.data
              });
              if (parsed && parsed.name === "ProposalCreated") {
                finalProposalId = `SIP-${parsed.args.proposalId.toString()}`;
                break;
              }
            } catch {
              // skip unparseable logs
            }
          }
        }
      } catch (eventErr) {
        console.error("Failed to parse on-chain ProposalCreated event log:", eventErr);
      }

      set({ initialized: false });
      const currentDao = get().currentDao;
      await get().initializeStore(currentDao || undefined, true);

      return finalProposalId;
    } catch (err: any) {
      // Provide clear human-readable error messages
      const raw = err?.reason || err?.message || '';
      const lower = raw.toLowerCase();
      if (lower.includes('user rejected') || lower.includes('user denied') || lower.includes('cancelled')) {
        throw new Error('Transaction was rejected by wallet.');
      }
      if (lower.includes('insufficient funds') || lower.includes('insufficient balance')) {
        throw new Error('Insufficient USDC balance for gas fees. Please claim from the faucet.');
      }
      if (lower.includes('nonce too low')) {
        throw new Error('Transaction nonce error. Please wait a moment and try again.');
      }
      const message = err?.reason || err?.message || 'Failed to create proposal';
      throw new Error(message);
    }
  },

  castVote: async (proposalId, option, weight, signature, signer) => {
    const governorAddress = get().activeContracts.governor;
    const governorContract = new Contract(governorAddress, GovernorABI, signer);

    const id = Number(proposalId.replace("SIP-", ""));
    const optionMap = {
      "Against": 0,
      "For": 1,
      "Abstain": 2
    };
    const optionNum = optionMap[option];

    const tx = await governorContract.castVoteWithReason(id, optionNum, signature);
    await tx.wait();

    set({ initialized: false });
    const currentDao = get().currentDao;
    await get().initializeStore(currentDao || undefined, true);
  },

  executeProposal: async (proposalId, signer) => {
    const governorAddress = get().activeContracts.governor;
    const governorContract = new Contract(governorAddress, GovernorABI, signer);

    const id = Number(proposalId.replace("SIP-", ""));

    const tx = await governorContract.execute(id);
    await tx.wait();

    set({ initialized: false });
    const currentDao = get().currentDao;
    await get().initializeStore(currentDao || undefined, true);
  }
}));

// Automatically react to network switches across the app
if (typeof window !== "undefined") {
  window.addEventListener("synarc_network_changed", () => {
    const currentDao = useGovernanceStore.getState().currentDao;
    useGovernanceStore.getState().initializeStore(currentDao || undefined, true);
  });
}

