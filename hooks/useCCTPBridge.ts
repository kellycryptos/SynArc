"use client";

import { useState, useEffect, useRef } from "react";
import { useWallets as usePrivyWallets } from "@privy-io/react-auth";
import { useSwitchChain, useAccount, useConfig } from "wagmi";
import { toast } from "react-hot-toast";
import {
  createPublicClient,
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
// Source: https://developers.circle.com/cctp/docs/supported-domains
// ALL testnet chains now use CCTP V2 with these same addresses.
// ============================================================
const CCTP_TOKEN_MESSENGER_V2  = "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA";
const CCTP_MSG_TRANSMITTER_V2  = "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275";

export const SOURCE_CHAINS = {
  ETH_SEPOLIA: {
    id: 11155111,
    name: "Ethereum Sepolia",
    domain: 0,
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    tokenMessenger: CCTP_TOKEN_MESSENGER_V2,
    messageTransmitter: CCTP_MSG_TRANSMITTER_V2,
    rpcUrl: "https://rpc.ankr.com/eth_sepolia",
    icon: "🪙"
  },
  BASE_SEPOLIA: {
    id: 84532,
    name: "Base Sepolia",
    domain: 6,
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    tokenMessenger: CCTP_TOKEN_MESSENGER_V2,
    messageTransmitter: CCTP_MSG_TRANSMITTER_V2,
    rpcUrl: "https://sepolia.base.org",
    icon: "🔵"
  },
  AVAX_FUJI: {
    id: 43113,
    name: "Avalanche Fuji",
    domain: 1,
    usdcAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
    tokenMessenger: CCTP_TOKEN_MESSENGER_V2,
    messageTransmitter: CCTP_MSG_TRANSMITTER_V2,
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    icon: "🔺"
  },
  SOL_DEVNET: {
    id: 103, // Internal Solana identifier (mock)
    name: "Solana Devnet",
    domain: 5,
    usdcAddress: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    tokenMessenger: "CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe",
    messageTransmitter: "CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC",
    rpcUrl: "https://api.devnet.solana.com",
    icon: "☀️"
  }
} as const;

// Arc Testnet uses CCTP V2 — domain 26
const ARC_CHAIN_CONFIG = {
  id: 5042002,
  name: "Arc Testnet",
  domain: 26,
  usdcAddress: "0x3600000000000000000000000000000000000000" as `0x${string}`,
  tokenMessenger: CCTP_TOKEN_MESSENGER_V2,
  messageTransmitter: CCTP_MSG_TRANSMITTER_V2,
  rpcUrl: ARC_RPC_URL,
  icon: "⚡"
};

// ============================================================
// ABIs
// ============================================================
const erc20Abi = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)"
] as const);

// CCTP V2 depositForBurn — 7 parameters
const tokenMessengerV2Abi = parseAbi([
  "function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold) returns (uint64)"
] as const);

const messageTransmitterAbi = parseAbi([
  "event MessageSent(bytes message)",
  "function receiveMessage(bytes message, bytes attestation) returns (bool)"
] as const);

// keccak256 topic for MessageSent event
const MESSAGE_SENT_TOPIC = "0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036";

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
}

// ============================================================
// RPC fallback lists per chain
// ============================================================
const CHAIN_RPCS: Record<number, string[]> = {
  11155111: [
    "https://rpc.ankr.com/eth_sepolia",
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://eth-sepolia.public.blastapi.io",
    "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
  ],
  84532: [
    "https://sepolia.base.org",
    "https://base-sepolia-rpc.publicnode.com"
  ],
  43113: [
    "https://api.avax-test.network/ext/bc/C/rpc",
    "https://avalanche-fuji-c-chain-rpc.publicnode.com"
  ],
  5042002: ARC_RPC_URLS
};

