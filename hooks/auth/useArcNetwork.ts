"use client";

import { useChainId, useSwitchChain, useAccount } from 'wagmi';
import { 
  arcTestnet, 
  arcMainnet, 
  ACTIVE_NETWORK, 
  CONTRACTS_MAINNET, 
  CONTRACTS_TESTNET,
  setActiveNetwork 
} from '@/lib/arc-config';
import { ensureWalletOnChain, updateWalletChainRpc } from '@/lib/chain-network-helper';
import { useEffect, useCallback, useSyncExternalStore } from 'react';

export const ARC_TESTNET_CHAIN_ID = 5042002;
export const ARC_MAINNET_CHAIN_ID = 5042;
export const TARGET_CHAIN_ID = ARC_MAINNET_CHAIN_ID;

function subscribeToNetwork(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('synarc_network_changed', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('synarc_network_changed', callback);
    window.removeEventListener('storage', callback);
  };
}

function getNetworkSnapshot(): 'mainnet' | 'testnet' {
  if (typeof window === 'undefined') return ACTIVE_NETWORK;
  const saved = localStorage.getItem('synarc_active_network_mode');
  if (saved === 'testnet' || saved === 'mainnet') return saved;
  return ACTIVE_NETWORK;
}

function getServerSnapshot(): 'mainnet' | 'testnet' {
  return ACTIVE_NETWORK;
}

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
  updateWalletRpc: (targetChainId?: number) => Promise<boolean>;
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
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain, switchChainAsync, isPending: isSwitching } = useSwitchChain();

  // Subscribe to network preference using React's official external store hook
  const unconnectedNetwork = useSyncExternalStore(
    subscribeToNetwork,
    getNetworkSnapshot,
    getServerSnapshot
  );

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
      localStorage.setItem('synarc_active_network_mode', activeNetwork);
      window.dispatchEvent(new CustomEvent('synarc_network_changed', { detail: { activeNetwork } }));
    }
  }, [activeNetwork]);

  const updateWalletRpc = useCallback(async (targetChainId: number = ARC_TESTNET_CHAIN_ID): Promise<boolean> => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        return await updateWalletChainRpc((window as any).ethereum, targetChainId);
      } catch (err) {
        console.warn('[useArcNetwork] updateWalletRpc failed:', err);
        return false;
      }
    }
    return false;
  }, []);

  const switchToMainnet = useCallback(async () => {
    try {
      if (isWalletConnected) {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          try {
            await ensureWalletOnChain((window as any).ethereum, ARC_MAINNET_CHAIN_ID, false);
          } catch {}
        }
        if (switchChainAsync) {
          await switchChainAsync({ chainId: ARC_MAINNET_CHAIN_ID });
        } else if (switchChain) {
          switchChain({ chainId: ARC_MAINNET_CHAIN_ID });
        }
      } else {
        if (typeof window !== 'undefined') {
          localStorage.setItem('synarc_active_network_mode', 'mainnet');
        }
        setActiveNetwork('mainnet');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('synarc_network_changed', { detail: { activeNetwork: 'mainnet' } }));
        }
      }
    } catch (error) {
      console.error('Failed to switch to Arc Mainnet:', error);
    }
  }, [isWalletConnected, switchChain, switchChainAsync]);

  const switchToTestnet = useCallback(async () => {
    try {
      if (isWalletConnected) {
        // Sync official RPC with Rabby/MetaMask to eliminate stale 401 nodes
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          try {
            await ensureWalletOnChain((window as any).ethereum, ARC_TESTNET_CHAIN_ID, true);
          } catch (e) {
            console.warn('[useArcNetwork] Auto-add testnet chain failed:', e);
          }
        }
        if (switchChainAsync) {
          await switchChainAsync({ chainId: ARC_TESTNET_CHAIN_ID });
        } else if (switchChain) {
          switchChain({ chainId: ARC_TESTNET_CHAIN_ID });
        }
      } else {
        if (typeof window !== 'undefined') {
          localStorage.setItem('synarc_active_network_mode', 'testnet');
        }
        setActiveNetwork('testnet');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('synarc_network_changed', { detail: { activeNetwork: 'testnet' } }));
        }
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
    updateWalletRpc,
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
