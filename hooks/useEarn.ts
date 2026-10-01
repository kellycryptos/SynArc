"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import type { ArcEarnChain, EarnVault, DepositQuote, WithdrawalQuote, EarnPosition } from "@/types/earn";

export function useEarn() {
  const { isArcTestnet, activeNetwork, networkName, isConnected } = useArcNetwork();
  const { walletAddress, isAuthenticated } = useAuth();
  const { connector } = useAccount();

  const [vaults, setVaults] = useState<EarnVault[]>([]);
  const [positions, setPositions] = useState<Record<string, EarnPosition>>({});
  const [isLoadingVaults, setIsLoadingVaults] = useState(false);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const [isTransacting, setIsTransacting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentEarnChain: ArcEarnChain = useMemo(() => {
    return isArcTestnet ? "Arc_Testnet" : "Arc";
  }, [isArcTestnet]);

  // Helper to load SDK dynamically (safeguard against SSR issues)
  const getEarnKit = async () => {
    const { EarnKit } = await import("@circle-fin/earn-kit");
    return new EarnKit();
  };

  const getAdapter = async () => {
    const { createViemAdapterFromProvider } = await import("@circle-fin/adapter-viem-v2");

    const provider = await (
      connector?.getProvider?.() ||
      (typeof window !== "undefined" ? (window as any).ethereum : null)
    );

    if (!provider) {
      throw new Error("No Web3 provider found. Please connect your wallet.");
    }

    return await createViemAdapterFromProvider({
      provider,
      capabilities: { addressContext: "user-controlled" },
    });
  };

  // 1. Fetch available vaults on Arc (Mainnet or Testnet)
  const fetchVaults = useCallback(async (chainOverride?: ArcEarnChain) => {
    const chainToUse = chainOverride || currentEarnChain;
    setIsLoadingVaults(true);
    setError(null);

    try {
      const kit = await getEarnKit();
      const res = await kit.exploreVaults({
        chain: chainToUse,
        sortBy: "apy",
      });

      const rawVaults = res?.vaults || [];
      const formattedVaults: EarnVault[] = rawVaults.map((v: any) => ({
        vaultAddress: v.vaultAddress || v.address,
        chain: v.chain as ArcEarnChain,
        name: v.name || "Morpho Vault",
        protocol: v.protocol || "MORPHO",
        asset: v.asset || "USDC",
        assetAddress: v.assetAddress || "0x3600000000000000000000000000000000000000",
        currentApy: typeof v.currentApy === "number" ? v.currentApy : 0,
        nativeApy: v.nativeApy,
        vaultFee: v.vaultFee,
        status: v.status || "active",
        circleGuarded: Boolean(v.circleGuarded),
        totalDeposits: v.totalDeposits || "0.0",
        liquidity: v.liquidity || "0.0",
        manager: v.manager,
        fee: v.fee,
        liquidityProfile: v.liquidityProfile,
      }));

      setVaults(formattedVaults);
      return formattedVaults;
    } catch (err: any) {
      console.error("[useEarn] fetchVaults error:", err);
      setError(err?.message || "Failed to load Earn vaults");
      return [];
    } finally {
      setIsLoadingVaults(false);
    }
  }, [currentEarnChain]);

  // 2. Fetch positions for the connected wallet
  const fetchPositions = useCallback(async (vaultList?: EarnVault[]) => {
    if (!walletAddress || !isAuthenticated) {
      setPositions({});
      return {};
    }

    const list = vaultList || vaults;
    if (!list || list.length === 0) return {};

    setIsLoadingPositions(true);
    const newPositions: Record<string, EarnPosition> = {};

    try {
      const kit = await getEarnKit();
      const adapter = await getAdapter();

      await Promise.allSettled(
        list.map(async (vault) => {
          try {
            const pos = await kit.getPosition({
              from: { adapter: adapter as any, chain: currentEarnChain },
              vaultAddress: vault.vaultAddress,
            });

            if (pos && (parseFloat(pos.currentBalance || "0") > 0 || parseFloat(pos.shares || "0") > 0)) {
              newPositions[vault.vaultAddress.toLowerCase()] = {
                wallet: pos.wallet || walletAddress,
                chain: pos.chain || currentEarnChain,
                vaultAddress: vault.vaultAddress,
                vaultName: vault.name,
                asset: vault.asset,
                currentBalance: pos.currentBalance || "0",
                currentApy: pos.currentApy || vault.currentApy,
                shares: pos.shares || "0",
                pnl: pos.pnl,
                accruedRewards: pos.accruedRewards,
              };
            }
          } catch {
            // Ignore individual position query failures for vaults with 0 shares
          }
        })
      );

      setPositions(newPositions);
      return newPositions;
    } catch (err: any) {
      console.warn("[useEarn] fetchPositions error:", err);
      return {};
    } finally {
      setIsLoadingPositions(false);
    }
  }, [walletAddress, isAuthenticated, vaults, currentEarnChain]);

  // Auto-fetch on chain or wallet switch
  useEffect(() => {
    let isSubscribed = true;

    fetchVaults().then((loadedVaults) => {
      if (isSubscribed && loadedVaults && loadedVaults.length > 0 && walletAddress) {
        fetchPositions(loadedVaults);
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [fetchVaults, walletAddress]);

  // 3. Preview Deposit (Quote)
  const getDepositQuote = async (vaultAddress: string, amount: string): Promise<DepositQuote | null> => {
    try {
      const kit = await getEarnKit();
      const adapter = await getAdapter();

      const quote = await kit.getDepositQuote({
        from: { adapter: adapter as any, chain: currentEarnChain },
        vaultAddress,
        amount,
      });

      return quote as DepositQuote;
    } catch (err: any) {
      console.error("[useEarn] getDepositQuote error:", err);
      throw new Error(err?.message || "Could not retrieve deposit quote");
    }
  };

  // 4. Deposit into Vault
  const deposit = async (vaultAddress: string, amount: string) => {
    setIsTransacting(true);
    const toastId = toast.loading(`Preparing deposit of ${amount} USDC...`);

    try {
      const kit = await getEarnKit();
      const adapter = await getAdapter();

      toast.loading("Please confirm transactions in your wallet (approval + deposit)...", { id: toastId });

      const result = await kit.deposit({
        from: { adapter: adapter as any, chain: currentEarnChain },
        vaultAddress,
        amount,
      });

      toast.success(`Successfully deposited ${amount} USDC into vault!`, { id: toastId });

      // Refresh positions
      setTimeout(() => {
        fetchPositions();
      }, 1500);

      return result;
    } catch (err: any) {
      console.error("[useEarn] deposit error:", err);
      toast.error(err?.message || "Deposit failed", { id: toastId });
      throw err;
    } finally {
      setIsTransacting(false);
    }
  };

  // 5. Preview Withdrawal (Quote)
  const getWithdrawalQuote = async (vaultAddress: string, amount: string): Promise<WithdrawalQuote | null> => {
    try {
      const kit = await getEarnKit();
      const adapter = await getAdapter();

      const quote = await kit.getWithdrawalQuote({
        from: { adapter: adapter as any, chain: currentEarnChain },
        vaultAddress,
        amount,
      });

      return quote as WithdrawalQuote;
    } catch (err: any) {
      console.error("[useEarn] getWithdrawalQuote error:", err);
      throw new Error(err?.message || "Could not retrieve withdrawal quote");
    }
  };

  // 6. Withdraw from Vault
  const withdraw = async (vaultAddress: string, amount: string) => {
    setIsTransacting(true);
    const toastId = toast.loading(`Preparing withdrawal of ${amount} USDC...`);

    try {
      const kit = await getEarnKit();
      const adapter = await getAdapter();

      toast.loading("Please confirm withdrawal in your wallet...", { id: toastId });

      const result = await kit.withdraw({
        from: { adapter: adapter as any, chain: currentEarnChain },
        vaultAddress,
        amount,
      });

      toast.success(`Successfully redeemed ${result?.amount || amount} USDC!`, { id: toastId });

      // Refresh positions
      setTimeout(() => {
        fetchPositions();
      }, 1500);

      return result;
    } catch (err: any) {
      console.error("[useEarn] withdraw error:", err);
      toast.error(err?.message || "Withdrawal failed", { id: toastId });
      throw err;
    } finally {
      setIsTransacting(false);
    }
  };

  return {
    vaults,
    positions,
    currentEarnChain,
    activeNetwork,
    networkName,
    isLoadingVaults,
    isLoadingPositions,
    isTransacting,
    error,
    fetchVaults,
    fetchPositions,
    getDepositQuote,
    deposit,
    getWithdrawalQuote,
    withdraw,
  };
}