// ============================================================
// Resilient receipt polling
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
          transport: http(url, { timeout: 20000, retryCount: 2 })
        });

        // Try a quick direct get first
        try {
          const receipt = await client.getTransactionReceipt({ hash: txHash });
          if (receipt) return receipt;
        } catch (_) {
          // not confirmed yet, fall through to waitFor
        }

        const receipt = await client.waitForTransactionReceipt({
          hash: txHash,
          timeout: 60000, // 60 s max per RPC
          pollingInterval: 3000
        });
        if (receipt) return receipt;
      } catch (err) {
        console.warn(`Receipt poll attempt ${attempt} failed on ${url}:`, err);
        lastError = err;
      }
    }
    // Brief pause between outer retries
    await new Promise(r => setTimeout(r, 4000));
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
      // Primary decode via decodeEventLog
      try {
        const decoded = decodeEventLog({
          abi: messageTransmitterAbi,
          data: log.data,
          topics: log.topics
        });
        if (decoded.eventName === "MessageSent" && decoded.args.message) {
          return decoded.args.message as `0x${string}`;
        }
      } catch (_) {
        // fallback
      }

      // Fallback: manual ABI param decode
      try {
        const [msgBytes] = decodeAbiParameters([{ type: "bytes" }], log.data);
        if (msgBytes) return msgBytes as `0x${string}`;
      } catch (e) {
        console.error("Manual MessageSent decode also failed:", e);
      }
    }
  }
  return null;
}

// ============================================================
// Poll Circle Iris attestation API (testnet sandbox)
// ============================================================
const IRIS_SANDBOX_URL = "https://iris-api-sandbox.circle.com/v1/attestations";

