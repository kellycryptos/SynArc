"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCCTPBridge } from "@/hooks/useCCTPBridge";
import { useWallets as usePrivyWallets } from "@privy-io/react-auth";
import { useSwitchChain } from "wagmi";
import { createPublicClient, http, parseAbi, formatUnits } from "viem";
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
  AlertCircle
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

// ABI for ERC20 balanceOf
const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);

// Source networks config for balance fetching and displays
const SOURCE_CHAINS = [
  { 
    id: "ETH_SEPOLIA", 
    name: "Ethereum Sepolia", 
    tokenAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", 
    rpcUrl: "https://rpc.ankr.com/eth_sepolia",
    icon: "🪙",
    color: "text-blue-400"
  },
  { 
    id: "BASE_SEPOLIA", 
    name: "Base Sepolia", 
    tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dcf7e", 
    rpcUrl: "https://sepolia.base.org",
    icon: "🔵",
    color: "text-blue-500"
  },
  { 
    id: "AVAX_FUJI", 
    name: "Avalanche Fuji", 
    tokenAddress: "0x5425890298aed601595a70AB815c96711a31Bc65", 
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    icon: "🔺",
    color: "text-red-500"
  },
  { 
    id: "SOL_DEVNET", 
    name: "Solana Devnet", 
    tokenAddress: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", 
    rpcUrl: "https://api.devnet.solana.com",
    icon: "☀️",
    color: "text-purple-400"
  },
];

interface BridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BridgeModal({ isOpen, onClose, onSuccess }: BridgeModalProps) {
  const { isAuthenticated, login } = useAuth();
  const [selectedChain, setSelectedChain] = useState(SOURCE_CHAINS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [sourceBalance, setSourceBalance] = useState<string>("0.00");
  const [balanceLoading, setBalanceLoading] = useState(false);
  
  // Consume live CCTP Hook
  const { state: bridgeState, bridgeUSDC, resetState } = useCCTPBridge();
  
  const [switchingNetwork, setSwitchingNetwork] = useState(false);
  const switchChainResult = useSwitchChain();
  const switchChainAsync = switchChainResult?.switchChainAsync;

  const handleSwitchNetwork = async () => {
    setSwitchingNetwork(true);
    try {
      const targetChainId = selectedChain.id === "ETH_SEPOLIA" ? 11155111 : selectedChain.id === "BASE_SEPOLIA" ? 84532 : selectedChain.id === "AVAX_FUJI" ? 43113 : 0;
      if (targetChainId > 0) {
        await switchChainAsync({ chainId: targetChainId });
        resetState();
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
      if (!activeWallet) return;
      const provider = await (activeWallet.getEthereumProvider?.() || (activeWallet as any).getProvider?.() || (activeWallet as any).getEip1193Provider?.());
      
      let chainParams: any = null;
      if (selectedChain.id === "ETH_SEPOLIA") {
        chainParams = {
          chainId: "0xaa36a7", // 11155111 hex
          chainName: "Ethereum Sepolia",
          rpcUrls: ["https://rpc.ankr.com/eth_sepolia"],
          nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
          blockExplorerUrls: ["https://sepolia.etherscan.io"],
        };
      }
      
      if (chainParams) {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [chainParams],
        });
        await switchChainAsync({ chainId: parseInt(chainParams.chainId, 16) });
        resetState();
      }
    } catch (err) {
      console.error("Manual network add failed:", err);
    } finally {
      setSwitchingNetwork(false);
    }
  };

  // Safe: Circle wallet does not register with Privy wallets list
  const { wallets: privyWallets } = usePrivyWallets();
  const wallets = privyWallets ?? [];
  const activeWallet = wallets.length > 0 ? wallets[0] : null;

