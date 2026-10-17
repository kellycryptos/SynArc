"use client";

import { useWallets as usePrivyWallets } from "@/hooks/useWallets";
import { 
  useArcNetwork, 
  TARGET_CHAIN_ID, 
  ARC_MAINNET_CHAIN_ID, 
  ARC_TESTNET_CHAIN_ID 
} from "@/hooks/auth/useArcNetwork";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { useState, useCallback } from "react";
import { ensureArcNetwork } from "@/lib/arc/config";
import { useAuth } from "@/hooks/auth/useAuth";
import { selectActiveWallet } from "@/lib/tx-helper";
import { useContext } from "react";
import { useDeferredWeb3 } from "@/providers/DeferredWeb3Provider";
import { useSwitchChain, WagmiContext } from "wagmi";

export function useSwitchArcNetwork() {
  const { wallets: privyWallets } = usePrivyWallets();
  const wallets = privyWallets ?? [];
  const { isUnsupported, isArcTestnet } = useArcNetwork();
  const { refetch: refetchBalance } = useUSDCBalance();
  const [isLocalSwitching, setIsLocalSwitching] = useState(false);
  const { walletAddress } = useAuth();
  const { switchChain, switchChainAsync, isPending: isWagmiSwitching } = useSwitchChain();

  const activeWallet = selectActiveWallet(wallets, walletAddress);
  const isSwitching = isLocalSwitching || isWagmiSwitching;

  const switchToNetwork = useCallback(async (targetChainId: number) => {
    setIsLocalSwitching(true);
    try {
      if (switchChainAsync) {
        await switchChainAsync({ chainId: targetChainId });
      } else if (switchChain) {
        switchChain({ chainId: targetChainId });
      } else if (activeWallet) {
        const provider = await activeWallet.getEthereumProvider();
        await ensureArcNetwork(provider, targetChainId);
      }

      const isTestnet = targetChainId === ARC_TESTNET_CHAIN_ID;
      const netKey = isTestnet ? 'testnet' : 'mainnet';
      if (typeof window !== 'undefined') {
        localStorage.setItem('synarc_active_network_mode', netKey);
        window.dispatchEvent(new CustomEvent('synarc_network_changed', { detail: { activeNetwork: netKey } }));
      }
      refetchBalance();
    } catch (err) {
      console.error("Error during chain switch operation:", err);
      throw err;
    } finally {
      setIsLocalSwitching(false);
    }
  }, [activeWallet, refetchBalance, switchChain, switchChainAsync]);

  const switchToArc = useCallback(async () => {
    const target = isArcTestnet ? ARC_TESTNET_CHAIN_ID : ARC_MAINNET_CHAIN_ID;
    return switchToNetwork(target);
  }, [isArcTestnet, switchToNetwork]);

  const switchToMainnet = useCallback(async () => {
    return switchToNetwork(ARC_MAINNET_CHAIN_ID);
  }, [switchToNetwork]);

  const switchToTestnet = useCallback(async () => {
    return switchToNetwork(ARC_TESTNET_CHAIN_ID);
  }, [switchToNetwork]);

  return {
    switchToArc,
    switchToNetwork,
    switchToMainnet,
    switchToTestnet,
    isSwitching,
    shouldShowButton: isUnsupported,
  };
}
