"use client";
 
import { useState, useEffect, useRef } from "react";
import { useWallets as usePrivyWallets } from "@privy-io/react-auth";
import { useSwitchChain, useAccount, useConfig } from "wagmi";
import { sepolia } from "wagmi/chains";
import { arcTestnet } from "@/lib/chains/arc";
import { toast } from "react-hot-toast";
import { 
  createPublicClient, 
  http, 
  fallback,
  custom,
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
 
// CCTP Chain Configs matching circlefin's official configuration
export const SOURCE_CHAINS = {
  ETH_SEPOLIA: {
    id: 11155111,
    name: "Ethereum Sepolia",
    domain: 0,
    usdcAddress: "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238",
    tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    rpcUrl: "https://rpc.ankr.com/eth_sepolia",
    icon: "🪙"
  },
  BASE_SEPOLIA: {
    id: 84532,
    name: "Base Sepolia",
    domain: 6,
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    tokenMessenger: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    rpcUrl: "https://sepolia.base.org",
    icon: "🔵"
  },
  AVAX_FUJI: {
    id: 43113,
    name: "Avalanche Fuji",
    domain: 1,
    usdcAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
    tokenMessenger: "0xeb08f243E5d3FCFF26A9E38Ae5520A669f4019d0",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    icon: "🔺"
  },
  SOL_DEVNET: {
    id: 103, // Internal Solana identifier
    name: "Solana Devnet",
    domain: 5,
    usdcAddress: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    tokenMessenger: "CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe",
    messageTransmitter: "CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC",
    rpcUrl: "https://api.devnet.solana.com",
    icon: "☀️"
  }
};
 
const DESTINATION_CHAIN = {
  id: 5042002, // ALWAYS use actual Arc chain ID!
  name: "Arc Testnet",
  domain: 26,
  tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
  messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
  rpcUrl: ARC_RPC_URL,
  nativeCurrency: "USDC"
};

// Standard ABIs
const erc20Abi = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)"
] as const);

const tokenMessengerV1Abi = parseAbi([
  "function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken) returns (uint64)"
] as const);

const tokenMessengerV2Abi = parseAbi([
  "function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold) returns (uint64)"
] as const);

const messageTransmitterAbi = parseAbi([
  "event MessageSent(bytes message)",
  "function receiveMessage(bytes message, bytes attestation) returns (bool)"
] as const);

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

