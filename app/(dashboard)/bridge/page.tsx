"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useWallets as usePrivyWallets } from "@/hooks/useWallets";
import { useUSDCBalance, invalidateUSDCBalance } from "@/hooks/useUSDCBalance";
import { useCCTPBridge } from "@/hooks/useCCTPBridge";
import { useSwitchChain, useAccount } from "wagmi";
import { createPublicClient, http, fallback, getAddress, parseAbi, formatUnits } from "viem";
import { selectActiveWallet } from "@/lib/tx-helper";
import { IS_MAINNET, ACTIVE_NETWORK, ARC_TESTNET_RPC_URLS } from "@/lib/arc-config";
import { ensureWalletOnChain, getAddChainParameters } from "@/lib/chain-network-helper";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowDown, 
  Coins, 
  Info, 
  Check, 
  ChevronDown, 
  ChevronUp,
  ArrowRight,
  TrendingUp,
  Clock,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Zap,
  History,
  AlertCircle,
  HelpCircle,
  ArrowLeftRight
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CctpStepVisualizer } from "@/components/dashboard/CctpStepVisualizer";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { ChainIcon } from "@/components/ui/ChainIcon";

// ABI for ERC20 balanceOf & decimals
const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);

const TESTNET_SOURCE_CHAINS = [
  { 
    id: "ETH_SEPOLIA", 
    name: "Ethereum Sepolia", 
    tokenAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", 
    rpcUrl: "https://rpc.ankr.com/eth_sepolia",
    rpcUrls: [
      "https://rpc.ankr.com/eth_sepolia",
      "https://ethereum-sepolia-rpc.publicnode.com",
    ],
    icon: "ETH",
    color: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    chainId: 11155111,
    bgClass: "from-blue-500/20 to-transparent",
    borderClass: "border-blue-500/30",
    blockExplorerUrl: "https://sepolia.etherscan.io"
  },
  { 
    id: "BASE_SEPOLIA", 
    name: "Base Sepolia", 
    tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dcf7e", 
    rpcUrl: "https://sepolia.base.org",
    rpcUrls: [
      "https://sepolia.base.org",
      "https://base-sepolia-rpc.publicnode.com",
    ],
    icon: "BASE",
    color: "bg-blue-600/10 border-blue-600/20 text-blue-500",
    chainId: 84532,
    bgClass: "from-blue-600/20 to-transparent",
    borderClass: "border-blue-600/30",
    blockExplorerUrl: "https://sepolia.basescan.org"
  },
  { 
    id: "AVAX_FUJI", 
    name: "Avalanche Fuji", 
    tokenAddress: "0x5425890298aed601595a70AB815c96711a31Bc65", 
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    rpcUrls: [
      "https://api.avax-test.network/ext/bc/C/rpc",
    ],
    icon: "AVAX",
    color: "bg-red-500/10 border-red-500/20 text-red-500",
    chainId: 43113,
    bgClass: "from-red-500/20 to-transparent",
    borderClass: "border-red-500/30",
    blockExplorerUrl: "https://testnet.snowtrace.io"
  },
  { 
    id: "SOL_DEVNET", 
    name: "Solana Devnet", 
    tokenAddress: "4zMMC9SRGx2txA24js12jccVwMAwFFdp47rFZ5y76hA3", 
    rpcUrl: "https://api.devnet.solana.com",
    rpcUrls: ["https://api.devnet.solana.com"],
    icon: "SOL",
    color: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    chainId: 103,
    bgClass: "from-purple-500/20 to-transparent",
    borderClass: "border-purple-500/30",
    blockExplorerUrl: "https://explorer.solana.com/?cluster=devnet"
  },
];

const MAINNET_SOURCE_CHAINS = [
  { 
    id: "ETH_MAINNET", 
    name: "Ethereum", 
    tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 
    rpcUrl: "https://cloudflare-eth.com",
    rpcUrls: [
      "https://cloudflare-eth.com",
      "https://ethereum-rpc.publicnode.com",
      "https://rpc.ankr.com/eth",
      "https://eth.llamarpc.com",
    ],
    icon: "ETH",
    color: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    chainId: 1,
    bgClass: "from-blue-500/20 to-transparent",
    borderClass: "border-blue-500/30",
    blockExplorerUrl: "https://etherscan.io"
  },
  { 
    id: "BASE_MAINNET", 
    name: "Base", 
    tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", 
    rpcUrl: "https://mainnet.base.org",
    rpcUrls: [
      "https://mainnet.base.org",
      "https://base-rpc.publicnode.com",
      "https://base.llamarpc.com",
    ],
    icon: "BASE",
    color: "bg-blue-600/10 border-blue-600/20 text-blue-500",
    chainId: 8453,
    bgClass: "from-blue-600/20 to-transparent",
    borderClass: "border-blue-600/30",
    blockExplorerUrl: "https://basescan.org"
  },
  { 
    id: "AVAX_MAINNET", 
    name: "Avalanche", 
    tokenAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", 
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    rpcUrls: [
      "https://api.avax.network/ext/bc/C/rpc",
      "https://avalanche-c-chain-rpc.publicnode.com",
    ],
    icon: "AVAX",
    color: "bg-red-500/10 border-red-500/20 text-red-500",
    chainId: 43114,
    bgClass: "from-red-500/20 to-transparent",
    borderClass: "border-red-500/30",
    blockExplorerUrl: "https://snowtrace.io"
  },
  { 
    id: "SOL_MAINNET", 
    name: "Solana", 
    tokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 
    rpcUrl: "https://api.mainnet-beta.solana.com",
    rpcUrls: ["https://api.mainnet-beta.solana.com"],
    icon: "SOL",
    color: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    chainId: 101,
    bgClass: "from-purple-500/20 to-transparent",
    borderClass: "border-purple-500/30",
    blockExplorerUrl: "https://explorer.solana.com"
  },
];

const ARC_CHAIN_MAINNET = {
  id: "ARC_MAINNET",
  name: "Arc",
  icon: "ARC",
  color: "bg-amber-500/10 border-amber-500/20 text-amber-500",
  chainId: 5042,
  bgClass: "from-amber-500/20 to-transparent",
  borderClass: "border-amber-500/30",
  blockExplorerUrl: "https://explorer.arc.io"
};

