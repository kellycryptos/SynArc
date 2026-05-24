import { create } from "zustand";
import { Proposal, ProposalStatus, TimelineEvent, GovernanceMetrics } from "@/types/governance";
import { TreasuryActivity } from "@/types";

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
  castVote: (proposalId: string, option: "For" | "Against" | "Abstain", weight: number, signature: string) => void;
  executeProposal: (proposalId: string) => void;
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
  },
  {
    id: "SIP-39",
    title: "Increase Liquidity Mining Rewards on ArcDEX",
    description: `This proposal requests the distribution of an additional 200,000 USDC in liquidity rewards to the ArcDEX USDC/sUSDC pool over a 30-day period.

### Motivation
To attract deeper liquidity and reduce slippage for institutional traders swapping DAO tokens.

### Risk Assessment
The Treasury Committee has warned that subsidizing short-term liquidity yields historically results in mercenary capital exit immediately after rewards terminate. Strong opposition is expected.`,
    proposer: "0x1f8A615c4D3d758bBce42013f9c64A2F865a3B272",
    category: "Ecosystem Grant",
    status: "Defeated",
    forVotes: 4500000,
    againstVotes: 6200000,
    abstainVotes: 300000,
    totalVotes: 11000000,
    participationPercentage: 76.4,
    treasuryImpactValue: 0,
    treasuryImpact: "None",
    timeRemaining: "Ended 2 weeks ago",
    createdAt: "2026-04-20T11:45:00Z",
    votingStarts: "2026-04-21T11:45:00Z",
    votingEnds: "2026-04-28T11:45:00Z",
    executionTarget: "0xArcDEXLiquidityPool8f9c64A2F865a3B2728f3",
    votingDuration: 7,
    timeline: [
      { title: "Proposal Created", timestamp: "2026-04-20T11:45:00Z", status: "Proposed", txHash: "0x3939abc..." },
      { title: "Voting Phase Active", timestamp: "2026-04-21T11:45:00Z", status: "Active" },
      { title: "Voting Closed & Defeated", timestamp: "2026-04-28T11:45:00Z", status: "Defeated" }
    ]
  },
  {
    id: "SIP-38",
    title: "Fund SynArc Developer Tooling Initiative",
    description: `Allocate 250,000 USDC to support the development of SynArc developer tools, including a TypeScript client SDK, secure smart contract templates for Arc Network, and CLI deployment tools.

### Rationale
Providing first-class developer tooling is crucial for rapid onboarding of projects onto the Arc governance framework, thereby increasing network fee generation for the DAO.`,
    proposer: "0x5e6Ba1F0d758bBce42013f9c64A2F865a3B2728f32",
    category: "Treasury Allocation",
    status: "Executed",
    forVotes: 9800000,
    againstVotes: 1100000,
    abstainVotes: 100000,
    totalVotes: 11000000,
    participationPercentage: 77.8,
    treasuryImpactValue: -250000,
    treasuryImpact: "-250,000 USDC",
    timeRemaining: "Ended 3 weeks ago",
    createdAt: "2026-04-10T16:20:00Z",
    votingStarts: "2026-04-11T16:20:00Z",
    votingEnds: "2026-04-18T16:20:00Z",
    executionTarget: "0xSynArcDevMultisig8349fa8e23bfae8432a901ff",
    votingDuration: 7,
    timeline: [
      { title: "Proposal Created", timestamp: "2026-04-10T16:20:00Z", status: "Proposed", txHash: "0x3838def..." },
      { title: "Voting Phase Active", timestamp: "2026-04-11T16:20:00Z", status: "Active" },
      { title: "Voting Closed & Passed", timestamp: "2026-04-18T16:20:00Z", status: "Passed" },
      { title: "Transaction Executed", timestamp: "2026-04-20T10:00:00Z", status: "Executed", txHash: "0x3838exec..." }
    ]
  },
  {
    id: "SIP-37",
    title: "Reduce Voting Delay to 1 Block",
    description: `Reduce the initial voting delay (the delay between proposal creation and voting starting) from 2 days to 1 block (instant activation) to allow quicker coordination on security patches.

### Motivation
During emergency contract freezes or parameters tuning, a 2-day voting delay leaves the protocol vulnerable. Reducing it to 1 block enables immediate action while relying on the timelock delay for pre-execution safety.`,
    proposer: "0x7a9F23d758bBce42013f9c64A2F865a3B2728f32",
    category: "Governance Parameter",
    status: "Executed",
    forVotes: 11500000,
    againstVotes: 200000,
    abstainVotes: 50000,
    totalVotes: 11750000,
    participationPercentage: 83.5,
    treasuryImpactValue: 0,
    treasuryImpact: "None",
    timeRemaining: "Ended 1 month ago",
    createdAt: "2026-03-25T08:00:00Z",
    votingStarts: "2026-03-26T08:00:00Z",
    votingEnds: "2026-04-02T08:00:00Z",
    executionTarget: "0xSynArcGovernanceAdminHub88f9c64A2F865a3B",
    votingDuration: 7,
    timeline: [
      { title: "Proposal Created", timestamp: "2026-03-25T08:00:00Z", status: "Proposed", txHash: "0x3737abc..." },
      { title: "Voting Phase Active", timestamp: "2026-03-26T08:00:00Z", status: "Active" },
      { title: "Voting Closed & Passed", timestamp: "2026-04-02T08:00:00Z", status: "Passed" },
      { title: "Transaction Executed", timestamp: "2026-04-03T12:00:00Z", status: "Executed", txHash: "0x3737exec..." }
    ]
  }
];

