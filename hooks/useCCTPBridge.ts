"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWallets } from "@/hooks/useWallets";
import { useSwitchChain, useAccount } from "wagmi";
import {
  createPublicClient,
  http,
  fallback
} from "viem";

import { selectActiveWallet } from "@/lib/tx-helper";
import { EVM_BRIDGE_CHAINS, ACTIVE_NETWORK, ARC_MAINNET_RPC_URLS, ARC_TESTNET_RPC_URLS, getMainnetProxyUrl, getTestnetProxyUrl } from "@/lib/arc-config";
import { wrapEip1193ProviderWithAutoAdd, ensureWalletOnChain } from "@/lib/chain-network-helper";
import { useAuth } from "@/hooks/auth/useAuth";
import { useDeferredWeb3 } from "@/providers/DeferredWeb3Provider";

// Circle CCTP V2 canonical addresses
export const CCTP_TESTNET_MESSENGER = '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA' as const;
export const CCTP_TESTNET_TRANSMITTER = '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275' as const;

export const CCTP_MAINNET_MESSENGER = '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d' as const;
export const CCTP_MAINNET_TRANSMITTER = '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64' as const;

// Iris API URLs
export const IRIS_API_MAINNET_URL = 'https://iris-api.circle.com/v1/attestations';
export const IRIS_API_SANDBOX_URL = 'https://iris-api-sandbox.circle.com/v1/attestations';

export const IRIS_FEE_MAINNET_URL = 'https://iris-api.circle.com/v2/burn/USDC/fees';
export const IRIS_FEE_SANDBOX_URL = 'https://iris-api-sandbox.circle.com/v2/burn/USDC/fees';

// Default values based on active network
export const IRIS_API_URL = ACTIVE_NETWORK === 'mainnet' ? IRIS_API_MAINNET_URL : IRIS_API_SANDBOX_URL;
export const IRIS_FEE_URL = ACTIVE_NETWORK === 'mainnet' ? IRIS_FEE_MAINNET_URL : IRIS_FEE_SANDBOX_URL;

export const CCTP_TOKEN_MESSENGER_V2 = ACTIVE_NETWORK === 'mainnet' ? CCTP_MAINNET_MESSENGER : CCTP_TESTNET_MESSENGER;
export const CCTP_MSG_TRANSMITTER_V2 = ACTIVE_NETWORK === 'mainnet' ? CCTP_MAINNET_TRANSMITTER : CCTP_TESTNET_TRANSMITTER;


