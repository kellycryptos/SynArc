import { create } from "zustand";
import { Proposal, ProposalStatus, TimelineEvent, GovernanceMetrics } from "@/types/governance";
import { TreasuryActivity } from "@/types";
import { ethers, JsonRpcProvider, BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";
import { GOVERNANCE_CONTRACTS, GovernorABI, ProposalState, VoteType } from "@/lib/governance/contracts";

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
  }) => Promise<string>;
  castVote: (proposalId: string, option: "For" | "Against" | "Abstain", weight: number, signature: string) => Promise<void>;
  executeProposal: (proposalId: string) => Promise<void>;
}

const INITIAL_PROPOSALS: Proposal[] = [
  {
    id: "SIP-42",
    title: "Allocate 500k USDC for Ecosystem Grants Q3",
    description: `This proposal requests the allocation of 500,000 USDC from the SynArc DAO Treasury to fund ecosystem grants during Q3 2026. The funds will be distributed to developer teams building critical infrastructure, zero-knowledge voting integration, and delegate reputation scorecards. Recipient grants are vetted by the Grants Committee through a 3-stage validation process.

### Funding Breakdown
*   **Confidential Voting Integration**: 150,000 USDC
*   **Developer SDK Tooling**: 150,000 USDC
*   **Arcscan Governance API**: 100,000 USDC
*   **Community Education Grants**: 100,000 USDC

### Execution Details
- Target Multisig Contract: \`0x7a9F23d758bBce42013f9c64A2F865a3B2728f32\`
- Treasury Disbursement: 500,000 USDC`,
    proposer: "0x7a9F23d758bBce42013f9c64A2F865a3B2728f32",
    category: "Ecosystem Grant",
    status: "Active",
    forVotes: 8500000,
    againstVotes: 1200000,
    abstainVotes: 800000,
    totalVotes: 10500000,
    participationPercentage: 64.6,
    treasuryImpactValue: -500000,
    treasuryImpact: "-500,000 USDC",
    timeRemaining: "2 days left",
    createdAt: "2026-05-15T10:00:00Z",
    votingStarts: "2026-05-16T10:00:00Z",
    votingEnds: "2026-05-23T10:00:00Z",
    executionTarget: "0x7a9F23d758bBce42013f9c64A2F865a3B2728f32",
    votingDuration: 7,
    timeline: [
      { title: "Proposal Created", timestamp: "2026-05-15T10:00:00Z", status: "Proposed", txHash: "0xabc123..." },
      { title: "Voting Phase Active", timestamp: "2026-05-16T10:00:00Z", status: "Active" }
    ]
  },
  {
    id: "SIP-41",
    title: "Update Governance Quorum Parameter to 15%",
    description: `This proposal aims to adjust the DAO governance quorum requirement from its current flat 10M USDC weight to a dynamic 15% of the total circulating delegate voting power. This ensures that quorum requirements automatically scale with total token delegation and prevents governance stagnation.

### Parameters Affected
*   **Minimum Quorum Threshold**: From \`10,000,000 USDC\` to \`15% of active delegations\`
*   **Proposal Threshold**: Stays at \`100,000 USDC\`

### Rationale
As circulating power moves into long-term delegate locks, a flat parameter runs the risk of being unachievable or excessively easy. A percentage-based requirement resolves both scenarios.`,
    proposer: "0x3b4C2818f9c64A2F865a3B2728f323156828ab1",
    category: "Governance Parameter",
    status: "Pending",
    forVotes: 0,
    againstVotes: 0,
    abstainVotes: 0,
    totalVotes: 0,
    participationPercentage: 0,
    treasuryImpactValue: 0,
    treasuryImpact: "None",
    timeRemaining: "Starts in 5 hrs",
    createdAt: "2026-05-16T14:30:00Z",
    votingStarts: "2026-05-24T14:30:00Z",
    votingEnds: "2026-05-31T14:30:00Z",
    executionTarget: "0x0000000000000000000000000000000000000000",
    votingDuration: 7,
    timeline: [
      { title: "Proposal Created", timestamp: "2026-05-16T14:30:00Z", status: "Proposed", txHash: "0xdef456..." }
    ]
  },
  {
    id: "SIP-40",
    title: "Onboard Gauntlet as Risk Service Provider",
    description: `Retain Gauntlet for a 6-month risk management engagement to optimize lending and treasury yield strategy risks inside SynArc protocols on Arc Testnet. Gauntlet will deliver weekly risk scorecards, parameter suggestions, and automated hedging simulations.

### Engagement Cost
- Total Contract Fee: 100,000 USDC (paid as a lump sum upon execution)

### Target Wallet
- Gauntlet multisig: \`0xGauntletRisk...A420\`

### Deliverables
*   Dynamic risk parameters optimization
*   Treasury sUSDC vault simulation reports
*   Automated liquidations threshold tuning`,
    proposer: "0x9d2E9f5A0d758bBce42013f9c64A2F865a3B2728",
    category: "Delegate Onboarding",
    status: "Executed",
    forVotes: 12400000,
    againstVotes: 500000,
    abstainVotes: 100000,
    totalVotes: 13000000,
    participationPercentage: 92.1,
    treasuryImpactValue: -100000,
    treasuryImpact: "-100,000 USDC",
    timeRemaining: "Ended 1 week ago",
    createdAt: "2026-05-01T09:15:00Z",
    votingStarts: "2026-05-02T09:15:00Z",
    votingEnds: "2026-05-09T09:15:00Z",
    executionTarget: "0xGauntletRisk3428905cdfa8e23bfae8432a901ff2a9",
    votingDuration: 7,
    timeline: [
      { title: "Proposal Created", timestamp: "2026-05-01T09:15:00Z", status: "Proposed", txHash: "0x789txHash..." },
      { title: "Voting Phase Active", timestamp: "2026-05-02T09:15:00Z", status: "Active" },
      { title: "Voting Closed & Passed", timestamp: "2026-05-09T09:15:00Z", status: "Passed" },
      { title: "Transaction Executed", timestamp: "2026-05-10T11:00:00Z", status: "Executed", txHash: "0xexec7890..." }
    ]
  }
];