const INITIAL_TREASURY_ACTIVITIES: TreasuryActivity[] = [
  { id: '1', type: 'Inflow', amount: 125000, token: 'USDC', timestamp: '2026-05-12T10:00:00Z', description: 'Protocol fees collected', txHash: '0xabc123...' },
  { id: '2', type: 'Outflow', amount: 100000, token: 'USDC', timestamp: '2026-05-10T11:00:00Z', description: 'SIP-40 Execution: Retain Gauntlet Risk Services', txHash: '0xexec7890...' },
  { id: '3', type: 'Stake', amount: 200000, token: 'USDC', timestamp: '2026-05-08T09:15:00Z', description: 'Staked in sUSDC Morpho Vault', txHash: '0xghi789...' },
  { id: '4', type: 'Inflow', amount: 87000, token: 'USDC', timestamp: '2026-05-05T16:45:00Z', description: 'Agentic liquidity pool yield', txHash: '0xjkl012...' },
  { id: '5', type: 'Outflow', amount: 250000, token: 'USDC', timestamp: '2026-04-20T10:00:00Z', description: 'SIP-38 Execution: synarc developer tooling fund', txHash: '0x3838exec...' },
  { id: '6', type: 'Outflow', amount: 25000, token: 'USDC', timestamp: '2026-04-07T08:00:00Z', description: 'Auditor payment for governance contracts', txHash: '0xpqr678...' },
];

