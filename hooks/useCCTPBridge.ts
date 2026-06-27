"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWallets as usePrivyWallets } from "@privy-io/react-auth";
import { useSwitchChain, useAccount } from "wagmi";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  fallback,
  parseAbi,
  encodeFunctionData,
  decodeEventLog,
  decodeAbiParameters,
  keccak256,
  type Hex
} from "viem";

import { ARC_RPC_URL, ARC_RPC_URLS } from "@/lib/arc/config";
import { getSigner, selectActiveWallet } from "@/lib/tx-helper";
import { EVM_BRIDGE_CHAINS } from "@/lib/arc-config";
import { useAuth } from "@/hooks/auth/useAuth";

// ============================================================
// CCTP V2 Contract Addresses (Circle Official — June 2026)
// Same deterministic CREATE2 address across all supported chains
// Source: https://developers.circle.com/stablecoins/docs/evm-smart-contracts
// ============================================================
const CCTP_TOKEN_MESSENGER_V2  = "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA";
const CCTP_MSG_TRANSMITTER_V2  = "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275";

// CCTP V2 finality thresholds
// 1000 = Fast Transfer (fees apply — use fetchMinFee to get the required maxFee)
// 2000 = Standard Transfer (free, ~20 min on mainnet, ~1–3 min on testnet)
const FINALITY_STANDARD = 2000; // always free, reliable on testnet

// Iris fee API — get minimum fee for a route before fast-transfer attempt
const IRIS_FEE_URL = "https://iris-api-sandbox.circle.com/v2/burn/USDC/fees";

async function fetchMinFeeForRoute(
  sourceDomain: number,
  destDomain: number
): Promise<bigint> {
  try {
    const res = await fetch(`${IRIS_FEE_URL}/${sourceDomain}/${destDomain}`, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (!res.ok) return 0n;
    const data: Array<{ finalityThreshold: number; minimumFee: number }> = await res.json();
    const fast = data.find(d => d.finalityThreshold === 1000);
    if (!fast || fast.minimumFee <= 0) return 0n;
    // Convert human-readable USDC to 6-decimal BigInt, add 20% buffer
    const feeWithBuffer = fast.minimumFee * 1.20;
    return BigInt(Math.ceil(feeWithBuffer * 1_000_000));
  } catch {
    return 0n;
  }
}

export const SOURCE_CHAINS = {
  ETH_SEPOLIA: {
    id: 11155111,
    name: "Ethereum Sepolia",
    bridgeKitId: "Ethereum_Sepolia" as const,
    domain: 0,
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    tokenMessenger: CCTP_TOKEN_MESSENGER_V2,
    messageTransmitter: CCTP_MSG_TRANSMITTER_V2,
    rpcUrls: [
      "https://rpc.ankr.com/eth_sepolia",
      "https://ethereum-sepolia-rpc.publicnode.com",
      "https://eth-sepolia.public.blastapi.io",
    ],
    icon: "🪙"
  },
  BASE_SEPOLIA: {
    id: 84532,
    name: "Base Sepolia",
    bridgeKitId: "Base_Sepolia" as const,
    domain: 6,
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    tokenMessenger: CCTP_TOKEN_MESSENGER_V2,
    messageTransmitter: CCTP_MSG_TRANSMITTER_V2,
    rpcUrls: [
      "https://sepolia.base.org",
      "https://base-sepolia-rpc.publicnode.com",
    ],
    icon: "🔵"
  },
  AVAX_FUJI: {
    id: 43113,
    name: "Avalanche Fuji",
    bridgeKitId: "Avalanche_Fuji" as const,
    domain: 1,
    usdcAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
    tokenMessenger: CCTP_TOKEN_MESSENGER_V2,
    messageTransmitter: CCTP_MSG_TRANSMITTER_V2,
    rpcUrls: [
      "https://api.avax-test.network/ext/bc/C/rpc",
      "https://avalanche-fuji-c-chain-rpc.publicnode.com",
    ],
    icon: "🔺"
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
    icon: "☀️"
  }
} as const;

const ARC_CHAIN_CONFIG = {
  id: 5042002,
  name: "Arc Testnet",
  bridgeKitId: "Arc_Testnet" as const,
  domain: 26,
  usdcAddress: "0x3600000000000000000000000000000000000000" as `0x${string}`,
  tokenMessenger: CCTP_TOKEN_MESSENGER_V2,
  messageTransmitter: CCTP_MSG_TRANSMITTER_V2,
  rpcUrl: ARC_RPC_URL,
  rpcUrls: ARC_RPC_URLS,
  icon: "⚡"
};

// ============================================================
// ABIs
// ============================================================
const erc20Abi = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)"
] as const);

