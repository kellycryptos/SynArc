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

    const readPromise = Promise.all([
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
    ]);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("RPC readContract timeout")), 2000)
    );

    const [totalRaisedBigInt, totalContributorsBigInt] = await Promise.race([
      readPromise,
      timeoutPromise
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
      let mappedCreators: Creator[] = [...MOCK_CREATORS];

      const response = await fetch("/api/campaigns");

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.campaigns)) {
          const rawCampaigns: Campaign[] = data.campaigns;

          const baseCreators: Creator[] = rawCampaigns.map((c) => {
            const deadlineDate = new Date(c.deadline);
            const diffTime = deadlineDate.getTime() - Date.now();
            const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
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
              raised: c.raised,
              supporters: c.contributors,
              daysLeft,
              twitter: c.twitter || null,
              wallet: c.recipient,
              slug,
              isAgent: c.isAgent,
              image: c.image || undefined
            };
          });

          baseCreators.forEach((hc) => {
            const idx = mappedCreators.findIndex((c) => c.id === hc.id || c.slug === hc.slug);
            if (idx !== -1) {
              mappedCreators[idx] = { ...mappedCreators[idx], ...hc };
            } else {
              mappedCreators.push(hc);
            }
          });

          // Unblock immediately with base DB values
          set({
            creators: [...mappedCreators],
            initialized: true
          });
          lastFetchTime = Date.now();

          // Asynchronously hydrate on-chain metrics
          Promise.allSettled(
            rawCampaigns.map(async (c) => {
              const onChain = await fetchOnChainCampaignMetrics(c.escrowAddress);
              if (onChain) {
                return { id: c.id, raised: onChain.raised, supporters: onChain.contributors };
              }
              return null;
            })
          ).then((results) => {
            const updates = results
              .filter((r): r is PromiseFulfilledResult<{ id: string; raised: number; supporters: number }> => r.status === 'fulfilled' && r.value !== null)
              .map(r => r.value);

            if (updates.length > 0) {
              const currentCreators = [...get().creators];
              updates.forEach(u => {
                const idx = currentCreators.findIndex(c => c.id === u.id);
                if (idx !== -1) {
                  currentCreators[idx] = {
                    ...currentCreators[idx],
                    raised: u.raised,
                    supporters: u.supporters
                  };
                }
              });
              set({ creators: currentCreators });
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

      const mappedSimulatedCreators = await Promise.all(
        simulatedCampaigns.map(async (sc) => {
          // Hydrate real on-chain parameters if escrow address exists
          const onChain = await fetchOnChainCampaignMetrics(sc.escrowAddress);
          const raised = onChain ? onChain.raised : sc.raised;
          const supporters = onChain ? onChain.contributors : sc.contributors;

          const deadlineDate = new Date(sc.deadline);
          const diffTime = deadlineDate.getTime() - Date.now();
          const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          let category = sc.category.toLowerCase().replace(" ", "-");
          if (category === "ai-agent-fund" || category === "ai-infrastructure") {
            category = "ai-agent";
          }
          const slug = sc.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

          return {
            id: sc.id,
            name: sc.title,
            category,
            description: sc.description,
            goal: sc.goal,
            raised,
            supporters,
            daysLeft,
            twitter: sc.twitter || null,
            wallet: sc.recipient,
            slug,
            isAgent: sc.isAgent,
            image: sc.image || undefined
          };
        })
      );

      mappedSimulatedCreators.forEach((msc) => {
        const idx = mappedCreators.findIndex((c) => c.id === msc.id || c.slug === msc.slug);
        if (idx !== -1) {
          mappedCreators[idx] = msc;
        } else {
          mappedCreators.push(msc);
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
