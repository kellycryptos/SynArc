"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { useAuth } from "@/hooks/auth/useAuth";
import { useWallets as usePrivyWallets } from "@/hooks/useWallets";
import { selectActiveWallet } from "@/lib/tx-helper";
import { wrapEip1193ProviderWithAutoAdd, ensureWalletOnChain } from "@/lib/chain-network-helper";
import { useDeferredWeb3 } from "@/providers/DeferredWeb3Provider";
import { useConnectorClient } from "wagmi";
import { toast } from "react-hot-toast";
import { invalidateUSDCBalance } from "@/hooks/useUSDCBalance";
import type { ArcEarnChain, EarnVault, DepositQuote, WithdrawalQuote, EarnPosition } from "@/types/earn";

// Helper to load SDK dynamically
const getEarnKit = async () => {
  const { EarnKit } = await import("@circle-fin/earn-kit");
  return new EarnKit();
};

/**
 * Resolve an EIP-1193-compatible provider from all available wallet sources:
 * Wagmi connector client, Privy active wallet, or window.ethereum.
 * Always wrapped with wrapEip1193ProviderWithAutoAdd for seamless chain registration.
 */
const resolveProvider = async (activeWallet: any, connectorClient: any) => {
  let raw: any = null;

  if (connectorClient?.transport?.request) {
    raw = {
      request: (args: any) => connectorClient.transport.request(args),
    };
  } else if (activeWallet) {
    raw = await (
      activeWallet.getEthereumProvider?.() ||
      activeWallet.getProvider?.() ||
      activeWallet.getEip1193Provider?.()
    );
  }

  if (!raw && typeof window !== "undefined" && (window as any).ethereum) {
    raw = (window as any).ethereum;
  }

  if (!raw) return null;
  return wrapEip1193ProviderWithAutoAdd(raw);
};

const buildAdapter = async (provider: any) => {
  const { createViemAdapterFromProvider } = await import("@circle-fin/adapter-viem-v2");
  const { createPublicClient, http, fallback } = await import("viem");
  const { ARC_MAINNET_RPC_URLS, ARC_TESTNET_RPC_URLS } = await import("@/lib/arc-config");

  return await createViemAdapterFromProvider({
    provider: wrapEip1193ProviderWithAutoAdd(provider),
    capabilities: { addressContext: "user-controlled" },
    getPublicClient: (({ chain }: { chain: any }) => {
      if (chain?.id === 5042) {
        return createPublicClient({
          chain,
          transport: fallback(ARC_MAINNET_RPC_URLS.map(u => http(u, { timeout: 10_000, retryCount: 2 }))),
        });
      }
      if (chain?.id === 5042002) {
        return createPublicClient({
          chain,
          transport: fallback(ARC_TESTNET_RPC_URLS.map(u => http(u, { timeout: 10_000, retryCount: 2 }))),
        });
      }
      return createPublicClient({ chain, transport: http() });
    }) as any,
  });
};

export function useEarn() {
  const deferred = useDeferredWeb3();

  // If Web3Provider has not been mounted yet (SSR or unauthenticated visitor),
  // use the guest version of useEarn so no Wagmi hooks are executed outside WagmiProvider.
  if (deferred && !deferred.isMounted) {
    return useGuestEarn();
  }

  return useActiveEarn();
}

/**
 * Guest version of useEarn for SSR and unauthenticated state.
 * Allows browsing vaults freely without executing wallet-dependent Wagmi hooks.
 */
function useGuestEarn() {
  const { isArcTestnet, activeNetwork, networkName } = useArcNetwork();
  const [vaults, setVaults] = useState<EarnVault[]>([]);
  const [isLoadingVaults, setIsLoadingVaults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentEarnChain: ArcEarnChain = useMemo(() => {
    return isArcTestnet ? "Arc_Testnet" : "Arc";
  }, [isArcTestnet]);

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
      console.error("[useEarn guest] fetchVaults error:", err);
      setError(err?.message || "Failed to load Earn vaults");
      return [];
    } finally {
      setIsLoadingVaults(false);
    }
  }, [currentEarnChain]);

  useEffect(() => {
    fetchVaults();
  }, [fetchVaults]);

  return {
    vaults,
    positions: {} as Record<string, EarnPosition>,
    currentEarnChain,
    activeNetwork,
    networkName,
    isLoadingVaults,
    isLoadingPositions: false,
    isTransacting: false,
    error,
    fetchVaults,
    fetchPositions: async () => ({} as Record<string, EarnPosition>),
    getDepositQuote: async () => null,
    deposit: async () => { throw new Error("Please connect your wallet to deposit."); },
    getWithdrawalQuote: async () => null,
    withdraw: async () => { throw new Error("Please connect your wallet to withdraw."); },
  };
}

/**
 * Active version of useEarn for connected/mounted Web3 sessions.
 */