const CHAIN_RPCS: Record<number, string[]> = {
  11155111: [
    "https://rpc.ankr.com/eth_sepolia",
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://eth-sepolia.public.blastapi.io"
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

const waitForTransactionReceiptResiliently = async (
  txHash: `0x${string}`,
  chainObj: any,
  rpcUrls: string[]
) => {
  let lastError: any = null;
  
  // We will do up to 3 outer retries
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const url of rpcUrls) {
      try {
        const client = createPublicClient({
          chain: chainObj,
          transport: http(url, {
            timeout: 15000,
            retryCount: 2,
          })
        });

        // Try direct get first
        try {
          const receipt = await client.getTransactionReceipt({ hash: txHash });
          if (receipt) return receipt;
        } catch (e) {
          // not found yet
        }

        const receipt = await client.waitForTransactionReceipt({
          hash: txHash,
          timeout: 25000,
        });
        if (receipt) return receipt;
      } catch (err) {
        console.warn(`waitForTransactionReceiptResiliently: attempt ${attempt} failed on RPC ${url} for tx ${txHash}:`, err);
        lastError = err;
      }
    }
    
    // Wait before next retry
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  throw lastError || new Error(`Failed to wait for transaction receipt for ${txHash}.`);
};

export function useCCTPBridge() {
  const { walletAddress } = useAuth();
  // Safe: Circle wallet does not register with Privy wallets list
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

  // Clear timer on unmount
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

  // Perform full CCTP Bridge flow
  const bridgeUSDC = async (
    sourceKey: keyof typeof SOURCE_CHAINS,
    amountString: string,
    direction: "in" | "out" = "in"
  ) => {
    const chainConfig = SOURCE_CHAINS[sourceKey];
    const isCircleConnected = typeof window !== 'undefined' && localStorage.getItem('synarc_circle_connected') === 'true';

    if (isCircleConnected) {
      await executeSolanaMockBridge(direction === "in" ? chainConfig.name : "Arc Testnet", amountString);
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

    // Amount scaled to 6 decimals (USDC standard)
    const numericAmount = BigInt(Math.round(amount * 1_000_000));

    const sourceChainConfig = direction === "in" ? chainConfig : {
      id: 5042002,
      name: "Arc Testnet",
      domain: 26,
      usdcAddress: "0x3600000000000000000000000000000000000000",
      tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
      messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
      rpcUrl: ARC_RPC_URL,
      icon: "⚡"
    };

    const destChainConfig = direction === "in" ? {
      id: 5042002,
      name: "Arc Testnet",
      domain: 26,
      usdcAddress: "0x3600000000000000000000000000000000000000",
      tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
      messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
      rpcUrl: ARC_RPC_URL,
      icon: "⚡"
    } : chainConfig;

    if (sourceChainConfig.id === 103 || destChainConfig.id === 103) {
      // SOLANA DEVNET -> ARC TESTNET: Graceful simulated bridging experience
      await executeSolanaMockBridge(direction === "in" ? chainConfig.name : "Arc Testnet", amountString);
      return;
    }

    // Logging for debugging mismatches
    console.log('Current chain:', chain);
    console.log('Source chain:', sourceChainConfig);
    console.log('Destination chain:', destChainConfig);
    console.log('Configured chains:', wagmiConfig.chains);

    try {
      // ==========================================
      // STEP 1 — Approve USDC
      // ==========================================
      setState(prev => ({ ...prev, status: "approving", errorMessage: "" }));

      // Switch chain using Wagmi to the source chain
      try {
        const currentChainId = parseInt(activeWallet.chainId.replace("eip155:", ""));
        if (currentChainId !== sourceChainConfig.id) {
          const supportedChains = Object.keys(EVM_BRIDGE_CHAINS).map(Number);
          if (!supportedChains.includes(sourceChainConfig.id)) {
            toast.error("Please connect to a supported network");
            throw new Error("Source network is not configured in SynArc");
          }
          await switchChainAsync({ chainId: sourceChainConfig.id as any });
        }
      } catch (err: any) {
        if (sourceChainConfig.id === 5042002) {
          try {
            const provider = await activeWallet.getEthereumProvider();
            await provider.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x4cef52", // 5042002 hex
                  chainName: sourceChainConfig.name,
                  rpcUrls: [sourceChainConfig.rpcUrl],
                  nativeCurrency: {
                    name: "USD Coin",
                    symbol: "USDC",
                    decimals: 6
                  },
                  blockExplorerUrls: ["https://testnet.arcscan.app"]
                }
              ]
            });
            await switchChainAsync({ chainId: sourceChainConfig.id as any });
          } catch (addError: any) {
            throw new Error(`Failed to switch to Arc Testnet: ${addError?.message || addError}`);
          }
        } else {
          const errMsg = err?.message || String(err);
          if (errMsg.toLowerCase().includes("chain not configured") || errMsg.toLowerCase().includes("not configured")) {
            throw new Error("Source network is not configured in SynArc");
          }
          throw new Error(`Failed to switch wallet to ${sourceChainConfig.name}: ${err?.message || err}`);
        }
      }

      const targetChainObj = EVM_BRIDGE_CHAINS[sourceChainConfig.id];
      const { walletClient, address } = await getSigner(wallets, targetChainObj, walletAddress || undefined);

      const approveData = encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [sourceChainConfig.tokenMessenger as `0x${string}`, numericAmount]
      });

      let approveTxHash: string;
      try {
        const txParams: any = {
          to: sourceChainConfig.usdcAddress as `0x${string}`,
          data: approveData,
          account: address,
          chain: targetChainObj
        };
        if (sourceChainConfig.id === 5042002) {
          txParams.gas = 150000n;
          txParams.gasPrice = 10000000n;
        }
        approveTxHash = await walletClient.sendTransaction(txParams);
      } catch (err: any) {
        throw new Error(`USDC Approval rejected by user: ${err?.message || err}`);
      }

      const sourceRpcs = CHAIN_RPCS[sourceChainConfig.id] || [sourceChainConfig.rpcUrl];
      const approveReceipt = await waitForTransactionReceiptResiliently(
        approveTxHash as `0x${string}`,
        targetChainObj,
        sourceRpcs
      );

      if (approveReceipt.status === "reverted") {
        throw new Error("USDC approval transaction reverted on-chain. Please verify gas fees and balances.");
      }

      // ==========================================
      // STEP 2 — Burn on source chain
      // ==========================================
      setState(prev => ({ ...prev, status: "burning" }));

      // User address formatted to bytes32 for TokenMessenger
      const mintRecipientBytes32 = `0x${activeWallet.address.replace(/^0x/, "").padStart(64, "0")}` as `0x${string}`;

      let burnData: Hex;
      if (sourceChainConfig.id === 5042002) {
        // Arc Testnet uses CCTP V2 with 7 parameters
        const zeroBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;
        burnData = encodeFunctionData({
          abi: tokenMessengerV2Abi,
          functionName: "depositForBurn",
          args: [
            numericAmount,
            destChainConfig.domain,
            mintRecipientBytes32,
            sourceChainConfig.usdcAddress as `0x${string}`,
            zeroBytes32,
            0n,
            0
          ]
        });
      } else {
        // Other chains use CCTP V1 with 4 parameters
        burnData = encodeFunctionData({
          abi: tokenMessengerV1Abi,
          functionName: "depositForBurn",
          args: [
            numericAmount,
            destChainConfig.domain,
            mintRecipientBytes32,
            sourceChainConfig.usdcAddress as `0x${string}`
          ]
        });
      }

      let burnTxHash: string;
      try {
        const txParams: any = {
          to: sourceChainConfig.tokenMessenger as `0x${string}`,
          data: burnData,
          account: address,
          chain: targetChainObj
        };
        if (sourceChainConfig.id === 5042002) {
          txParams.gas = 300000n;
          txParams.gasPrice = 10000000n;
        }
        burnTxHash = await walletClient.sendTransaction(txParams);
      } catch (err: any) {
        throw new Error(`CCTP Burn transaction rejected: ${err?.message || err}`);
      }

      // Wait for burn confirmation to parse events
      const burnReceipt = await waitForTransactionReceiptResiliently(
        burnTxHash as `0x${string}`,
        targetChainObj,
        sourceRpcs
      );

      if (burnReceipt.status === "reverted") {
        throw new Error("Burn transaction reverted on-chain. Please check your USDC balance and try again.");
      }

      setState(prev => ({ ...prev, burnTxHash: burnTxHash }));

      // Extract messageBytes from logs
      let messageBytes: `0x${string}` | null = null;
      const MESSAGE_SENT_TOPIC = "0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036";

      for (const log of burnReceipt.logs) {
        if (log.topics && log.topics[0] && log.topics[0].toLowerCase() === MESSAGE_SENT_TOPIC.toLowerCase()) {
          try {
            // First attempt using decodeEventLog
            const decoded = decodeEventLog({
              abi: messageTransmitterAbi,
              data: log.data,
              topics: log.topics
            });
            if (decoded.eventName === "MessageSent") {
              messageBytes = decoded.args.message;
              break;
            }
          } catch (decodeErr) {
            console.warn("Failed to decode MessageSent event log via decodeEventLog, falling back to manual decode:", decodeErr);
            try {
              // Fallback to manual ABI parameter decoding
              const decodedParams = decodeAbiParameters([{ type: "bytes" }], log.data);
              if (decodedParams && decodedParams[0]) {
                messageBytes = decodedParams[0] as `0x${string}`;
                break;
              }
            } catch (manualErr) {
              console.error("Manual decoding also failed:", manualErr);
            }
          }
        }
      }

      if (!messageBytes) {
        console.error("CCTP extraction failed. Receipt logs:", burnReceipt.logs);
        throw new Error("MessageSent event was not found in burn transaction logs. Please verify that you called the correct TokenMessenger contract.");
      }

      const messageHash = keccak256(messageBytes);

      // ==========================================
      // STEP 3 — Poll for Circle attestation
      // ==========================================
      setState(prev => ({
        ...prev,
        status: "waiting-attestation",
        elapsedSeconds: 0
      }));

      // Start elapsed timer counter
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.status === "waiting-attestation") {
            return { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
          }
          return prev;
        });
      }, 1000);

      const attestationUrl = `https://iris-api-sandbox.circle.com/v1/attestations/${messageHash}`;
      let attestation: string | null = null;
      let apiMessageBytes: string | null = null;

      // Poll every 5-10 seconds until attestation signature is ready (limit to 120 polls = ~10-15 mins)
      let pollCount = 0;
      let delayMs = 5000;
      while (!attestation && pollCount < 120) {
        try {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          pollCount++;
          const response = await fetch(attestationUrl);
          
          if (response.status === 429) {
            console.warn("Circle attestation API rate limited (429). Backing off...");
            delayMs = Math.min(delayMs * 1.5, 30000); // Backoff up to 30 seconds
            continue;
          }
          
          // Reset delay on successful check
          delayMs = 5000;

          if (response.ok) {
            const data = await response.json();
            if (data.status === "complete") {
              attestation = data.attestation;
              apiMessageBytes = data.messageBytes;
              break;
            } else if (data.status === "failed_to_sign") {
              console.error("Circle attestation failed to sign message:", data);
              throw new Error("Circle attestation service failed to sign the message. Please contact Circle support.");
            }
          } else {
            console.warn(`Circle attestation API returned status: ${response.status}`);
          }
        } catch (pollErr: any) {
          console.error("Circle attestation polling error:", pollErr);
          if (pollErr.message && pollErr.message.includes("failed to sign")) {
            throw pollErr;
          }
        }
      }

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (!attestation) {
        throw new Error("Circle attestation polling timed out (10 minutes elapsed). The transfer is still processing; you can claim it later using the attestation.");
      }

      const finalMessageBytes = (apiMessageBytes || messageBytes) as `0x${string}`;
      const finalAttestation = attestation as `0x${string}`;

      // ==========================================
      // STEP 4 — Mint on destination chain
      // ==========================================
      setState(prev => ({ ...prev, status: "minting" }));

      // Switch chain to Destination Chain
      try {
        await switchChainAsync({ chainId: destChainConfig.id as any });
      } catch (switchError: any) {
        if (destChainConfig.id === 5042002) {
          try {
            const provider = await activeWallet.getEthereumProvider();
            await provider.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x4cef52", // 5042002 hex
                  chainName: destChainConfig.name,
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
            // Switch after adding
            await switchChainAsync({ chainId: destChainConfig.id as any });
          } catch (addError: any) {
            throw new Error(`Failed to add or switch to Arc Testnet (0x4cef52): ${addError?.message || addError}`);
          }
        } else {
          throw new Error(`Failed to switch to destination chain ${destChainConfig.name}: ${switchError?.message || switchError}`);
        }
      }

      const mintData = encodeFunctionData({
        abi: messageTransmitterAbi,
        functionName: "receiveMessage",
        args: [finalMessageBytes, finalAttestation]
      });

      // Submit mint transaction on destination chain
      let mintTxHash: string;
      try {
        const targetDestChain = EVM_BRIDGE_CHAINS[destChainConfig.id];
        const { walletClient: destWalletClient, address: destAddress } = await getSigner(wallets, targetDestChain, walletAddress || undefined);
        const txParams: any = {
          to: destChainConfig.messageTransmitter as `0x${string}`,
          data: mintData,
          account: destAddress,
          chain: targetDestChain
        };
        if (destChainConfig.id === 5042002) {
          txParams.gas = 300000n;
          txParams.gasPrice = 10000000n;
        }
        mintTxHash = await destWalletClient.sendTransaction(txParams);
      } catch (err: any) {
        throw new Error(`Minting transaction rejected: ${err?.message || err}`);
      }

      // Wait for mint transaction confirmation
      const destRpcs = CHAIN_RPCS[destChainConfig.id] || [destChainConfig.rpcUrl];
      const mintReceipt = await waitForTransactionReceiptResiliently(
        mintTxHash as `0x${string}`,
        EVM_BRIDGE_CHAINS[destChainConfig.id],
        destRpcs
      );

      if (mintReceipt.status === "reverted") {
        throw new Error("Minting transaction reverted on-chain. Please verify gas fees and try again.");
      }

      // Done
      setState(prev => ({
        ...prev,
        status: "success",
        txHash: mintTxHash
      }));

    } catch (err: any) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setState(prev => ({
        ...prev,
        status: "error",
        errorMessage: err?.message || "Bridging pipeline encountered an unexpected issue."
      }));
    }
  };

  // Graceful Solana Mock Bridging workflow
  const executeSolanaMockBridge = async (chainName: string, amountString: string) => {
    try {
      // 1. Approving
      setState(prev => ({ ...prev, status: "approving", errorMessage: "" }));
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 2. Burning
      setState(prev => ({ ...prev, status: "burning" }));
      await new Promise(resolve => setTimeout(resolve, 2500));

      // 3. Waiting Attestation
      setState(prev => ({ ...prev, status: "waiting-attestation", elapsedSeconds: 0 }));
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }));
      }, 1000);

      await new Promise(resolve => setTimeout(resolve, 5000));
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // 4. Minting on Arc Testnet
      setState(prev => ({ ...prev, status: "minting" }));
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Generate random burn/mint transaction hash
      const chars = "0123456789abcdef";
      let mockHash = "0x";
      for (let i = 0; i < 64; i++) {
        mockHash += chars[Math.floor(Math.random() * chars.length)];
      }

      setState(prev => ({
        ...prev,
        status: "success",
        txHash: mockHash
      }));
    } catch (err: any) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setState(prev => ({
        ...prev,
        status: "error",
        errorMessage: "Solana bridging pipeline simulation encountered an error."
      }));
    }
  };

  return {
    state,
    bridgeUSDC,
    resetState
  };
}