export const SOURCE_CHAINS = {
  // Mainnet chains
  ETHEREUM: {
    id: 1,
    name: "Ethereum",
    bridgeKitId: "Ethereum" as const,
    domain: 0,
    usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    tokenMessenger: CCTP_MAINNET_MESSENGER,
    messageTransmitter: CCTP_MAINNET_TRANSMITTER,
    rpcUrls: [
      "https://ethereum.reth.rs/rpc",
      "https://rpc.ankr.com/eth",
      "https://eth.llamarpc.com",
    ],
    icon: "ETH",
    isTestnet: false
  },
  ETH_MAINNET: {
    id: 1,
    name: "Ethereum",
    bridgeKitId: "Ethereum" as const,
    domain: 0,
    usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    tokenMessenger: CCTP_MAINNET_MESSENGER,
    messageTransmitter: CCTP_MAINNET_TRANSMITTER,
    rpcUrls: [
      "https://ethereum.reth.rs/rpc",
      "https://rpc.ankr.com/eth",
      "https://eth.llamarpc.com",
    ],
    icon: "ETH",
    isTestnet: false
  },
  BASE: {
    id: 8453,
    name: "Base",
    bridgeKitId: "Base" as const,
    domain: 6,
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    tokenMessenger: CCTP_MAINNET_MESSENGER,
    messageTransmitter: CCTP_MAINNET_TRANSMITTER,
    rpcUrls: [
      "https://mainnet.base.org",
      "https://base.llamarpc.com",
    ],
    icon: "BASE",
    isTestnet: false
  },
  BASE_MAINNET: {
    id: 8453,
    name: "Base",
    bridgeKitId: "Base" as const,
    domain: 6,
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    tokenMessenger: CCTP_MAINNET_MESSENGER,
    messageTransmitter: CCTP_MAINNET_TRANSMITTER,
    rpcUrls: [
      "https://mainnet.base.org",
      "https://base.llamarpc.com",
    ],
    icon: "BASE",
    isTestnet: false
  },
  AVALANCHE: {
    id: 43114,
    name: "Avalanche",
    bridgeKitId: "Avalanche" as const,
    domain: 1,
    usdcAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    tokenMessenger: CCTP_MAINNET_MESSENGER,
    messageTransmitter: CCTP_MAINNET_TRANSMITTER,
    rpcUrls: [
      "https://api.avax.network/ext/bc/C/rpc",
      "https://avalanche.public-rpc.com",
    ],
    icon: "AVAX",
    isTestnet: false
  },
  AVAX_MAINNET: {
    id: 43114,
    name: "Avalanche",
    bridgeKitId: "Avalanche" as const,
    domain: 1,
    usdcAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    tokenMessenger: CCTP_MAINNET_MESSENGER,
    messageTransmitter: CCTP_MAINNET_TRANSMITTER,
    rpcUrls: [
      "https://api.avax.network/ext/bc/C/rpc",
      "https://avalanche.public-rpc.com",
    ],
    icon: "AVAX",
    isTestnet: false
  },
  SOL_MAINNET: {
    id: 101,
    name: "Solana",
    bridgeKitId: "Solana" as const,
    domain: 5,
    usdcAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    tokenMessenger: "CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe",
    messageTransmitter: "CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC",
    rpcUrls: ["https://api.mainnet-beta.solana.com"],
    icon: "SOL",
    isTestnet: false
  },
  SOLANA: {
    id: 101,
    name: "Solana",
    bridgeKitId: "Solana" as const,
    domain: 5,
    usdcAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    tokenMessenger: "CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe",
    messageTransmitter: "CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC",
    rpcUrls: ["https://api.mainnet-beta.solana.com"],
    icon: "SOL",
    isTestnet: false
  },
  // Testnet chains
  ETH_SEPOLIA: {
    id: 11155111,
    name: "Ethereum Sepolia",
    bridgeKitId: "Ethereum_Sepolia" as const,
    domain: 0,
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    tokenMessenger: CCTP_TESTNET_MESSENGER,
    messageTransmitter: CCTP_TESTNET_TRANSMITTER,
    rpcUrls: [
      "https://rpc.ankr.com/eth_sepolia",
      "https://ethereum-sepolia-rpc.publicnode.com",
      "https://eth-sepolia.public.blastapi.io",
    ],
    icon: "ETH",
    isTestnet: true
  },
  BASE_SEPOLIA: {
    id: 84532,
    name: "Base Sepolia",
    bridgeKitId: "Base_Sepolia" as const,
    domain: 6,
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    tokenMessenger: CCTP_TESTNET_MESSENGER,
    messageTransmitter: CCTP_TESTNET_TRANSMITTER,
    rpcUrls: [
      "https://sepolia.base.org",
      "https://base-sepolia-rpc.publicnode.com",
    ],
    icon: "BASE",
    isTestnet: true
  },
  AVAX_FUJI: {
    id: 43113,
    name: "Avalanche Fuji",
    bridgeKitId: "Avalanche_Fuji" as const,
    domain: 1,
    usdcAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
    tokenMessenger: CCTP_TESTNET_MESSENGER,
    messageTransmitter: CCTP_TESTNET_TRANSMITTER,
    rpcUrls: [
      "https://api.avax-test.network/ext/bc/C/rpc",
      "https://avalanche-fuji-c-chain-rpc.publicnode.com",
    ],
    icon: "AVAX",
    isTestnet: true
  },
  SOL_DEVNET: {
    id: 103,
    name: "Solana Devnet",
    bridgeKitId: "Solana_Devnet" as const,
    domain: 5,
    usdcAddress: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    tokenMessenger: "CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe",
    messageTransmitter: "CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC",
    rpcUrls: ["https://api.devnet.solana.com"],
    icon: "SOL",
    isTestnet: true
  }
} as const;

