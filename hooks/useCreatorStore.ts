"use client";

// NOTE: For this demo/hackathon, useCreatorStore persists creator organizations and supporter metadata locally via localStorage.
// In production/mainnet, this store will connect directly to the Crowdfund Hub contract to query campaigns, track contributions, and fetch on-chain states.

import { create } from "zustand";
import { Creator, MOCK_CREATORS } from "@/data/mock/creators";

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
  initializeStore: () => void;
  addCreator: (creatorData: Omit<Creator, "raised" | "supporters" | "daysLeft" | "slug">) => string;
  supportCreator: (creatorId: string, amount: number, senderAddress: string, txHash: string) => void;
}

export const useCreatorStore = create<CreatorStoreState>((set, get) => ({
  creators: [],
  supporters: {},
  initialized: false,

  initializeStore: () => {
    if (typeof window === "undefined") return;

    try {
      // 1. Load creators from localStorage
      let storedCreators: Creator[] = [];
      const storedCreatorsRaw = localStorage.getItem("synarc_creators");
      if (storedCreatorsRaw) {
        storedCreators = JSON.parse(storedCreatorsRaw);
      } else {
        storedCreators = [...MOCK_CREATORS];
        localStorage.setItem("synarc_creators", JSON.stringify(storedCreators));
      }

      // 2. Load supporters for each creator
      const supportersMap: Record<string, Supporter[]> = {};
      storedCreators.forEach((c) => {
        const storedSuppsRaw = localStorage.getItem(`synarc_creator_supporters_${c.id}`);
        if (storedSuppsRaw) {
          supportersMap[c.id] = JSON.parse(storedSuppsRaw);
        } else {
          supportersMap[c.id] = [];
        }
      });

      set({
        creators: storedCreators,
        supporters: supportersMap,
        initialized: true,
      });
    } catch (err) {
      console.error("useCreatorStore: Failed to initialize store:", err);
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

    // TODO: Connect this flow to trigger on-chain contract deployments of Crowdfund Hub escrows in mainnet/production versions.
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

    // TODO: Direct donation outputs trigger direct USDC ERC20 transfer execution on-chain. Later versions will interact with the Crowdfund Hub escrow smart contracts to approve milestone-based releases.
  },
}));
