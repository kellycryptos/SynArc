"use client";

import { useChainId, useSwitchChain, useAccount } from 'wagmi';
import { arcTestnet, arcMainnet, ACTIVE_NETWORK, ARC_CHAIN } from '@/lib/arc-config';
import { useDeferredWeb3 } from '@/providers/DeferredWeb3Provider';

export const ARC_TESTNET_CHAIN_ID = 5042002;
export const ARC_MAINNET_CHAIN_ID = 5042;
export const TARGET_CHAIN_ID = ACTIVE_NETWORK === 'mainnet' ? ARC_MAINNET_CHAIN_ID : ARC_TESTNET_CHAIN_ID;

export function useArcNetwork() {
  const deferred = useDeferredWeb3();

  if (deferred && !deferred.isMounted) {
    return {
      chainId: TARGET_CHAIN_ID,
      isArcTestnet: TARGET_CHAIN_ID === ARC_TESTNET_CHAIN_ID,
      isArcMainnet: TARGET_CHAIN_ID === ARC_MAINNET_CHAIN_ID,
      isArc: true,
      isUnsupported: false,
      isSwitching: false,
      switchNetwork: async () => {},
      arcChain: ARC_CHAIN,
      targetChainId: TARGET_CHAIN_ID,
      networkName: ACTIVE_NETWORK === 'mainnet' ? 'Arc' : 'Arc Testnet',
    };
  }

  return useActiveArcNetwork();
}

function useActiveArcNetwork() {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  // If connected, determine if user is on active Arc chain
  const isArc = chainId === ARC_TESTNET_CHAIN_ID || chainId === ARC_MAINNET_CHAIN_ID;
  const isArcActive = chainId === TARGET_CHAIN_ID;
  const isUnsupported = isConnected && !isArcActive;

  const switchToArc = async () => {
    try {
      if (switchChain) {
        await switchChain({ chainId: TARGET_CHAIN_ID });
      }
    } catch (error) {
      console.error(`Failed to switch to ${ACTIVE_NETWORK === 'mainnet' ? 'Arc' : 'Arc Testnet'}:`, error);
    }
  };

  return {
    chainId,
    isArcTestnet: chainId === ARC_TESTNET_CHAIN_ID,
    isArcMainnet: chainId === ARC_MAINNET_CHAIN_ID,
    isArc,
    isUnsupported,
    isSwitching,
    switchNetwork: switchToArc,
    arcChain: ARC_CHAIN,
    targetChainId: TARGET_CHAIN_ID,
    networkName: ACTIVE_NETWORK === 'mainnet' ? 'Arc' : 'Arc Testnet',
  };
}