export const ARC_CHAIN_TESTNET_CONFIG = {
  id: 5042002,
  name: "Arc Testnet",
  bridgeKitId: "Arc_Testnet" as const,
  domain: 26,
  usdcAddress: "0x3600000000000000000000000000000000000000" as `0x${string}`,
  tokenMessenger: CCTP_TESTNET_MESSENGER,
  messageTransmitter: CCTP_TESTNET_TRANSMITTER,
  rpcUrl: getTestnetProxyUrl(),
  rpcUrls: ARC_TESTNET_RPC_URLS,
  icon: "ARC",
  isTestnet: true,
  blockExplorerUrl: "https://testnet.arcscan.app"
} as const;

export const ARC_CHAIN_MAINNET_CONFIG = {
  id: 5042,
  name: "Arc",
  bridgeKitId: "Arc" as const,
  domain: 26,
  usdcAddress: "0x3600000000000000000000000000000000000000" as `0x${string}`,
  tokenMessenger: CCTP_MAINNET_MESSENGER,
  messageTransmitter: CCTP_MAINNET_TRANSMITTER,
  rpcUrl: getMainnetProxyUrl(),
  rpcUrls: ARC_MAINNET_RPC_URLS,
  icon: "ARC",
  isTestnet: false,
  blockExplorerUrl: "https://explorer.arc.io"
} as const;

export function getArcChainConfig(isTestnet: boolean) {
  return isTestnet ? ARC_CHAIN_TESTNET_CONFIG : ARC_CHAIN_MAINNET_CONFIG;
}

export const ARC_CHAIN_CONFIG = new Proxy({} as typeof ARC_CHAIN_MAINNET_CONFIG, {
  get(_target, prop) {
    const config = ACTIVE_NETWORK === 'mainnet' ? ARC_CHAIN_MAINNET_CONFIG : ARC_CHAIN_TESTNET_CONFIG;
    return (config as any)[prop];
  }
});


// ============================================================
// Types
// ============================================================
export type BridgeStatus =
  | "idle"
  | "approving"
  | "burning"
  | "waiting-attestation"
  | "minting"
  | "success"
  | "error";

export interface BridgeState {
  status: BridgeStatus;
  elapsedSeconds: number;
  errorMessage: string;
  txHash: string;
  burnTxHash?: string;
  /** Percentage progress 0-100 for smooth progress bar */
  progress: number;
  /** Human-readable detail message for current step */
  stepDetail: string;
}

const INITIAL_STATE: BridgeState = {
  status: "idle",
  elapsedSeconds: 0,
  errorMessage: "",
  txHash: "",
  burnTxHash: "",
  progress: 0,
  stepDetail: ""
};




// Check if an address has enough native USDC on Arc to pay for minting gas
export async function checkArcGasBalance(
  address: string,
  isTestnet: boolean
): Promise<{ hasEnoughGas: boolean; balanceWei: bigint; balanceFormatted: string }> {
  try {
    const rpcUrls = isTestnet ? ARC_TESTNET_RPC_URLS : ARC_MAINNET_RPC_URLS;
    const client = createPublicClient({
      transport: fallback(rpcUrls.map(u => http(u, { timeout: 10_000, retryCount: 2 })))
    });
    const balanceWei = await client.getBalance({ address: address as `0x${string}` });
    // Require at least 0.01 USDC (10^16 wei on Arc where native token has 18 decimals)
    const MIN_GAS_WEI = 10_000_000_000_000_000n; // 0.01 USDC
    const balanceFormatted = (Number(balanceWei) / 1e18).toFixed(4);
    return {
      hasEnoughGas: balanceWei >= MIN_GAS_WEI,
      balanceWei,
      balanceFormatted
    };
  } catch (err) {
    console.warn("[CCTP] Failed to check Arc gas balance:", err);
    return { hasEnoughGas: true, balanceWei: 0n, balanceFormatted: "0.00" };
  }
}

// ============================================================
// Hook
// ============================================================
export function useCCTPBridge() {
  const deferred = useDeferredWeb3();

  if (deferred && !deferred.isMounted) {
    return {
      state: INITIAL_STATE,
      bridgeUSDC: async () => {},
      resetState: () => {},
    };
  }

  return useActiveCCTPBridge();
}