async function pollAttestation(
  messageHash: string,
  onElapsed: (s: number) => void
): Promise<{ attestation: string; messageBytes: string | null }> {
  const url = `${IRIS_SANDBOX_URL}/${messageHash}`;
  let elapsed = 0;
  let delayMs = 5000;
  const MAX_WAIT_MS = 15 * 60 * 1000; // 15 minutes

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
        // Rate limited — exponential back-off
        delayMs = Math.min(delayMs * 2, 30000);
        console.warn("[CCTP] Iris API rate limited. Backing off to", delayMs, "ms");
        continue;
      }

      if (res.status === 404) {
        // Not yet indexed — keep polling at normal pace
        delayMs = 5000;
        continue;
      }

      if (!res.ok) {
        console.warn("[CCTP] Iris API returned", res.status, "— retrying");
        delayMs = 8000;
        continue;
      }

      const data = await res.json();
      console.log("[CCTP] Iris response:", data);

      if (data.status === "complete" && data.attestation) {
        return { attestation: data.attestation, messageBytes: data.messageBytes ?? null };
      }

      if (data.status === "failed_to_sign") {
        throw new Error("Circle Iris attestation failed to sign the message. Please contact Circle support.");
      }

      // pending_confirmation / pending — reset delay and keep going
      delayMs = 5000;
    } catch (err: any) {
      if (err.message?.includes("failed to sign")) throw err;
      console.error("[CCTP] Attestation poll error:", err);
      delayMs = 8000;
    }
  }

  throw new Error(
    "Circle attestation timed out after 15 minutes. The burn transaction was confirmed — you can claim your USDC later by re-submitting the attestation."
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
  const { chain } = useAccount();
  const wagmiConfig = useConfig();

  const [state, setState] = useState<BridgeState>({
    status: "idle",
    elapsedSeconds: 0,
    errorMessage: "",
    txHash: "",
    burnTxHash: ""
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const resetState = () => {
    setState({
      status: "idle",
      elapsedSeconds: 0,
      errorMessage: "",
      txHash: "",
      burnTxHash: ""
    });
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // -------------------------------------------------------
  // Main bridge function
  // direction "in"  = sourceChain -> Arc Testnet
  // direction "out" = Arc Testnet -> sourceChain
  // -------------------------------------------------------
  const bridgeUSDC = async (
    sourceKey: keyof typeof SOURCE_CHAINS,
    amountString: string,
    direction: "in" | "out" = "in"
  ) => {
    const chainConfig = SOURCE_CHAINS[sourceKey];

    // Circle-connected accounts use the mock Solana bridge simulation
    const isCircleConnected =
      typeof window !== "undefined" &&
      localStorage.getItem("synarc_circle_connected") === "true";

    if (isCircleConnected || chainConfig.id === 103) {
      await executeSolanaMockBridge(
        direction === "in" ? chainConfig.name : "Arc Testnet",
        amountString
      );
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

    // USDC has 6 decimals
    const numericAmount = BigInt(Math.round(amount * 1_000_000));

    // Determine source and destination based on direction
    const sourceChainConfig =
      direction === "in" ? chainConfig : ARC_CHAIN_CONFIG;
    const destChainConfig =
      direction === "in" ? ARC_CHAIN_CONFIG : chainConfig;

    console.log("[CCTP] Bridge start —", {
      direction,
      source: sourceChainConfig.name,
      dest: destChainConfig.name,
      amount,
      wallet: activeWallet.address
    });

    try {
      // ====================================================
      // STEP 1 — Approve USDC on source chain
      // ====================================================
      setState(prev => ({ ...prev, status: "approving", errorMessage: "" }));

      // Switch to source chain
      await switchToChain(activeWallet, sourceChainConfig, switchChainAsync);

      const sourceChainObj = EVM_BRIDGE_CHAINS[sourceChainConfig.id];
      const { walletClient, address } = await getSigner(
        wallets,
        sourceChainObj,
        walletAddress || undefined
      );

      const approveData = encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [
          sourceChainConfig.tokenMessenger as `0x${string}`,
          numericAmount
        ]
      });

      const approveParams: any = {
        to: sourceChainConfig.usdcAddress as `0x${string}`,
        data: approveData,
        account: address,
        chain: sourceChainObj
      };
      // Arc requires explicit gas params (USDC gas token)
      if (sourceChainConfig.id === 5042002) {
        approveParams.gas = 200000n;
        approveParams.gasPrice = 10000000n;
      }

      let approveTxHash: string;
      try {
        approveTxHash = await walletClient.sendTransaction(approveParams);
      } catch (err: any) {
        throw new Error(`USDC approval rejected: ${err?.message || err}`);
      }

      const sourceRpcs = CHAIN_RPCS[sourceChainConfig.id] || [sourceChainConfig.rpcUrl];
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
      setState(prev => ({ ...prev, status: "burning" }));

      // mintRecipient must be left-padded to 32 bytes
      const mintRecipientBytes32 =
        `0x${activeWallet.address.replace(/^0x/, "").padStart(64, "0")}` as `0x${string}`;

      const zeroBytes32 =
        "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

      // CCTP V2 — 7-parameter depositForBurn
      const burnData = encodeFunctionData({
        abi: tokenMessengerV2Abi,
        functionName: "depositForBurn",
        args: [
          numericAmount,
          destChainConfig.domain as unknown as number,
          mintRecipientBytes32,
          sourceChainConfig.usdcAddress as `0x${string}`,
          zeroBytes32,    // destinationCaller: zero = any relayer
          0n,             // maxFee: 0 for standard transfer
          0               // minFinalityThreshold: 0 = auto
        ]
      });

      const burnParams: any = {
        to: sourceChainConfig.tokenMessenger as `0x${string}`,
        data: burnData,
        account: address,
        chain: sourceChainObj
      };
      if (sourceChainConfig.id === 5042002) {
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

      const burnReceipt = await waitForTransactionReceiptResiliently(
        burnTxHash as `0x${string}`,
        sourceChainObj,
        sourceRpcs
      );

      if (burnReceipt.status === "reverted") {
        throw new Error(
          "Burn transaction reverted. Check your USDC balance and that the TokenMessenger contract is correct."
        );
      }

      setState(prev => ({ ...prev, burnTxHash }));

      // ====================================================
      // Extract MessageSent bytes from burn receipt logs
      // ====================================================
      const messageBytes = extractMessageBytes(burnReceipt.logs as any[]);

      if (!messageBytes) {
        console.error("[CCTP] No MessageSent event found in logs:", burnReceipt.logs);
        throw new Error(
          "Could not find MessageSent event in burn transaction logs. " +
          "The burn may have succeeded — check the tx on-chain and contact support with the burn hash: " +
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
        elapsedSeconds: 0
      }));

      // Start elapsed timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.status === "waiting-attestation") {
            return { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
          }
          return prev;
        });
      }, 1000);

      let attestation: string;
      let apiMessageBytes: string | null;

      try {
        const result = await pollAttestation(messageHash, () => {});
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
      setState(prev => ({ ...prev, status: "minting" }));

      await switchToChain(activeWallet, destChainConfig, switchChainAsync);

      const destChainObj = EVM_BRIDGE_CHAINS[destChainConfig.id];
      const { walletClient: destWalletClient, address: destAddress } =
        await getSigner(wallets, destChainObj, walletAddress || undefined);

      const mintData = encodeFunctionData({
        abi: messageTransmitterAbi,
        functionName: "receiveMessage",
        args: [finalMessageBytes, finalAttestation]
      });

      const mintParams: any = {
        to: destChainConfig.messageTransmitter as `0x${string}`,
        data: mintData,
        account: destAddress,
        chain: destChainObj
      };
      if (destChainConfig.id === 5042002) {
        mintParams.gas = 400000n;
        mintParams.gasPrice = 10000000n;
      }

      let mintTxHash: string;
      try {
        mintTxHash = await destWalletClient.sendTransaction(mintParams);
      } catch (err: any) {
        throw new Error(`Mint transaction rejected: ${err?.message || err}`);
      }

      console.log("[CCTP] Mint tx submitted:", mintTxHash);

      const destRpcs = CHAIN_RPCS[destChainConfig.id] || [destChainConfig.rpcUrl];
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
        txHash: mintTxHash
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
        errorMessage: err?.message || "Bridge encountered an unexpected error."
      }));
    }
  };

  // -------------------------------------------------------
  // Mock Solana / Circle wallet bridge simulation
  // -------------------------------------------------------
  const executeSolanaMockBridge = async (chainName: string, amountString: string) => {
    try {
      setState(prev => ({ ...prev, status: "approving", errorMessage: "" }));
      await new Promise(r => setTimeout(r, 2000));

      setState(prev => ({ ...prev, status: "burning" }));
      await new Promise(r => setTimeout(r, 2500));

      setState(prev => ({ ...prev, status: "waiting-attestation", elapsedSeconds: 0 }));
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }));
      }, 1000);

      await new Promise(r => setTimeout(r, 5000));

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setState(prev => ({ ...prev, status: "minting" }));
      await new Promise(r => setTimeout(r, 2500));

      const chars = "0123456789abcdef";
      let mockHash = "0x";
      for (let i = 0; i < 64; i++) {
        mockHash += chars[Math.floor(Math.random() * chars.length)];
      }

      setState(prev => ({ ...prev, status: "success", txHash: mockHash }));
    } catch (err: any) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setState(prev => ({
        ...prev,
        status: "error",
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
  chainConfig: { id: number; name: string; rpcUrl: string },
  switchChainAsync: any
) {
  try {
    const currentChainId = parseInt(
      activeWallet.chainId.replace("eip155:", "")
    );
    if (currentChainId === chainConfig.id) return;

    await switchChainAsync({ chainId: chainConfig.id });
  } catch (err: any) {
    // Arc Testnet may need to be added first
    if (chainConfig.id === 5042002) {
      const provider = await activeWallet.getEthereumProvider();
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x4cef52", // 5042002
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