const tokenMessengerV2Abi = parseAbi([
  "function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold) returns (uint64)"
] as const);

const messageTransmitterAbi = parseAbi([
  "event MessageSent(bytes message)",
  "function receiveMessage(bytes message, bytes attestation) returns (bool)"
] as const);

const MESSAGE_SENT_TOPIC = "0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036";
const IRIS_SANDBOX_URL = "https://iris-api-sandbox.circle.com/v1/attestations";

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

// ============================================================
// Resilient RPC-based receipt polling
// ============================================================
const waitForTransactionReceiptResiliently = async (
  txHash: `0x${string}`,
  chainObj: any,
  rpcUrls: string[]
) => {
  let lastError: any = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    for (const url of rpcUrls) {
      try {
        const client = createPublicClient({
          chain: chainObj,
          transport: http(url, { timeout: 25000, retryCount: 2 })
        });

        try {
          const receipt = await client.getTransactionReceipt({ hash: txHash });
          if (receipt) return receipt;
        } catch (_) {
          // Not confirmed yet
        }

        const receipt = await client.waitForTransactionReceipt({
          hash: txHash,
          timeout: 90000,
          pollingInterval: 2500
        });
        if (receipt) return receipt;
      } catch (err) {
        console.warn(`[CCTP] Receipt poll attempt ${attempt + 1} failed on ${url}:`, err);
        lastError = err;
      }
    }
    await new Promise(r => setTimeout(r, 3000));
  }

  throw lastError || new Error(`Could not confirm transaction ${txHash} after retries.`);
};

// ============================================================
// Extract MessageSent bytes from receipt logs
// ============================================================
function extractMessageBytes(logs: any[]): `0x${string}` | null {
  for (const log of logs) {
    if (
      log.topics &&
      log.topics[0] &&
      log.topics[0].toLowerCase() === MESSAGE_SENT_TOPIC.toLowerCase()
    ) {
      try {
        const decoded = decodeEventLog({
          abi: messageTransmitterAbi,
          data: log.data,
          topics: log.topics
        }) as any;
        if (decoded.eventName === "MessageSent" && decoded.args?.message) {
          return decoded.args.message as `0x${string}`;
        }
      } catch (_) {}


      try {
        const [msgBytes] = decodeAbiParameters([{ type: "bytes" }], log.data);
        if (msgBytes) return msgBytes as `0x${string}`;
      } catch (e) {
        console.error("[CCTP] MessageSent decode failed:", e);
      }
    }
  }
  return null;
}

// ============================================================
// Poll Circle Iris attestation API — aggressive & smart
// ============================================================
async function pollAttestation(
  messageHash: string,
  onElapsed: (s: number) => void
): Promise<{ attestation: string; messageBytes: string | null }> {
  const url = `${IRIS_SANDBOX_URL}/${messageHash}`;
  let elapsed = 0;
  let delayMs = 3000; // Start polling faster (3s vs old 5s)
  const MAX_WAIT_MS = 20 * 60 * 1000; // 20 minutes max

  while (elapsed < MAX_WAIT_MS) {
    await new Promise(r => setTimeout(r, delayMs));
    elapsed += delayMs;
    onElapsed(Math.floor(elapsed / 1000));

    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store"
      });

      if (res.status === 429) {
        // Rate limited — back off exponentially
        delayMs = Math.min(delayMs * 2, 30000);
        console.warn("[CCTP] Iris rate limited. Back-off to", delayMs, "ms");
        continue;
      }

      if (res.status === 404) {
        // Not indexed yet — keep polling at fast pace
        delayMs = 3000;
        continue;
      }

      if (!res.ok) {
        console.warn("[CCTP] Iris returned", res.status, "— retrying");
        delayMs = 6000;
        continue;
      }

      const data = await res.json();
      console.log("[CCTP] Iris response:", data);

      if (data.status === "complete" && data.attestation) {
        return { attestation: data.attestation, messageBytes: data.messageBytes ?? null };
      }

      if (data.status === "failed_to_sign") {
        throw new Error("Circle Iris attestation failed to sign. Please try again or contact support.");
      }

      // pending_confirmation / pending — keep polling
      delayMs = 3000;
    } catch (err: any) {
      if (err.message?.includes("failed to sign")) throw err;
      console.error("[CCTP] Attestation poll error:", err);
      delayMs = 6000;
    }
  }

  throw new Error(
    "Circle attestation timed out after 20 minutes. Your burn transaction was confirmed — " +
    "you can claim your USDC later by re-submitting the attestation manually."
  );
}

