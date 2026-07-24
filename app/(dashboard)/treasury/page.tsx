"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useTreasuryBalances } from "@/hooks/useTreasuryBalances";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { useEURCBalance } from "@/hooks/useEURCBalance";
import { useAuth } from "@/hooks/auth/useAuth";
import { useWallets as usePrivyWallets } from "@privy-io/react-auth";
import { ErrorBoundary, SectionErrorBoundary } from "@/components/ErrorBoundary";
import { Contract, parseUnits, BrowserProvider } from "ethers";
import { GOVERNANCE_CONTRACTS, ERC20ABI, TreasuryABI } from "@/lib/governance/contracts";
import { useWriteContract, useAccount, usePublicClient, useSwitchChain } from "wagmi";
import React from "react";
import { ARC_GAS_CONFIG, ARC_GAS_CONFIG_LOW } from "@/lib/constants";
import { TreasuryActivity } from "@/types";
import { getWorkingRPC, arcTestnetChain } from "@/lib/rpc";
import { createPublicClient, createWalletClient, http, custom, fallback } from "viem";
import { toast } from "react-hot-toast";
import { parseArcError } from "@/lib/utils";
import { writeWithRetry, getSigner, enforceChain, getAuthenticatedClient, waitForTransaction, getAggressiveGasParams, selectActiveWallet } from "@/lib/tx-helper";
import { ARC_GAS, ARC_CHAIN, ARC_RPC_URLS, CONTRACTS } from "@/lib/arc-config";

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const

const TREASURY_ABI = [
  {
    name: 'depositUSDC',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'depositEURC',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: []
  }
] as const

const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as `0x${string}`;
const EURC_ADDRESS = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a" as `0x${string}`;
import { AuthPromptBanner } from "@/components/auth/AuthPromptBanner";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend
} from "recharts";
import { 
  ArrowUpRight, ArrowDownRight, Activity, Wallet, Shield, PieChart, Coins, Info, PlusCircle, X, Check, Clock
} from "lucide-react";
import { BridgeModal } from "@/components/BridgeModal";


