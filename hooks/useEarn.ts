"use client";

import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { useAuth } from "@/hooks/auth/useAuth";
import { useWallets as usePrivyWallets } from "@/hooks/useWallets";
import { selectActiveWallet } from "@/lib/tx-helper";
import { wrapEip1193ProviderWithAutoAdd, ensureWalletOnChain } from "@/lib/chain-network-helper";
import { useDeferredWeb3 } from "@/providers/DeferredWeb3Provider";
import { useConnectorClient, WagmiContext } from "wagmi";
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

  if (!raw && typeof window !== "undefined") {
    // Explicitly check OKX Web3 wallet injected provider
    if ((window as any).okxwallet) {
      raw = (window as any).okxwallet;
    } else if ((window as any).ethereum) {
      raw = (window as any).ethereum;
    }
  }

  if (!raw) return null;
  return wrapEip1193ProviderWithAutoAdd(raw);
};

const buildAdapter = async (provider: any) => {
  const { createViemAdapterFromProvider } = await import("@circle-fin/adapter-viem-v2");
  const { createPublicClient, http, fallback } = await import("viem");
  const { ARC_MAINNET_RPC_URLS, ARC_TESTNET_RPC_URLS } = await import("@/lib/arc-config");
  const { sanitizeAdapterSignatures } = await import("@/lib/eip712-helper");

  const adapter = await createViemAdapterFromProvider({
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

  return sanitizeAdapterSignatures(adapter, provider);
};

export function useEarn() {
  const deferred = useDeferredWeb3();
  const wagmiContext = useContext(WagmiContext);

  // If Web3Provider has not been mounted yet (SSR or unauthenticated visitor),
  // use the guest version of useEarn so no Wagmi hooks are executed outside WagmiProvider.
  if (!deferred?.isMounted || !wagmiContext) {
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
          let pos: any = null;
          try {
            pos = await kit.getPosition({
              from: { adapter: adapter as any, chain: currentEarnChain },
              vaultAddress: vault.vaultAddress,
            });
          } catch {
            // Kit getPosition query failed, proceed to on-chain read
          }

          // If Kit returned 0 or failed, query on-chain ERC-4626 directly
          if (!pos || (parseFloat(pos.currentBalance || "0") <= 0 && parseFloat(pos.shares || "0") <= 0)) {
            try {
              const { createPublicClient, http, fallback, formatUnits } = await import("viem");
              const { ARC_MAINNET_RPC_URLS, ARC_TESTNET_RPC_URLS, arcMainnet, arcTestnet } = await import("@/lib/arc-config");
              const { ERC4626_VAULT_ABI } = await import("@/lib/eip712-helper");

              const isTestnet = isArcTestnet;
              const rpcUrls = isTestnet ? ARC_TESTNET_RPC_URLS : ARC_MAINNET_RPC_URLS;
              const client = createPublicClient({
                chain: isTestnet ? arcTestnet : arcMainnet,
                transport: fallback(rpcUrls.map(u => http(u, { timeout: 8000 }))),
              });

              const sharesRaw = await client.readContract({
                address: vault.vaultAddress as `0x${string}`,
                abi: ERC4626_VAULT_ABI,
                functionName: 'balanceOf',
                args: [walletAddress as `0x${string}`],
              });

              if (sharesRaw > 0n) {
                let assetsRaw = sharesRaw;
                try {
                  assetsRaw = await client.readContract({
                    address: vault.vaultAddress as `0x${string}`,
                    abi: ERC4626_VAULT_ABI,
                    functionName: 'convertToAssets',
                    args: [sharesRaw],
                  });
                } catch {
                  // Assume 1:1 if convertToAssets is unsupported
                }

                pos = {
                  wallet: walletAddress,
                  chain: currentEarnChain,
                  vaultAddress: vault.vaultAddress,
                  vaultName: vault.name,
                  asset: vault.asset,
                  currentBalance: formatUnits(assetsRaw, 6),
                  currentApy: vault.currentApy,
                  shares: formatUnits(sharesRaw, 6),
                };
              }
            } catch {
              // Ignore on-chain read errors for unused vaults
            }
          }

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

      // On-chain ERC-4626 previewDeposit fallback if EarnKit service has issues
      try {
        const { createPublicClient, http, fallback, parseUnits, formatUnits } = await import("viem");
        const { ARC_MAINNET_RPC_URLS, ARC_TESTNET_RPC_URLS, arcMainnet, arcTestnet } = await import("@/lib/arc-config");
        const { ERC4626_VAULT_ABI } = await import("@/lib/eip712-helper");

        const isTestnet = isArcTestnet;
        const chain = isTestnet ? arcTestnet : arcMainnet;
        const rpcUrls = isTestnet ? ARC_TESTNET_RPC_URLS : ARC_MAINNET_RPC_URLS;
        const client = createPublicClient({
          chain,
          transport: fallback(rpcUrls.map(u => http(u, { timeout: 8000 }))),
        });
        const amountRaw = parseUnits(amount, 6);
        const sharesRaw = await client.readContract({
          address: vaultAddress as `0x${string}`,
          abi: ERC4626_VAULT_ABI,
          functionName: 'previewDeposit',
          args: [amountRaw],
        });

        return {
          vaultAddress,
          deposit: { symbol: "USDC", amount },
          expectedShares: {
            amount: formatUnits(sharesRaw, 6),
            symbol: "SHARES",
          },
          sharePrice: "1.000000",
        } as unknown as DepositQuote;
      } catch {
        throw new Error(err?.message || "Could not retrieve deposit quote");
      }
    }
  };

  // 4. Deposit into Vault (Standard on-chain ERC-20 approve + ERC-4626 deposit)
  const deposit = async (vaultAddress: string, amount: string) => {
    setIsTransacting(true);
    const toastId = toast.loading(`Preparing deposit of ${amount} USDC...`);

    try {
      const provider = await getProvider();
      if (!provider) {
        throw new Error("No Web3 provider found. Please connect your wallet first.");
      }

      // Ensure wallet is switched to active Arc chain with auto-add
      const targetChainId = isArcTestnet ? 5042002 : 5042;
      toast.loading(`Switching to ${isArcTestnet ? "Arc Testnet" : "Arc"}...`, { id: toastId });
      await ensureWalletOnChain(provider, targetChainId);

      const activeAccount = (walletAddress || (await provider.request({ method: 'eth_accounts' }))?.[0]) as `0x${string}`;
      if (!activeAccount) {
        throw new Error("No active wallet account detected. Please connect your wallet.");
      }

      // ── PRIMARY FLOW: Standard ERC-20 approve + ERC-4626 deposit ──────────
      // This is the cleanest, standard EVM interaction. It requires ZERO off-chain
      // EIP-712 permit signatures, preventing OKX Web3 Wallet's "risky signature type"
      // alert from ever triggering.
      try {
        const { createPublicClient, createWalletClient, custom, http, fallback, parseUnits } = await import("viem");
        const { ARC_MAINNET_RPC_URLS, ARC_TESTNET_RPC_URLS, arcMainnet, arcTestnet } = await import("@/lib/arc-config");
        const { ERC20_ALLOWANCE_ABI, ERC4626_VAULT_ABI } = await import("@/lib/eip712-helper");

        const isTestnet = isArcTestnet;
        const chain = isTestnet ? arcTestnet : arcMainnet;
        const rpcUrls = isTestnet ? ARC_TESTNET_RPC_URLS : ARC_MAINNET_RPC_URLS;

        const publicClient = createPublicClient({
          chain,
          transport: fallback(rpcUrls.map(u => http(u, { timeout: 10_000, retryCount: 2 }))),
        });

        const walletClient = createWalletClient({
          account: activeAccount,
          chain,
          transport: custom(provider),
        });

        const amountRaw = parseUnits(amount, 6);
        const vaultAddr = vaultAddress as `0x${string}`;

        // Discover underlying asset token (defaults to canonical USDC 0x3600...)
        let assetAddress: `0x${string}` = '0x3600000000000000000000000000000000000000';
        try {
          const onchainAsset = await publicClient.readContract({
            address: vaultAddr,
            abi: ERC4626_VAULT_ABI,
            functionName: 'asset',
          });
          if (onchainAsset && onchainAsset !== '0x0000000000000000000000000000000000000000') {
            assetAddress = onchainAsset;
          }
        } catch {
          // Keep canonical USDC
        }

        // 1. Check existing allowance
        toast.loading("Checking USDC allowance...", { id: toastId });
        const currentAllowance = await publicClient.readContract({
          address: assetAddress,
          abi: ERC20_ALLOWANCE_ABI,
          functionName: 'allowance',
          args: [activeAccount, vaultAddr],
        });

        // 2. Request standard on-chain ERC-20 approve if needed
        if (currentAllowance < amountRaw) {
          toast.loading(`Step 1/2: Please approve ${amount} USDC in your wallet...`, { id: toastId });
          const approveTx = await walletClient.writeContract({
            address: assetAddress,
            abi: ERC20_ALLOWANCE_ABI,
            functionName: 'approve',
            args: [vaultAddr, amountRaw],
          });
          toast.loading("Confirming USDC approval on Arc...", { id: toastId });
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
        }

        // 3. Request standard on-chain ERC-4626 deposit
        toast.loading(`Step 2/2: Confirming deposit of ${amount} USDC in your wallet...`, { id: toastId });
        const depositTx = await walletClient.writeContract({
          address: vaultAddr,
          abi: ERC4626_VAULT_ABI,
          functionName: 'deposit',
          args: [amountRaw, activeAccount],
        });

        toast.loading("Confirming vault deposit on Arc...", { id: toastId });
        const receipt = await publicClient.waitForTransactionReceipt({ hash: depositTx });

        toast.success(`Successfully deposited ${amount} USDC into vault!`, { id: toastId });
        invalidateUSDCBalance();
        setTimeout(() => {
          fetchPositions();
        }, 1500);

        return { txHash: depositTx, receipt };
      } catch (onchainErr: any) {
        console.warn("[useEarn] Standard on-chain flow encountered an error, evaluating fallback:", onchainErr?.message);
        const errMsg = (onchainErr?.message || "").toLowerCase();
        // If user intentionally rejected/cancelled in wallet, do not retry
        if (
          errMsg.includes("user rejected") ||
          errMsg.includes("user denied") ||
          errMsg.includes("cancelled") ||
          errMsg.includes("rejected the request") ||
          onchainErr?.code === 4001
        ) {
          throw onchainErr;
        }

        // ── SECONDARY FALLBACK: Circle EarnKit with EIP-712 sanitizer ────────
        const kit = await getEarnKit();
        const adapter = await buildAdapter(provider);

        toast.loading("Submitting deposit via Circle Earn adapter...", { id: toastId });
        const result = await kit.deposit({
          from: { adapter: adapter as any, chain: currentEarnChain },
          vaultAddress,
          amount,
        });

        toast.success(`Successfully deposited ${amount} USDC into vault!`, { id: toastId });
        invalidateUSDCBalance();
        setTimeout(() => {
          fetchPositions();
        }, 1500);

        return result;
      }
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
      } else if (msg.includes("risky") || msg.includes("signature type is risky")) {
        toast.error("OKX risk protection flagged the signature. Switched to standard ERC-20 approve.", { id: toastId, duration: 8000 });
      } else if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("thecanteenapp")) {
        toast.error("Wallet RPC unauthorized (401). Click 'Sync Official RPC' in top network badge to update Rabby/MetaMask.", { id: toastId, duration: 8000 });
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

      // On-chain ERC-4626 previewWithdraw fallback
      try {
        const { createPublicClient, http, fallback, parseUnits, formatUnits } = await import("viem");
        const { ARC_MAINNET_RPC_URLS, ARC_TESTNET_RPC_URLS, arcMainnet, arcTestnet } = await import("@/lib/arc-config");
        const { ERC4626_VAULT_ABI } = await import("@/lib/eip712-helper");

        const isTestnet = isArcTestnet;
        const chain = isTestnet ? arcTestnet : arcMainnet;
        const rpcUrls = isTestnet ? ARC_TESTNET_RPC_URLS : ARC_MAINNET_RPC_URLS;
        const client = createPublicClient({
          chain,
          transport: fallback(rpcUrls.map(u => http(u, { timeout: 8000 }))),
        });
        const amountRaw = parseUnits(amount, 6);
        const sharesRaw = await client.readContract({
          address: vaultAddress as `0x${string}`,
          abi: ERC4626_VAULT_ABI,
          functionName: 'previewWithdraw',
          args: [amountRaw],
        });

        return {
          vaultAddress,
          withdrawal: { symbol: "USDC", amount },
          sharesToRedeem: {
            amount: formatUnits(sharesRaw, 6),
            symbol: "SHARES",
          },
          sharePrice: "1.000000",
        } as unknown as WithdrawalQuote;
      } catch {
        throw new Error(err?.message || "Could not retrieve withdrawal quote");
      }
    }
  };

  // 6. Withdraw from Vault (Standard on-chain ERC-4626 withdraw)
  const withdraw = async (vaultAddress: string, amount: string) => {
    setIsTransacting(true);
    const toastId = toast.loading(`Preparing withdrawal of ${amount} USDC...`);

    try {
      const provider = await getProvider();
      if (!provider) {
        throw new Error("No Web3 provider found. Please connect your wallet first.");
      }

      // Ensure wallet is switched to active Arc chain with auto-add
      const targetChainId = isArcTestnet ? 5042002 : 5042;
      toast.loading(`Switching to ${isArcTestnet ? "Arc Testnet" : "Arc"}...`, { id: toastId });
      await ensureWalletOnChain(provider, targetChainId);

      const activeAccount = (walletAddress || (await provider.request({ method: 'eth_accounts' }))?.[0]) as `0x${string}`;
      if (!activeAccount) {
        throw new Error("No active wallet account detected. Please connect your wallet.");
      }

      // ── PRIMARY FLOW: Standard ERC-4626 withdraw ─────────────────────────
      try {
        const { createPublicClient, createWalletClient, custom, http, fallback, parseUnits } = await import("viem");
        const { ARC_MAINNET_RPC_URLS, ARC_TESTNET_RPC_URLS, arcMainnet, arcTestnet } = await import("@/lib/arc-config");
        const { ERC4626_VAULT_ABI } = await import("@/lib/eip712-helper");

        const isTestnet = isArcTestnet;
        const chain = isTestnet ? arcTestnet : arcMainnet;
        const rpcUrls = isTestnet ? ARC_TESTNET_RPC_URLS : ARC_MAINNET_RPC_URLS;

        const publicClient = createPublicClient({
          chain,
          transport: fallback(rpcUrls.map(u => http(u, { timeout: 10_000, retryCount: 2 }))),
        });

        const walletClient = createWalletClient({
          account: activeAccount,
          chain,
          transport: custom(provider),
        });

        const amountRaw = parseUnits(amount, 6);
        const vaultAddr = vaultAddress as `0x${string}`;

        toast.loading(`Please confirm withdrawal of ${amount} USDC in your wallet...`, { id: toastId });
        const withdrawTx = await walletClient.writeContract({
          address: vaultAddr,
          abi: ERC4626_VAULT_ABI,
          functionName: 'withdraw',
          args: [amountRaw, activeAccount, activeAccount],
        });

        toast.loading("Confirming withdrawal on Arc...", { id: toastId });
        const receipt = await publicClient.waitForTransactionReceipt({ hash: withdrawTx });

        toast.success(`Successfully redeemed ${amount} USDC!`, { id: toastId });
        invalidateUSDCBalance();
        setTimeout(() => {
          fetchPositions();
        }, 1500);

        return { txHash: withdrawTx, receipt, amount };
      } catch (onchainErr: any) {
        console.warn("[useEarn] Direct withdraw failed, checking fallback:", onchainErr?.message);
        const errMsg = (onchainErr?.message || "").toLowerCase();
        if (
          errMsg.includes("user rejected") ||
          errMsg.includes("user denied") ||
          errMsg.includes("cancelled") ||
          onchainErr?.code === 4001
        ) {
          throw onchainErr;
        }

        // Fallback to EarnKit
        const kit = await getEarnKit();
        const adapter = await buildAdapter(provider);

        toast.loading("Please confirm withdrawal in your wallet...", { id: toastId });
        const result = await kit.withdraw({
          from: { adapter: adapter as any, chain: currentEarnChain },
          vaultAddress,
          amount,
        });

        toast.success(`Successfully redeemed ${result?.amount || amount} USDC!`, { id: toastId });
        invalidateUSDCBalance();
        setTimeout(() => {
          fetchPositions();
        }, 1500);

        return result;
      }
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
      } else if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("thecanteenapp")) {
        toast.error("Wallet RPC unauthorized (401). Click 'Sync Official RPC' in top network badge to update Rabby/MetaMask.", { id: toastId, duration: 8000 });
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