function useActiveEarn() {
  const { isArcTestnet, activeNetwork, networkName } = useArcNetwork();
  const { walletAddress, isAuthenticated } = useAuth();
  const { wallets: privyWallets } = usePrivyWallets();
  const wallets = privyWallets ?? [];
  const activeWallet = selectActiveWallet(wallets, walletAddress);

  // Get the currently connected wagmi connector client (EIP-1193 transport)
  const { data: connectorClient } = useConnectorClient();

  const [vaults, setVaults] = useState<EarnVault[]>([]);
  const [positions, setPositions] = useState<Record<string, EarnPosition>>({});
  const [isLoadingVaults, setIsLoadingVaults] = useState(false);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const [isTransacting, setIsTransacting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentEarnChain: ArcEarnChain = useMemo(() => {
    return isArcTestnet ? "Arc_Testnet" : "Arc";
  }, [isArcTestnet]);

  /**
   * Resolve wrapped EIP-1193 provider from any active wallet source
   */
  const getProvider = useCallback(async () => {
    return await resolveProvider(activeWallet, connectorClient);
  }, [activeWallet, connectorClient]);

  /**
   * Build and return the adapter with auto-add and robust RPCs
   */
  const getAdapter = useCallback(async () => {
    const provider = await getProvider();
    if (!provider) {
      throw new Error(
        "No Web3 provider found. Please connect your wallet first."
      );
    }
    return buildAdapter(provider);
  }, [getProvider]);

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
            // Ignore 0 balance queries
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
  }, [walletAddress, isAuthenticated, vaults, currentEarnChain, getAdapter]);

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
      console.warn("[useEarn] getDepositQuote warning:", err?.message);
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("does not hold enough") || msg.includes("insufficient_token") || msg.includes("insufficient")) {
        throw new Error("Amount exceeds current wallet balance");
      }
      throw new Error(err?.message || "Could not retrieve deposit quote");
    }
  };

  // 4. Deposit into Vault
  const deposit = async (vaultAddress: string, amount: string) => {
    setIsTransacting(true);
    const toastId = toast.loading(`Preparing deposit of ${amount} USDC...`);

    try {
      const kit = await getEarnKit();
      const provider = await getProvider();
      if (!provider) {
        throw new Error("No Web3 provider found. Please connect your wallet first.");
      }

      // Ensure wallet is switched to active Arc chain with auto-add
      const targetChainId = isArcTestnet ? 5042002 : 5042;
      toast.loading(`Switching to ${isArcTestnet ? "Arc Testnet" : "Arc"}...`, { id: toastId });
      await ensureWalletOnChain(provider, targetChainId);

      const adapter = await buildAdapter(provider);

      toast.loading("Please confirm transactions in your wallet (approval + deposit)...", { id: toastId });

      const result = await kit.deposit({
        from: { adapter: adapter as any, chain: currentEarnChain },
        vaultAddress,
        amount,
      });

      toast.success(`Successfully deposited ${amount} USDC into vault!`, { id: toastId });

      // Invalidate wallet USDC balance cache so navbar/sidebar refresh immediately
      invalidateUSDCBalance();

      setTimeout(() => {
        fetchPositions();
      }, 1500);

      return result;
    } catch (err: any) {
      console.error("[useEarn] deposit error:", err);
      const msg = (err?.message || "").toLowerCase();
      if (
        msg.includes("user rejected") ||
        msg.includes("user denied") ||
        msg.includes("cancelled") ||
        err?.code === 4001
      ) {
        toast.error("Transaction was cancelled by user", { id: toastId });
      } else {
        toast.error(err?.message || "Deposit failed", { id: toastId });
      }
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
      console.warn("[useEarn] getWithdrawalQuote warning:", err?.message);
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("does not hold enough") || msg.includes("insufficient") || msg.includes("exceeds")) {
        throw new Error("Amount exceeds current vault balance");
      }
      throw new Error(err?.message || "Could not retrieve withdrawal quote");
    }
  };

  // 6. Withdraw from Vault
  const withdraw = async (vaultAddress: string, amount: string) => {
    setIsTransacting(true);
    const toastId = toast.loading(`Preparing withdrawal of ${amount} USDC...`);

    try {
      const kit = await getEarnKit();
      const provider = await getProvider();
      if (!provider) {
        throw new Error("No Web3 provider found. Please connect your wallet first.");
      }

      // Ensure wallet is switched to active Arc chain with auto-add
      const targetChainId = isArcTestnet ? 5042002 : 5042;
      toast.loading(`Switching to ${isArcTestnet ? "Arc Testnet" : "Arc"}...`, { id: toastId });
      await ensureWalletOnChain(provider, targetChainId);

      const adapter = await buildAdapter(provider);

      toast.loading("Please confirm withdrawal in your wallet...", { id: toastId });

      const result = await kit.withdraw({
        from: { adapter: adapter as any, chain: currentEarnChain },
        vaultAddress,
        amount,
      });

      toast.success(`Successfully redeemed ${result?.amount || amount} USDC!`, { id: toastId });

      // Invalidate wallet USDC balance cache so navbar/sidebar refresh immediately
      invalidateUSDCBalance();

      setTimeout(() => {
        fetchPositions();
      }, 1500);

      return result;
    } catch (err: any) {
      console.error("[useEarn] withdraw error:", err);
      const msg = (err?.message || "").toLowerCase();
      if (
        msg.includes("user rejected") ||
        msg.includes("user denied") ||
        msg.includes("cancelled") ||
        err?.code === 4001
      ) {
        toast.error("Transaction was cancelled by user", { id: toastId });
      } else {
        toast.error(err?.message || "Withdrawal failed", { id: toastId });
      }
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
