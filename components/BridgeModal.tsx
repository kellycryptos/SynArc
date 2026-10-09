"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCCTPBridge } from "@/hooks/useCCTPBridge";
import { useUSDCBalance, invalidateUSDCBalance } from "@/hooks/useUSDCBalance";
import { useWallets as usePrivyWallets } from "@/hooks/useWallets";
import { useSwitchChain } from "wagmi";
import { createPublicClient, http, fallback, getAddress, parseAbi, formatUnits } from "viem";
import { selectActiveWallet } from "@/lib/tx-helper";
import { IS_MAINNET, getActiveNetwork } from "@/lib/arc-config";
import { ensureWalletOnChain } from "@/lib/chain-network-helper";
import { useDeferredWeb3 } from "@/providers/DeferredWeb3Provider";
import {
  X,
  Coins,
  Info,
  Check,
  ChevronDown,
  ArrowRight,
  Clock,
  ExternalLink,
  Loader2,
  AlertCircle,
  Zap
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { ChainIcon } from "@/components/ui/ChainIcon";

// ABI for ERC20 balanceOf
const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);

// Testnet source networks config
export const TESTNET_SOURCE_CHAINS = [
  {
    id: "ETH_SEPOLIA",
    chainId: 11155111,
    name: "Ethereum Sepolia",
    tokenAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    rpcUrl: "https://rpc.ankr.com/eth_sepolia",
    rpcUrls: [
      "https://rpc.ankr.com/eth_sepolia",
      "https://ethereum-sepolia-rpc.publicnode.com"
    ],
    icon: "ETH",
    color: "text-blue-400"
  },
  {
    id: "BASE_SEPOLIA",
    chainId: 84532,
    name: "Base Sepolia",
    tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dcf7e",
    rpcUrl: "https://sepolia.base.org",
    rpcUrls: [
      "https://sepolia.base.org",
      "https://base-sepolia-rpc.publicnode.com"
    ],
    icon: "BASE",
    color: "text-blue-500"
  },
  {
    id: "AVAX_FUJI",
    chainId: 43113,
    name: "Avalanche Fuji",
    tokenAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    rpcUrls: [
      "https://api.avax-test.network/ext/bc/C/rpc"
    ],
    icon: "AVAX",
    color: "text-red-500"
  },
  {
    id: "SOL_DEVNET",
    chainId: 103,
    name: "Solana Devnet",
    tokenAddress: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    rpcUrl: "https://api.devnet.solana.com",
    rpcUrls: ["https://api.devnet.solana.com"],
    icon: "SOL",
    color: "text-purple-400"
  },
];

// Mainnet source networks config
export const MAINNET_SOURCE_CHAINS = [
  {
    id: "ETH_MAINNET",
    chainId: 1,
    name: "Ethereum",
    tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    rpcUrl: "https://eth.llamarpc.com",
    rpcUrls: [
      "https://cloudflare-eth.com",
      "https://ethereum-rpc.publicnode.com"
    ],
    icon: "ETH",
    color: "text-blue-400"
  },
  {
    id: "BASE_MAINNET",
    chainId: 8453,
    name: "Base",
    tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    rpcUrl: "https://mainnet.base.org",
    rpcUrls: [
      "https://mainnet.base.org",
      "https://base-rpc.publicnode.com"
    ],
    icon: "BASE",
    color: "text-blue-500"
  },
  {
    id: "AVAX_MAINNET",
    chainId: 43114,
    name: "Avalanche",
    tokenAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    rpcUrls: [
      "https://api.avax.network/ext/bc/C/rpc",
      "https://avalanche-c-chain-rpc.publicnode.com"
    ],
    icon: "AVAX",
    color: "text-red-500"
  },
];

// Fallback alias for backward compatibility
const SOURCE_CHAINS = TESTNET_SOURCE_CHAINS;

// CCTP step definitions
const BRIDGE_STEPS = [
  { key: "approving",            label: "Approve USDC",         short: "Approve" },
  { key: "burning",              label: "Burn on Source",       short: "Burn" },
  { key: "waiting-attestation",  label: "Circle Attestation",   short: "Attest" },
  { key: "minting",              label: "Mint on Arc",          short: "Mint" },
];

interface BridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BridgeModal(props: BridgeModalProps) {
  const deferred = useDeferredWeb3();

  if (!props.isOpen || (deferred && !deferred.isMounted)) {
    return null;
  }

  return <ActiveBridgeModal {...props} />;
}