function TreasuryPageContent() {
  const { 
    balance: combinedTotal, 
    usdcBalance, 
    eurcBalance, 
    activities, 
    queuedWithdrawals,
    isLoading: treasuryLoading, 
    isHistoryLoading,
    refetch: refetchTreasury 
  } = useTreasuryBalances();

  const { balance: walletUSDC, refetch: refetchWalletUSDC } = useUSDCBalance();
  const { balance: walletEURC, refetch: refetchWalletEURC } = useEURCBalance();
  // usePrivyWallets and wagmi hooks may not have a wallet when Circle is the only connection.
  // Safe-wrap them so they return empty/noop values instead of crashing.
  const { wallets: privyWallets } = usePrivyWallets();
  const wallets = privyWallets ?? [];
  const { isAuthenticated, login, walletAddress, isCircle } = useAuth();

  const [executingId, setExecutingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const pendingWithdrawals = useMemo(() => {
    return (queuedWithdrawals || []).filter(q => !q.executed && !q.canceled);
  }, [queuedWithdrawals]);

  const handleExecuteWithdrawal = async (id: string) => {
    if (!isAuthenticated) {
      login();
      return;
    }
    
    setExecutingId(id);
    const toastId = toast.loading("Initiating withdrawal execution...");
    
    try {

      
      const { walletClient, publicClient, address } = await getAuthenticatedClient(wallets, 5042002, walletAddress);
      const gasParams = await getAggressiveGasParams(publicClient);
      
      const hash = await walletClient.writeContract({
        address: GOVERNANCE_CONTRACTS.treasury,
        abi: TreasuryABI,
        functionName: 'executeWithdrawal',
        args: [BigInt(id)],
        account: address,
        gas: 300000n,
        ...gasParams
      });
      
      toast.loading("⏳ Confirming withdrawal execution...", { id: toastId });
      await waitForTransaction(publicClient, hash);
      toast.success("Withdrawal executed successfully! ✅", { id: toastId });
      refetchTreasury();
    } catch (err: any) {
      console.error(err);
      toast.error(parseArcError(err), { id: toastId });
    } finally {
      setExecutingId(null);
    }
  };

  const handleCancelWithdrawal = async (id: string) => {
    if (!isAuthenticated) {
      login();
      return;
    }
    
    setCancelingId(id);
    const toastId = toast.loading("Initiating withdrawal cancellation...");
    
    try {

      
      const { walletClient, publicClient, address } = await getAuthenticatedClient(wallets, 5042002, walletAddress);
      const gasParams = await getAggressiveGasParams(publicClient);
      
      const hash = await walletClient.writeContract({
        address: GOVERNANCE_CONTRACTS.treasury,
        abi: TreasuryABI,
        functionName: 'cancelWithdrawal',
        args: [BigInt(id)],
        account: address,
        gas: 300000n,
        ...gasParams
      });
      
      toast.loading("⏳ Confirming cancellation...", { id: toastId });
      await waitForTransaction(publicClient, hash);
      toast.success("Withdrawal canceled successfully! ✅", { id: toastId });
      refetchTreasury();
    } catch (err: any) {
      console.error(err);
      toast.error(parseArcError(err), { id: toastId });
    } finally {
      setCancelingId(null);
    }
  };

  const userAddress = walletAddress;
  // Wagmi hooks return undefined when no wagmi wallet is connected (Circle-only).
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const writeContractResult = useWriteContract();
  const writeContractAsync = writeContractResult?.writeContractAsync ?? (async () => { throw new Error('No wagmi wallet'); });
  const publicClient = usePublicClient();
  const switchChainResult = useSwitchChain();
  const switchChainAsync = switchChainResult?.switchChainAsync;

  interface Transaction {
    id: string
    description: string
    amount: number
    token: 'USDC' | 'EURC'
    date: string
    txHash: string // full 66-character hash
    status: 'pending' | 'confirmed' | 'failed'
  }

  const [recentActivity, setRecentActivity] = useState<Transaction[]>([]);

  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    setRecentActivity(prev => [{
      ...tx,
      id: crypto.randomUUID(),
    }, ...prev]);
  };

  const activeWallet = selectActiveWallet(wallets, walletAddress);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [showBridge, setShowBridge] = useState(false);
  const [selectedToken, setSelectedToken] = useState<"USDC" | "EURC">("USDC");
  const [depositAmount, setDepositAmount] = useState("");
  const [txStep, setTxStep] = useState<"idle" | "approving" | "depositing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [txHash, setTxHash] = useState("");
  const [depositStatus, _setDepositStatus] = useState("");
  const setDepositStatus = (status: string) => {
    _setDepositStatus(status);
    if (status.includes("Preparing") || status.includes("Approving")) {
      setTxStep("approving");
    } else if (status.includes("Depositing")) {
      setTxStep("depositing");
    } else if (status.includes("successful")) {
      setTxStep("success");
    } else if (status === "") {
      setTxStep("error");
    }
  };

  const currentWalletBalance = useMemo(() => {
    return selectedToken === "USDC" ? walletUSDC || "0.00" : walletEURC || "0.00";
  }, [selectedToken, walletUSDC, walletEURC]);

  // Combined USD Total simulations
  const chartData = useMemo(() => {
    if (!activities.length) {
      return [{ date: "Now", balance: combinedTotal }];
    }
    
    // Sort chronologically
    const sorted = [...activities].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let runningBalance = combinedTotal;
    
    const points = sorted.map(act => {
      const point = {
        date: new Date(act.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        balance: runningBalance,
      };
      
      const factor = act.token === "EURC" ? 1.08 : 1.0;
      if (act.type === 'Inflow') {
        runningBalance -= (act.amount * factor);
      } else if (act.type === 'Outflow') {
        runningBalance += (act.amount * factor);
      }
      
      return point;
    }).reverse();
    
    return [...points, { date: "Current", balance: combinedTotal }];
  }, [activities, combinedTotal]);

  const recentTransactions = useMemo(() => {
    // Map recentActivity to match TreasuryActivity format
    const localActs: TreasuryActivity[] = recentActivity.map(act => ({
      id: act.id,
      type: 'Inflow',
      amount: act.amount,
      token: act.token,
      timestamp: new Date().toISOString(),
      description: act.description,
      txHash: act.txHash
    }));
    
    // De-duplicate: if any local tx has the same txHash as an activity from the contract, filter it from the local list
    const contractHashes = new Set(activities.map(a => a.txHash));
    const filteredLocal = localActs.filter(a => !contractHashes.has(a.txHash));

    return [...filteredLocal, ...activities].slice(0, 10);
  }, [recentActivity, activities]);

  // Asset Composition details
  const usdcValueInUSD = usdcBalance;
  const eurcValueInUSD = eurcBalance * 1.08;
  const totalValueInUSD = usdcValueInUSD + eurcValueInUSD;

  const compositionData = useMemo(() => {
    if (totalValueInUSD === 0) {
      return [
        { name: "USDC", value: 100, color: "#2775CA" },
        { name: "EURC", value: 0, color: "#EC4899" }
      ];
    }
    return [
      { name: "USDC", value: parseFloat(((usdcValueInUSD / totalValueInUSD) * 100).toFixed(1)), color: "#2775CA" },
      { name: "EURC", value: parseFloat(((eurcValueInUSD / totalValueInUSD) * 100).toFixed(1)), color: "#EC4899" }
    ];
  }, [usdcValueInUSD, eurcValueInUSD, totalValueInUSD]);

  const handleMaxClick = () => {
    setDepositAmount(currentWalletBalance);
  };

  const handleDepositSubmit = async () => {
    const amount = parseFloat(depositAmount);
    const token = selectedToken;
    
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage("Please enter a valid amount greater than 0.");
      setTxStep("error");
      return;
    }

    const balanceVal = parseFloat(currentWalletBalance);
    if (amount > balanceVal) {
      setErrorMessage(`Insufficient ${token} balance in your wallet. You have ${balanceVal.toFixed(2)} ${token}, but tried to deposit ${amount.toFixed(2)} ${token}.`);
      setTxStep("error");
      return;
    }

    setDepositStatus('Preparing...')
    setErrorMessage("");

    try {


      const activeWallet = selectActiveWallet(wallets, walletAddress);
      const isEmbedded = activeWallet?.walletClientType === 'privy';

      if (isEmbedded && activeWallet) {
        setDepositStatus('Preparing...');
        const eip1193Provider = await enforceChain(activeWallet, 5042002);
        const provider = new BrowserProvider(eip1193Provider);
        const signer = await provider.getSigner();

        const tokenAddress = token === 'USDC' ? USDC_ADDRESS : EURC_ADDRESS;
        const amountRaw = BigInt(Math.floor(amount * 1_000_000));

        // Get dynamic gas price with a 20 Gwei floor
        const feeData = await provider.getFeeData();
        const networkGasPrice = feeData.gasPrice || 20000000000n;
        const gasPrice = (networkGasPrice * 150n) / 100n > 20000000000n 
          ? (networkGasPrice * 150n) / 100n 
          : 20000000000n;

        // ERC20 Contract instance
        const erc20 = new Contract(
          tokenAddress,
          [
            'function approve(address spender, uint256 amount) returns (bool)',
            'function allowance(address owner, address spender) view returns (uint256)',
          ],
          signer
        );

        // Treasury Contract instance
        const treasury = new Contract(
          CONTRACTS.treasury,
          [
            'function depositUSDC(uint256 amount) external',
            'function depositEURC(uint256 amount) external',
          ],
          signer
        );

        // Step 1 — Approve
        setDepositStatus('Sending transaction...');
        const approveTx = await erc20.approve(
          CONTRACTS.treasury,
          amountRaw,
          {
            gasLimit: 250000,
            gasPrice: gasPrice
          }
        );

        setDepositStatus('Confirming approval...');
        const approveReceipt = await approveTx.wait(1);
        if (!approveReceipt || approveReceipt.status !== 1) {
          throw new Error('Approval failed on-chain.');
        }

        // Apply a brief settlement delay for RPC sync
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Step 2 — Deposit
        setDepositStatus('Sending transaction...');
        const depositFn = token === 'USDC' ? 'depositUSDC' : 'depositEURC';
        const depositTx = await treasury[depositFn](
          amountRaw,
          {
            gasLimit: 300000,
            gasPrice: gasPrice
          }
        );

        setTxHash(depositTx.hash);
        setDepositStatus('Confirming deposit...');
        const depositReceipt = await depositTx.wait(1);
        if (!depositReceipt || depositReceipt.status !== 1) {
          throw new Error('Deposit failed on-chain.');
        }

        setDepositStatus('✅ Deposit successful!');
        toast.success(`${amount} ${token} deposited to treasury`);

        addTransaction({
          description: `${token} Deposit`,
          amount: amount,
          token: token,
          date: new Date().toLocaleDateString('en-GB'),
          txHash: depositTx.hash,
          status: 'confirmed',
        });

        setDepositAmount("");
        refetchTreasury();
        refetchWalletUSDC?.();
        refetchWalletEURC?.();
        return;
      }

      // Get provider and client — Privy wallet, Circle wallet OR external wallet
      const { walletClient, publicClient, address } = await getAuthenticatedClient(wallets, 5042002, walletAddress);

      const tokenAddress = token === 'USDC' ? USDC_ADDRESS : EURC_ADDRESS;
      const amountRaw = BigInt(Math.floor(amount * 1_000_000));

      // Dynamically estimate fees using low-latency and aggressive parameters
      const gasParams = await getAggressiveGasParams(publicClient);

      // Step 1 — Approve
      let estimatedApproveGas = 250000n; // Slightly higher gas limit
      try {
        const est = await publicClient.estimateContractGas({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CONTRACTS.treasury, amountRaw],
          account: address,
        })
        estimatedApproveGas = (est * 150n) / 100n;
        if (estimatedApproveGas < 250000n) estimatedApproveGas = 250000n;
      } catch (e) {
        console.warn('Approve gas estimation failed:', e)
      }

      setDepositStatus('Sending transaction...');
      const approveTx = await walletClient.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.treasury, amountRaw],
        account: address,
        gas: estimatedApproveGas,
        ...gasParams,
      })

      setDepositStatus('Confirming approval...');
      await waitForTransaction(publicClient, approveTx);

      // Step 2 — Deposit
      let estimatedDepositGas = 300000n; // Slightly higher gas limit
      try {
        estimatedDepositGas = await publicClient.estimateContractGas({
          address: CONTRACTS.treasury,
          abi: TREASURY_ABI,
          functionName: token === 'USDC' ? 'depositUSDC' : 'depositEURC',
          args: [amountRaw],
          account: address,
        })
        estimatedDepositGas = (estimatedDepositGas * 150n) / 100n;
        if (estimatedDepositGas < 300000n) estimatedDepositGas = 300000n;
      } catch (e) {
        console.warn('Deposit gas estimation failed:', e)
      }

      setDepositStatus('Sending transaction...');
      const depositTx = await walletClient.writeContract({
        address: CONTRACTS.treasury,
        abi: TREASURY_ABI,
        functionName: token === 'USDC' ? 'depositUSDC' : 'depositEURC',
        args: [amountRaw],
        account: address,
        gas: estimatedDepositGas,
        ...gasParams,
      })
      setTxHash(depositTx);
      setDepositStatus('Confirming deposit...');
      await waitForTransaction(publicClient, depositTx);

      setDepositStatus('✅ Deposit successful!')
      toast.success(`${amount} ${token} deposited to treasury`)
      
      // Store in activity log
      addTransaction({
        description: `${token} Deposit`,
        amount: amount,
        token: token,
        date: new Date().toLocaleDateString('en-GB'),
        txHash: depositTx,
        status: 'confirmed',
      });

      setDepositAmount("");
      refetchTreasury();
      refetchWalletUSDC?.();
      refetchWalletEURC?.();

    } catch (error: any) {
      setDepositStatus('')
      setTxStep("error");
      const errorText = parseArcError(error);
      setErrorMessage(errorText);
      toast.error(errorText);
    }
  };

  const getRPCErrorMessage = (error: any): string => {
    const msg = error?.message || '';
    
    if (msg.includes('rate limit') || msg.includes('429') || msg.toLowerCase().includes('capacity exceeded') || msg.toLowerCase().includes('coalesce')) {
      return 'Arc network is busy — switching to backup node...';
    }
    if (msg.includes('timeout')) {
      return 'Connection timeout — retrying with backup node...';
    }
    if (msg.toLowerCase().includes('insufficient')) {
      return `Insufficient ${selectedToken} for this transaction`;
    }
    return 'Transaction failed — please try again';
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setTxStep("idle");
    setDepositAmount("");
    setErrorMessage("");
    setTxHash("");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">DAO Treasury</h1>
            <p className="text-muted text-xs sm:text-sm mt-1">Multi-asset capital reserves and smart treasury contracts on Arc Testnet.</p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 w-full lg:w-auto">
            {!isAuthenticated ? (
              <button 
                onClick={login}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white-keep font-semibold text-sm transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full lg:w-auto"
              >
                <Wallet className="w-4.5 h-4.5" />
                Connect Wallet to Deposit
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setShowBridge(true)}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 text-text-primary font-semibold text-sm transition-all border border-border-thin flex items-center justify-center gap-2 cursor-pointer hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] shrink-0 w-full lg:w-auto"
                >
                  🌉 Bridge USDC to Arc
                </button>

                <button 
                  onClick={() => setModalOpen(true)}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white-keep font-semibold text-sm transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full lg:w-auto"
                >
                  <PlusCircle className="w-4.5 h-4.5" />
                  Deposit Assets
                </button>
              </>
            )}
            
            <div className="bg-surface-elevated border border-border-thin px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center gap-3 shadow-md shrink-0 w-full lg:w-auto justify-between lg:justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <div className="text-right lg:text-left flex-1 lg:flex-none">
                <div className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Combined Total</div>
                <div className="text-base sm:text-lg font-bold font-mono text-text-primary flex items-center justify-end lg:justify-start h-[28px]">
                  {treasuryLoading ? (
                    <span className="inline-block w-20 h-5 bg-white/5 animate-pulse rounded mt-0.5" />
                  ) : (
                    `$${combinedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Overview Cards */}
        <SectionErrorBoundary sectionName="Treasury Balance Overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-[#2775CA]/10 border border-[#2775CA]/20 rounded-xl">
                <Coins className="w-5 h-5 text-[#2775CA]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-surface border border-border-thin text-muted">Stable</span>
            </div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">USDC Balance</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-text-primary mt-2 font-mono flex items-center h-[32px]">
              {treasuryLoading ? (
                <span className="inline-block w-28 h-7 bg-white/5 animate-pulse rounded" />
              ) : (
                `${usdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC`
              )}
            </h3>
            <p className="text-[11px] text-text-tertiary mt-1 font-mono">${usdcBalance.toLocaleString()} USD</p>
          </GlassCard>

          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-pink-500/10 border border-pink-500/20 rounded-xl">
                <Coins className="w-5 h-5 text-pink-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-surface border border-border-thin text-muted">Stable</span>
            </div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">EURC Balance</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-text-primary mt-2 font-mono flex items-center h-[32px]">
              {treasuryLoading ? (
                <span className="inline-block w-28 h-7 bg-white/5 animate-pulse rounded" />
              ) : (
                `${eurcBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} EURC`
              )}
            </h3>
            <p className="text-[11px] text-pink-400 mt-1 font-mono">≈ ${(eurcBalance * 1.08).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</p>
          </GlassCard>

          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-success/10 border border-success/20 rounded-xl">
                <Shield className="w-5 h-5 text-success" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-success/10 border border-success/20 text-success">Active</span>
            </div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Emergency Guardian</p>
            <h3 className="text-base font-bold text-text-primary mt-3">
              Deposits Pausable
            </h3>
            <p className="text-[11px] text-text-tertiary mt-1">Multi-signature emergency pause enabled</p>
          </GlassCard>
        </div>
      </SectionErrorBoundary>

        {/* Charts Row */}
        <SectionErrorBoundary sectionName="Treasury Valuation & Composition Charts">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Growth Chart */}
          <GlassCard className="lg:col-span-2 p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-text-primary mb-6">Treasury Valuation Trend (USD Value)</h3>
            <div className="flex-1 w-full h-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D1B4E" opacity={0.3} vertical={false} />
                  <XAxis dataKey="date" stroke="#9E8CA9" tick={{fill: '#9E8CA9', fontSize: 11}} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9E8CA9" tick={{fill: '#9E8CA9', fontSize: 11}} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} width={45} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#150A2E', borderColor: '#3D2E68', borderRadius: '12px', color: '#FFF' }}
                    formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, "US Valuation"]}
                  />
                  <Area type="monotone" dataKey="balance" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Allocation Composition */}
          <GlassCard className="p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-text-primary mb-6">Asset Composition (USD)</h3>
            <div className="flex-1 w-full min-h-0 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={compositionData}
                    cx="50%"
                    cy="40%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {compositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#150A2E', borderColor: '#3D2E68', borderRadius: '12px', color: '#FFF' }}
                    formatter={(v) => [`${v}%`, "Allocation"]}
                  />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs font-medium text-muted">{value}</span>} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </SectionErrorBoundary>

        {/* Pending Withdrawals (Timelocks) */}
        <SectionErrorBoundary sectionName="Treasury Timelocked Withdrawals & Activity">
          {pendingWithdrawals.length > 0 && (
          <GlassCard className="p-6 border border-warning/20 bg-warning/[0.01]">
            <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Pending Withdrawals (Timelocked)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-thin text-text-tertiary text-xs uppercase tracking-wider">
                    <th className="pb-4 font-bold pl-2">ID</th>
                    <th className="pb-4 font-bold">Recipient</th>
                    <th className="pb-4 font-bold">Amount</th>
                    <th className="pb-4 font-bold">Purpose / Details</th>
                    <th className="pb-4 font-bold">Status / Countdown</th>
                    <th className="pb-4 font-bold text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {pendingWithdrawals.map((q) => {
                    const diff = q.executionTime - currentTime;
                    const isReady = diff <= 0;
                    const timeLeftStr = isReady 
                      ? "Ready to Execute" 
                      : `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m left`;

                    return (
                      <tr key={q.id} className="border-b border-border-thin/50 hover:bg-surface-elevated/30 transition-colors">
                        <td className="py-4 pl-2 font-mono font-bold text-text-primary">#W-{q.id}</td>
                        <td className="py-4">
                          <span className="font-mono text-xs text-text-secondary bg-surface-elevated px-2 py-1 rounded border border-border-subtle" title={q.recipient}>
                            {q.recipient.slice(0, 6)}...{q.recipient.slice(-4)}
                          </span>
                        </td>
                        <td className="py-4 font-mono font-bold text-text-primary">
                          -{q.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {q.tokenSymbol}
                        </td>
                        <td className="py-4 text-text-secondary">{q.description}</td>
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold ${
                            isReady 
                              ? "bg-success/15 text-success border border-success/20" 
                              : "bg-warning/15 text-warning border border-warning/20"
                          }`}>
                            {timeLeftStr}
                          </span>
                        </td>
                        <td className="py-4 text-right pr-2 space-x-2">
                          <button
                            onClick={() => handleExecuteWithdrawal(q.id)}
                            disabled={!isReady || executingId === q.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isReady
                                ? "bg-success text-black hover:bg-success/90 shadow-[0_0_10px_rgba(34,197,94,0.2)] font-extrabold"
                                : "bg-surface-elevated text-text-tertiary border border-border-thin cursor-not-allowed font-extrabold"
                            }`}
                          >
                            {executingId === q.id ? "Executing..." : "Execute"}
                          </button>
                          
                          <button
                            onClick={() => handleCancelWithdrawal(q.id)}
                            disabled={cancelingId === q.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-danger/10 border border-danger/25 text-danger hover:bg-danger/20 transition-all cursor-pointer font-extrabold"
                          >
                            {cancelingId === q.id ? "Canceling..." : "Cancel (Admin)"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* Transactions Table */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-text-primary">Recent Activities</h3>
            {isHistoryLoading && (
              <span className="flex items-center gap-1.5 text-xs text-primary font-semibold animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Syncing history...
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-thin text-text-tertiary text-xs uppercase tracking-wider">
                  <th className="pb-4 font-bold pl-2">Type</th>
                  <th className="pb-4 font-bold">Description</th>
                  <th className="pb-4 font-bold">Amount</th>
                  <th className="pb-4 font-bold">Date</th>
                  <th className="pb-4 font-bold text-right pr-2">Tx</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {treasuryLoading || (isHistoryLoading && recentTransactions.length === 0) ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border-thin/50">
                      <td className="py-4 pl-2">
                        <div className="h-6 w-16 bg-white/5 animate-pulse rounded" />
                      </td>
                      <td className="py-4">
                        <div className="h-4 w-32 bg-white/5 animate-pulse rounded" />
                      </td>
                      <td className="py-4 font-mono font-bold">
                        <div className="h-4 w-20 bg-white/5 animate-pulse rounded" />
                      </td>
                      <td className="py-4">
                        <div className="h-4 w-24 bg-white/5 animate-pulse rounded" />
                      </td>
                      <td className="py-4 text-right pr-2">
                        <div className="h-4 w-12 bg-white/5 animate-pulse rounded ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : recentTransactions.length > 0 ? (
                  recentTransactions.map((tx, i) => (
                    <tr key={tx.id || i} className="border-b border-border-thin/50 hover:bg-surface-elevated/30 transition-colors">
                      <td className="py-4 pl-2">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold
                          ${tx.type === 'Inflow' ? 'bg-success/10 text-success border border-success/10' : 
                            'bg-danger/10 text-danger border border-danger/10'}
                        `}>
                          {tx.type === 'Inflow' ? <ArrowDownRight className="w-3.5 h-3.5" /> : 
                           <ArrowUpRight className="w-3.5 h-3.5" />}
                          {tx.type}
                        </div>
                      </td>
                      <td className="py-4 text-text-secondary">{tx.description}</td>
                      <td className="py-4 font-mono font-bold text-text-primary">
                        {tx.type === 'Outflow' ? '-' : '+'}
                        {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx.token}
                      </td>
                      <td className="py-4 text-text-tertiary">
                        {new Date(tx.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-4 text-right pr-2">
                        <a 
                          href={`https://testnet.arcscan.app/tx/${tx.txHash}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-primary hover:underline font-mono text-xs"
                        >
                          {tx.txHash ? tx.txHash.slice(0,6) + '...' + tx.txHash.slice(-4) : 'Pending...'}
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-tertiary">No recent activities found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </SectionErrorBoundary>

      {/* Deposit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={handleModalClose} />
          
          <GlassCard className="w-full max-w-md p-6 relative z-10 animate-fade-in-up border border-border-thin">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border-thin pb-4 mb-6">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg text-text-primary">Deposit to Treasury</h3>
              </div>
              <button 
                onClick={handleModalClose}
                className="p-1.5 text-muted hover:text-text-primary hover:bg-surface-elevated rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Token Selector */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">Select Token</label>
                <div className="grid grid-cols-2 gap-4">
                  {(["USDC", "EURC"] as const).map((token) => (
                    <button
                      key={token}
                      onClick={() => {
                        setSelectedToken(token);
                        setDepositAmount("");
                        setTxStep("idle");
                      }}
                      className={`p-3 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        selectedToken === token
                          ? "bg-accent-purple border-accent-purple text-white-keep shadow-[0_0_15px_rgba(124,58,237,0.12)]"
                          : "bg-surface border-border-thin text-muted hover:text-foreground hover:bg-surface-elevated"
                      }`}
                    >
                      <Coins className={`w-4 h-4 ${token === "USDC" ? "text-[#2775CA]" : "text-pink-400"}`} />
                      {token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Balance display */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Wallet Balance</span>
                <span className="font-semibold text-text-primary font-mono">{parseFloat(currentWalletBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedToken}</span>
              </div>

              {/* Amount input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block">Deposit Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={txStep === "approving" || txStep === "depositing"}
                    className="w-full pl-4 pr-16 py-3 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none transition-colors text-text-primary font-mono text-sm disabled:opacity-50"
                  />
                  <button
                    onClick={handleMaxClick}
                    disabled={txStep === "approving" || txStep === "depositing"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[10px] font-bold uppercase bg-primary/10 border border-primary/20 hover:bg-primary/20 rounded text-primary transition-colors cursor-pointer disabled:opacity-50"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Gas info */}
              <div className="bg-surface-elevated p-3 rounded-xl border border-border-thin flex justify-between items-center text-xs">
                <span className="text-muted flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-muted" />
                  Gas Fee
                </span>
                <span className="text-success font-semibold">Gasless via Paymaster</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger flex flex-col gap-2 mb-6 animate-fade-in-up">
                <div className="flex items-start gap-2 w-full">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="break-words w-full">{errorMessage}</span>
                </div>
                {(errorMessage.includes("busy") || errorMessage.includes("timeout") || errorMessage.includes("failed") || errorMessage.includes("again")) && (
                  <button 
                    onClick={() => {
                      setErrorMessage("");
                      handleDepositSubmit();
                    }}
                    className="self-end px-3 py-1.5 rounded-lg bg-danger/20 border border-danger/30 hover:bg-danger/30 text-xs font-bold text-danger transition-colors cursor-pointer flex items-center gap-1 mt-1"
                  >
                    🔄 Retry Deposit
                  </button>
                )}
              </div>
            )}

            {/* Success message */}
            {txStep === "success" && (
              <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-center space-y-3 mb-6 animate-fade-in-up">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center mx-auto text-success">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary text-sm">Deposit Confirmed!</h4>
                  <p className="text-xs text-muted mt-1">Your assets have been deposited into the SynArc Treasury on-chain.</p>
                </div>
                {txHash && (
                  <a
                    href={`https://testnet.arcscan.app/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-xs font-semibold text-primary hover:underline font-mono"
                  >
                    Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </a>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleModalClose}
                disabled={txStep === "approving" || txStep === "depositing"}
                className="flex-1 py-3 border border-border-thin text-muted font-bold text-sm rounded-xl hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer disabled:opacity-50"
              >
                {txStep === "success" ? "Close" : "Cancel"}
              </button>
              
              {txStep !== "success" && (
                <button
                  onClick={handleDepositSubmit}
                  disabled={txStep === "approving" || txStep === "depositing" || !depositAmount}
                  className="flex-1 py-3 bg-accent-purple text-white-keep font-bold text-sm rounded-xl hover:bg-accent-purple/90 transition-all shadow-[0_0_15px_rgba(124,58,237,0.15)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {txStep === "approving" ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Approving...
                    </>
                  ) : txStep === "depositing" ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Depositing...
                    </>
                  ) : (
                    "Confirm Deposit"
                  )}
                </button>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Bridge Modal */}
      <BridgeModal 
        isOpen={showBridge} 
        onClose={() => setShowBridge(false)} 
        onSuccess={() => {
          refetchWalletUSDC?.();
          refetchTreasury?.();
        }}
      />
    </div>
  );
}

export default function TreasuryPage() {
  return (
    <ErrorBoundary>
      <TreasuryPageContent />
    </ErrorBoundary>
  );
}

// Simple dynamic loader helper icon
function RefreshCw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
