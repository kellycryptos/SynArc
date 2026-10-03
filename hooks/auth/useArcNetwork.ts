"use client";

import { useChainId, useSwitchChain, useAccount } from 'wagmi';
import { 
  arcTestnet, 
  arcMainnet, 
  ACTIVE_NETWORK, 
  ARC_CHAIN, 
  CONTRACTS_MAINNET, 
  CONTRACTS_TESTNET,
  setActiveNetwork 
} from '@/lib/arc-config';
import { useDeferredWeb3 } from '@/providers/DeferredWeb3Provider';
import { useState, useEffect, useCallback } from 'react';

export const ARC_TESTNET_CHAIN_ID = 5042002;
export const ARC_MAINNET_CHAIN_ID = 5042;
export const TARGET_CHAIN_ID = ARC_MAINNET_CHAIN_ID;

export interface ArcNetworkState {
  chainId: number;
  currentChainId: number;
  isArcTestnet: boolean;
  isArcMainnet: boolean;
  isArc: boolean;
  isUnsupported: boolean;
  isSwitching: boolean;
  switchNetwork: (targetChainId?: number) => Promise<void>;
  switchToMainnet: () => Promise<void>;
  switchToTestnet: () => Promise<void>;
  arcChain: typeof arcMainnet | typeof arcTestnet;
  targetChainId: number;
  networkName: string;
  activeNetwork: 'mainnet' | 'testnet';
  contractSetLabel: 'mainnet' | 'testnet';
  contracts: typeof CONTRACTS_MAINNET | typeof CONTRACTS_TESTNET;
  explorerUrl: string;
  faucetUrl?: string;
  isConnected: boolean;
}

export function useArcNetwork(): ArcNetworkState {
  const deferred = useDeferredWeb3();

  if (deferred && !deferred.isMounted) {
    return {
      chainId: ARC_MAINNET_CHAIN_ID,
      currentChainId: ARC_MAINNET_CHAIN_ID,
      isArcTestnet: false,
      isArcMainnet: true,
      isArc: true,
      isUnsupported: false,
      isSwitching: false,
      switchNetwork: async () => {},
      switchToMainnet: async () => {},
      switchToTestnet: async () => {},
      arcChain: arcMainnet,
      targetChainId: ARC_MAINNET_CHAIN_ID,
      networkName: 'Arc',
      activeNetwork: 'mainnet',
      contractSetLabel: 'mainnet',
      contracts: CONTRACTS_MAINNET,
      explorerUrl: 'https://explorer.arc.io',
      faucetUrl: undefined,
      isConnected: false,
    };
  }

  return useActiveArcNetwork();
}

function useActiveArcNetwork(): ArcNetworkState {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain, switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const [unconnectedNetwork, setUnconnectedNetwork] = useState<'mainnet' | 'testnet'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('synarc_active_network_mode');
      if (saved === 'testnet' || saved === 'mainnet') return saved;
    }
    return ACTIVE_NETWORK;
  });

  const isWalletConnected = Boolean(isConnected);

  // If a wallet is connected, reflect its actual Arc network.
  // If no wallet is connected, default network on any fresh page load is mainnet (or user's unconnected selection).
  const isArcTestnet = isWalletConnected 
    ? chainId === ARC_TESTNET_CHAIN_ID 
    : unconnectedNetwork === 'testnet';
  const isArcMainnet = !isArcTestnet && (!isWalletConnected || chainId === ARC_MAINNET_CHAIN_ID);

  // Both 5042 (Mainnet) and 5042002 (Testnet) are valid Arc networks
  const isArc = !isWalletConnected || chainId === ARC_MAINNET_CHAIN_ID || chainId === ARC_TESTNET_CHAIN_ID;
  const isUnsupported = isWalletConnected && !isArc;

  const activeNetwork: 'mainnet' | 'testnet' = isArcTestnet ? 'testnet' : 'mainnet';
  const currentChainId = isArcTestnet ? ARC_TESTNET_CHAIN_ID : ARC_MAINNET_CHAIN_ID;
  const networkName = isArcTestnet ? 'Arc Testnet' : 'Arc';
  const contractSetLabel = isArcTestnet ? 'testnet' : 'mainnet';
  const contracts = isArcTestnet ? CONTRACTS_TESTNET : CONTRACTS_MAINNET;
  const explorerUrl = isArcTestnet ? 'https://testnet.arcscan.app' : 'https://explorer.arc.io';
  const faucetUrl = isArcTestnet ? 'https://faucet.circle.com' : undefined;
  const arcChain = isArcTestnet ? arcTestnet : arcMainnet;

  // Sync active network in arc-config for non-React callers & notify stores
  useEffect(() => {
    setActiveNetwork(activeNetwork);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('synarc_network_changed', { detail: { activeNetwork } }));
    }
  }, [activeNetwork]);

  const switchToMainnet = useCallback(async () => {
    try {
      if (isWalletConnected) {
        if (switchChainAsync) {
          await switchChainAsync({ chainId: ARC_MAINNET_CHAIN_ID });
        } else if (switchChain) {
          switchChain({ chainId: ARC_MAINNET_CHAIN_ID });
        }
      } else {
        setUnconnectedNetwork('mainnet');
        if (typeof window !== 'undefined') {
          localStorage.setItem('synarc_active_network_mode', 'mainnet');
        }
        setActiveNetwork('mainnet');
      }
    } catch (error) {
      console.error('Failed to switch to Arc Mainnet:', error);
    }
  }, [isWalletConnected, switchChain, switchChainAsync]);

  const switchToTestnet = useCallback(async () => {
    try {
      if (isWalletConnected) {
        if (switchChainAsync) {
          await switchChainAsync({ chainId: ARC_TESTNET_CHAIN_ID });
        } else if (switchChain) {
          switchChain({ chainId: ARC_TESTNET_CHAIN_ID });
        }
      } else {
        setUnconnectedNetwork('testnet');
        if (typeof window !== 'undefined') {
          localStorage.setItem('synarc_active_network_mode', 'testnet');
        }
        setActiveNetwork('testnet');
      }
    } catch (error) {
      console.error('Failed to switch to Arc Testnet:', error);
    }
  }, [isWalletConnected, switchChain, switchChainAsync]);

  const switchNetwork = useCallback(async (targetChainId?: number) => {
    const target = targetChainId || (isArcTestnet ? ARC_MAINNET_CHAIN_ID : ARC_TESTNET_CHAIN_ID);
    if (target === ARC_MAINNET_CHAIN_ID) {
      await switchToMainnet();
    } else {
      await switchToTestnet();
    }
  }, [isArcTestnet, switchToMainnet, switchToTestnet]);

  return {
    chainId: chainId || ARC_MAINNET_CHAIN_ID,
    currentChainId,
    isArcTestnet,
    isArcMainnet,
    isArc,
    isUnsupported,
    isSwitching,
    switchNetwork,
    switchToMainnet,
    switchToTestnet,
    arcChain,
    targetChainId: TARGET_CHAIN_ID,
    networkName,
    activeNetwork,
    contractSetLabel,
    contracts,
    explorerUrl,
    faucetUrl,
    isConnected: isWalletConnected,
  };
}