// ============================================================
// Hook
// ============================================================
export function useCCTPBridge() {
  const { walletAddress } = useAuth();
  const { wallets: privyWallets } = usePrivyWallets();
  const wallets = privyWallets ?? [];
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

    // Solana / Circle-wallet mock bridge simulation
    const isCircleConnected =
      typeof window !== "undefined" &&
      localStorage.getItem("synarc_circle_connected") === "true";

    if (isCircleConnected || chainConfig.id === 103) {
      await executeSolanaMockBridge(chainConfig.name, amountString);
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

    // Try Circle Bridge Kit first (fast path)
    try {
      await bridgeWithKit(
        activeWallet,
        chainConfig,
        amountString,
        direction
      );
      return;
    } catch (kitErr: any) {
      console.warn("[CCTP] Bridge Kit failed, falling back to manual flow:", kitErr?.message);
      // Don't surface Kit errors to user if we can retry manually
      if (
        kitErr?.message?.includes("unsupported") ||
        kitErr?.message?.includes("adapter") ||
        kitErr?.message?.includes("not installed")
      ) {
        console.info("[CCTP] Adapter unavailable — using manual CCTP flow");
      }
    }

    // Manual CCTP fallback
    await bridgeManual(activeWallet, chainConfig, amountString, direction);
  };

  // -------------------------------------------------------
  // Fast Path: Circle Bridge Kit (adapter-viem-v2)
  // -------------------------------------------------------
  const bridgeWithKit = async (
    activeWallet: any,
    chainConfig: (typeof SOURCE_CHAINS)[keyof typeof SOURCE_CHAINS],
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

    const provider = await (
      activeWallet.getEthereumProvider?.() ||
      (activeWallet as any).getProvider?.() ||
      (activeWallet as any).getEip1193Provider?.()
    );

    if (!provider) throw new Error("Could not get EIP-1193 provider from wallet");

    // Build adapter from the connected browser wallet
    const adapter = await createViemAdapterFromProvider({
      provider,
      capabilities: { addressContext: "user-controlled" }
    });

    const kit = new BridgeKit();

    const fromChainId = direction === "in" ? chainConfig.bridgeKitId : "Arc_Testnet";
    const toChainId   = direction === "in" ? "Arc_Testnet" : chainConfig.bridgeKitId;

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
        stepDetail: "Circle attestation received — switching to Arc…"
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
        stepDetail: `Minting USDC on Arc Testnet…`
      }));
    });

    // Start elapsed timer during attestation phase
    setState(prev => ({ ...prev, status: "burning", progress: 25, stepDetail: "Broadcasting burn transaction…" }));

    // Switch to correct source chain before Kit executes
    await switchToChain(activeWallet, direction === "in" ? chainConfig : ARC_CHAIN_CONFIG, switchChainAsync);

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
    const burnStep = result?.steps?.find((s: any) => s.name === "depositForBurn");

    setState(prev => ({
      ...prev,
      status: "success",
      progress: 100,
      txHash: mintStep?.txHash || "",
      burnTxHash: burnStep?.txHash || prev.burnTxHash,
      stepDetail: "Bridge complete! Funds arrived on Arc Testnet."
    }));

    console.log("[Kit] Bridge complete:", result);
  };

  // -------------------------------------------------------
  // Manual CCTP Fallback (proven, battle-tested)
  // -------------------------------------------------------
  const bridgeManual = async (
    activeWallet: any,
    chainConfig: (typeof SOURCE_CHAINS)[keyof typeof SOURCE_CHAINS],
    amountString: string,
    direction: "in" | "out"
  ) => {
    const amount = parseFloat(amountString);
    const numericAmount = BigInt(Math.round(amount * 1_000_000));

    // Look up per-route fee so we can correctly set maxFee for fast transfers.
    // On testnet we use STANDARD (free) to avoid "Insufficient max fee" reverts.
    // Fast transfers require: maxFee >= minimumFee from Iris fee API.
    const sourceDomain = (direction === "in" ? chainConfig : ARC_CHAIN_CONFIG).domain;
    const destDomain   = (direction === "in" ? ARC_CHAIN_CONFIG : chainConfig).domain;
    const fastMinFee = await fetchMinFeeForRoute(sourceDomain, destDomain);
    console.log(`[CCTP] Route ${sourceDomain}→${destDomain} fast min fee:`, fastMinFee.toString(), "(USDC micro)");

    const sourceChainConfig = direction === "in" ? chainConfig : ARC_CHAIN_CONFIG;
    const destChainConfig   = direction === "in" ? ARC_CHAIN_CONFIG : chainConfig;

    console.log("[CCTP Manual] Bridge start:", {
      direction,
      source: sourceChainConfig.name,
      dest: destChainConfig.name,
      amount,
    });

    try {
      // ====================================================
      // STEP 0 — Pre-flight USDC balance check
      // ====================================================
      try {
        const checkClient = createPublicClient({
          chain: EVM_BRIDGE_CHAINS[(sourceChainConfig as any).id],
          transport: http((sourceChainConfig as any).rpcUrls?.[0] || (sourceChainConfig as any).rpcUrl, { timeout: 8000 })
        });
        const rawBal = await checkClient.readContract({
          address: (sourceChainConfig as any).usdcAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [activeWallet.address as `0x${string}`]
        });
        if ((rawBal as bigint) < numericAmount) {
          throw new Error(
            `Insufficient USDC balance on ${sourceChainConfig.name}. ` +
            `You need ${amountString} USDC but your wallet only has ` +
            `${(Number(rawBal) / 1_000_000).toFixed(6)} USDC.`
          );
        }
        console.log(`[CCTP] Balance OK: ${(Number(rawBal) / 1_000_000).toFixed(6)} USDC available`);
      } catch (balErr: any) {
        if (balErr.message?.includes("Insufficient USDC")) throw balErr;
        console.warn("[CCTP] Balance pre-check failed (non-fatal):", balErr.message);
      }

      // ====================================================
      // STEP 1 — Approve USDC on source chain
      // ====================================================
      setState(prev => ({
        ...prev,
        status: "approving",
        progress: 5,
        stepDetail: `Approving USDC on ${sourceChainConfig.name}…`,
        errorMessage: ""
      }));

      await switchToChain(activeWallet, sourceChainConfig, switchChainAsync);

      const sourceChainObj = EVM_BRIDGE_CHAINS[(sourceChainConfig as any).id];
      const { walletClient, address } = await getSigner(
        wallets,
        sourceChainObj,
        walletAddress || undefined
      );

      const approveData = encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [
          (sourceChainConfig as any).tokenMessenger as `0x${string}`,
          numericAmount
        ]
      });

      const approveParams: any = {
        to: (sourceChainConfig as any).usdcAddress as `0x${string}`,
        data: approveData,
        account: address,
        chain: sourceChainObj
      };
      if ((sourceChainConfig as any).id === 5042002) {
        approveParams.gas = 200000n;
        approveParams.gasPrice = 10000000n;
      }

      let approveTxHash: string;
      try {
        approveTxHash = await walletClient.sendTransaction(approveParams);
      } catch (err: any) {
        throw new Error(`USDC approval rejected: ${err?.message || err}`);
      }

      setState(prev => ({ ...prev, progress: 15, stepDetail: "Waiting for approval confirmation…" }));

      const sourceRpcs = (sourceChainConfig as any).rpcUrls || [(sourceChainConfig as any).rpcUrl];
      const approveReceipt = await waitForTransactionReceiptResiliently(
        approveTxHash as `0x${string}`,
        sourceChainObj,
        sourceRpcs
      );

      if (approveReceipt.status === "reverted") {
        throw new Error("USDC approval reverted. Check your balance and gas.");
      }

      // ====================================================
      // STEP 2 — Burn (depositForBurn) on source chain
      // ====================================================
      setState(prev => ({
        ...prev,
        status: "burning",
        progress: 25,
        stepDetail: `Burning ${amountString} USDC on ${sourceChainConfig.name}…`
      }));

      const mintRecipientBytes32 =
        `0x${activeWallet.address.replace(/^0x/, "").padStart(64, "0")}` as `0x${string}`;
      const zeroBytes32 =
        "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

      // CCTP V2 depositForBurn parameters:
      //   minFinalityThreshold: 2000 = Standard (free) — avoids "Insufficient max fee" reverts.
      //   maxFee: 0n for Standard (not charged). If upgrading to Fast: maxFee >= fetchMinFeeForRoute().
      const burnData = encodeFunctionData({
        abi: tokenMessengerV2Abi,
        functionName: "depositForBurn",
        args: [
          numericAmount,
          (destChainConfig as any).domain as unknown as number,
          mintRecipientBytes32,
          (sourceChainConfig as any).usdcAddress as `0x${string}`,
          zeroBytes32,
          0n,              // maxFee: 0 for Standard transfers (free)
          FINALITY_STANDARD // minFinalityThreshold: 2000 = Standard (no fee)
        ]
      });

      const burnParams: any = {
        to: (sourceChainConfig as any).tokenMessenger as `0x${string}`,
        data: burnData,
        account: address,
        chain: sourceChainObj
      };
      if ((sourceChainConfig as any).id === 5042002) {
        burnParams.gas = 400000n;
        burnParams.gasPrice = 10000000n;
      }

      let burnTxHash: string;
      try {
        burnTxHash = await walletClient.sendTransaction(burnParams);
      } catch (err: any) {
        throw new Error(`Burn transaction rejected: ${err?.message || err}`);
      }

      console.log("[CCTP] Burn tx submitted:", burnTxHash);
      setState(prev => ({
        ...prev,
        burnTxHash,
        progress: 35,
        stepDetail: "Waiting for burn confirmation…"
      }));

      const burnReceipt = await waitForTransactionReceiptResiliently(
        burnTxHash as `0x${string}`,
        sourceChainObj,
        sourceRpcs
      );

      if (burnReceipt.status === "reverted") {
        // Diagnose the likely cause based on what we know
        const srcName = sourceChainConfig.name;
        throw new Error(
          `Burn reverted on ${srcName}. Possible causes:\n` +
          `• Insufficient USDC balance (need ${amountString} USDC + gas)\n` +
          `• USDC not approved for TokenMessenger\n` +
          `• CCTP route from ${srcName} → Arc not yet supported\n` +
          `Burn tx: ${burnTxHash}`
        );
      }

      setState(prev => ({
        ...prev,
        progress: 45,
        stepDetail: "Burn confirmed. Extracting message…"
      }));

      // ====================================================
      // Extract MessageSent bytes from burn receipt logs
      // ====================================================
      const messageBytes = extractMessageBytes(burnReceipt.logs as any[]);

      if (!messageBytes) {
        console.error("[CCTP] No MessageSent event in logs:", burnReceipt.logs);
        throw new Error(
          "Could not find MessageSent event in burn transaction logs. " +
          "The burn may have succeeded — contact support with burn hash: " +
          burnTxHash
        );
      }

      const messageHash = keccak256(messageBytes);
      console.log("[CCTP] messageHash:", messageHash);

      // ====================================================
      // STEP 3 — Poll Circle Iris for attestation
      // ====================================================
      setState(prev => ({
        ...prev,
        status: "waiting-attestation",
        progress: 50,
        elapsedSeconds: 0,
        stepDetail: "Waiting for Circle attestation…"
      }));

      // Start elapsed timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.status === "waiting-attestation") {
            // Animate progress from 50 → 75 during attestation
            const newProgress = Math.min(75, 50 + Math.floor(prev.elapsedSeconds / 4));
            return {
              ...prev,
              elapsedSeconds: prev.elapsedSeconds + 1,
              progress: newProgress
            };
          }
          return prev;
        });
      }, 1000);

      let attestation: string;
      let apiMessageBytes: string | null;

      try {
        const result = await pollAttestation(
          messageHash,
          (secs) => setState(prev => ({
            ...prev,
            stepDetail: `Circle signing attestation… (${secs}s)`
          }))
        );
        attestation = result.attestation;
        apiMessageBytes = result.messageBytes;
      } finally {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }

      console.log("[CCTP] Attestation received.");

      const finalMessageBytes = (apiMessageBytes || messageBytes) as `0x${string}`;
      const finalAttestation = attestation as `0x${string}`;

      // ====================================================
      // STEP 4 — Mint (receiveMessage) on destination chain
      // ====================================================
      setState(prev => ({
        ...prev,
        status: "minting",
        progress: 80,
        stepDetail: `Switching to ${destChainConfig.name} to mint…`
      }));

      await switchToChain(activeWallet, destChainConfig, switchChainAsync);

      const destChainObj = EVM_BRIDGE_CHAINS[(destChainConfig as any).id];
      const { walletClient: destWalletClient, address: destAddress } =
        await getSigner(wallets, destChainObj, walletAddress || undefined);

      const mintData = encodeFunctionData({
        abi: messageTransmitterAbi,
        functionName: "receiveMessage",
        args: [finalMessageBytes, finalAttestation]
      });

      const mintParams: any = {
        to: (destChainConfig as any).messageTransmitter as `0x${string}`,
        data: mintData,
        account: destAddress,
        chain: destChainObj
      };
      if ((destChainConfig as any).id === 5042002) {
        mintParams.gas = 400000n;
        mintParams.gasPrice = 10000000n;
      }

      setState(prev => ({
        ...prev,
        progress: 88,
        stepDetail: `Broadcasting mint transaction on Arc…`
      }));

      let mintTxHash: string;
      try {
        mintTxHash = await destWalletClient.sendTransaction(mintParams);
      } catch (err: any) {
        throw new Error(`Mint transaction rejected: ${err?.message || err}`);
      }

      console.log("[CCTP] Mint tx submitted:", mintTxHash);
      setState(prev => ({
        ...prev,
        progress: 92,
        stepDetail: "Confirming mint transaction…"
      }));

      const destRpcs = (destChainConfig as any).rpcUrls || [(destChainConfig as any).rpcUrl];
      const mintReceipt = await waitForTransactionReceiptResiliently(
        mintTxHash as `0x${string}`,
        destChainObj,
        destRpcs
      );

      if (mintReceipt.status === "reverted") {
        throw new Error("Mint transaction reverted. Ensure the attestation is valid and try again.");
      }

      setState(prev => ({
        ...prev,
        status: "success",
        progress: 100,
        txHash: mintTxHash,
        stepDetail: "Bridge complete! USDC has arrived on Arc Testnet."
      }));

      console.log("[CCTP] Bridge complete! Mint tx:", mintTxHash);

    } catch (err: any) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      console.error("[CCTP] Bridge error:", err);
      setState(prev => ({
        ...prev,
        status: "error",
        progress: 0,
        errorMessage: err?.message || "Bridge encountered an unexpected error."
      }));
    }
  };

  // -------------------------------------------------------
  // Mock Solana / Circle wallet bridge simulation
  // -------------------------------------------------------
  const executeSolanaMockBridge = async (chainName: string, amountString: string) => {
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

      setState(prev => ({ ...prev, status: "minting", progress: 85, stepDetail: "Minting USDC on Arc Testnet…" }));
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

    await switchChainAsync({ chainId: chainConfig.id });
  } catch (err: any) {
    if (chainConfig.id === 5042002) {
      const provider = await activeWallet.getEthereumProvider();
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x4cef52",
            chainName: "Arc Testnet",
            rpcUrls: ARC_RPC_URLS,
            nativeCurrency: {
              name: "USD Coin",
              symbol: "USDC",
              decimals: 6
            },
            blockExplorerUrls: ["https://testnet.arcscan.app"]
          }
        ]
      });
      await switchChainAsync({ chainId: 5042002 });
    } else {
      throw new Error(
        `Failed to switch to ${chainConfig.name}: ${err?.message || err}`
      );
    }
  }
}