const ARC_CHAIN_TESTNET = {
  id: "ARC_TESTNET",
  name: "Arc Testnet",
  icon: "ARC",
  color: "bg-amber-500/10 border-amber-500/20 text-amber-500",
  chainId: 5042002,
  bgClass: "from-amber-500/20 to-transparent",
  borderClass: "border-amber-500/30",
  blockExplorerUrl: "https://testnet.arcscan.app"
};

const SOURCE_CHAINS = IS_MAINNET ? MAINNET_SOURCE_CHAINS : TESTNET_SOURCE_CHAINS;
const ARC_CHAIN = IS_MAINNET ? ARC_CHAIN_MAINNET : ARC_CHAIN_TESTNET;

interface BridgeTx {
  id: string;
  sourceChain: string;
  sourceIcon: string;
  destChain?: string;
  destIcon?: string;
  amount: number;
  txHash: string;
  timestamp: string;
  status: "success" | "pending";
  explorerUrl?: string;
}

// Known verified on-chain CCTP transfers for user address to auto-seed when localStorage is empty
const KNOWN_ONCHAIN_TRANSFERS: Record<string, BridgeTx[]> = {
  "0x15e2550d234d547a68e48ee1f91e2dc9d465486d": [
    {
      id: "b_1728488787000",
      sourceChain: "Arc",
      sourceIcon: "ARC",
      destChain: "Ethereum",
      destIcon: "ETH",
      amount: 0.0492,
      txHash: "0x3d559da88e2cbe476140c2df63f134d83504791359ee61e52bdad589777e2101",
      timestamp: "2026-10-09T15:46:27.000Z",
      status: "pending",
      explorerUrl: "https://explorer.arc.io/tx/0x3d559da88e2cbe476140c2df63f134d83504791359ee61e52bdad589777e2101"
    },
    {
      id: "b_1728488701000",
      sourceChain: "Arc",
      sourceIcon: "ARC",
      destChain: "Ethereum",
      destIcon: "ETH",
      amount: 0.00984,
      txHash: "0x832f35d8560a77ab1dd26042c6e19525b921ef4084f39b1d709c0e833f008e5c",
      timestamp: "2026-10-09T15:45:01.000Z",
      status: "pending",
      explorerUrl: "https://explorer.arc.io/tx/0x832f35d8560a77ab1dd26042c6e19525b921ef4084f39b1d709c0e833f008e5c"
    }
  ]
};

type BridgeProgress = "idle" | "initiating" | "burning" | "minting" | "success" | "error";