function ActiveBridgeModal({ isOpen, onClose, onSuccess }: BridgeModalProps) {
  const { isAuthenticated, login, walletAddress } = useAuth();
  const isMainnet = getActiveNetwork() === 'mainnet';
  const arcNetworkLabel = isMainnet ? "Arc Mainnet" : "Arc Testnet";
  const arcExplorerUrl = isMainnet ? "https://explorer.arc.io" : "https://testnet.arcscan.app";
  const activeSourceChains = isMainnet ? MAINNET_SOURCE_CHAINS : TESTNET_SOURCE_CHAINS;
  const [selectedChain, setSelectedChain] = useState(activeSourceChains[0]);

  // Keep selectedChain in sync when network mode changes
  useEffect(() => {
    setSelectedChain(isMainnet ? MAINNET_SOURCE_CHAINS[0] : TESTNET_SOURCE_CHAINS[0]);
  }, [isMainnet]);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [sourceBalance, setSourceBalance] = useState<string>("0.00");
  const [balanceLoading, setBalanceLoading] = useState(false);

  const { state: bridgeState, bridgeUSDC, resetState } = useCCTPBridge();
  const { balance: arcUSDCBalance } = useUSDCBalance(walletAddress);
  const hasInsufficientArcGas = isAuthenticated && parseFloat(arcUSDCBalance || "0") < 0.01;

  const [switchingNetwork, setSwitchingNetwork] = useState(false);
  const switchChainResult = useSwitchChain();
  const switchChainAsync = switchChainResult?.switchChainAsync;

  const { wallets: privyWallets } = usePrivyWallets();
  const wallets = privyWallets ?? [];
  const activeWallet = selectActiveWallet(wallets, walletAddress);

  const handleSwitchNetwork = async () => {
    setSwitchingNetwork(true);
    try {
      const provider = await (
        activeWallet?.getEthereumProvider?.() ||
        (activeWallet as any)?.getProvider?.() ||
        (activeWallet as any)?.getEip1193Provider?.() ||
        (typeof window !== "undefined" ? (window as any).ethereum : null)
      );

      if (provider) {
        await ensureWalletOnChain(provider, selectedChain.chainId);
        resetState();
        fetchSourceBalance();
        return;
      }

      if (selectedChain.chainId > 0 && switchChainAsync) {
        await switchChainAsync({ chainId: selectedChain.chainId });
        resetState();
        fetchSourceBalance();
      }
    } catch (err) {
      console.error("Manual network switch failed:", err);
    } finally {
      setSwitchingNetwork(false);
    }
  };

  const handleAddNetwork = async () => {
    setSwitchingNetwork(true);
    try {
      const provider = await (
        activeWallet?.getEthereumProvider?.() ||
        (activeWallet as any)?.getProvider?.() ||
        (activeWallet as any)?.getEip1193Provider?.() ||
        (typeof window !== "undefined" ? (window as any).ethereum : null)
      );

      if (provider) {
        await ensureWalletOnChain(provider, selectedChain.chainId);
        resetState();
        fetchSourceBalance();
      }
    } catch (err) {
      console.error("Manual network add failed:", err);
    } finally {
      setSwitchingNetwork(false);
    }
  };

  // Load USDC balance on source chain
  const fetchSourceBalance = async () => {
    const rawTarget = activeWallet?.address || walletAddress;
    if (!rawTarget) {
      setSourceBalance("0.00");
      return;
    }
    if (selectedChain.id === "SOL_DEVNET" || (selectedChain as any).id === "SOL_MAINNET") {
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
          urls.map((u: string) => http(u, { timeout: 8000, retryCount: 2 }))
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
      setSourceBalance(parseFloat(formatUnits(rawBalance, 6)).toFixed(2));
    } catch (err) {
      console.warn(`Failed to fetch balance on ${selectedChain.name}:`, err);
      setSourceBalance("0.00");
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeWallet?.address) fetchSourceBalance();
  }, [isOpen, selectedChain, activeWallet?.address]);

  useEffect(() => {
    if (bridgeState.status === "success") {
      fetchSourceBalance();
      invalidateUSDCBalance();
      if (onSuccess) onSuccess();
    }
  }, [bridgeState.status]);

  const handleMaxClick = () => setAmount(sourceBalance);

  const handleBridgeConfirm = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    if (amountNum > parseFloat(sourceBalance)) return;
    await bridgeUSDC(selectedChain.id as any, amount);
  };

  const handleModalClose = () => {
    if (
      bridgeState.status === "approving" ||
      bridgeState.status === "burning" ||
      bridgeState.status === "waiting-attestation" ||
      bridgeState.status === "minting"
    ) {
      return;
    }
    resetState();
    setAmount("");
    onClose();
  };

  if (!isOpen) return null;

  const isFormView = bridgeState.status === "idle" || bridgeState.status === "error";

  // Current step index (for progress steps indicator)
  const currentStepIdx = BRIDGE_STEPS.findIndex(s => s.key === bridgeState.status);

  // Determine explorer link for source/dest
  const getSourceExplorer = (hash: string) => {
    if (selectedChain.id === "ETH_SEPOLIA") return `https://sepolia.etherscan.io/tx/${hash}`;
    if (selectedChain.id === "BASE_SEPOLIA") return `https://sepolia.basescan.org/tx/${hash}`;
    if (selectedChain.id === "AVAX_FUJI") return `https://testnet.snowtrace.io/tx/${hash}`;
    if (selectedChain.id === "ETH_MAINNET") return `https://etherscan.io/tx/${hash}`;
    if (selectedChain.id === "BASE_MAINNET") return `https://basescan.org/tx/${hash}`;
    if (selectedChain.id === "AVAX_MAINNET") return `https://snowtrace.io/tx/${hash}`;
    return `#`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity duration-300"
        onClick={handleModalClose}
      />

      {/* Modal Container */}
      <GlassCard
        hover={false}
        className="w-full max-w-lg p-6 relative z-10 animate-fade-in-up border border-border-thin shadow-2xl shadow-purple-950/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-thin pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              
            </div>
            <div>
              <h3 className="font-bold text-lg text-text-primary">Bridge Funds to Arc</h3>
              <p className="text-[11px] text-text-tertiary flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-400" />
                Powered by Circle CCTP V2 — Fast transfers
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            disabled={!isFormView && bridgeState.status !== "success"}
            className="p-1.5 text-muted hover:text-text-primary hover:bg-surface-elevated rounded-full transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isFormView ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Error Notification */}
              {bridgeState.status === "error" && bridgeState.errorMessage && (
                (() => {
                  const isNetworkConfigError =
                    bridgeState.errorMessage.toLowerCase().includes("not configured") ||
                    bridgeState.errorMessage.toLowerCase().includes("unsupported chain") ||
                    bridgeState.errorMessage.toLowerCase().includes("network configuration");

                  if (isNetworkConfigError) {
                    return (
                      <div className="p-4 bg-warning/10 border border-warning/30 rounded-2xl space-y-3 animate-fade-in-up text-left">
                        <div className="flex items-center gap-2 text-warning font-bold text-sm">
                          <AlertCircle className="w-5 h-5 text-warning shrink-0 animate-pulse" />
                          <span>Network Configuration Required</span>
                        </div>
                        <p className="text-xs text-text-secondary leading-normal">
                          {selectedChain.name} has not been added to your wallet or is not configured.
                        </p>
                        <div className="flex gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={handleSwitchNetwork}
                            disabled={switchingNetwork}
                            className="px-4 py-2 bg-warning border border-warning/70 hover:opacity-90 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            {switchingNetwork ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Switch Network"}
                          </button>
                          <button
                            type="button"
                            onClick={handleAddNetwork}
                            disabled={switchingNetwork}
                            className="px-4 py-2 bg-surface border border-border-thin hover:bg-surface-elevated text-text-primary text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            Add Network
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="p-3.5 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger flex items-start gap-2 animate-fade-in-up">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="break-words w-full font-medium">{bridgeState.errorMessage}</div>
                    </div>
                  );
                })()
              )}

              {/* Source Chain Selector */}
              <div className="relative">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">Source Chain</label>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-surface border border-border-thin rounded-xl text-text-primary text-sm font-semibold hover:border-primary/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <ChainIcon chain={selectedChain.id} size={20} />
                    <span>{selectedChain.name}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-300 ${dropdownOpen ? "rotate-180 text-text-primary" : ""}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 z-20 bg-surface-elevated/95 border border-border-thin backdrop-blur-xl rounded-xl shadow-xl overflow-hidden py-1">
                    {activeSourceChains.map((chain) => (
                      <button
                        key={chain.id}
                        type="button"
                        onClick={() => {
                          setSelectedChain(chain);
                          setDropdownOpen(false);
                          setAmount("");
                          resetState();
                        }}
                        className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:bg-primary/20 transition-all cursor-pointer ${
                          selectedChain.id === chain.id ? "bg-primary/10 text-text-primary font-bold" : "text-muted hover:text-text-primary"
                        }`}
                      >
                        <ChainIcon chain={chain.id} size={20} />
                        <span>{chain.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Route Arrow */}
              <div className="flex items-center justify-center py-1">
                <div className="h-px bg-border-thin flex-1" />
                <div className="px-3 py-1 rounded-full bg-surface-elevated border border-border-thin flex items-center gap-1.5 text-[10px] font-bold text-primary shadow-sm uppercase tracking-wider">
                  <span>Transfer Route</span>
                  <ArrowRight className="w-3 h-3" />
                  <span className="text-text-primary flex items-center gap-1">
                    <ChainIcon chain="arc" size={14} />
                    {arcNetworkLabel}
                  </span>
                </div>
                <div className="h-px bg-border-thin flex-1" />
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-muted uppercase tracking-wider">Amount to Bridge</label>
                  <div className="flex items-center gap-1.5 text-text-tertiary">
                    <span>Balance:</span>
                    {balanceLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    ) : (
                      <span className="font-bold font-mono text-text-primary select-all">
                        {parseFloat(sourceBalance || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-muted font-bold text-sm">
                    <TokenIcon symbol="USDC" size={18} />
                    <span>USDC</span>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (bridgeState.status === "error") resetState();
                    }}
                    placeholder="0.00"
                    className="w-full pl-24 pr-20 py-3.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none transition-colors text-text-primary font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleMaxClick}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[10px] font-bold uppercase bg-primary/10 border border-primary/20 hover:bg-primary/20 rounded text-primary transition-colors cursor-pointer"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Fast Bridge Badge */}
              <div className="bg-surface-elevated p-3.5 rounded-xl border border-border-thin flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-text-primary font-bold block">Circle CCTP V2 — Fast Transfer</span>
                    <span className="text-[10px] text-text-tertiary">Direct burn-and-mint with Circle attestation</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-success font-bold text-sm block">~20–60 sec</span>
                  <span className="text-[10px] text-success/80">{isMainnet ? "Arc native" : "Arc Testnet native"}</span>
                </div>
              </div>

              {/* Arc Gas Informational Notice Banner */}
              {hasInsufficientArcGas && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-200">Arc Gas Notice: USDC is the Native Gas Token</p>
                    <p className="text-[11px] text-amber-300/80 leading-relaxed">
                      Arc uses native USDC to pay network gas. Once your transfer completes, your bridged USDC is immediately usable as native gas for all transactions on Arc.
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="flex-1 py-3 border border-border-thin text-muted hover:text-text-primary font-bold text-sm rounded-xl hover:bg-surface-elevated transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleBridgeConfirm}
                    disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(sourceBalance)}
                    className="flex-1 py-3 bg-accent-purple text-white-keep font-bold text-sm rounded-xl hover:bg-accent-purple/95 transition-all shadow-[0_0_15px_rgba(124,58,237,0.15)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-white-keep">
                      {parseFloat(amount) > parseFloat(sourceBalance) ? "Insufficient Balance" : "Bridge USDC"}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={login}
                    className="flex-1 py-3 bg-accent-purple text-white-keep font-bold text-sm rounded-xl hover:bg-accent-purple/95 transition-all shadow-[0_0_15px_rgba(124,58,237,0.15)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="text-white-keep">Connect Wallet</span>
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="progress"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="py-4 text-center space-y-5"
            >
              {bridgeState.status === "success" ? (
                // ──── Success State ────
                <div className="space-y-4 animate-fade-in-up">
                  <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto text-success shadow-lg shadow-success/10">
                    <Check className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">Bridge complete</h3>
                    <p className="text-xs text-text-tertiary mt-1.5 max-w-sm mx-auto leading-relaxed">
                      Your USDC has successfully arrived on {arcNetworkLabel} and is ready to use.
                    </p>
                  </div>

                  <div className="p-4 bg-surface rounded-xl border border-border-thin max-w-xs mx-auto space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted">Bridged Amount</span>
                      <span className="font-bold text-text-primary font-mono">{amount} USDC</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted">Destination</span>
                      <span className="font-bold text-success flex items-center gap-1.5">
                        <ChainIcon chain="arc" size={14} />
                        <span>{arcNetworkLabel}</span>
                      </span>
                    </div>
                    {bridgeState.burnTxHash && (
                      <div className="flex justify-between items-center text-xs border-t border-border-thin pt-2 mt-2">
                        <span className="text-muted">Burn Tx (Origin)</span>
                        <a
                          href={getSourceExplorer(bridgeState.burnTxHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-mono font-bold flex items-center gap-1"
                        >
                          {bridgeState.burnTxHash.slice(0, 6)}…{bridgeState.burnTxHash.slice(-4)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {bridgeState.txHash && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted">Mint Tx (Arc)</span>
                        <a
                          href={`${arcExplorerUrl}/tx/${bridgeState.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-mono font-bold flex items-center gap-1"
                        >
                          {bridgeState.txHash.slice(0, 6)}…{bridgeState.txHash.slice(-4)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="px-6 py-2.5 bg-accent-purple text-white-keep font-bold text-sm rounded-xl hover:bg-accent-purple/95 transition-all shadow-[0_0_12px_rgba(124,58,237,0.2)] cursor-pointer"
                  >
                    <span className="text-white-keep">Done</span>
                  </button>
                </div>
              ) : (
                // ──── In-Progress State ────
                <div className="space-y-5">
                  {/* Glowing Spinner */}
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                    <div className="absolute inset-1 rounded-full border-2 border-purple-500/5 border-b-purple-500/30 animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }} />
                    <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center">
                      <TokenIcon symbol="USDC" size={24} className="animate-pulse" />
                    </div>
                  </div>

                  {/* Status Text */}
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-text-primary uppercase tracking-widest text-xs">
                      {bridgeState.status === "approving"           && "Approving USDC…"}
                      {bridgeState.status === "burning"             && `Burning on ${selectedChain.name}…`}
                      {bridgeState.status === "waiting-attestation" && "Waiting for Attestation…"}
                      {bridgeState.status === "minting"             && `Minting on ${arcNetworkLabel}…`}
                    </h3>
                    <p className="text-xs text-text-tertiary max-w-xs mx-auto min-h-[1.25rem]">
                      {bridgeState.stepDetail || (
                        <>
                          {bridgeState.status === "approving"           && `Approving CCTP to spend ${amount} USDC`}
                          {bridgeState.status === "burning"             && `Burning ${amount} USDC — triggers Circle attestation`}
                          {bridgeState.status === "waiting-attestation" && `Polling Circle Iris… (${bridgeState.elapsedSeconds}s elapsed)`}
                          {bridgeState.status === "minting"             && "Relaying attestation to Arc MessageTransmitter"}
                        </>
                      )}
                    </p>
                  </div>

                  {/* Smooth Progress Bar */}
                  <div className="max-w-sm mx-auto">
                    <div className="flex justify-between items-center text-[10px] text-text-tertiary mb-1.5">
                      <span>Progress</span>
                      <span>{bridgeState.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary via-purple-500 to-accent-purple rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${bridgeState.progress}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* 4-Step CCTP Progress Indicators */}
                  <div className="max-w-sm mx-auto p-4 bg-surface-elevated border border-border-thin rounded-2xl text-left space-y-3">
                    {BRIDGE_STEPS.map((step, idx) => {
                      const isDone    = currentStepIdx > idx;
                      const isActive  = currentStepIdx === idx;
                      const isPending = currentStepIdx < idx;

                      return (
                        <div key={step.key} className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border flex-shrink-0 transition-all duration-300 ${
                              isDone
                                ? "bg-success/15 border-success text-success"
                                : isActive
                                ? "bg-primary/20 border-primary text-primary"
                                : "bg-surface border-border-thin text-text-tertiary"
                            }`}
                          >
                            {isDone
                              ? <Check className="w-3.5 h-3.5" />
                              : isActive
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-xs truncate block transition-colors duration-300 ${
                                isActive ? "text-text-primary font-bold" : isDone ? "text-muted" : "text-text-tertiary"
                              }`}
                            >
                              {idx + 1}. {step.label}
                            </span>
                            {isActive && step.key === "waiting-attestation" && (
                              <span className="text-[10px] text-primary/70 font-mono">
                                {bridgeState.elapsedSeconds}s · querying {IS_MAINNET ? "iris-api.circle.com" : "iris-api-sandbox.circle.com"}
                              </span>
                            )}
                            {isDone && step.key === "burning" && bridgeState.burnTxHash && (
                              <a
                                href={getSourceExplorer(bridgeState.burnTxHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-primary hover:underline font-mono flex items-center gap-1"
                              >
                                {bridgeState.burnTxHash.slice(0, 8)}…
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Attestation tip */}
                  {bridgeState.status === "waiting-attestation" && bridgeState.elapsedSeconds > 30 && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-sm mx-auto p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl text-[10px] text-blue-300/70 text-left"
                    >
                      ℹ️ Circle attestation can take 20–90 seconds on testnet. We&apos;re polling every 3s — hang tight!
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}
