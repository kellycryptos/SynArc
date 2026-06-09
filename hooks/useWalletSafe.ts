"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { useWallets as usePrivyWallets } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
import { createPublicClient, http, parseAbi } from "viem";
import { ARC_RPC_URLS } from "@/lib/arc-config";
import { selectActiveWallet, enforceChain } from "@/lib/tx-helper";
import { toast } from "react-hot-toast";

export type WalletType = 'external' | 'embedded' | 'circle' | null;

export function useWalletSafe() {
  const { isAuthenticated, walletAddress, isCircle, ready } = useAuth();
  const { isArcTestnet, switchNetwork } = useArcNetwork();
  const { wallets: privyWallets } = usePrivyWallets();
  const wallets = privyWallets ?? [];
  const activeWallet = selectActiveWallet(wallets, walletAddress);

  const [usdcBalance, setUsdcBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Determine walletType
  let walletType: WalletType = null;
  if (isAuthenticated) {
    if (isCircle) {
      walletType = 'circle';
    } else if (activeWallet) {
      walletType = activeWallet.walletClientType === 'privy' ? 'embedded' : 'external';
    } else {
      walletType = 'external';
    }
  }

  // Network check
  const isCorrectNetwork = isCircle ? true : (isAuthenticated ? isArcTestnet : false);

  const switchToArc = async () => {
    if (walletType === 'circle') {
      toast.success("Circle Wallet accounts are auto-routed to Arc Testnet.", {
        icon: "⭕",
        duration: 4000,
      });
      return;
    }
    if (walletType === 'embedded' && activeWallet) {
      try {
        await enforceChain(activeWallet, 5042002);
      } catch (err: any) {
        toast.error(err?.message || "Failed to switch embedded wallet to Arc Testnet.");
      }
      return;
    }
    if (switchNetwork) {
      await switchNetwork();
    }
  };

  useEffect(() => {
    if (!walletAddress) {
      setUsdcBalance(null);
      return;
    }

    let isMounted = true;
    const fetchBalance = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      try {
        if (walletType === 'circle') {
          const userToken = localStorage.getItem('synarc_circle_user_token');
          if (userToken) {
            const res = await fetch('/api/circle/wallet/balances', {
              headers: {
                'x-user-token': userToken
              }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.balances) {
                const usdcToken = data.balances.find((b: any) => 
                  b.token?.symbol?.toUpperCase() === 'USDC' || 
                  b.token?.address?.toLowerCase() === '0x3600000000000000000000000000000000000000'
                );
                if (usdcToken && isMounted) {
                  const amountNum = parseFloat(usdcToken.amount);
                  const decimals = usdcToken.token?.decimals || 6;
                  const balanceBig = BigInt(Math.round(amountNum * Math.pow(10, decimals)));
                  setUsdcBalance(balanceBig);
                  setIsLoading(false);
                  return;
                }
              }
            }
          }
        }

        // Fallback: public contract read
        const rpcUrl = ARC_RPC_URLS[0] || 'https://rpc.testnet.arc.network';
        const client = createPublicClient({
          transport: http(rpcUrl)
        });
        const bal = await client.readContract({
          address: '0x3600000000000000000000000000000000000000',
          abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
          functionName: 'balanceOf',
          args: [walletAddress as `0x${string}`]
        });
        if (isMounted) {
          setUsdcBalance(BigInt(bal.toString()));
        }
      } catch (err) {
        console.error("Failed to fetch balance in useWalletSafe:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchBalance();
    
    // Poll every 15 seconds
    const interval = setInterval(fetchBalance, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [walletAddress, walletType]);

  return {
    isConnected: isAuthenticated,
    walletType,
    address: walletAddress || null,
    usdcBalance,
    isCorrectNetwork,
    switchToArc,
    isLoading: !ready || isLoading,
  };
}