export const useGovernanceStore = create<GovernanceState>((set, get) => ({
  proposals: [],
  metrics: {
    treasuryValue: "$2,450,000",
    activeProposals: 1,
    governanceParticipation: "68.5%",
    daoMembers: 12450,
    treasuryTransactions: 342,
    proposalExecutionRate: "92.4%",
  },
  treasuryActivities: [],
  userVotes: {},
  initialized: false,

  initializeStore: () => {
    if (get().initialized) return;

    if (typeof window !== "undefined") {
      const savedProposals = localStorage.getItem("synarc_store_proposals");
      const savedActivities = localStorage.getItem("synarc_store_activities");
      const savedVotes = localStorage.getItem("synarc_store_votes");
      const savedTreasury = localStorage.getItem("synarc_store_treasury_value");

      const loadedProposals = savedProposals ? JSON.parse(savedProposals) : INITIAL_PROPOSALS;
      const loadedActivities = savedActivities ? JSON.parse(savedActivities) : INITIAL_TREASURY_ACTIVITIES;
      const loadedVotes = savedVotes ? JSON.parse(savedVotes) : {};
      const loadedTreasury = savedTreasury ? parseFloat(savedTreasury) : 2450000;

      // Calculate dynamic metrics
      const activeCount = loadedProposals.filter((p: Proposal) => p.status === "Active").length;
      const executedCount = loadedProposals.filter((p: Proposal) => p.status === "Executed").length;
      const totalPastCount = loadedProposals.filter((p: Proposal) => p.status !== "Active" && p.status !== "Pending").length;
      const execRate = totalPastCount > 0 ? ((executedCount / totalPastCount) * 100).toFixed(1) + "%" : "92.4%";

      set({
        proposals: loadedProposals,
        treasuryActivities: loadedActivities,
        userVotes: loadedVotes,
        initialized: true,
        metrics: {
          treasuryValue: `$${loadedTreasury.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
          activeProposals: activeCount,
          governanceParticipation: "68.5%",
          daoMembers: 12450 + Object.keys(loadedVotes).length,
          treasuryTransactions: loadedActivities.length + 336,
          proposalExecutionRate: execRate,
        }
      });
    }
  },

  submitProposal: async (proposalData) => {
    // Force store initialization
    get().initializeStore();

    const timestamp = new Date().toISOString();
    const id = `SIP-${get().proposals.length + 37}`;
    
    // Format impact string
    let treasuryImpact = "None";
    if (proposalData.treasuryImpactValue < 0) {
      treasuryImpact = `${proposalData.treasuryImpactValue.toLocaleString()} USDC`;
    } else if (proposalData.treasuryImpactValue > 0) {
      treasuryImpact = `+${proposalData.treasuryImpactValue.toLocaleString()} USDC`;
    }

    const newProposal: Proposal = {
      id,
      title: proposalData.title,
      description: proposalData.description,
      proposer: proposalData.proposer,
      category: proposalData.category,
      status: "Active", // Live instantly for demo prototype
      forVotes: 0,
      againstVotes: 0,
      abstainVotes: 0,
      totalVotes: 0,
      participationPercentage: 0,
      treasuryImpactValue: proposalData.treasuryImpactValue,
      treasuryImpact,
      timeRemaining: `${proposalData.votingDuration} days left`,
      createdAt: timestamp,
      votingStarts: timestamp,
      votingEnds: new Date(Date.now() + proposalData.votingDuration * 24 * 60 * 60 * 1000).toISOString(),
      executionTarget: proposalData.executionTarget || "0x0000000000000000000000000000000000000000",
      votingDuration: proposalData.votingDuration,
      timeline: [
        { title: "Proposal Created", timestamp, status: "Proposed", txHash: "0x" + Math.random().toString(16).substring(2, 10) + "..." },
        { title: "Voting Phase Active", timestamp, status: "Active" }
      ]
    };

    const nextProposals = [newProposal, ...get().proposals];
    
    // Add pending activity log if treasury impact exists
    let nextActivities = [...get().treasuryActivities];
    if (proposalData.treasuryImpactValue !== 0) {
      const pendingActivity: TreasuryActivity = {
        id: `act-${Date.now()}`,
        type: proposalData.treasuryImpactValue < 0 ? 'Outflow' : 'Inflow',
        amount: Math.abs(proposalData.treasuryImpactValue),
        token: 'USDC',
        timestamp,
        description: `PENDING - ${id} Execution: ${proposalData.title}`,
        txHash: "0xpending..."
      };
      nextActivities = [pendingActivity, ...nextActivities];
    }

    set({
      proposals: nextProposals,
      treasuryActivities: nextActivities,
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("synarc_store_proposals", JSON.stringify(nextProposals));
      localStorage.setItem("synarc_store_activities", JSON.stringify(nextActivities));
    }

    // Refresh dynamic metrics
    const currentTreasury = parseFloat(get().metrics.treasuryValue.replace(/[$,]/g, ""));
    const activeCount = nextProposals.filter(p => p.status === "Active").length;
    
    set({
      metrics: {
        ...get().metrics,
        activeProposals: activeCount,
        treasuryTransactions: nextActivities.length + 336,
      }
    });

    return id;
  },

  castVote: (proposalId, option, weight, signature) => {
    get().initializeStore();

    const nextVotes = {
      ...get().userVotes,
      [proposalId]: { option, sig: signature, vp: weight }
    };

    const nextProposals = get().proposals.map(p => {
      if (p.id === proposalId) {
        const forV = option === "For" ? p.forVotes + weight : p.forVotes;
        const againstV = option === "Against" ? p.againstVotes + weight : p.againstVotes;
        const abstainV = option === "Abstain" ? p.abstainVotes + weight : p.abstainVotes;
        const tot = forV + againstV + abstainV;
        const part = parseFloat(((tot / 15000000) * 100).toFixed(1));

        return {
          ...p,
          forVotes: forV,
          againstVotes: againstV,
          abstainVotes: abstainV,
          totalVotes: tot,
          participationPercentage: part > 100 ? 100 : part,
        };
      }
      return p;
    });

    set({
      proposals: nextProposals,
      userVotes: nextVotes
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("synarc_store_proposals", JSON.stringify(nextProposals));
      localStorage.setItem("synarc_store_votes", JSON.stringify(nextVotes));
    }

    // Check if proposal should dynamically pass for instant execution UX
    // In our live mockup, if a user votes For, we can optionally queue execution
  },

  executeProposal: (proposalId) => {
    get().initializeStore();

    const timestamp = new Date().toISOString();
    let currentTreasury = parseFloat(get().metrics.treasuryValue.replace(/[$,]/g, ""));
    let targetProposal: Proposal | undefined;

    const nextProposals = get().proposals.map(p => {
      if (p.id === proposalId) {
        targetProposal = p;
        const updatedTimeline = [
          ...p.timeline,
          { title: "Proposal Passed", timestamp, status: "Passed" },
          { title: "Transaction Executed", timestamp, status: "Executed", txHash: "0x" + Math.random().toString(16).substring(2, 10) + "..." }
        ];

        return {
          ...p,
          status: "Executed" as ProposalStatus,
          timeRemaining: "Ended & Executed",
          timeline: updatedTimeline
        };
      }
      return p;
    });

    if (!targetProposal) return;

    // Deduct treasury if negative impact
    if (targetProposal.treasuryImpactValue !== 0) {
      currentTreasury += targetProposal.treasuryImpactValue; // (negative impact value deducts)
    }

    // Update the pending activity log to success/confirmed
    const nextActivities = get().treasuryActivities.map(act => {
      if (act.description.includes(`PENDING - ${proposalId}`)) {
        return {
          ...act,
          timestamp,
          description: `SIP-${proposalId.replace("SIP-", "")} Execution: ${targetProposal?.title}`,
          txHash: "0x" + Math.random().toString(16).substring(2, 12)
        };
      }
      return act;
    });

    set({
      proposals: nextProposals,
      treasuryActivities: nextActivities,
      metrics: {
        ...get().metrics,
        treasuryValue: `$${currentTreasury.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        activeProposals: nextProposals.filter(p => p.status === "Active").length,
        proposalExecutionRate: ((nextProposals.filter(p => p.status === "Executed").length / nextProposals.filter(p => p.status !== "Active" && p.status !== "Pending").length) * 100).toFixed(1) + "%"
      }
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("synarc_store_proposals", JSON.stringify(nextProposals));
      localStorage.setItem("synarc_store_activities", JSON.stringify(nextActivities));
      localStorage.setItem("synarc_store_treasury_value", currentTreasury.toString());
    }
  }
}));
