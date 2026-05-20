"use client";

import { useChainId, useSwitchChain, useAccount } from 'wagmi';
import { arcTestnet } from '@/lib/chains/arc';

export const ARC_TESTNET_CHAIN_ID = 5042002;

export function useArcNetwork() {
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
