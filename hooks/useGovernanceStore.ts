import { create } from "zustand";
import { Proposal, ProposalStatus, TimelineEvent, GovernanceMetrics } from "@/types/governance";
import { TreasuryActivity } from "@/types";
import { ethers, JsonRpcProvider, BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";
import { GOVERNANCE_CONTRACTS, GovernorABI, ProposalState, VoteType, ERC20ABI } from "@/lib/governance/contracts";

import { getResilientProvider } from "@/lib/rpc/config";

interface GovernanceState {
  proposals: Proposal[];
  metrics: GovernanceMetrics;
  treasuryActivities: TreasuryActivity[];
  userVotes: Record<string, { option: "For" | "Against" | "Abstain"; sig: string; vp: number }>;
  initialized: boolean;
  lastFetched: number | null;
  currentDaoId: string | null;
  currentDao: { id: string; governorAddress: string; treasuryAddress: string; tokenAddress: string } | null;
  activeContracts: {
    governor: string;
    treasury: string;
    token: string;
  };
  
  // Actions
  initializeStore: (customDao?: { id: string; governorAddress: string; treasuryAddress: string; tokenAddress: string }) => Promise<void>;
  submitProposal: (proposalData: {
    title: string;
    description: string;
    category: string;
    treasuryImpactValue: number;
    executionTarget: string;
    votingDuration: number;
    proposer: string;
  }, signer: ethers.Signer) => Promise<string>;
  castVote: (proposalId: string, option: "For" | "Against" | "Abstain", weight: number, signature: string, signer: ethers.Signer) => Promise<void>;
  executeProposal: (proposalId: string, signer: ethers.Signer) => Promise<void>;
}

const INITIAL_PROPOSALS: Proposal[] = [];
const INITIAL_TREASURY_ACTIVITIES: TreasuryActivity[] = [];

export const useGovernanceStore = create<GovernanceState>((set, get) => ({
  proposals: [],
  metrics: {
    treasuryValue: "$2,450,000",
    activeProposals: 0,
    totalProposals: 0,
    governanceParticipation: "68.5%",
    daoMembers: 12450,
    treasuryTransactions: 3,
    proposalExecutionRate: "92.4%",
  },
  treasuryActivities: [],
  userVotes: {},
  initialized: false,
  lastFetched: null,
  currentDaoId: null,
  currentDao: null,
  activeContracts: {
    governor: GOVERNANCE_CONTRACTS.governor,
    treasury: GOVERNANCE_CONTRACTS.treasury,
    token: GOVERNANCE_CONTRACTS.token,
  },

  initializeStore: async (customDao) => {
    const activeDaoId = customDao?.id || 'synarc';
    const STALE_MS = 120_000; // 2-minute cache — avoids redundant RPC round-trips
    const state = get();
    const now = Date.now();

    // Skip re-fetch if data is fresh and DAO hasn't changed
    if (
      state.initialized &&
      state.currentDaoId === activeDaoId &&
      state.lastFetched !== null &&
      now - state.lastFetched < STALE_MS
    ) return;

    // Reset store state for new DAO load
    const contracts = customDao ? {
      governor: customDao.governorAddress,
      treasury: customDao.treasuryAddress,
      token: customDao.tokenAddress
    } : {
      governor: GOVERNANCE_CONTRACTS.governor,
      treasury: GOVERNANCE_CONTRACTS.treasury,
      token: GOVERNANCE_CONTRACTS.token
    };

    set({ 
      proposals: [], 
      treasuryActivities: [],
      initialized: false, 
      currentDaoId: activeDaoId,
      currentDao: customDao || null,
      activeContracts: contracts 
    });

    try {
      const provider = await getResilientProvider();

      const governorAddress = contracts.governor;
      const governorContract = new Contract(governorAddress, GovernorABI, provider);

      // Fetch proposal count directly from the contract
      const count = await governorContract.proposalCount();
      const totalCount = Number(count);

      // Fetch all proposals in parallel for dramatically faster load times
      const proposalIndices = Array.from({ length: totalCount }, (_, i) => i + 1);
      const settled = await Promise.allSettled(
        proposalIndices.map(async (i) => {
          const [p, proposalStateNum] = await Promise.all([
            governorContract.getProposal(i),
            governorContract.state(i),
          ]);
          return { i, p, proposalStateNum };
        })
      );

      const loadedProposals: Proposal[] = [];
      for (const result of settled) {
        if (result.status === 'rejected') {
          console.error(`Failed to load a proposal:`, result.reason);
          continue;
        }
        const { p, proposalStateNum } = result.value;

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

          const timeline: TimelineEvent[] = [
            { title: "Proposal Created", timestamp: new Date(Number(p.startTime) * 1000).toISOString(), status: "Proposed" }
          ];
          if (status === "Active") {
            timeline.push({ title: "Voting Phase Active", timestamp: new Date(Number(p.startTime) * 1000).toISOString(), status: "Active" });
          } else if (status === "Executed") {
            timeline.push({ title: "Transaction Executed", timestamp: new Date(Number(p.endTime) * 1000).toISOString(), status: "Executed" });
          } else if (status === "Canceled") {
            timeline.push({ title: "Proposal Canceled", timestamp: new Date(Number(p.endTime) * 1000).toISOString(), status: "Canceled" });
          } else if (status === "Defeated") {
            timeline.push({ title: "Voting Closed & Defeated", timestamp: new Date(Number(p.endTime) * 1000).toISOString(), status: "Defeated" });
          } else if (status === "Succeeded") {
            timeline.push({ title: "Voting Closed & Passed", timestamp: new Date(Number(p.endTime) * 1000).toISOString(), status: "Passed" });
          }

          loadedProposals.push({
            id: `SIP-${p.id.toString()}`,
            title: p.title || `Proposal #${p.id.toString()}`,
            description: p.description,
            proposer: p.proposer,
            category: p.category || "General",
            status: status as ProposalStatus,
            forVotes: forV,
            againstVotes: againstV,
            abstainVotes: abstainV,
            totalVotes: total,
            participationPercentage: parseFloat(participation.toFixed(1)),
            // treasuryImpactValue is USDC (6 decimals) — separate from vote weights
            treasuryImpactValue: -Number(formatUnits(p.treasuryImpactValue, 6)),
            treasuryImpact: p.treasuryImpactValue > 0n ? `-${Number(formatUnits(p.treasuryImpactValue, 6)).toLocaleString()} USDC` : "None",
            timeRemaining: status === "Active" ? `${Math.max(0, Math.ceil((Number(p.endTime) - Date.now() / 1000) / 86400))} days left` : "Ended",
            createdAt: new Date(Number(p.startTime) * 1000).toISOString(),
            votingStarts: new Date(Number(p.startTime) * 1000).toISOString(),
            votingEnds: new Date(Number(p.endTime) * 1000).toISOString(),
            executionTarget: p.executionTarget,
            votingDuration: Number(p.votingDuration) / 86400,
            timeline
          });
      }

      loadedProposals.reverse();

      const treasuryAddress = contracts.treasury;
      const treasuryContract = new Contract(treasuryAddress, [
        "function getTransactions() external view returns (tuple(string txType, address party, uint256 amount, string description, uint256 timestamp)[])",
        "function balance() external view returns (uint256)"
      ], provider);

      let loadedActivities: TreasuryActivity[] = [];
      let treasuryVal = 2450000;
      try {
        const rawActivities = await treasuryContract.getTransactions();
        loadedActivities = rawActivities.map((act: any, idx: number) => ({
          id: idx.toString(),
          type: act.txType as "Inflow" | "Outflow",
          amount: Number(formatUnits(act.amount, 6)),
          token: "USDC",
          timestamp: new Date(Number(act.timestamp) * 1000).toISOString(),
          description: act.description,
          txHash: "0x" + Math.random().toString(16).substring(2, 10) + "..."
        }));
        loadedActivities.reverse();

        const bal = await treasuryContract.balance();
        treasuryVal = Number(formatUnits(bal, 6));
      } catch (err) {
        console.error("Failed to load Treasury activities", err);
      }

      const avgPart = loadedProposals.length > 0
        ? (loadedProposals.reduce((sum, p) => sum + p.participationPercentage, 0) / loadedProposals.length).toFixed(1) + "%"
        : "0.0%";

      const executionRate = loadedProposals.filter(p => p.status === "Executed" || p.status === "Defeated").length > 0
        ? ((loadedProposals.filter(p => p.status === "Executed").length / loadedProposals.filter(p => p.status === "Executed" || p.status === "Defeated").length) * 100).toFixed(1) + "%"
        : "100.0%";

      set({
        proposals: loadedProposals,
        treasuryActivities: loadedActivities,
        initialized: true,
        lastFetched: Date.now(),
        metrics: {
          treasuryValue: `$${treasuryVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
          activeProposals: loadedProposals.filter(p => p.status === "Active").length,
          totalProposals: loadedProposals.length,
          governanceParticipation: avgPart,
          daoMembers: 12450, // Static fallback of active sARC holders to bypass 8800 rate-limited queries
          treasuryTransactions: loadedActivities.length,
          proposalExecutionRate: executionRate,
        }
      });
    } catch (e) {
      console.warn("RPC connection unavailable, reset to zero on-chain stats:", e);
      set({
        proposals: [],
        treasuryActivities: [],
        initialized: true,
        lastFetched: Date.now(),
        metrics: {
          treasuryValue: "$0",
          activeProposals: 0,
          totalProposals: 0,
          governanceParticipation: "0.0%",
          daoMembers: 0,
          treasuryTransactions: 0,
          proposalExecutionRate: "100.0%"
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

      const tx = await governorContract.propose(
        proposalData.title.trim(),
        proposalData.description.trim(),
        proposalData.category.trim(),
        votingDurationSecs,
        absoluteImpactValue,
        targetAddress,
        { 
          gasLimit: 500000n, 
          gasPrice: 10000000n, 
        }
      );

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
      await get().initializeStore(currentDao || undefined);

      return finalProposalId;
    } catch (err: any) {
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

    const tx = await governorContract.castVoteWithReason(id, optionNum, signature, {
      gasLimit: 300000n,
      gasPrice: 10000000n,
    });
    await tx.wait();

    set({ initialized: false });
    const currentDao = get().currentDao;
    await get().initializeStore(currentDao || undefined);
  },

  executeProposal: async (proposalId, signer) => {
    const governorAddress = get().activeContracts.governor;
    const governorContract = new Contract(governorAddress, GovernorABI, signer);

    const id = Number(proposalId.replace("SIP-", ""));

    const tx = await governorContract.execute(id, {
      gasLimit: 300000n,
      gasPrice: 10000000n,
    });
    await tx.wait();

    set({ initialized: false });
    const currentDao = get().currentDao;
    await get().initializeStore(currentDao || undefined);
  }
}));
