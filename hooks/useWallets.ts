"use client";

import { useMemo, useContext } from 'react';
import { useAccount, useSwitchChain, WagmiContext } from 'wagmi';
import { useCircleWallet } from '@/hooks/useCircleWallet';
import { ARC_CHAIN } from '@/lib/arc-config';
import { useDeferredWeb3 } from '@/providers/DeferredWeb3Provider';

export interface SynArcConnectedWallet {
  address: string;
  chainId: string;
  walletClientType: string;
  getEthereumProvider: () => Promise<any>;
  getEip1193Provider: () => Promise<any>;
  getProvider: () => Promise<any>;
  switchChain: (targetChainId: number) => Promise<any>;
}

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
        chainId: `eip155:${ARC_CHAIN.id}`,
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
        if (typeof window !== 'undefined') {
          if (connector?.name?.toLowerCase().includes('okx') && (window as any).okxwallet) {
            return (window as any).okxwallet;
          }
          if ((window as any).okxwallet && !(window as any).ethereum) {
            return (window as any).okxwallet;
          }
          if ((window as any).ethereum) {
            return (window as any).ethereum;
          }
          if ((window as any).okxwallet) {
            return (window as any).okxwallet;
          }
        }
        return null;
      };

      list.push({
        address,
        chainId: `eip155:${chainId || ARC_CHAIN.id}`,
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
