"use client";

// NOTE: For this demo/hackathon, useCreatorStore persists creator organizations and supporter metadata locally via localStorage.
// In production/mainnet, this store will connect directly to the Crowdfund Hub contract to query campaigns, track contributions, and fetch on-chain states.

import { create } from "zustand";
import { Creator, Campaign } from "@/types";
import { createPublicClient, http } from "viem";
import { arcTestnet } from "@/lib/arc-config";
import { getArcRpcUrl } from "@/lib/rpc/config";
import { SynArcCrowdfundABI } from "@/lib/governance/SynArcCrowdfund";

const MOCK_CREATORS: Creator[] = [];

export interface Supporter {
  address: string;
  amount: number;
  timeAgo: string;
  txHash: string;
}

interface CreatorStoreState {
  creators: Creator[];
  supporters: Record<string, Supporter[]>;
  initialized: boolean;
  initializeStore: () => Promise<void>;
  addCreator: (creatorData: Omit<Creator, "raised" | "supporters" | "daysLeft" | "slug">) => string;
  supportCreator: (creatorId: string, amount: number, senderAddress: string, txHash: string) => void;
}

// Reuse a single client instance to prevent redundant RPC connections and connection overhead
let globalPublicClient: any = null;
function getSharedPublicClient() {
  if (!globalPublicClient) {
    globalPublicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(getArcRpcUrl())
    });
  }
  return globalPublicClient;
}

let lastFetchTime = 0;
const CACHE_DURATION = 15000; // 15 seconds cache

// Resilient on-chain event / state fetcher for deployed campaigns
async function fetchOnChainCampaignMetrics(escrowAddress: string) {
  if (!escrowAddress || !escrowAddress.startsWith("0x") || escrowAddress.toLowerCase().includes("escrow") || escrowAddress.toLowerCase().includes("treasury") || escrowAddress.length < 42) {
    return null; // Not a real contract address, use backend database fallback
  }

  try {
    const client = getSharedPublicClient();

    const [totalRaisedBigInt, totalContributorsBigInt] = await Promise.all([
      client.readContract({
        address: escrowAddress as `0x${string}`,
        abi: SynArcCrowdfundABI,
        functionName: "totalRaised"
      }),
      client.readContract({
        address: escrowAddress as `0x${string}`,
        abi: SynArcCrowdfundABI,
        functionName: "totalContributors"
      })
    ]) as [bigint, bigint];

    const raised = Number(totalRaisedBigInt) / 1_000_000;
    const contributors = Number(totalContributorsBigInt);

    return { raised, contributors };
  } catch (err) {
    console.warn(`useCreatorStore: On-chain fetch failed for ${escrowAddress}:`, err);
    return null;
  }
}


