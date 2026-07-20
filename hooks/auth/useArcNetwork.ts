"use client";

import { useChainId, useSwitchChain, useAccount } from 'wagmi';
import { arcTestnet } from '@/lib/chains/arc';
import { useDeferredWeb3 } from '@/providers/DeferredWeb3Provider';

export const ARC_TESTNET_CHAIN_ID = 5042002;

export function useArcNetwork() {
  const deferred = useDeferredWeb3();

  if (deferred && !deferred.isMounted) {
    return {
      chainId: ARC_TESTNET_CHAIN_ID,
      isArcTestnet: true,
      isUnsupported: false,
      isSwitching: false,
      switchNetwork: async () => {},
      arcChain: arcTestnet,
    };
  }

  return useActiveArcNetwork();
}

function useActiveArcNetwork() {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  // If connected, determine if user is on Arc Testnet
  const isArcTestnet = chainId === ARC_TESTNET_CHAIN_ID;
  const isUnsupported = isConnected && !isArcTestnet;

  const switchToArcTestnet = async () => {
    try {
      if (switchChain) {
        await switchChain({ chainId: ARC_TESTNET_CHAIN_ID });
      }
    } catch (error) {
      console.error("Failed to switch to Arc Testnet network:", error);
    }
  };

  return {
    chainId,
    isArcTestnet,
    isUnsupported,
    isSwitching,
    switchNetwork: switchToArcTestnet,
    arcChain: arcTestnet,
  };
}
