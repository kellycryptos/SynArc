"use client";

import { useWallets as usePrivyWallets } from '@/hooks/useWallets';
import { useMemo } from 'react';
import { createWalletClient, custom } from 'viem';
import { arcTestnet } from '@/lib/chains/arc';

export function usePrivyWallet() {
  // Safe: returns active wallet from Wagmi or Circle
  const { wallets: rawWallets, ready } = usePrivyWallets();
  const wallets = rawWallets ?? [];

  // Find the active wallet among all active connections
  const embeddedWallet = useMemo(() => {
    return wallets[0] || null;
  }, [wallets]);

  const address = embeddedWallet?.address || "";

  // Helper to sign a message using the embedded wallet's EIP-1193 provider
  const signMessage = async (message: string): Promise<`0x${string}`> => {
    if (!embeddedWallet) {
      throw new Error("Privy embedded wallet not initialized or not found.");
    }
    const provider = await embeddedWallet.getEthereumProvider();
    const walletClient = createWalletClient({
      account: embeddedWallet.address as `0x${string}`,
      chain: arcTestnet,
      transport: custom(provider),
    });
    const [account] = await walletClient.getAddresses();
    return await walletClient.signMessage({
      account,
      message,
    });
  };

  // Helper to send a transaction on Arc Testnet using the embedded wallet's EIP-1193 provider
  const sendTransaction = async (
    to: string,
    value: bigint,
    data?: `0x${string}`
  ): Promise<`0x${string}`> => {
    if (!embeddedWallet) {
      throw new Error("Privy embedded wallet not initialized or not found.");
    }
    const provider = await embeddedWallet.getEthereumProvider();
    const walletClient = createWalletClient({
      account: embeddedWallet.address as `0x${string}`,
      chain: arcTestnet,
      transport: custom(provider),
    });
    const [account] = await walletClient.getAddresses();
    return await walletClient.sendTransaction({
      account,
      to: to as `0x${string}`,
      value,
      data,
    });
  };

  return {
    wallet: embeddedWallet,
    address,
    signMessage,
    sendTransaction,
    isReady: ready && !!embeddedWallet,
  };
}