export const useCreatorStore = create<CreatorStoreState>((set, get) => ({
  creators: [],
  supporters: {},
  initialized: false,

  initializeStore: async () => {
    if (typeof window === "undefined") return;

    // 15-second cache limit to avoid redundant RPC/REST requests
    if (get().initialized && Date.now() - lastFetchTime < CACHE_DURATION) {
      return;
    }

    try {
      // Start with all MOCK_CREATORS (which includes the 'synarc' profile)
      let mappedCreators: Creator[] = [...MOCK_CREATORS];

      // Fetch campaigns from the backend API
      const response = await fetch("/api/campaigns");

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.campaigns)) {
          const rawCampaigns: Campaign[] = data.campaigns;

          // Hydrate real on-chain parameters for deployed campaigns
          const hydratedCreators: Creator[] = await Promise.all(
            rawCampaigns.map(async (c) => {
              const onChain = await fetchOnChainCampaignMetrics(c.escrowAddress);
              
              const raised = onChain ? onChain.raised : c.raised;
              const supporters = onChain ? onChain.contributors : c.contributors;

              // Calculate days left
              const deadlineDate = new Date(c.deadline);
              const diffTime = deadlineDate.getTime() - Date.now();
              const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

              // Category mapping
              let category = c.category.toLowerCase().replace(" ", "-");
              if (category === "ai-agent-fund" || category === "ai-infrastructure") {
                category = "ai-agent";
              }

              const slug = c.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

              return {
                id: c.id,
                name: c.title,
                category,
                description: c.description,
                goal: c.goal,
                raised,
                supporters,
                daysLeft,
                twitter: c.twitter || null,
                wallet: c.recipient,
                slug,
                isAgent: c.isAgent,
                image: c.image || undefined
              };
            })
          );

          // Merge hydrated creators by ID/slug
          hydratedCreators.forEach((hc) => {
            const idx = mappedCreators.findIndex((c) => c.id === hc.id || c.slug === hc.slug);
            if (idx !== -1) {
              mappedCreators[idx] = { ...mappedCreators[idx], ...hc };
            } else {
              mappedCreators.push(hc);
            }
          });
        }
      }

      // Merge custom creators from localStorage (synarc_creators)
      let localCreators: Creator[] = [];
      try {
        const stored = localStorage.getItem("synarc_creators");
        if (stored) {
          localCreators = JSON.parse(stored);
        }
      } catch (err) {}
      
      localCreators.forEach((lc) => {
        const idx = mappedCreators.findIndex((c) => c.id === lc.id || c.slug === lc.slug);
        if (idx !== -1) {
          mappedCreators[idx] = { ...mappedCreators[idx], ...lc };
        } else {
          mappedCreators.push(lc);
        }
      });

      // Merge simulated campaigns from localStorage (synarc_simulated_campaigns)
      let simulatedCampaigns: Campaign[] = [];
      try {
        const stored = localStorage.getItem("synarc_simulated_campaigns");
        if (stored) {
          simulatedCampaigns = JSON.parse(stored);
        }
      } catch (err) {}

      simulatedCampaigns.forEach((sc) => {
        const deadlineDate = new Date(sc.deadline);
        const diffTime = deadlineDate.getTime() - Date.now();
        const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        let category = sc.category.toLowerCase().replace(" ", "-");
        if (category === "ai-agent-fund" || category === "ai-infrastructure") {
          category = "ai-agent";
        }
        const slug = sc.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

        const mappedSimulated: Creator = {
          id: sc.id,
          name: sc.title,
          category,
          description: sc.description,
          goal: sc.goal,
          raised: sc.raised,
          supporters: sc.contributors,
          daysLeft,
          twitter: sc.twitter || null,
          wallet: sc.recipient,
          slug,
          isAgent: sc.isAgent,
          image: sc.image || undefined
        };

        const idx = mappedCreators.findIndex((c) => c.id === sc.id || c.slug === slug);
        if (idx !== -1) {
          mappedCreators[idx] = mappedSimulated;
        } else {
          mappedCreators.push(mappedSimulated);
        }
      });

      // Load supporters for each creator
      const supportersMap: Record<string, Supporter[]> = {};
      mappedCreators.forEach((c) => {
        const storedSuppsRaw = localStorage.getItem(`synarc_creator_supporters_${c.id}`);
        if (storedSuppsRaw) {
          supportersMap[c.id] = JSON.parse(storedSuppsRaw);
        } else {
          supportersMap[c.id] = [];
        }
      });

      lastFetchTime = Date.now();

      set({
        creators: mappedCreators,
        supporters: supportersMap,
        initialized: true,
      });

    } catch (err) {
      console.error("useCreatorStore: Failed to initialize store:", err);
      // Fallback
      let fallbackCreators = [...MOCK_CREATORS];
      const storedCreatorsRaw = localStorage.getItem("synarc_creators");
      if (storedCreatorsRaw) {
        try { fallbackCreators = JSON.parse(storedCreatorsRaw); } catch {}
      }
      const supportersMap: Record<string, Supporter[]> = {};
      fallbackCreators.forEach((c) => {
        const storedSuppsRaw = localStorage.getItem(`synarc_creator_supporters_${c.id}`);
        if (storedSuppsRaw) {
          supportersMap[c.id] = JSON.parse(storedSuppsRaw);
        } else {
          supportersMap[c.id] = [];
        }
      });
      set({
        creators: fallbackCreators,
        supporters: supportersMap,
        initialized: true,
      });
    }
  },

  addCreator: (creatorData) => {
    // Generate unique ID and slug
    const slug = creatorData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const id = slug || `creator-${Date.now()}`;

    const newCreator: Creator = {
      ...creatorData,
      id,
      slug,
      raised: 0,
      supporters: 0,
      daysLeft: 30, // Default duration
    };

    set((state) => {
      const updatedCreators = [...state.creators, newCreator];
      if (typeof window !== "undefined") {
        localStorage.setItem("synarc_creators", JSON.stringify(updatedCreators));
        localStorage.setItem(`synarc_creator_supporters_${id}`, JSON.stringify([]));
      }
      return {
        creators: updatedCreators,
        supporters: { ...state.supporters, [id]: [] },
      };
    });

    return id;
  },

  supportCreator: (creatorId, amount, senderAddress, txHash) => {
    const newSupporter: Supporter = {
      address: senderAddress,
      amount,
      timeAgo: "Just now",
      txHash,
    };

    set((state) => {
      // 1. Update creators list
      const updatedCreators = state.creators.map((c) => {
        if (c.id === creatorId) {
          return {
            ...c,
            raised: c.raised + amount,
            supporters: c.supporters + 1,
          };
        }
        return c;
      });

      // 2. Update supporters list for this creator
      const currentSupporters = state.supporters[creatorId] || [];
      const updatedSupporters = [newSupporter, ...currentSupporters].slice(0, 10); // Keep last 10

      if (typeof window !== "undefined") {
        localStorage.setItem("synarc_creators", JSON.stringify(updatedCreators));
        localStorage.setItem(`synarc_creator_supporters_${creatorId}`, JSON.stringify(updatedSupporters));
      }

      return {
        creators: updatedCreators,
        supporters: {
          ...state.supporters,
          [creatorId]: updatedSupporters,
        },
      };
    });
  },
}));
