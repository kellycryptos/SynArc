"use client";

import { useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { useWalletStore } from "@/store/walletStore";

export function useWallet() {
  const store = useWalletStore();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Sync wagmi state to zustand store for non-react usage or global access
  useEffect(() => {
    if (isConnected && address) {
      store.setConnected(address, chainId);
    } else {
      store.setDisconnected();
    }
  }, [isConnected, address, chainId, store]);

  useEffect(() => {
    if (chainId) {
      store.setChainId(chainId);
    }
  }, [chainId, store]);

  return store;
}
