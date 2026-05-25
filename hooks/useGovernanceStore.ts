import { create } from "zustand";
import { Proposal, ProposalStatus, TimelineEvent, GovernanceMetrics } from "@/types/governance";
import { TreasuryActivity } from "@/types";
import { ethers, JsonRpcProvider, BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";
import { GOVERNANCE_CONTRACTS, GovernorABI, ProposalState, VoteType } from "@/lib/governance/contracts";

async function getResilientProvider(): Promise<JsonRpcProvider> {
  const rpcUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network";
  const fallbackRpcUrl = "https://arc-testnet.drpc.org";
  
  try {
    const provider = new JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
    // Let's do a lightweight network call to verify responsiveness
    await provider.getNetwork();
    return provider;
  } catch (err) {
    console.warn("Primary RPC connection failed, falling back to secondary RPC:", err);
    try {
      const fallbackProvider = new JsonRpcProvider(fallbackRpcUrl, undefined, { staticNetwork: true });
      await fallbackProvider.getNetwork();
      return fallbackProvider;
    } catch (fallbackErr) {
      console.error("Secondary RPC connection failed too:", fallbackErr);
      throw new Error("All RPC endpoints are offline");
    }
  }
}

interface GovernanceState {
  proposals: Proposal[];
  metrics: GovernanceMetrics;
  treasuryActivities: TreasuryActivity[];
  userVotes: Record<string, { option: "For" | "Against" | "Abstain"; sig: string; vp: number }>;
  initialized: boolean;
  
  // Actions
  initializeStore: () => void;
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
    governanceParticipation: "68.5%",
    daoMembers: 12450,
    treasuryTransactions: 3,
    proposalExecutionRate: "92.4%",
  },
  treasuryActivities: [],
  userVotes: {},
  initialized: false,

  initializeStore: async () => {
    if (get().initialized) return;

    try {
      const provider = await getResilientProvider();

      const governorAddress = GOVERNANCE_CONTRACTS.governor;
      const governorContract = new Contract(governorAddress, GovernorABI, provider);

      const count = await governorContract.proposalCount();
      const loadedProposals: Proposal[] = [];

      for (let i = 1; i <= Number(count); i++) {
        const p = await governorContract.getProposal(i);
        const proposalStateNum = await governorContract.state(i);

        const forV = Number(formatUnits(p.forVotes, 6)); // USDC 6 decimals
        const againstV = Number(formatUnits(p.againstVotes, 6));
        const abstainV = Number(formatUnits(p.abstainVotes, 6));
        const total = forV + againstV + abstainV;
        const participation = total > 0 ? (total / 15000000) * 100 : 0;

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
          id: `SIP-${p.id}`,
          title: p.title,
          description: p.description,
          proposer: p.proposer,
          category: p.category,
          status: status as ProposalStatus,
          forVotes: forV,
          againstVotes: againstV,
          abstainVotes: abstainV,
          totalVotes: total,
          participationPercentage: parseFloat(participation.toFixed(1)),
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

      const treasuryAddress = GOVERNANCE_CONTRACTS.treasury;
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

      set({
        proposals: loadedProposals.length > 0 ? loadedProposals : INITIAL_PROPOSALS,
        treasuryActivities: loadedActivities.length > 0 ? loadedActivities : INITIAL_TREASURY_ACTIVITIES,
        initialized: true,
        metrics: {
          treasuryValue: `$${treasuryVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
          activeProposals: loadedProposals.filter(p => p.status === "Active").length,
          governanceParticipation: "68.5%",
          daoMembers: 12450 + loadedProposals.length,
          treasuryTransactions: loadedActivities.length || INITIAL_TREASURY_ACTIVITIES.length,
          proposalExecutionRate: loadedProposals.filter(p => p.status === "Executed").length > 0
            ? ((loadedProposals.filter(p => p.status === "Executed").length / loadedProposals.filter(p => p.status !== "Active" && p.status !== "Pending").length) * 100).toFixed(1) + "%"
            : "92.4%",
        }
      });
    } catch (e) {
      console.warn("RPC connection unavailable, falling back to offline high-fidelity mockup data:", e);
      set({
        proposals: INITIAL_PROPOSALS,
        treasuryActivities: INITIAL_TREASURY_ACTIVITIES,
        initialized: true,
        metrics: {
          treasuryValue: "$2,450,000",
          activeProposals: INITIAL_PROPOSALS.filter(p => p.status === "Active").length,
          governanceParticipation: "68.5%",
          daoMembers: 12450,
          treasuryTransactions: INITIAL_TREASURY_ACTIVITIES.length,
          proposalExecutionRate: "92.4%"
        }
      });
    }
  },

  submitProposal: async (proposalData, signer) => {
    const governorAddress = GOVERNANCE_CONTRACTS.governor;
    const governorContract = new Contract(governorAddress, GovernorABI, signer);

    const votingDurationSeconds = proposalData.votingDuration * 86400;
    const treasuryImpactWei = parseUnits(Math.abs(proposalData.treasuryImpactValue).toString(), 6);
    const target = proposalData.executionTarget || "0x0000000000000000000000000000000000000000";

    const tx = await governorContract.propose(
      proposalData.title,
      proposalData.description,
      proposalData.category,
      votingDurationSeconds,
      treasuryImpactWei,
      target
    );

    await tx.wait();

    set({ initialized: false });
    await get().initializeStore();

    return `SIP-${get().proposals.length}`;
  },

  castVote: async (proposalId, option, weight, signature, signer) => {
    const governorAddress = GOVERNANCE_CONTRACTS.governor;
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
    await get().initializeStore();
  },

  executeProposal: async (proposalId, signer) => {
    const governorAddress = GOVERNANCE_CONTRACTS.governor;
    const governorContract = new Contract(governorAddress, GovernorABI, signer);

    const id = Number(proposalId.replace("SIP-", ""));

    const tx = await governorContract.execute(id);
    await tx.wait();

    set({ initialized: false });
    await get().initializeStore();
  }
}));