  // Load balance for the selected EVM source chain
  const fetchSourceBalance = async () => {
    if (!activeWallet?.address) {
      setSourceBalance("0.00");
      return;
    }

    if (selectedChain.id === "SOL_DEVNET") {
      setSourceBalance("500.00");
      return;
    }

    setBalanceLoading(true);
    try {
      const client = createPublicClient({
        transport: http(selectedChain.rpcUrl, {
          timeout: 10000,
          retryCount: 3,
          retryDelay: 1000,
        }),
      });

      const rawBalance = await client.readContract({
        address: selectedChain.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [activeWallet.address as `0x${string}`],
      });

      const formatted = formatUnits(rawBalance, 6);
      setSourceBalance(parseFloat(formatted).toFixed(2));
    } catch (err) {
      console.error(`Failed to fetch balance on ${selectedChain.name}:`, err);
      setSourceBalance("0.00"); 
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeWallet?.address) {
      fetchSourceBalance();
    }
  }, [isOpen, selectedChain, activeWallet?.address]);

  // Hook success triggers UI refresher
  useEffect(() => {
    if (bridgeState.status === "success") {
      fetchSourceBalance();
      if (onSuccess) {
        onSuccess();
      }
    }
  }, [bridgeState.status]);

  const handleMaxClick = () => {
    setAmount(sourceBalance);
  };

  const handleBridgeConfirm = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return;
    }

    if (amountNum > parseFloat(sourceBalance)) {
      return;
    }

    // Call native bridge runner
    await bridgeUSDC(selectedChain.id as any, amount);
  };

  const handleModalClose = () => {
    if (
      bridgeState.status === "approving" ||
      bridgeState.status === "burning" ||
      bridgeState.status === "waiting-attestation" ||
      bridgeState.status === "minting"
    ) {
      // Prevent closing during active bridging transactions
      return;
    }
    resetState();
    setAmount("");
    onClose();
  };

  if (!isOpen) return null;

  const isFormView = bridgeState.status === "idle" || bridgeState.status === "error";

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
              <span className="text-lg">🌉</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Bridge USDC to Arc</h3>
              <p className="text-[11px] text-text-tertiary">Powered by Circle CCTP V2 Infrastructure</p>
            </div>
          </div>
          <button 
            onClick={handleModalClose}
            disabled={!isFormView && bridgeState.status !== "success"}
            className="p-1.5 text-muted hover:text-white hover:bg-surface-elevated rounded-full transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
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
                    console.warn("SynArc Bridge Switch Config Error:", bridgeState.errorMessage);
                    return (
                      <div className="p-4 bg-warning/10 border border-warning/30 rounded-2xl space-y-3 animate-fade-in-up text-left">
                        <div className="flex items-center gap-2 text-warning font-bold text-sm">
                          <AlertCircle className="w-5 h-5 text-warning shrink-0 animate-pulse" />
                          <span>⚠️ Network Configuration Required</span>
                        </div>
                        <p className="text-xs text-text-secondary leading-normal">
                          {selectedChain.name} has not been added to your wallet or is not configured.
                        </p>
                        <div className="flex gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={handleSwitchNetwork}
                            disabled={switchingNetwork}
                            className="px-4 py-2 bg-warning/20 border border-warning/30 hover:bg-warning/30 text-warning text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
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
                      <Info className="w-4.5 h-4.5 shrink-0 mt-0.5" />
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
                  className="w-full flex items-center justify-between px-4 py-3 bg-surface border border-border-thin rounded-xl text-white text-sm font-semibold hover:border-primary/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base select-none">{selectedChain.icon}</span>
                    <span>{selectedChain.name}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-300 ${dropdownOpen ? "rotate-180 text-white" : ""}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 z-20 bg-[#160B2E]/95 border border-border-thin backdrop-blur-xl rounded-xl shadow-xl overflow-hidden py-1">
                    {SOURCE_CHAINS.map((chain) => (
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
                          selectedChain.id === chain.id ? "bg-primary/10 text-white font-bold" : "text-muted hover:text-white"
                        }`}
                      >
                        <span className="text-base select-none">{chain.icon}</span>
                        <span>{chain.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Path indicator */}
              <div className="flex items-center justify-center py-1">
                <div className="h-px bg-border-thin flex-1" />
                <div className="px-3 py-1 rounded-full bg-surface-elevated border border-border-thin flex items-center gap-1.5 text-[10px] font-bold text-primary shadow-sm uppercase tracking-wider">
                  <span>Transfer Route</span>
                  <ArrowRight className="w-3 h-3" />
                  <span className="text-white">Arc Testnet</span>
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
                      <span className="font-bold font-mono text-white select-all">{sourceBalance} USDC</span>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold text-sm">USDC</div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (bridgeState.status === "error") resetState();
                    }}
                    placeholder="0.00"
                    className="w-full pl-16 pr-20 py-3.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none transition-colors text-white font-mono text-sm"
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
                  <div className="p-1 rounded bg-[#2775CA]/10 text-[#2775CA]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-white font-bold block">Estimated Speed</span>
                    <span className="text-[10px] text-text-tertiary">Circle CCTP Native Route</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-success font-bold text-sm block">~20 seconds</span>
                  <span className="text-[10px] text-success/80">Gas-optimized bridge mint</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="flex-1 py-3 border border-border-thin text-muted hover:text-white font-bold text-sm rounded-xl hover:bg-surface-elevated transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleBridgeConfirm}
                    disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(sourceBalance)}
                    className="flex-1 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/95 transition-all shadow-[0_0_15px_rgba(124,58,237,0.15)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Bridge USDC
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={login}
                    className="flex-1 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/95 transition-all shadow-[0_0_15px_rgba(124,58,237,0.15)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Connect Wallet
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
              className="py-6 text-center space-y-6"
            >
              {bridgeState.status === "success" ? (
                // Success State View
                <div className="space-y-4 animate-fade-in-up">
                  <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto text-success shadow-lg shadow-success/10">
                    <Check className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Bridge complete ✓</h3>
                    <p className="text-xs text-text-tertiary mt-1.5 max-w-sm mx-auto leading-relaxed">
                      Circle CCTP successfully completed the native bridge transfer. The USDC has safely arrived in your Arc Testnet wallet balance.
                    </p>
                  </div>

                  <div className="p-4 bg-surface rounded-xl border border-border-thin max-w-xs mx-auto space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted">Bridged Amount</span>
                      <span className="font-bold text-white font-mono">{amount} USDC</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted">Destination</span>
                      <span className="font-bold text-success">Arc Testnet</span>
                    </div>
                    {bridgeState.txHash && (
                      <div className="flex justify-between items-center text-xs border-t border-border-thin pt-2 mt-2">
                        <span className="text-muted">Arcscan Mint Tx</span>
                        <a
                          href={`https://testnet.arcscan.app/tx/${bridgeState.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-mono font-bold flex items-center gap-1"
                        >
                          {bridgeState.txHash.slice(0, 6)}...{bridgeState.txHash.slice(-4)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/95 transition-all shadow-[0_0_12px_rgba(124,58,237,0.2)] cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                // Bridging Progress View (CCTP Live State Machine)
                <div className="space-y-6">
                  {/* Glowing Spinner */}
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                    <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center">
                      <Coins className="w-5 h-5 text-primary animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider text-xs">
                      {bridgeState.status === "approving" && "Approving USDC..."}
                      {bridgeState.status === "burning" && `Burning on ${selectedChain.name}...`}
                      {bridgeState.status === "waiting-attestation" && "Waiting for attestation..."}
                      {bridgeState.status === "minting" && "Minting on Arc Testnet..."}
                    </h3>
                    <p className="text-xs text-text-tertiary max-w-xs mx-auto">
                      {bridgeState.status === "approving" && `Approving CCTP Messenger to spend ${amount} USDC on ${selectedChain.name}.`}
                      {bridgeState.status === "burning" && `Burning ${amount} USDC on ${selectedChain.name} source chain.`}
                      {bridgeState.status === "waiting-attestation" && `Retrieving signed Circle proofs. (${bridgeState.elapsedSeconds}s elapsed)`}
                      {bridgeState.status === "minting" && "Delivering attestations to Arc Transmitter to mint native gas token USDC."}
                    </p>
                  </div>

                  {/* 4-Step CCTP Progress Indicators */}
                  <div className="max-w-sm mx-auto p-4 bg-surface-elevated border border-border-thin rounded-2xl text-left space-y-3.5">
                    {/* Step 1: Approve */}
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                        bridgeState.status === "approving"
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-success/15 border-success text-success"
                      }`}>
                        {bridgeState.status === "approving" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-xs ${bridgeState.status === "approving" ? "text-white font-bold" : "text-muted"}`}>
                        1. Approve USDC Spending
                      </span>
                    </div>

                    {/* Step 2: Burn */}
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                        bridgeState.status === "approving"
                          ? "bg-surface border-border-thin text-text-tertiary"
                          : bridgeState.status === "burning"
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-success/15 border-success text-success"
                      }`}>
                        {bridgeState.status === "approving" ? "2" : bridgeState.status === "burning" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-xs ${
                        bridgeState.status === "burning" ? "text-white font-bold" : bridgeState.status === "approving" ? "text-text-tertiary" : "text-muted"
                      }`}>
                        2. Burn USDC on {selectedChain.name}
                      </span>
                    </div>

                    {/* Step 3: Attestation */}
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                        bridgeState.status === "approving" || bridgeState.status === "burning"
                          ? "bg-surface border-border-thin text-text-tertiary"
                          : bridgeState.status === "waiting-attestation"
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-success/15 border-success text-success"
                      }`}>
                        {bridgeState.status === "approving" || bridgeState.status === "burning" ? "3" : bridgeState.status === "waiting-attestation" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-xs ${
                        bridgeState.status === "waiting-attestation" ? "text-white font-bold" : (bridgeState.status === "approving" || bridgeState.status === "burning") ? "text-text-tertiary" : "text-muted"
                      }`}>
                        3. Poll Circle Attestation
                      </span>
                    </div>

                    {/* Step 4: Mint */}
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                        bridgeState.status === "minting"
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-surface border-border-thin text-text-tertiary"
                      }`}>
                        {bridgeState.status === "minting" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "4"}
                      </div>
                      <span className={`text-xs ${bridgeState.status === "minting" ? "text-white font-bold" : "text-text-tertiary"}`}>
                        4. Switch Wallet & Mint on Arc
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}

