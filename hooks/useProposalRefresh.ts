"use client";

import { useCallback } from "react";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";
import { arcPublicClient } from "@/lib/arc/config";

/**
 * Hook: useProposalRefresh
 * 
 * Exposes a helper to wait for transactions (ethers or WAGMI tx hashes) 
 * and trigger a reactive state update in the global governance store.
 */
export function useProposalRefresh() {
  const { initializeStore, currentDao } = useGovernanceStore();

  const refreshGovernance = useCallback(async (txOrHash?: any) => {
    if (txOrHash) {
      try {
        if (typeof txOrHash.wait === "function") {
          // Standard Ethers transaction object
          await txOrHash.wait();
        } else if (typeof txOrHash === "string" && txOrHash.startsWith("0x")) {
          // WAGMI transaction hash
          await arcPublicClient.waitForTransactionReceipt({ 
            hash: txOrHash as `0x${string}` 
          });
        }
      } catch (err) {
        console.warn("Failed waiting for transaction confirmation before refresh:", err);
      }
    }
    
    // Refresh the global governance store
    await initializeStore(currentDao || undefined);
  }, [initializeStore, currentDao]);

  return { refreshGovernance };
}