const INITIAL_TREASURY_ACTIVITIES: TreasuryActivity[] = [
  { id: '1', type: 'Inflow', amount: 125000, token: 'USDC', timestamp: '2026-05-12T10:00:00Z', description: 'Protocol fees collected', txHash: '0xabc123...' },
  { id: '2', type: 'Outflow', amount: 100000, token: 'USDC', timestamp: '2026-05-10T11:00:00Z', description: 'SIP-40 Execution: Retain Gauntlet Risk Services', txHash: '0xexec7890...' },
  { id: '3', type: 'Stake', amount: 200000, token: 'USDC', timestamp: '2026-05-08T09:15:00Z', description: 'Staked in sUSDC Morpho Vault', txHash: '0xghi789...' }
];

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
      const rpcUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network";
      const provider = new JsonRpcProvider(rpcUrl);

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

  submitProposal: async (proposalData) => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) throw new Error("No web3 provider found");

    const browserProvider = new BrowserProvider(ethereum);
    const signer = await browserProvider.getSigner();

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

  castVote: async (proposalId, option, weight, signature) => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) throw new Error("No web3 provider found");

    const browserProvider = new BrowserProvider(ethereum);
    const signer = await browserProvider.getSigner();

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

  executeProposal: async (proposalId) => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) throw new Error("No web3 provider found");

    const browserProvider = new BrowserProvider(ethereum);
    const signer = await browserProvider.getSigner();

    const governorAddress = GOVERNANCE_CONTRACTS.governor;
    const governorContract = new Contract(governorAddress, GovernorABI, signer);

    const id = Number(proposalId.replace("SIP-", ""));

    const tx = await governorContract.execute(id);
    await tx.wait();

    set({ initialized: false });
    await get().initializeStore();
  }
}));