function useActiveCCTPBridge() {
  const { walletAddress } = useAuth();
  const { connector } = useAccount();
  const { wallets } = useWallets();
  const switchChainResult = useSwitchChain();
  const switchChainAsync = switchChainResult?.switchChainAsync;

  const [state, setState] = useState<BridgeState>(INITIAL_STATE);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const resetState = useCallback(() => {
    setState(INITIAL_STATE);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // -------------------------------------------------------
  // Try to use Circle Bridge Kit for fast/reliable bridging
  // Falls back to manual CCTP if Kit is unavailable
  // -------------------------------------------------------
  const bridgeUSDC = async (
    sourceKey: keyof typeof SOURCE_CHAINS,
    amountString: string,
    direction: "in" | "out" = "in"
  ) => {
    const chainConfig = SOURCE_CHAINS[sourceKey];
    const isTestnetRoute = Boolean((chainConfig as any).isTestnet);
    const arcConfig = getArcChainConfig(isTestnetRoute);
    const irisApiUrl = isTestnetRoute ? IRIS_API_SANDBOX_URL : IRIS_API_MAINNET_URL;
    const irisFeeUrl = isTestnetRoute ? IRIS_FEE_SANDBOX_URL : IRIS_FEE_MAINNET_URL;

    // Solana / Circle-wallet mock bridge simulation
    const isCircleConnected =
      typeof window !== "undefined" &&
      localStorage.getItem("synarc_circle_connected") === "true";

    if (isCircleConnected || chainConfig.id === 103) {
      await executeSolanaMockBridge(chainConfig.name, arcConfig.name, amountString);
      return;
    }

    const activeWallet = selectActiveWallet(wallets, walletAddress);
    if (!activeWallet?.address) {
      setState(prev => ({
        ...prev,
        status: "error",
        errorMessage: "Please connect your wallet to bridge USDC."
      }));
      return;
    }

    const amount = parseFloat(amountString);
    if (isNaN(amount) || amount <= 0) {
      setState(prev => ({
        ...prev,
        status: "error",
        errorMessage: "Invalid transfer amount."
      }));
      return;
    }

    // Pre-flight check: Arc uses USDC as its native gas token (18 decimals).
    if (direction === "in") {
      const gasCheck = await checkArcGasBalance(activeWallet.address, isTestnetRoute);
      if (!gasCheck.hasEnoughGas) {
        console.warn(`[CCTP] Destination wallet has ${gasCheck.balanceFormatted} USDC on ${arcConfig.name}. Proceeding with bridge.`);
      }
    }

    // Try Circle Bridge Kit first (primary path)
    try {
      await bridgeWithKit(
        activeWallet,
        chainConfig,
        arcConfig,
        amountString,
        direction
      );
      return;
    } catch (kitErr: any) {
      console.warn("[CCTP] Bridge Kit failed:", kitErr?.message);
      const errMsg = (kitErr?.message || "").toLowerCase();
      // If user rejected in wallet, abort without retrying in manual flow
      if (
        errMsg.includes("user rejected") ||
        errMsg.includes("user denied") ||
        errMsg.includes("user_rejected") ||
        errMsg.includes("cancelled") ||
        errMsg.includes("rejected the request") ||
        kitErr?.code === 4001
      ) {
        setState(prev => ({
          ...prev,
          status: "error",
          errorMessage: "Transaction rejected by user."
        }));
        return;
      }
      if (errMsg.includes("insufficient") && (errMsg.includes("gas") || errMsg.includes("funds"))) {
        setState(prev => ({
          ...prev,
          status: "error",
          errorMessage: kitErr.message || "Insufficient funds for transaction gas."
        }));
        return;
      }
      setState(prev => ({
        ...prev,
        status: "error",
        errorMessage: kitErr?.message || "Bridge transfer failed. Please try again."
      }));
    }
  };

  // -------------------------------------------------------
  // Fast Path: Circle Bridge Kit (adapter-viem-v2)
  // -------------------------------------------------------
  const bridgeWithKit = async (
    activeWallet: any,
    chainConfig: (typeof SOURCE_CHAINS)[keyof typeof SOURCE_CHAINS],
    arcConfig: typeof ARC_CHAIN_MAINNET_CONFIG | typeof ARC_CHAIN_TESTNET_CONFIG,
    amountString: string,
    direction: "in" | "out"
  ) => {
    // Dynamic import to avoid SSR issues and gracefully handle missing package
    let BridgeKit: any, createViemAdapterFromProvider: any;
    try {
      const kitModule = await import("@circle-fin/bridge-kit");
      BridgeKit = kitModule.BridgeKit;
    } catch (e) {
      throw new Error("Bridge Kit not installed");
    }
    try {
      const adapterModule = await import("@circle-fin/adapter-viem-v2");
      createViemAdapterFromProvider = adapterModule.createViemAdapterFromProvider;
    } catch (e) {
      throw new Error("adapter-viem-v2 not installed");
    }

    const rawProvider = await (
      connector?.getProvider?.() ||
      activeWallet.getEthereumProvider?.() ||
      (activeWallet as any).getProvider?.() ||
      (activeWallet as any).getEip1193Provider?.() ||
      (typeof window !== "undefined" ? (window as any).ethereum : null)
    );

    if (!rawProvider) throw new Error("Could not get EIP-1193 provider from wallet");
    const provider = wrapEip1193ProviderWithAutoAdd(rawProvider);

    // Build adapter from the connected browser wallet with auto-chain addition and CORS-free RPCs
    const adapter = await createViemAdapterFromProvider({
      provider,
      capabilities: { addressContext: "user-controlled" },
      getPublicClient: ({ chain }: { chain: any }) => {
        const chainId = chain?.id;
        if (chainId === 5042) {
          return createPublicClient({
            chain,
            transport: fallback(ARC_MAINNET_RPC_URLS.map(u => http(u, { timeout: 10_000, retryCount: 2 })))
          });
        }
        if (chainId === 5042002) {
          return createPublicClient({
            chain,
            transport: fallback(ARC_TESTNET_RPC_URLS.map(u => http(u, { timeout: 10_000, retryCount: 2 })))
          });
        }
        return createPublicClient({ chain, transport: http() });
      }
    });

    const kit = new BridgeKit();

    const fromChainId = direction === "in" ? chainConfig.bridgeKitId : arcConfig.bridgeKitId;
    const toChainId   = direction === "in" ? arcConfig.bridgeKitId : chainConfig.bridgeKitId;

    // Wire up Kit events → bridge state
    setState({ ...INITIAL_STATE, status: "approving", progress: 5, stepDetail: "Requesting USDC approval…" });

    kit.on("approve", (event: any) => {
      console.log("[Kit] approve event:", event);
      setState(prev => ({
        ...prev,
        status: "approving",
        progress: 20,
        stepDetail: `Approval confirmed: ${(event.values?.txHash || "").slice(0, 10)}…`
      }));
    });

    kit.on("burn", (event: any) => {
      console.log("[Kit] burn event:", event);
      setState(prev => ({
        ...prev,
        status: "burning",
        progress: 40,
        burnTxHash: event.values?.txHash || prev.burnTxHash,
        stepDetail: `Burn confirmed on ${chainConfig.name}`
      }));
    });

    kit.on("fetchAttestation", (event: any) => {
      console.log("[Kit] fetchAttestation event:", event);
      setState(prev => ({
        ...prev,
        status: "waiting-attestation",
        progress: 65,
        stepDetail: `Circle attestation received — switching to ${arcConfig.name}…`
      }));
      // Stop elapsed timer since we have the attestation
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    });

    kit.on("mint", (event: any) => {
      console.log("[Kit] mint event:", event);
      setState(prev => ({
        ...prev,
        status: "minting",
        progress: 85,
        stepDetail: `Minting USDC on ${arcConfig.name}…`
      }));
    });

    // Start elapsed timer during attestation phase
    setState(prev => ({ ...prev, status: "burning", progress: 25, stepDetail: "Broadcasting burn transaction…" }));

    // Switch to correct source chain before Kit executes
    await switchToChain(activeWallet, direction === "in" ? chainConfig : arcConfig, switchChainAsync);

    // Start attestation elapsed timer
    timerRef.current = setInterval(() => {
      setState(prev => {
        if (prev.status === "waiting-attestation") {
          return { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
        }
        return prev;
      });
    }, 1000);

    // Execute bridge via Kit
    const result = await kit.bridge({
      from: { adapter, chain: fromChainId },
      to:   { adapter, chain: toChainId },
      amount: amountString,
      config: { transferSpeed: "FAST" }
    });

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const mintStep = result?.steps?.find((s: any) => s.name === "mint");
    const burnStep = result?.steps?.find((s: any) => s.name === "burn" || s.name === "depositForBurn");
    const destChainName = direction === "in" ? arcConfig.name : chainConfig.name;

    setState(prev => ({
      ...prev,
      status: "success",
      progress: 100,
      txHash: mintStep?.txHash || prev.txHash,
      burnTxHash: burnStep?.txHash || prev.burnTxHash,
      stepDetail: `Bridge complete! Funds arrived on ${destChainName}.`
    }));

    console.log("[Kit] Bridge complete:", result);
  };




  // -------------------------------------------------------
  // Mock Solana / Circle wallet bridge simulation
  // -------------------------------------------------------
  const executeSolanaMockBridge = async (chainName: string, arcName: string, amountString: string) => {
    try {
      setState({ ...INITIAL_STATE, status: "approving", progress: 5, stepDetail: "Connecting to Circle bridge…" });
      await new Promise(r => setTimeout(r, 1800));

      setState(prev => ({ ...prev, status: "burning", progress: 30, stepDetail: `Burning USDC on ${chainName}…` }));
      await new Promise(r => setTimeout(r, 2200));

      setState(prev => ({
        ...prev,
        status: "waiting-attestation",
        progress: 55,
        elapsedSeconds: 0,
        stepDetail: "Waiting for Circle attestation…"
      }));

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
          progress: Math.min(75, 55 + prev.elapsedSeconds * 2)
        }));
      }, 1000);

      await new Promise(r => setTimeout(r, 4000));

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setState(prev => ({ ...prev, status: "minting", progress: 85, stepDetail: `Minting USDC on ${arcName}…` }));
      await new Promise(r => setTimeout(r, 2000));

      const mockHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setState(prev => ({
        ...prev,
        status: "success",
        progress: 100,
        txHash: mockHash,
        stepDetail: "Bridge simulation complete!"
      }));
    } catch (err: any) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setState(prev => ({
        ...prev,
        status: "error",
        progress: 0,
        errorMessage: "Bridge simulation encountered an error."
      }));
    }
  };

  return { state, bridgeUSDC, resetState };
}

