"use client";

import { useMemo } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { useCircleWallet } from '@/hooks/useCircleWallet';

export interface SynArcConnectedWallet {
  address: string;
  chainId: string;
  walletClientType: string;
  getEthereumProvider: () => Promise<any>;
  getEip1193Provider: () => Promise<any>;
  getProvider: () => Promise<any>;
  switchChain: (targetChainId: number) => Promise<any>;
}

/**
 * useWallets — Universal wallet hook for Syn DAO
 *
 * Provides a drop-in replacement for useWallets / usePrivyWallets,
 * exposing connected Wagmi wallets (via RainbowKit) and Circle Smart Accounts.
 */
export function useWallets() {
  const { address, isConnected, connector, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { circleConnected, circleAddress } = useCircleWallet();

  const wallets = useMemo<SynArcConnectedWallet[]>(() => {
    const list: SynArcConnectedWallet[] = [];

    // 1. Circle Wallet priority if connected
    if (circleConnected && circleAddress) {
      list.push({
        address: circleAddress,
        chainId: 'eip155:5042002',
        walletClientType: 'circle',
        getEthereumProvider: async () => null,
        getEip1193Provider: async () => null,
        getProvider: async () => null,
        switchChain: async () => {},
      });
    }

    // 2. Connected Wagmi / Injected / RainbowKit wallet
    if (isConnected && address) {
      const getProvider = async () => {
        if (connector?.getProvider) {
          try {
            const provider = await connector.getProvider();
            if (provider) return provider;
          } catch (e) {
            console.warn('[useWallets] Failed to get connector provider:', e);
          }
        }
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          return (window as any).ethereum;
        }
        return null;
      };

      list.push({
        address,
        chainId: `eip155:${chainId || 5042002}`,
        walletClientType: connector?.name?.toLowerCase() || 'injected',
        getEthereumProvider: getProvider,
        getEip1193Provider: getProvider,
        getProvider: getProvider,
        switchChain: async (targetId: number) => {
          if (switchChainAsync) {
            return await switchChainAsync({ chainId: targetId });
          }
          const provider = await getProvider();
          if (provider?.request) {
            return await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${targetId.toString(16)}` }],
            });
          }
        },
      });
    }

    return list;
  }, [isConnected, address, connector, chainId, circleConnected, circleAddress, switchChainAsync]);

  return {
    wallets,
    ready: true,
  };
}

export const usePrivyWallets = useWallets;
