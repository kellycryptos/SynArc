"use client";

import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useWallets } from "@/hooks/useWallets";
import { useSwitchChain, useAccount, WagmiContext } from "wagmi";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  fallback,
  parseUnits,
  decodeEventLog,
  keccak256
} from "viem";

import { selectActiveWallet } from "@/lib/tx-helper";
import { EVM_BRIDGE_CHAINS, ACTIVE_NETWORK, ARC_MAINNET_RPC_URLS, ARC_TESTNET_RPC_URLS, getMainnetProxyUrl, getTestnetProxyUrl } from "@/lib/arc-config";
import { wrapEip1193ProviderWithAutoAdd, ensureWalletOnChain } from "@/lib/chain-network-helper";
import { useAuth } from "@/hooks/auth/useAuth";
import { useDeferredWeb3 } from "@/providers/DeferredWeb3Provider";
import { isOKXWallet, sanitizeAdapterSignatures, ERC20_ALLOWANCE_ABI, CCTP_TOKEN_MESSENGER_ABI, CCTP_MESSAGE_TRANSMITTER_ABI } from "@/lib/eip712-helper";

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
    eurcAddress: "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c",
    tokenMessenger: CCTP_MAINNET_MESSENGER,
    messageTransmitter: CCTP_MAINNET_TRANSMITTER,
    rpcUrls: [
      "https://ethereum-rpc.publicnode.com",
      "https://eth.drpc.org",
      "https://1rpc.io/eth",
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
    eurcAddress: "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c",
    tokenMessenger: CCTP_MAINNET_MESSENGER,
    messageTransmitter: CCTP_MAINNET_TRANSMITTER,
    rpcUrls: [
      "https://ethereum-rpc.publicnode.com",
      "https://eth.drpc.org",
      "https://1rpc.io/eth",
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
    eurcAddress: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
    tokenMessenger: CCTP_MAINNET_MESSENGER,
    messageTransmitter: CCTP_MAINNET_TRANSMITTER,
    rpcUrls: [
      "https://mainnet.base.org",
      "https://base-rpc.publicnode.com",
      "https://1rpc.io/base",
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
    eurcAddress: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
    tokenMessenger: CCTP_MAINNET_MESSENGER,
    messageTransmitter: CCTP_MAINNET_TRANSMITTER,
    rpcUrls: [
      "https://mainnet.base.org",
      "https://base-rpc.publicnode.com",
      "https://1rpc.io/base",
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
    eurcAddress: "0xC891EB4cbdEFf6e073e859e987815Ed1505c2ACD",
    tokenMessenger: CCTP_MAINNET_MESSENGER,
    messageTransmitter: CCTP_MAINNET_TRANSMITTER,
    rpcUrls: [
      "https://api.avax.network/ext/bc/C/rpc",
      "https://avalanche-c-chain-rpc.publicnode.com",
      "https://1rpc.io/avax/c",
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
    eurcAddress: "0xC891EB4cbdEFf6e073e859e987815Ed1505c2ACD",
    tokenMessenger: CCTP_MAINNET_MESSENGER,
    messageTransmitter: CCTP_MAINNET_TRANSMITTER,
    rpcUrls: [
      "https://api.avax.network/ext/bc/C/rpc",
      "https://avalanche-c-chain-rpc.publicnode.com",
      "https://1rpc.io/avax/c",
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
    eurcAddress: "HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr",
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
    eurcAddress: "HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr",
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
    eurcAddress: "0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4",
    tokenMessenger: CCTP_TESTNET_MESSENGER,
    messageTransmitter: CCTP_TESTNET_TRANSMITTER,
    rpcUrls: [
      "https://ethereum-sepolia-rpc.publicnode.com",
      "https://sepolia.drpc.org",
      "https://1rpc.io/sepolia",
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
    eurcAddress: "0x808456652fdb597867f38412077A9182bf77359F",
    tokenMessenger: CCTP_TESTNET_MESSENGER,
    messageTransmitter: CCTP_TESTNET_TRANSMITTER,
    rpcUrls: [
      "https://base-sepolia.drpc.org",
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
    eurcAddress: "0x5E44db7996c682E92a960b65AC713a54AD815c6B",
    tokenMessenger: CCTP_TESTNET_MESSENGER,
    messageTransmitter: CCTP_TESTNET_TRANSMITTER,
    rpcUrls: [
      "https://api.avax-test.network/ext/bc/C/rpc",
      "https://avalanche-fuji-c-chain-rpc.publicnode.com",
    ],
    icon: "AVAX",
    isTestnet: true
  }
} as const;

export const ARC_CHAIN_TESTNET_CONFIG = {
  id: 5042002,
  name: "Arc Testnet",
  bridgeKitId: "Arc_Testnet" as const,
  domain: 26,
  usdcAddress: "0x3600000000000000000000000000000000000000" as `0x${string}`,
  eurcAddress: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a" as `0x${string}`,
  tokenMessenger: CCTP_TESTNET_MESSENGER,
  messageTransmitter: CCTP_TESTNET_TRANSMITTER,
  rpcUrl: getTestnetProxyUrl(),
  rpcUrls: ARC_TESTNET_RPC_URLS,
  icon: "ARC",
  isTestnet: true,
  blockExplorerUrl: "https://explorer.testnet.arc.io"
} as const;

export const ARC_CHAIN_MAINNET_CONFIG = {
  id: 5042,
  name: "Arc",
  bridgeKitId: "Arc" as const,
  domain: 26,
  usdcAddress: "0x3600000000000000000000000000000000000000" as `0x${string}`,
  eurcAddress: "0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1" as `0x${string}`,
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
  const wagmiContext = useContext(WagmiContext);

  if (!deferred?.isMounted || !wagmiContext) {
    return {
      state: INITIAL_STATE,
      bridgeUSDC: async () => {},
      bridgeToken: async () => {},
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
  // Supports both USDC and EURC across Mainnet and Testnet
  // -------------------------------------------------------
  const bridgeToken = async (
    sourceKey: keyof typeof SOURCE_CHAINS,
    amountString: string,
    direction: "in" | "out" = "in",
    tokenSymbol: "USDC" | "EURC" = "USDC"
  ) => {
    const chainConfig = SOURCE_CHAINS[sourceKey];
    const isTestnetRoute = Boolean((chainConfig as any).isTestnet);
    const arcConfig = getArcChainConfig(isTestnetRoute);
    const irisApiUrl = isTestnetRoute ? IRIS_API_SANDBOX_URL : IRIS_API_MAINNET_URL;
    const irisFeeUrl = isTestnetRoute ? IRIS_FEE_SANDBOX_URL : IRIS_FEE_MAINNET_URL;

    // Solana CCTP bridging notice
    if ((chainConfig as any).id === 103 || (chainConfig as any).id === 101) {
      setState(prev => ({
        ...prev,
        status: "error",
        errorMessage: "Solana CCTP bridging requires a connected Solana wallet (Phantom or Solflare). Please select Ethereum, Base, or Avalanche for EVM bridging."
      }));
      return;
    }

    const activeWallet = selectActiveWallet(wallets, walletAddress);
    if (!activeWallet?.address) {
      setState(prev => ({
        ...prev,
        status: "error",
        errorMessage: `Please connect your wallet to bridge ${tokenSymbol}.`
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
        direction,
        tokenSymbol
      );
      return;
    } catch (kitErr: any) {
      console.warn("[CCTP] Bridge Kit failed, checking on-chain fallback:", kitErr?.message);
      const errMsg = (kitErr?.message || "").toLowerCase();
      // If user manually rejected in wallet (and NOT due to OKX signature risk warning), abort
      if (
        (errMsg.includes("user rejected") ||
         errMsg.includes("user denied") ||
         errMsg.includes("rejected the request") ||
         kitErr?.code === 4001) &&
        !errMsg.includes("risky") &&
        !errMsg.includes("signature type")
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

      // If OKX or wallet flagged signature as risky, or if BridgeKit encountered any error:
      // Fall back to standard canonical on-chain CCTP (ERC-20 approve + depositForBurn)
      try {
        console.log("[CCTP] Falling back to standard on-chain CCTP transfer...");
        await bridgeManualOnChain(
          activeWallet,
          chainConfig,
          arcConfig,
          amountString,
          direction,
          tokenSymbol
        );
        return;
      } catch (manualErr: any) {
        console.error("[CCTP] Standard on-chain CCTP fallback error:", manualErr);
        const manualErrMsg = (manualErr?.message || "").toLowerCase();
        if (
          manualErrMsg.includes("user rejected") ||
          manualErrMsg.includes("user denied") ||
          manualErrMsg.includes("cancelled") ||
          manualErr?.code === 4001
        ) {
          setState(prev => ({
            ...prev,
            status: "error",
            errorMessage: "Transaction rejected by user."
          }));
          return;
        }
        setState(prev => ({
          ...prev,
          status: "error",
          errorMessage: manualErr?.message || "Bridge transfer failed. Please try again."
        }));
      }
    }
  };

  // -------------------------------------------------------
  // Path A: Circle Bridge Kit with EIP-712 Sanitization
  // Uses TransferSpeed.SLOW for OKX wallet to ensure standard on-chain approve + burn
  // -------------------------------------------------------
  const bridgeWithKit = async (
    activeWallet: any,
    chainConfig: (typeof SOURCE_CHAINS)[keyof typeof SOURCE_CHAINS],
    arcConfig: typeof ARC_CHAIN_MAINNET_CONFIG | typeof ARC_CHAIN_TESTNET_CONFIG,
    amountString: string,
    direction: "in" | "out",
    tokenSymbol: "USDC" | "EURC" = "USDC"
  ) => {
    const isTestnetRoute = Boolean((chainConfig as any).isTestnet || (arcConfig as any).isTestnet);
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
      (typeof window !== "undefined" ? (window as any).okxwallet || (window as any).ethereum : null)
    );

    if (!rawProvider) throw new Error("Could not get EIP-1193 provider from wallet");
    const provider = wrapEip1193ProviderWithAutoAdd(rawProvider);
    const isOKX = isOKXWallet(rawProvider, connector);

    // Build adapter from the connected browser wallet with auto-chain addition and CORS-free RPCs
    const baseAdapter = await createViemAdapterFromProvider({
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

    // Sanitize any EIP-712 typed data signatures so OKX risk detector is not triggered
    const adapter = sanitizeAdapterSignatures(baseAdapter, rawProvider);

    const kit = new BridgeKit();

    const fromChainId = direction === "in" ? chainConfig.bridgeKitId : arcConfig.bridgeKitId;
    const toChainId   = direction === "in" ? arcConfig.bridgeKitId : chainConfig.bridgeKitId;

    // Wire up Kit events → bridge state
    setState({ ...INITIAL_STATE, status: "approving", progress: 5, stepDetail: `Requesting ${tokenSymbol} approval…` });

    kit.on("approve", (event: any) => {
      console.log("[Kit] approve event:", event);
      setState(prev => ({
        ...prev,
        status: "approving",
        progress: 20,
        stepDetail: `Approval confirmed: ${(event.values?.txHash || "").slice(0, 10)}…`
      }));
    });

    const sourceChainName = direction === "in" ? chainConfig.name : arcConfig.name;
    const destChainName   = direction === "in" ? arcConfig.name : chainConfig.name;

    let capturedBurnTxHash = "";
    kit.on("burn", (event: any) => {
      console.log("[Kit] burn event:", event);
      capturedBurnTxHash = event.values?.txHash || capturedBurnTxHash;
      setState(prev => ({
        ...prev,
        status: "burning",
        progress: 40,
        burnTxHash: capturedBurnTxHash || prev.burnTxHash,
        stepDetail: `Burn confirmed on ${sourceChainName}`
      }));
    });

    kit.on("fetchAttestation", (event: any) => {
      console.log("[Kit] fetchAttestation event:", event);
      setState(prev => ({
        ...prev,
        status: "waiting-attestation",
        progress: 65,
        stepDetail: `Circle attestation received — preparing mint on ${destChainName}…`
      }));
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
        stepDetail: `Minting ${tokenSymbol} on ${destChainName}…`
      }));
    });

    // Start elapsed timer during attestation phase
    setState(prev => ({ ...prev, status: "burning", progress: 25, stepDetail: `Broadcasting burn transaction on ${sourceChainName}…` }));

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

    // For OKX Web3 wallet, use canonical SLOW transfer speed (standard on-chain CCTP approve + depositForBurn)
    // to avoid triggering OKX's "risky signature type" risk detection on off-chain Gateway burn intents
    const transferSpeed = isOKX ? "SLOW" : "FAST";

    const result = await kit.bridge({
      from: { adapter, chain: fromChainId },
      to:   { adapter, chain: toChainId },
      amount: amountString,
      token: tokenSymbol,
      config: { transferSpeed }
    });

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const mintStep = result?.steps?.find((s: any) => s.name === "mint");
    const burnStep = result?.steps?.find((s: any) => s.name === "burn" || s.name === "depositForBurn");
    let finalMintTxHash = mintStep?.txHash;
    const finalBurnTxHash = burnStep?.txHash || capturedBurnTxHash;

    // If BridgeKit did not execute destination mint, complete it or mark as pending claim
    if (!finalMintTxHash && finalBurnTxHash) {
      console.log(`[Kit] Burn confirmed (${finalBurnTxHash}), checking destination mint on ${destChainName}...`);
      setState(prev => ({
        ...prev,
        status: "waiting-attestation",
        burnTxHash: finalBurnTxHash,
        progress: 60,
        stepDetail: `Fetching Circle attestation for ${destChainName} mint…`
      }));

      try {
        const sourceDomain = direction === "in" ? chainConfig.domain : arcConfig.domain;
        const irisBase = isTestnetRoute ? IRIS_API_SANDBOX_URL : IRIS_API_MAINNET_URL;

        let attestationMsg: any = null;
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 4000));
          try {
            const res = await fetch(`${irisBase}/v2/messages/${sourceDomain}?transactionHash=${finalBurnTxHash}`);
            if (res.ok) {
              const data = await res.json();
              const m = data.messages?.[0];
              if (m && m.status === "complete" && m.attestation && m.message) {
                attestationMsg = m;
                break;
              }
            }
          } catch (pollErr) {
            console.warn("[Kit Mint] Polling attestation error:", pollErr);
          }
        }

        if (attestationMsg) {
          setState(prev => ({
            ...prev,
            status: "minting",
            progress: 80,
            stepDetail: `Switching to ${destChainName} to claim ${tokenSymbol}…`
          }));

          const destChain = direction === "in" ? arcConfig : chainConfig;
          await switchToChain(activeWallet, destChain, switchChainAsync);

          setState(prev => ({
            ...prev,
            status: "minting",
            progress: 90,
            stepDetail: `Please confirm mint transaction on ${destChainName}…`
          }));

          const destViemChain = EVM_BRIDGE_CHAINS[destChain.id];
          const userAddress = (activeWallet.address || (await provider.request({ method: 'eth_accounts' }))?.[0]) as `0x${string}`;
          const destWalletClient = createWalletClient({
            account: userAddress,
            chain: destViemChain,
            transport: custom(provider)
          });

          const destTransmitter = (destChain.messageTransmitter || (destChain as any).transmitter || CCTP_MSG_TRANSMITTER_V2) as `0x${string}`;

          const mintTx = await destWalletClient.writeContract({
            address: destTransmitter,
            abi: CCTP_MESSAGE_TRANSMITTER_ABI,
            functionName: "receiveMessage",
            args: [attestationMsg.message as `0x${string}`, attestationMsg.attestation as `0x${string}`],
            chain: destViemChain
          });

          const destRpcUrls = (destChain as any).rpcUrls || [(destChain as any).rpcUrl];
          const destPublicClient = createPublicClient({
            transport: fallback(destRpcUrls.map((u: string) => http(u, { timeout: 10_000, retryCount: 2 })))
          });

          await destPublicClient.waitForTransactionReceipt({ hash: mintTx });
          finalMintTxHash = mintTx;
        }
      } catch (autoMintErr: any) {
        console.warn("[Kit Mint] Auto-mint deferred or rejected:", autoMintErr);
      }
    }

    if (finalMintTxHash) {
      setState(prev => ({
        ...prev,
        status: "success",
        progress: 100,
        txHash: finalMintTxHash,
        burnTxHash: finalBurnTxHash,
        stepDetail: `Bridge complete! ${tokenSymbol} arrived on ${destChainName}.`
      }));
    } else {
      // If mint was not confirmed yet, do NOT falsely report success.
      // Leave in pending claim state so the user can claim with 1 click via the Claim button!
      setState(prev => ({
        ...prev,
        status: "idle",
        progress: 50,
        txHash: "",
        burnTxHash: finalBurnTxHash,
        stepDetail: `Burn confirmed on ${sourceChainName}! Ready to claim on ${destChainName}.`
      }));
    }

    console.log("[Kit] Bridge complete:", result);
  };

  // -------------------------------------------------------
  // Path B: Direct Standard On-Chain CCTP (Zero Off-Chain Permits)
  // 100% on-chain standard ERC-20 approve + depositForBurn + Iris attestation + receiveMessage
  // Immune to OKX "risky signature type" warnings.
  // -------------------------------------------------------
  const bridgeManualOnChain = async (
    activeWallet: any,
    chainConfig: (typeof SOURCE_CHAINS)[keyof typeof SOURCE_CHAINS],
    arcConfig: typeof ARC_CHAIN_MAINNET_CONFIG | typeof ARC_CHAIN_TESTNET_CONFIG,
    amountString: string,
    direction: "in" | "out",
    tokenSymbol: "USDC" | "EURC" = "USDC"
  ) => {
    const rawProvider = await (
      connector?.getProvider?.() ||
      activeWallet.getEthereumProvider?.() ||
      (activeWallet as any).getProvider?.() ||
      (activeWallet as any).getEip1193Provider?.() ||
      (typeof window !== "undefined" ? (window as any).okxwallet || (window as any).ethereum : null)
    );
    if (!rawProvider) throw new Error("Could not get EIP-1193 provider from wallet");
    const provider = wrapEip1193ProviderWithAutoAdd(rawProvider);

    const isTestnetRoute = Boolean((chainConfig as any).isTestnet);
    const sourceChain = direction === "in" ? chainConfig : arcConfig;
    const destChain   = direction === "in" ? arcConfig : chainConfig;
    const sourceChainName = sourceChain.name;
    const destChainName   = destChain.name;

    const sourceTokenMessenger = sourceChain.tokenMessenger as `0x${string}`;
    const destTransmitter = destChain.messageTransmitter as `0x${string}`;
    const sourceTokenAddress = (tokenSymbol === "EURC" ? (sourceChain as any).eurcAddress : sourceChain.usdcAddress) as `0x${string}`;
    const destinationDomain = destChain.domain;

    const irisApiUrl = isTestnetRoute ? IRIS_API_SANDBOX_URL : IRIS_API_MAINNET_URL;

    const sourceRpcUrls = (sourceChain as any).rpcUrls || [(sourceChain as any).rpcUrl];
    const destRpcUrls   = (destChain as any).rpcUrls || [(destChain as any).rpcUrl];

    const sourcePublicClient = createPublicClient({
      transport: fallback(sourceRpcUrls.map((u: string) => http(u, { timeout: 10_000, retryCount: 2 }))),
    });

    const destPublicClient = createPublicClient({
      transport: fallback(destRpcUrls.map((u: string) => http(u, { timeout: 10_000, retryCount: 2 }))),
    });

    const userAddress = (activeWallet.address || (await provider.request({ method: 'eth_accounts' }))?.[0]) as `0x${string}`;
    const amountRaw = parseUnits(amountString, 6);

    // 1. Switch to source chain
    setState({ ...INITIAL_STATE, status: "approving", progress: 5, stepDetail: `Switching to ${sourceChainName}…` });
    await switchToChain(activeWallet, sourceChain, switchChainAsync);

    // 2. Check and approve allowance
    setState(prev => ({
      ...prev,
      status: "approving",
      progress: 10,
      stepDetail: `Checking ${tokenSymbol} allowance on ${sourceChainName}…`,
    }));

    const allowance = await sourcePublicClient.readContract({
      address: sourceTokenAddress,
      abi: ERC20_ALLOWANCE_ABI,
      functionName: "allowance",
      args: [userAddress, sourceTokenMessenger],
    });

    const sourceViemChain = EVM_BRIDGE_CHAINS[sourceChain.id];
    const walletClient = createWalletClient({
      account: userAddress,
      chain: sourceViemChain,
      transport: custom(provider),
    });

    if (allowance < amountRaw) {
      setState(prev => ({
        ...prev,
        status: "approving",
        progress: 15,
        stepDetail: `Please approve ${amountString} ${tokenSymbol} in your wallet…`,
      }));

      const approveTx = await walletClient.writeContract({
        address: sourceTokenAddress,
        abi: ERC20_ALLOWANCE_ABI,
        functionName: "approve",
        args: [sourceTokenMessenger, amountRaw],
        chain: sourceViemChain,
      });

      setState(prev => ({
        ...prev,
        status: "approving",
        progress: 25,
        stepDetail: `Confirming approval: ${approveTx.slice(0, 10)}…`,
      }));

      await sourcePublicClient.waitForTransactionReceipt({ hash: approveTx });
    }

    // 3. Deposit for burn
    setState(prev => ({
      ...prev,
      status: "burning",
      progress: 35,
      stepDetail: `Please confirm burn transaction on ${sourceChainName}…`,
    }));

    const mintRecipient = `0x000000000000000000000000${userAddress.slice(2)}` as `0x${string}`;
    const zeroBytes32 = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

    let burnTx: `0x${string}`;
    try {
      burnTx = await walletClient.writeContract({
        address: sourceTokenMessenger,
        abi: CCTP_TOKEN_MESSENGER_ABI,
        functionName: "depositForBurn",
        args: [amountRaw, destinationDomain, mintRecipient, sourceTokenAddress, zeroBytes32, 0n, 0],
        chain: sourceViemChain,
      });
    } catch {
      // Fallback for 4-param CCTP v1
      burnTx = await walletClient.writeContract({
        address: sourceTokenMessenger,
        abi: CCTP_TOKEN_MESSENGER_ABI,
        functionName: "depositForBurn",
        args: [amountRaw, destinationDomain, mintRecipient, sourceTokenAddress],
        chain: sourceViemChain,
      });
    }

    setState(prev => ({
      ...prev,
      status: "burning",
      progress: 45,
      burnTxHash: burnTx,
      stepDetail: `Burn broadcasted! Waiting for confirmation on ${sourceChainName}…`,
    }));

    const burnReceipt = await sourcePublicClient.waitForTransactionReceipt({ hash: burnTx });

    // 4. Extract messageBytes from MessageSent event
    let messageBytes: `0x${string}` | null = null;
    const MESSAGE_SENT_TOPIC = "0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036";

    for (const log of burnReceipt.logs) {
      if (log.topics && log.topics[0] && log.topics[0].toLowerCase() === MESSAGE_SENT_TOPIC.toLowerCase()) {
        try {
          const decoded = decodeEventLog({
            abi: CCTP_MESSAGE_TRANSMITTER_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "MessageSent") {
            messageBytes = (decoded.args as any).message;
            break;
          }
        } catch {}
      }
    }

    if (!messageBytes) {
      for (const log of burnReceipt.logs) {
        if (log.data && log.data.length > 200) {
          messageBytes = log.data as `0x${string}`;
          break;
        }
      }
    }

    if (!messageBytes) {
      throw new Error("Could not extract CCTP message bytes from burn transaction receipt.");
    }

    const messageHash = keccak256(messageBytes);
    console.log(`[CCTP Manual] Message hash: ${messageHash}`);

    // 5. Poll Circle Iris Attestation API
    setState(prev => ({
      ...prev,
      status: "waiting-attestation",
      progress: 60,
      stepDetail: `Circle attestation in progress… (usually 10-60s)`,
    }));

    let attestationSignature: `0x${string}` | null = null;
    const pollInterval = 4000;
    const maxPollAttempts = 60; // 4 minutes max

    for (let i = 0; i < maxPollAttempts; i++) {
      await new Promise(r => setTimeout(r, pollInterval));
      try {
        const attestationRes = await fetch(`${irisApiUrl}/${messageHash}`);
        if (attestationRes.ok) {
          const attestationData = await attestationRes.json();
          if (attestationData.status === "complete" && attestationData.attestation) {
            attestationSignature = attestationData.attestation as `0x${string}`;
            break;
          }
        }
      } catch (pollErr) {
        console.warn("[CCTP Manual] Polling attestation error:", pollErr);
      }
    }

    if (!attestationSignature) {
      throw new Error(`Attestation timed out for message ${messageHash}. You can claim funds later.`);
    }

    // 6. Switch to destination chain
    setState(prev => ({
      ...prev,
      status: "minting",
      progress: 80,
      stepDetail: `Switching to ${destChainName} to mint ${tokenSymbol}…`,
    }));

    await switchToChain(activeWallet, destChain, switchChainAsync);

    // 7. Receive message on destination MessageTransmitter
    setState(prev => ({
      ...prev,
      status: "minting",
      progress: 88,
      stepDetail: `Please confirm mint transaction on ${destChainName}…`,
    }));

    const destViemChain = EVM_BRIDGE_CHAINS[destChain.id];
    const destWalletClient = createWalletClient({
      account: userAddress,
      chain: destViemChain,
      transport: custom(provider),
    });

    const mintTx = await destWalletClient.writeContract({
      address: destTransmitter,
      abi: CCTP_MESSAGE_TRANSMITTER_ABI,
      functionName: "receiveMessage",
      args: [messageBytes, attestationSignature],
      chain: destViemChain,
    });

    setState(prev => ({
      ...prev,
      status: "minting",
      progress: 95,
      txHash: mintTx,
      stepDetail: `Confirming mint transaction on ${destChainName}…`,
    }));

    await destPublicClient.waitForTransactionReceipt({ hash: mintTx });

    setState(prev => ({
      ...prev,
      status: "success",
      progress: 100,
      txHash: mintTx,
      burnTxHash: burnTx,
      stepDetail: `Bridge complete! ${tokenSymbol} arrived on ${destChainName}.`,
    }));

    console.log("[CCTP Manual] Bridge complete. Burn:", burnTx, "Mint:", mintTx);
  };

  const bridgeUSDC = (
    sourceKey: keyof typeof SOURCE_CHAINS,
    amountString: string,
    direction: "in" | "out" = "in",
    tokenSymbol: "USDC" | "EURC" = "USDC"
  ) => bridgeToken(sourceKey, amountString, direction, tokenSymbol);

  return { state, bridgeUSDC, bridgeToken, resetState };
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