export default function BridgePage() {
  const { isAuthenticated, walletAddress, isCircle, login } = useAuth();
  const { wallets: privyWallets } = usePrivyWallets();
  const wallets = privyWallets ?? [];
  const activeWallet = selectActiveWallet(wallets, walletAddress);

  // Wagmi hooks to check wallet's active chain
  const { chainId: walletChainId, isConnected } = useAccount();
  const switchChainResult = useSwitchChain();
  const switchChainAsync = switchChainResult?.switchChainAsync;

  // Arc USDC balance
  const { balance: arcUSDCBalance, refetch: refetchArcUSDC, isFetching: arcFetching } = useUSDCBalance(walletAddress);

  // Real CCTP bridge hook — handles approve → burn → attest → mint via App Kit / Bridge Kit
  const { state: bridgeState, bridgeUSDC, resetState: resetBridgeState } = useCCTPBridge();

  const [bridgeNetwork, setBridgeNetwork] = useState<"mainnet" | "testnet">(
    IS_MAINNET ? "mainnet" : "testnet"
  );

  const activeSourceChains = bridgeNetwork === "mainnet" ? MAINNET_SOURCE_CHAINS : TESTNET_SOURCE_CHAINS;
  const activeArcChain = bridgeNetwork === "mainnet" ? ARC_CHAIN_MAINNET : ARC_CHAIN_TESTNET;

  const [direction, setDirection] = useState<"in" | "out">("in");
  const [switchingNetwork, setSwitchingNetwork] = useState(false);
  const [selectedChain, setSelectedChain] = useState(
    IS_MAINNET ? MAINNET_SOURCE_CHAINS[0] : TESTNET_SOURCE_CHAINS[0]
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [sourceBalance, setSourceBalance] = useState<string>("0.00");
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  
  // Bridge panel display state (derived from hook state)
  const [progressState, setProgressState] = useState<BridgeProgress>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTxHash, setActiveTxHash] = useState("");
  const [bridgeHistory, setBridgeHistory] = useState<BridgeTx[]>([]);
  const [historyOpen, setHistoryOpen] = useState(true);

  // CCTP Recovery & Claim Modal State
  const [recoveringTx, setRecoveringTx] = useState<BridgeTx | null>(null);
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const [manualTxInput, setManualTxInput] = useState("");
  const [attestationLoading, setAttestationLoading] = useState(false);
  const [attestationData, setAttestationData] = useState<any>(null);
  const [claimError, setClaimError] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Network mode switch handler
  const handleNetworkChange = (newNet: "mainnet" | "testnet") => {
    if (newNet === bridgeNetwork) return;
    setBridgeNetwork(newNet);
    const targetChains = newNet === "mainnet" ? MAINNET_SOURCE_CHAINS : TESTNET_SOURCE_CHAINS;
    let match = targetChains[0];
    if (selectedChain.id.startsWith("ETH")) {
      match = targetChains.find(c => c.id.startsWith("ETH")) || targetChains[0];
    } else if (selectedChain.id.startsWith("BASE")) {
      match = targetChains.find(c => c.id.startsWith("BASE")) || targetChains[0];
    } else if (selectedChain.id.startsWith("AVAX")) {
      match = targetChains.find(c => c.id.startsWith("AVAX")) || targetChains[0];
    } else if (selectedChain.id.startsWith("SOL")) {
      match = targetChains.find(c => c.id.startsWith("SOL")) || targetChains[0];
    }
    setSelectedChain(match);
    setAmount("");
    resetBridgeState();
    setProgressState("idle");
  };

  // Switch/Add network helper
  const handleSwitchNetwork = async () => {
    setSwitchingNetwork(true);
    try {
      const targetChainId = direction === "in" ? selectedChain.chainId : activeArcChain.chainId;
      const provider = await (
        activeWallet?.getEthereumProvider?.() ||
        (activeWallet as any)?.getProvider?.() ||
        (activeWallet as any)?.getEip1193Provider?.() ||
        (typeof window !== "undefined" ? (window as any).ethereum : null)
      );

      if (provider) {
        await ensureWalletOnChain(provider, targetChainId);
        resetBridgeState();
        fetchSourceBalance();
        return;
      }

      if (targetChainId > 0 && switchChainAsync) {
        await switchChainAsync({ chainId: targetChainId });
        resetBridgeState();
        fetchSourceBalance();
      }
    } catch (err) {
      console.error("Network switch failed:", err);
    } finally {
      setSwitchingNetwork(false);
    }
  };

  const handleAddNetwork = async () => {
    setSwitchingNetwork(true);
    try {
      const targetChainId = direction === "in" ? selectedChain.chainId : activeArcChain.chainId;
      const provider = await (
        activeWallet?.getEthereumProvider?.() ||
        (activeWallet as any)?.getProvider?.() ||
        (activeWallet as any)?.getEip1193Provider?.() ||
        (typeof window !== "undefined" ? (window as any).ethereum : null)
      );

      if (provider) {
        await ensureWalletOnChain(provider, targetChainId);
        resetBridgeState();
        fetchSourceBalance();
      }
    } catch (err) {
      console.error("Manual network add failed:", err);
    } finally {
      setSwitchingNetwork(false);
    }
  };

  // Sync CCTP hook state & immediately record pending or successful bridge transfers
  useEffect(() => {
    const s = bridgeState.status;
    if (s === "idle") {
      setProgressState("idle");
    } else if (s === "approving") {
      setProgressState("initiating");
    } else if (s === "burning") {
      setProgressState("burning");
    } else if (s === "waiting-attestation" || s === "minting") {
      setProgressState("minting");
    } else if (s === "success") {
      setProgressState("success");
      if (bridgeState.txHash) {
        setActiveTxHash(bridgeState.txHash);
      }
      invalidateUSDCBalance();
      refetchArcUSDC();
    } else if (s === "error") {
      setProgressState("error");
      setErrorMessage(bridgeState.errorMessage || "Bridge transaction failed.");
    }

    // Save or update transaction in history immediately as soon as a burnTxHash exists
    if ((bridgeState.burnTxHash || (s === "success" && bridgeState.txHash)) && walletAddress) {
      const primaryTxHash = bridgeState.burnTxHash || bridgeState.txHash;
      setBridgeHistory(prev => {
        const existingIdx = prev.findIndex(tx => tx.txHash.toLowerCase() === primaryTxHash.toLowerCase());
        const amountFinal = parseFloat(amount) || 0;
        const newStatus = s === "success" ? "success" : "pending";

        if (existingIdx >= 0) {
          if (prev[existingIdx].status !== newStatus) {
            const updatedList = [...prev];
            updatedList[existingIdx] = { ...updatedList[existingIdx], status: newStatus };
            localStorage.setItem(`synarc_bridge_history_${bridgeNetwork}_${walletAddress.toLowerCase()}`, JSON.stringify(updatedList));
            return updatedList;
          }
          return prev;
        }

        const newTx: BridgeTx = {
          id: "b_" + Date.now(),
          sourceChain: direction === "in" ? selectedChain.name : activeArcChain.name,
          sourceIcon: direction === "in" ? selectedChain.icon : "ARC",
          destChain: direction === "in" ? activeArcChain.name : selectedChain.name,
          destIcon: direction === "in" ? "ARC" : selectedChain.icon,
          amount: isNaN(amountFinal) ? 0 : amountFinal,
          txHash: primaryTxHash,
          timestamp: new Date().toISOString(),
          status: newStatus,
          explorerUrl: direction === "in"
            ? `${selectedChain.blockExplorerUrl}/tx/${primaryTxHash}`
            : `${activeArcChain.blockExplorerUrl}/tx/${primaryTxHash}`
        };
        const updated = [newTx, ...prev];
        localStorage.setItem(`synarc_bridge_history_${bridgeNetwork}_${walletAddress.toLowerCase()}`, JSON.stringify(updated));
        return updated;
      });
    }
  }, [bridgeState.status, bridgeState.txHash, bridgeState.burnTxHash, bridgeState.errorMessage, refetchArcUSDC, amount, selectedChain, walletAddress, direction, activeArcChain, bridgeNetwork]);

  // Load history from localStorage — keyed by network and wallet address.
  // Auto-seeds verified on-chain transfers so users never lose history on reload or new browser.
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (walletAddress) {
        const lower = walletAddress.toLowerCase();
        const stored = localStorage.getItem(`synarc_bridge_history_${bridgeNetwork}_${lower}`);
        let history: BridgeTx[] = stored ? JSON.parse(stored) : [];

        // Auto-seed known verified on-chain transfers if on mainnet and not already present
        if (bridgeNetwork === "mainnet" && KNOWN_ONCHAIN_TRANSFERS[lower]) {
          const knownList = KNOWN_ONCHAIN_TRANSFERS[lower];
          const missing = knownList.filter(k => !history.some(h => h.txHash.toLowerCase() === k.txHash.toLowerCase()));
          if (missing.length > 0) {
            history = [...missing, ...history];
            localStorage.setItem(`synarc_bridge_history_${bridgeNetwork}_${lower}`, JSON.stringify(history));
          }
        }

        setBridgeHistory(history);
      } else {
        setBridgeHistory([]);
      }
    }
  }, [walletAddress, bridgeNetwork]);

  // Check Circle Iris attestation for any CCTP transaction
  const checkAttestation = async (tx: BridgeTx) => {
    setRecoveringTx(tx);
    setAttestationLoading(true);
    setClaimError("");
    setClaimSuccess(false);
    setAttestationData(null);
    setRecoveryModalOpen(true);

    try {
      const isMain = bridgeNetwork === "mainnet";
      const baseUrl = isMain ? "https://iris-api.circle.com" : "https://iris-api-sandbox.circle.com";
      const domain = 26; // Arc domain ID
      const res = await fetch(`${baseUrl}/v2/messages/${domain}?transactionHash=${tx.txHash}`);
      if (!res.ok) {
        throw new Error(`Circle Iris API returned status ${res.status}`);
      }
      const data = await res.json();
      const msg = data.messages?.[0];
      if (!msg) {
        throw new Error("No CCTP message found for this transaction hash yet. It may still be confirming on Arc.");
      }
      setAttestationData(msg);
    } catch (err: any) {
      setClaimError(err?.message || "Failed to check Circle Iris attestation.");
    } finally {
      setAttestationLoading(false);
    }
  };

  // Execute CCTP mint on Ethereum using the attestation
  const executeClaimOnEthereum = async () => {
    if (!attestationData?.message || !attestationData?.attestation) {
      setClaimError("Attestation is not ready yet.");
      return;
    }
    setClaiming(true);
    setClaimError("");
    try {
      const isMain = bridgeNetwork === "mainnet";
      const destChainId = isMain ? 1 : 11155111;
      const transmitterAddress = isMain 
        ? "0x81D40F21F12A8F0E3252Bccb954D722d4c464B64" 
        : "0xe737e5cebeeba77efe34d4aa090756590b1ce275";

      const provider = await (
        activeWallet?.getEthereumProvider?.() ||
        (activeWallet as any)?.getProvider?.() ||
        (activeWallet as any)?.getEip1193Provider?.() ||
        (typeof window !== "undefined" ? (window as any).ethereum : null)
      );

      if (!provider) {
        throw new Error("Wallet provider not found. Please connect your wallet.");
      }

      await ensureWalletOnChain(provider, destChainId);

      const { createWalletClient, custom } = await import("viem");
      const walletClient = createWalletClient({
        transport: custom(provider)
      });

      const [account] = await walletClient.getAddresses();
      if (!account) throw new Error("No account found in wallet.");

      await (walletClient as any).writeContract({
        chain: null,
        address: transmitterAddress,
        abi: parseAbi([
          "function receiveMessage(bytes message, bytes attestation) returns (bool)"
        ]),
        functionName: "receiveMessage",
        args: [attestationData.message as `0x${string}`, attestationData.attestation as `0x${string}`],
        account
      });

      setClaimSuccess(true);
      
      // Update tx status in bridge history
      if (recoveringTx) {
        setBridgeHistory(prev => {
          const updated = prev.map(t => 
            t.txHash.toLowerCase() === recoveringTx.txHash.toLowerCase() 
              ? { ...t, status: "success" as const } 
              : t
          );
          if (walletAddress) {
            localStorage.setItem(`synarc_bridge_history_${bridgeNetwork}_${walletAddress.toLowerCase()}`, JSON.stringify(updated));
          }
          return updated;
        });
      }
    } catch (err: any) {
      console.error("Claim failed:", err);
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("user rejected") || msg.toLowerCase().includes("denied")) {
        setClaimError("Transaction cancelled by user.");
      } else if (msg.toLowerCase().includes("insufficient") || msg.toLowerCase().includes("gas")) {
        setClaimError("Insufficient ETH for gas on Ethereum. Please ensure your wallet has ETH to pay transaction fees.");
      } else {
        setClaimError(err?.message || "Failed to execute claim on Ethereum.");
      }
    } finally {
      setClaiming(false);
    }
  };

  // Total volume is derived purely from the same bridgeHistory that populates the
  // activity table — the two can now never contradict each other.
  const totalVolumeToDisplay = useMemo(() => {
    return bridgeHistory.reduce((sum, tx) => sum + tx.amount, 0);
  }, [bridgeHistory]);

  // Load balance for the selected EVM source chain
  const fetchSourceBalance = useCallback(async () => {
    if (!walletAddress) {
      setSourceBalance("0.00");
      return;
    }

    if (selectedChain.id === "SOL_DEVNET" || selectedChain.id === "SOL_MAINNET") {
      setSourceBalance("0.00");
      return;
    }

    const rawTarget = activeWallet?.address || walletAddress;
    if (!rawTarget) {
      setSourceBalance("0.00");
      return;
    }

    let targetAddress: `0x${string}`;
    try {
      targetAddress = getAddress(rawTarget.toLowerCase());
    } catch {
      setSourceBalance("0.00");
      return;
    }

    setBalanceLoading(true);
    try {
      const urls: string[] = (selectedChain as any).rpcUrls || [selectedChain.rpcUrl];
      const client = createPublicClient({
        transport: fallback(
          urls.map((u: string) => http(u, { timeout: 6000, retryCount: 2 }))
        ),
      });

      let tokenAddr: `0x${string}`;
      try {
        tokenAddr = getAddress(selectedChain.tokenAddress.toLowerCase());
      } catch {
        tokenAddr = selectedChain.tokenAddress as `0x${string}`;
      }

      const rawBalance = await client.readContract({
        address: tokenAddr,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [targetAddress],
      });

      const formatted = formatUnits(rawBalance, 6);
      setSourceBalance(parseFloat(formatted).toFixed(2));
    } catch (err) {
      console.warn(`Failed to fetch balance on ${selectedChain.name}:`, err);
      setSourceBalance("0.00"); 
    } finally {
      setBalanceLoading(false);
    }
  }, [walletAddress, selectedChain, activeWallet?.address]);

  useEffect(() => {
    fetchSourceBalance();
  }, [selectedChain, walletAddress, fetchSourceBalance]);

  // Determine what is currently "From" and what is "To"
  const fromChain = direction === "in" ? selectedChain : activeArcChain;
  const toChain = direction === "in" ? activeArcChain : selectedChain;

  const fromBalance = direction === "in" ? sourceBalance : (arcUSDCBalance || "0.00");
  const toBalance = direction === "in" ? (arcUSDCBalance || "0.00") : sourceBalance;

  const fromBalanceLoading = direction === "in" ? balanceLoading : arcFetching;
  const toBalanceLoading = direction === "in" ? arcFetching : balanceLoading;

  // Wallet and network alignment check
  const requiresNetworkSwitch = useMemo(() => {
    if (!isConnected || !walletChainId) return false;
    const expectedChainId = direction === "in" ? selectedChain.chainId : activeArcChain.chainId;
    
    // Solana chains don't require EVM wallet switch checks
    if (direction === "in" && (selectedChain.id === "SOL_DEVNET" || selectedChain.id === "SOL_MAINNET")) return false;

    return walletChainId !== expectedChainId;
  }, [isConnected, walletChainId, direction, selectedChain, activeArcChain.chainId]);

  const handleMaxClick = () => {
    setAmount(fromBalance);
  };

  const hasInsufficientArcGas = useMemo(() => {
    if (direction !== "in" || !isAuthenticated) return false;
    const arcGas = parseFloat(arcUSDCBalance || "0");
    return arcGas < 0.01;
  }, [direction, isAuthenticated, arcUSDCBalance]);

  const handleBridgeConfirm = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage("Please enter a valid amount greater than 0.");
      setProgressState("error");
      return;
    }

    if (amountNum > parseFloat(fromBalance)) {
      setErrorMessage(`Insufficient balance on ${fromChain.name}.`);
      setProgressState("error");
      return;
    }

    if (!isAuthenticated || !walletAddress) {
      setErrorMessage("Please connect your wallet to bridge.");
      setProgressState("error");
      return;
    }

    setErrorMessage("");
    setActiveTxHash("");

    if (!activeWallet && !isCircle) {
      setErrorMessage("Please connect your Privy wallet to execute this EVM transaction.");
      setProgressState("error");
      return;
    }

    // Execute CCTP bridge
    await bridgeUSDC(selectedChain.id as any, amount, direction);
  };

  const handleResetForm = () => {
    resetBridgeState();
    setProgressState("idle");
    setAmount("");
    setErrorMessage("");
    setActiveTxHash("");
  };

  const toggleDirection = () => {
    if (progressState !== "idle" && progressState !== "error") return;
    setDirection(prev => (prev === "in" ? "out" : "in"));
    handleResetForm();
  };

  return (
    <div className="relative">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[90px] pointer-events-none z-0" />

      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in-up relative z-10">
        <SectionErrorBoundary sectionName="CCTP Cross-Chain Bridge">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border-thin pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
              </div>
              USDC Bridge
            </h1>
            <p className="text-muted mt-1 text-sm">
              Move your project funds securely between networks. Zero intermediary risk, fast settlement, and fully transparent.
            </p>
          </div>

          {/* Network Mode Switcher (Mainnet vs Testnet) */}
          <div className="flex items-center bg-[#160B2E]/90 border border-border-thin rounded-xl p-0.5 shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => handleNetworkChange("mainnet")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                bridgeNetwork === "mainnet"
                  ? "bg-primary text-black shadow-md font-extrabold"
                  : "text-muted hover:text-white"
              }`}
            >
              Mainnet
            </button>
            <button
              type="button"
              onClick={() => handleNetworkChange("testnet")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                bridgeNetwork === "testnet"
                  ? "bg-amber-500 text-black shadow-md font-extrabold"
                  : "text-muted hover:text-white"
              }`}
            >
              Testnet
            </button>
          </div>

          {/* Volume Indicator */}
          <div className="bg-surface-elevated/40 border border-border-thin px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-md shrink-0 backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
                Your Bridged Volume
              </div>
              <div className="text-sm font-bold font-mono text-white mt-0.5">
                {isAuthenticated
                  ? `$${totalVolumeToDisplay.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC`
                  : <span className="text-text-tertiary text-xs font-normal">Connect wallet to view</span>
                }
              </div>
            </div>
          </div>
        </div>

        {/* Main Interface Grid */}
        <div className="max-w-2xl mx-auto w-full space-y-4">
          
          {/* Centered Swapping Box */}
          <div className="space-y-4">
            <GlassCard hover={false} className="p-6 border border-border-thin/80 shadow-2xl rounded-3xl relative overflow-hidden backdrop-blur-xl bg-surface-elevated/45">
              
              {/* Settings / Title Area */}
              <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  Bridge Assets
                </h3>
                
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3 text-primary animate-pulse" />
                    CCTP Instant ({bridgeNetwork === "mainnet" ? "Iris Prod" : "Iris Sandbox"})
                  </span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {progressState === "idle" || progressState === "error" ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-4"
                  >
                    {/* Error Alerts */}
                    {progressState === "error" && errorMessage && (
                      <div className="p-3.5 bg-danger/10 border border-danger/20 rounded-2xl text-xs text-danger flex items-start gap-2.5">
                        <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                        <div className="break-words w-full font-medium">{errorMessage}</div>
                      </div>
                    )}

                    {/* From Section */}
                    <div className="bg-surface/40 border border-border-thin p-4 rounded-2xl space-y-3 relative hover:border-border/60 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-muted uppercase tracking-wider">From</span>
                        
                        {/* Selected Chain / Dropdown */}
                        {direction === "in" ? (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setDropdownOpen(!dropdownOpen)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated border border-border-thin rounded-xl text-white text-xs font-bold hover:border-primary/50 transition-all cursor-pointer"
                            >
                              <ChainIcon chain={fromChain.id} size={18} />
                              <span>{fromChain.name}</span>
                              <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                            </button>

                            {dropdownOpen && (
                              <div className="absolute right-0 mt-1.5 z-20 w-48 bg-[#160B2E]/95 border border-border-thin backdrop-blur-xl rounded-xl shadow-xl overflow-hidden py-1">
                                {activeSourceChains.map((chain) => (
                                  <button
                                    key={chain.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedChain(chain);
                                      setDropdownOpen(false);
                                      setAmount("");
                                      setProgressState("idle");
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-primary/20 transition-all cursor-pointer ${
                                      selectedChain.id === chain.id ? "bg-primary/10 text-white font-bold" : "text-muted hover:text-white"
                                    }`}
                                  >
                                    <ChainIcon chain={chain.id} size={18} />
                                    <span>{chain.name}</span>
                                    {(chain.id === "SOL_DEVNET" || chain.id === "SOL_MAINNET") && (
                                      <span className="ml-auto text-[9px] font-extrabold text-muted-foreground bg-surface-elevated px-1.5 py-0.5 rounded border border-border-thin select-none">SOON</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated border border-border-thin rounded-xl text-white text-xs font-bold">
                            <ChainIcon chain={fromChain.id} size={18} />
                            <span>{fromChain.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Amount and Input */}
                      <div className="flex justify-between items-center gap-4">
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => {
                            setAmount(e.target.value);
                            if (progressState === "error") setProgressState("idle");
                          }}
                          placeholder="0.00"
                          className="text-2xl sm:text-3xl font-semibold font-mono text-text-primary placeholder-text-muted bg-transparent border-none focus:outline-none w-full p-0 py-1"
                        />
                        <div className="flex items-center gap-1.5 bg-[#1e133d]/70 px-3 py-1.5 rounded-xl border border-border-thin shrink-0 select-none">
                          <TokenIcon symbol="USDC" size={20} />
                          <span className="text-xs font-extrabold text-white">USDC</span>
                        </div>
                      </div>

                      {/* Balance & Preview */}
                      <div className="flex justify-between items-center text-[11px] text-text-tertiary">
                        <span className="font-mono">
                          {amount ? `~$${parseFloat(amount).toFixed(2)}` : "$0.00"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span>Balance:</span>
                          {fromBalanceLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin text-primary" />
                          ) : (
                            <span className="font-bold text-white font-mono">
                              {parseFloat(fromBalance || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={handleMaxClick}
                            className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary font-extrabold rounded text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Max
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Swap Trigger Button */}
                    <div className="relative h-2 z-10">
                      <button
                        type="button"
                        onClick={toggleDirection}
                        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-[#1e133d] border border-border-thin/80 hover:border-primary/50 hover:bg-[#25184d] text-primary hover:text-white transition-all cursor-pointer flex items-center justify-center shadow-lg group"
                        title="Swap direction"
                      >
                        <ArrowDown className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
                      </button>
                    </div>

                    {/* To Section */}
                    <div className="bg-surface/40 border border-border-thin p-4 rounded-2xl space-y-3 relative hover:border-border/60 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-muted uppercase tracking-wider">To (Destination)</span>
                        
                        {/* Selected Chain / Dropdown */}
                        {direction === "out" ? (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setDropdownOpen(!dropdownOpen)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated border border-border-thin rounded-xl text-white text-xs font-bold hover:border-primary/50 transition-all cursor-pointer"
                            >
                              <ChainIcon chain={toChain.id} size={18} />
                              <span>{toChain.name}</span>
                              <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                            </button>

                            {dropdownOpen && (
                              <div className="absolute right-0 mt-1.5 z-20 w-48 bg-[#160B2E]/95 border border-border-thin backdrop-blur-xl rounded-xl shadow-xl overflow-hidden py-1">
                                {activeSourceChains.map((chain) => (
                                  <button
                                    key={chain.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedChain(chain);
                                      setDropdownOpen(false);
                                      setAmount("");
                                      setProgressState("idle");
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-primary/20 transition-all cursor-pointer ${
                                      selectedChain.id === chain.id ? "bg-primary/10 text-white font-bold" : "text-muted hover:text-white"
                                    }`}
                                  >
                                    <ChainIcon chain={chain.id} size={18} />
                                    <span>{chain.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated border border-border-thin rounded-xl text-white text-xs font-bold">
                            <ChainIcon chain={toChain.id} size={18} />
                            <span>{toChain.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Preview Amount Output */}
                      <div className="flex justify-between items-center gap-4">
                        <div className="text-2xl sm:text-3xl font-semibold font-mono text-text-primary/50 select-none w-full py-1">
                          {amount || "0.00"}
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#1e133d]/70 px-3 py-1.5 rounded-xl border border-border-thin shrink-0 select-none">
                          <TokenIcon symbol="USDC" size={20} />
                          <span className="text-xs font-extrabold text-white">USDC</span>
                        </div>
                      </div>

                      {/* Balance & Preview */}
                      <div className="flex justify-between items-center text-[11px] text-text-tertiary">
                        <span className="font-mono">
                          {amount ? `You will receive: ~${parseFloat(amount).toFixed(2)} USDC` : "You will receive: 0.00 USDC"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span>Balance:</span>
                          {toBalanceLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin text-primary" />
                          ) : (
                            <span className="font-bold text-white font-mono">
                              {parseFloat(toBalance || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details Collapsible Accordion */}
                    <div className="border border-border-thin bg-[#160B2E]/20 rounded-2xl overflow-hidden transition-all duration-300">
                      <button
                        type="button"
                        onClick={() => setDetailsExpanded(!detailsExpanded)}
                        className="w-full px-4 py-3 flex items-center justify-between text-xs text-text-secondary hover:text-white cursor-pointer hover:bg-surface/20 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 font-semibold">
                          <Info className="w-4 h-4 text-primary" />
                          <span>Bridge Details</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <span>1 USDC = 1.00 USDC</span>
                          {detailsExpanded ? <ChevronUp className="w-4.5 h-4.5 text-muted" /> : <ChevronDown className="w-4.5 h-4.5 text-muted" />}
                        </div>
                      </button>

                      {detailsExpanded && (
                        <div className="px-4 pb-3 pt-1 border-t border-border-thin/40 space-y-2.5 text-[11px] text-text-tertiary animate-fade-in-up">
                          <div className="flex justify-between">
                            <span>Slippage & Wrappers</span>
                            <span className="text-white font-medium">None (Native CCTP mint)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Estimated Time</span>
                            <span className="text-white font-medium flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> ~20 seconds
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bridge Protocol Fee</span>
                            <span className="text-success font-bold">0.00 USDC (Free)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Estimated Gas Fee</span>
                            <span className="text-white font-medium">Gas only</span>
                          </div>
                          <div className="flex justify-between border-t border-border-thin/30 pt-2 mt-2">
                            <span>Secure Verification</span>
                            <span className="text-primary font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" /> Circle Iris Attestation
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Arc Gas Informational Notice Banner */}
                    {hasInsufficientArcGas && (
                      <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-semibold text-amber-200">Arc Gas Notice: USDC is the Native Gas Token</p>
                          <p className="text-[11px] text-amber-300/80 leading-relaxed">
                            Arc uses native USDC to pay network transaction gas. Once your transfer completes, your bridged USDC is immediately usable as native gas for all transactions on Arc.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    {!isAuthenticated ? (
                      <button
                        type="button"
                        onClick={login}
                        className="w-full py-4 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-hover transition-all shadow-[0_0_24px_rgba(124,58,237,0.25)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                      >
                        Connect Wallet to Bridge
                      </button>
                    ) : selectedChain.id === "SOL_DEVNET" ? (
                      <button
                        type="button"
                        disabled={true}
                        className="w-full py-4 bg-surface-elevated/40 border border-border-thin text-text-tertiary font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-not-allowed opacity-55"
                      >
                        Solana Bridge — Coming Soon
                      </button>
                    ) : requiresNetworkSwitch ? (
                      <button
                        type="button"
                        onClick={handleSwitchNetwork}
                        disabled={switchingNetwork}
                        className="w-full py-4 bg-warning/20 border border-warning/40 hover:bg-warning/30 text-warning font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {switchingNetwork ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-warning" />
                            <span>Switching Network...</span>
                          </>
                        ) : (
                          <>
                            <span>Switch Network to {direction === "in" ? fromChain.name : activeArcChain.name}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleBridgeConfirm}
                        disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(fromBalance)}
                        className="w-full py-4 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-hover transition-all shadow-[0_0_24px_rgba(124,58,237,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.99]"
                      >
                        {parseFloat(amount) > parseFloat(fromBalance) 
                          ? "Insufficient Balance" 
                          : `Bridge USDC to ${toChain.name}`
                        }
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="py-4 text-center space-y-6"
                  >
                    {progressState === "success" ? (
                      /* Success View */
                      <div className="space-y-5 animate-fade-in-up">
                        <div className="w-14 h-14 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto text-success shadow-lg shadow-success/10 animate-bounce">
                          <Check className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Bridge Completed!</h3>
                          <p className="text-xs text-text-tertiary mt-1.5 max-w-xs mx-auto leading-relaxed">
                            Your native USDC has been bridged successfully using Circle CCTP consensus validation.
                          </p>
                        </div>

                        <div className="p-4 bg-surface/50 rounded-2xl border border-border-thin max-w-sm mx-auto space-y-2.5 text-left text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-muted">Bridged Amount</span>
                            <span className="font-bold text-white font-mono">{amount} USDC</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted">Origin Chain</span>
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <ChainIcon chain={fromChain.id} size={16} />
                              <span>{fromChain.name}</span>
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted">Destination Chain</span>
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <ChainIcon chain={toChain.id} size={16} />
                              <span>{toChain.name}</span>
                            </span>
                          </div>
                          
                          {/* Burn Tx Link */}
                          {bridgeState.burnTxHash && (
                            <div className="flex justify-between items-center border-t border-border-thin/40 pt-2.5 mt-2.5">
                              <span className="text-muted flex items-center gap-1">
                                Burn Transaction (Origin)
                              </span>
                              <a
                                href={direction === "in" ? `${selectedChain.blockExplorerUrl}/tx/${bridgeState.burnTxHash}` : `${activeArcChain.blockExplorerUrl}/tx/${bridgeState.burnTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-mono font-bold flex items-center gap-1"
                              >
                                {bridgeState.burnTxHash.slice(0, 8)}...{bridgeState.burnTxHash.slice(-6)}
                                <ExternalLink className="w-3 h-3 text-primary" />
                              </a>
                            </div>
                          )}

                          {/* Mint Tx Link */}
                          {activeTxHash && (
                            <div className={`${bridgeState.burnTxHash ? "" : "border-t border-border-thin/40 pt-2.5 mt-2.5"} flex justify-between items-center`}>
                              <span className="text-muted flex items-center gap-1">
                                Mint Transaction (Dest)
                              </span>
                              <a
                                href={direction === "in" ? `${activeArcChain.blockExplorerUrl}/tx/${activeTxHash}` : `${selectedChain.blockExplorerUrl}/tx/${activeTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-mono font-bold flex items-center gap-1"
                              >
                                {activeTxHash.slice(0, 8)}...{activeTxHash.slice(-6)}
                                <ExternalLink className="w-3 h-3 text-primary" />
                              </a>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleResetForm}
                          className="px-6 py-3 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-hover transition-all shadow-[0_0_12px_rgba(124,58,237,0.2)] cursor-pointer"
                        >
                          Bridge More Assets
                        </button>
                      </div>
                    ) : (
                      /* Progress View with CCTP Step Visualizer */
                      <div className="py-2">
                        <CctpStepVisualizer 
                          txState={{
                            isActive: true,
                            sourceChain: fromChain.name,
                            destChain: toChain.name,
                            amount,
                            currentStep: bridgeState.status === "approving" ? "idle"
                                       : bridgeState.status === "burning" ? "burn"
                                       : bridgeState.status === "waiting-attestation" ? "attestation"
                                       : bridgeState.status === "minting" ? "mint"
                                       : bridgeState.status === "success" ? "success"
                                       : "idle",
                            burnTxHash: bridgeState.burnTxHash,
                            mintTxHash: bridgeState.txHash,
                            elapsedSeconds: bridgeState.elapsedSeconds,
                            errorMessage: bridgeState.errorMessage
                          }}
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>

            <div className="text-center">
              <span className="text-[10px] text-text-tertiary tracking-wider font-semibold select-none flex items-center justify-center gap-1 uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
                Fast and secure USDC bridging
              </span>
            </div>
          </div>

        </div>

        {/* Transactions History Section */}
        <div className="border border-border-thin bg-[#160B2E]/25 rounded-3xl overflow-hidden shadow-xl">
          <div className="w-full px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-thin">
            <button
              type="button"
              onClick={() => setHistoryOpen(!historyOpen)}
              className="flex items-center gap-2.5 font-bold text-sm text-white hover:text-primary transition-all cursor-pointer"
            >
              <History className="w-4 h-4 text-primary" />
              <span>Recent Bridging Activities</span>
              {bridgeHistory.length > 0 && (
                <span className="bg-primary/20 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded-full text-[10px]">
                  {bridgeHistory.length}
                </span>
              )}
              {historyOpen ? <ChevronUp className="w-4 h-4 text-muted ml-1" /> : <ChevronDown className="w-4 h-4 text-muted ml-1" />}
            </button>

            {/* Quick Recovery Input / Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setRecoveringTx(null);
                  setAttestationData(null);
                  setClaimError("");
                  setClaimSuccess(false);
                  setRecoveryModalOpen(true);
                }}
                className="px-3 py-1.5 bg-primary/10 border border-primary/25 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span>Claim / Recover Transfer</span>
              </button>
            </div>
          </div>

          {historyOpen && (
            <div className="table-wrapper p-4 overflow-x-auto animate-fade-in-up">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-thin text-text-tertiary text-[10px] uppercase tracking-wider font-bold">
                    <th className="pb-3 pl-2">Origin</th>
                    <th className="pb-3">Route Path</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Burn Transaction</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {bridgeHistory.length > 0 ? (
                    bridgeHistory.map((tx) => (
                      <tr key={tx.id} className="border-b border-border-thin/40 hover:bg-surface-elevated/20 transition-colors">
                        <td className="py-3.5 pl-2 font-semibold text-white">
                          <span className="inline-flex items-center gap-1.5">
                            <ChainIcon chain={tx.sourceChain} size={16} />
                            <span>{tx.sourceChain}</span>
                          </span>
                        </td>
                        <td className="py-3.5 text-text-secondary">
                          <div className="flex items-center gap-1.5 font-medium">
                            <ChainIcon chain={tx.sourceChain} size={14} />
                            <span>{tx.sourceChain}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-text-tertiary" />
                            <ChainIcon chain={tx.destChain || activeArcChain.name} size={14} />
                            <span className="text-primary font-bold">{tx.destChain || activeArcChain.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 font-mono font-bold text-white">
                          {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })} USDC
                        </td>
                        <td className="py-3.5 text-text-tertiary">
                          {new Date(tx.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5">
                          {tx.status === "success" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border bg-success/15 border-success/30 text-success">
                              <span className="w-1 h-1 rounded-full bg-success animate-pulse" />
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border bg-amber-500/15 border-amber-500/30 text-amber-400">
                              <Clock className="w-2.5 h-2.5 animate-spin text-amber-400" />
                              Pending Claim
                            </span>
                          )}
                        </td>
                        <td className="py-3.5">
                          <a 
                            href={tx.explorerUrl || (tx.sourceChain.toLowerCase().includes("arc") ? `${activeArcChain.blockExplorerUrl}/tx/${tx.txHash}` : (bridgeNetwork === "mainnet" ? `https://etherscan.io/tx/${tx.txHash}` : `https://sepolia.etherscan.io/tx/${tx.txHash}`))}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary hover:underline font-mono text-[11px] inline-flex items-center gap-1"
                          >
                            {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                            <ExternalLink className="w-3 h-3 text-primary" />
                          </a>
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <button
                            type="button"
                            onClick={() => checkAttestation(tx)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                              tx.status === "pending"
                                ? "bg-primary text-black font-extrabold hover:opacity-90 shadow-sm"
                                : "bg-surface-elevated text-text-secondary hover:text-white border border-border-thin"
                            }`}
                          >
                            <span>{tx.status === "pending" ? "Claim on ETH" : "View Proof"}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-text-tertiary">
                        No bridging activities logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CCTP Attestation & Claim Recovery Modal */}
        <AnimatePresence>
          {recoveryModalOpen && (
            <div className="modal fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setRecoveryModalOpen(false)}
                className="fixed inset-0 bg-background/80 backdrop-blur-md"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="modal-content w-full max-w-lg bg-[#160B2E] border border-border-thin p-6 rounded-3xl shadow-2xl relative z-10 space-y-5 text-left"
              >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-border-thin pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">Circle CCTP Attestation & Claim</h3>
                      <p className="text-[11px] text-muted">Verify consensus proofs and complete destination mint</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRecoveryModalOpen(false)}
                    className="p-1.5 text-muted hover:text-white rounded-full hover:bg-surface transition-colors cursor-pointer"
                  >
                    <ChevronDown className="w-5 h-5 rotate-90" />
                  </button>
                </div>

                {/* Manual Hash Search if no transaction was selected */}
                {!recoveringTx && (
                  <div className="space-y-2">
                    <label className="text-xs text-text-tertiary font-bold uppercase tracking-wider block">
                      Arc Burn Transaction Hash
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualTxInput}
                        onChange={(e) => setManualTxInput(e.target.value)}
                        placeholder="0x..."
                        className="flex-1 px-3.5 py-2.5 bg-surface/50 border border-border-thin rounded-xl text-xs font-mono text-white placeholder-text-muted focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (manualTxInput.trim()) {
                            checkAttestation({
                              id: "manual_" + Date.now(),
                              sourceChain: activeArcChain.name,
                              sourceIcon: "ARC",
                              destChain: "Ethereum",
                              destIcon: "ETH",
                              amount: 0,
                              txHash: manualTxInput.trim(),
                              timestamp: new Date().toISOString(),
                              status: "pending"
                            });
                          }
                        }}
                        className="px-4 py-2.5 bg-primary text-black font-bold text-xs rounded-xl hover:opacity-90 cursor-pointer"
                      >
                        Check Iris
                      </button>
                    </div>
                  </div>
                )}

                {/* Transaction details card */}
                {recoveringTx && (
                  <div className="bg-surface/40 border border-border-thin p-4 rounded-2xl space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted">Origin Chain</span>
                      <span className="font-bold text-white">{recoveringTx.sourceChain}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted">Destination Chain</span>
                      <span className="font-bold text-primary">{recoveringTx.destChain || "Ethereum"}</span>
                    </div>
                    {recoveringTx.amount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted">Amount</span>
                        <span className="font-bold text-white font-mono">{recoveringTx.amount} USDC</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-t border-border-thin/40 pt-2">
                      <span className="text-muted">Arc Burn Hash</span>
                      <a
                        href={`${activeArcChain.blockExplorerUrl}/tx/${recoveringTx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-mono font-bold flex items-center gap-1"
                      >
                        {recoveringTx.txHash.slice(0, 10)}...{recoveringTx.txHash.slice(-8)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {attestationLoading && (
                  <div className="py-6 text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    <p className="text-xs text-text-secondary">Checking Circle Iris Consensus API for attestation signature...</p>
                  </div>
                )}

                {/* Error Banner */}
                {claimError && (
                  <div className="p-3.5 bg-danger/10 border border-danger/25 rounded-2xl text-xs text-danger flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="break-words font-medium">{claimError}</div>
                  </div>
                )}

                {/* Success Banner */}
                {claimSuccess && (
                  <div className="p-3.5 bg-success/15 border border-success/30 rounded-2xl text-xs text-success flex items-start gap-2.5">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="font-semibold">
                      Claim executed successfully! Your native USDC has been minted on Ethereum.
                    </div>
                  </div>
                )}

                {/* Attestation Status & Claim Button */}
                {attestationData && (
                  <div className="space-y-4 animate-fade-in-up">
                    <div className="p-3.5 bg-success/10 border border-success/25 rounded-2xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        <span className="font-bold text-success">Circle Attestation Signed & Ready</span>
                      </div>
                      <span className="font-mono text-[10px] text-text-tertiary uppercase">Status: {attestationData.status}</span>
                    </div>

                    {/* Notice on gas requirements */}
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-amber-300 text-xs space-y-1">
                      <p className="font-bold text-amber-200">Ethereum Gas Requirement Notice</p>
                      <p className="text-[11px] text-amber-300/80 leading-relaxed">
                        To claim native USDC on Ethereum Mainnet, your wallet must submit the mint transaction and pay Ethereum network gas in ETH. If your wallet has 0 ETH, ensure you deposit a small amount of ETH for gas first.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={claiming || claimSuccess}
                      onClick={executeClaimOnEthereum}
                      className="w-full py-3.5 bg-primary hover:bg-primary-hover text-black font-extrabold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {claiming ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                          <span>Minting USDC on Ethereum...</span>
                        </>
                      ) : claimSuccess ? (
                        <>
                          <Check className="w-4 h-4 text-black" />
                          <span>Mint Completed</span>
                        </>
                      ) : (
                        <span>Mint & Claim USDC on Ethereum</span>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        </SectionErrorBoundary>
      </div>
    </div>
  );
}