// ============================================================
// Helper: Switch wallet to target chain, adding Arc if needed
// ============================================================
async function switchToChain(
  activeWallet: any,
  chainConfig: { id: number; name: string; rpcUrl?: string; rpcUrls?: readonly string[] | string[] },
  switchChainAsync: any
) {
  try {
    const currentChainId = parseInt(
      (activeWallet.chainId || "eip155:0").replace("eip155:", "")
    );
    if (currentChainId === chainConfig.id) return;

    // 1. Try direct provider switch with auto-add (most reliable for injected/embedded wallets)
    const provider = await (
      activeWallet.getEthereumProvider?.() ||
      (activeWallet as any).getEip1193Provider?.() ||
      (activeWallet as any).getProvider?.() ||
      (typeof window !== "undefined" ? (window as any).ethereum : null)
    );

    if (provider && provider.request) {
      console.log(`[CCTP Bridge] Direct switching to chain ${chainConfig.id} on provider with auto-add...`);
      await ensureWalletOnChain(provider, chainConfig.id);
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }

    // 2. Fallback to wagmi hook/privy switch
    if (switchChainAsync) {
      await switchChainAsync({ chainId: chainConfig.id });
    } else if (activeWallet.switchChain) {
      await activeWallet.switchChain(chainConfig.id);
    }
  } catch (err: any) {
    throw new Error(
      `Failed to switch to ${chainConfig.name}: ${err?.message || err}`
    );
  }
}
