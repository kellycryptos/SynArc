"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useTreasuryBalances, invalidateTreasuryBalances } from "@/hooks/useTreasuryBalances";
import { useUSDCBalance, invalidateUSDCBalance } from "@/hooks/useUSDCBalance";
import { useEURCBalance, invalidateEURCBalance } from "@/hooks/useEURCBalance";
import { useCirBTCBalance, invalidateCirBTCBalance } from "@/hooks/useCirBTCBalance";
import { useAuth } from "@/hooks/auth/useAuth";
import { useWallets as usePrivyWallets } from "@/hooks/useWallets";
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
import { resolveAttestationLink } from "@/lib/attestation";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";

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
const getEurcAddress = () => (CONTRACTS.eurc || '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1') as `0x${string}`;
import { AuthPromptBanner } from "@/components/auth/AuthPromptBanner";
import { TokenIcon } from "@/components/ui/TokenIcon";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  ArrowUpRight, ArrowDownRight, Activity, Wallet, PieChart, Coins, Info, PlusCircle, X, Check, Clock, TrendingUp
} from "lucide-react";

const BridgeModal = dynamic(
  () => import("@/components/BridgeModal").then((m) => m.BridgeModal),
  { ssr: false }
);

const TreasuryChartsSection = dynamic(
  () => import("@/components/charts/TreasuryChartsSection").then((m) => m.TreasuryChartsSection),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 skeleton h-[400px] rounded-2xl" />
        <div className="skeleton h-[400px] rounded-2xl" />
      </div>
    ),
  }
);


function TreasuryPageContent() {
  const { 
    balance: combinedTotal, 
    usdcBalance, 
    eurcBalance, 
    cirBtcBalance,
    activities, 
    queuedWithdrawals,
    isLoading: treasuryLoading, 
    isHistoryLoading,
    refetch: refetchTreasury 
  } = useTreasuryBalances();

  const { balance: walletUSDC, refetch: refetchWalletUSDC } = useUSDCBalance();
  const { balance: walletEURC, refetch: refetchWalletEURC } = useEURCBalance();
  const { balance: walletCirBTC, refetch: refetchWalletCirBTC } = useCirBTCBalance();
  // usePrivyWallets and wagmi hooks may not have a wallet when Circle is the only connection.
  // Safe-wrap them so they return empty/noop values instead of crashing.
  const { wallets: privyWallets } = usePrivyWallets();
  const wallets = privyWallets ?? [];
  const { isAuthenticated, login, walletAddress, isCircle } = useAuth();
  const { isArcMainnet, isArcTestnet, contracts, arcChain, explorerUrl } = useArcNetwork();

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

  const targetChainId = arcChain?.id || (isArcTestnet ? 5042002 : 5042);

  const handleExecuteWithdrawal = async (id: string) => {
    if (!isAuthenticated) {
      login();
      return;
    }
    
    setExecutingId(id);
    const toastId = toast.loading("Initiating withdrawal execution...");
    
    try {
      const { walletClient, publicClient, address } = await getAuthenticatedClient(wallets, targetChainId, walletAddress);
      const gasParams = await getAggressiveGasParams(publicClient);
      
      const hash = await walletClient.writeContract({
        address: contracts.treasury,
        abi: TreasuryABI,
        functionName: 'executeWithdrawal',
        args: [BigInt(id)],
        account: address,
        gas: 300000n,
        ...gasParams
      });
      
      toast.loading("⏳ Confirming withdrawal execution...", { id: toastId });
      await waitForTransaction(publicClient, hash);
      toast.success("Withdrawal executed successfully!", { id: toastId });
      refetchTreasury();
      invalidateTreasuryBalances();
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
      const { walletClient, publicClient, address } = await getAuthenticatedClient(wallets, targetChainId, walletAddress);
      const gasParams = await getAggressiveGasParams(publicClient);
      
      const hash = await walletClient.writeContract({
        address: contracts.treasury,
        abi: TreasuryABI,
        functionName: 'cancelWithdrawal',
        args: [BigInt(id)],
        account: address,
        gas: 300000n,
        ...gasParams
      });
      
      toast.loading("⏳ Confirming cancellation...", { id: toastId });
      await waitForTransaction(publicClient, hash);
      toast.success("Withdrawal canceled successfully!", { id: toastId });
      refetchTreasury();
      invalidateTreasuryBalances();
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
    token: 'USDC' | 'EURC' | 'cirBTC'
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
  const [selectedToken, setSelectedToken] = useState<"USDC" | "EURC" | "cirBTC">("USDC");
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
    if (selectedToken === "USDC") return walletUSDC || "0.00";
    if (selectedToken === "EURC") return walletEURC || "0.00";
    return walletCirBTC || "0.00";
  }, [selectedToken, walletUSDC, walletEURC, walletCirBTC]);

  // Combined USD Total simulations
  const chartData = useMemo(() => {
    if (!activities.length) {
      return [{ date: "Now", balance: combinedTotal }];
    }
    
    // Sort descending (newest first) to accurately trace back running balance
    const sortedDesc = [...activities].slice(0, 30).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    let runningBalance = combinedTotal;
    const points: { date: string; balance: number }[] = [
      { date: "Current", balance: Number(combinedTotal.toFixed(2)) }
    ];

    for (const act of sortedDesc) {
      points.push({
        date: new Date(act.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        balance: Number(Math.max(0, runningBalance).toFixed(2)),
      });
      const factor = act.token === "EURC" ? 1.08 : (act.token === "cirBTC" || act.token === "BTC") ? 95000 : 1.0;
      if (act.type === 'Inflow') {
        runningBalance -= (act.amount * factor);
      } else if (act.type === 'Outflow') {
        runningBalance += (act.amount * factor);
      }
    }

    if (sortedDesc.length > 0) {
      const oldestDate = new Date(sortedDesc[sortedDesc.length - 1].timestamp);
      oldestDate.setDate(oldestDate.getDate() - 1);
      points.push({
        date: oldestDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        balance: Number(Math.max(0, runningBalance).toFixed(2)),
      });
    }

    return points.reverse();
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
    const contractHashes = new Set(activities.map(a => a.txHash).filter(Boolean));
    const filteredLocal = localActs.filter(a => !contractHashes.has(a.txHash));

    return [...filteredLocal, ...activities].slice(0, 15);
  }, [recentActivity, activities]);

  // Asset Composition details
  const usdcValueInUSD = usdcBalance;
  const eurcValueInUSD = eurcBalance * 1.08;
  const cirBtcValueInUSD = (cirBtcBalance || 0) * 95000;
  const totalValueInUSD = usdcValueInUSD + eurcValueInUSD + cirBtcValueInUSD;

  const compositionData = useMemo(() => {
    if (totalValueInUSD === 0) {
      return [
        { name: "USDC", value: 100, color: "#2775CA" },
        { name: "EURC", value: 0, color: "#EC4899" },
        { name: "cirBTC", value: 0, color: "#F7931A" }
      ];
    }
    return [
      { name: "USDC", value: parseFloat(((usdcValueInUSD / totalValueInUSD) * 100).toFixed(1)), color: "#2775CA" },
      { name: "EURC", value: parseFloat(((eurcValueInUSD / totalValueInUSD) * 100).toFixed(1)), color: "#EC4899" },
      { name: "cirBTC", value: parseFloat(((cirBtcValueInUSD / totalValueInUSD) * 100).toFixed(1)), color: "#F7931A" }
    ];
  }, [usdcValueInUSD, eurcValueInUSD, cirBtcValueInUSD, totalValueInUSD]);

  const handleMaxClick = () => {
    const num = parseFloat(currentWalletBalance || "0");
    if (isNaN(num) || num <= 0) return;
    if (selectedToken === "USDC" && !isCircle) {
      // Leave 0.05 USDC buffer for Arc native gas fees when using external wallets
      const maxWithGasBuffer = Math.max(0, num - 0.05);
      setDepositAmount(maxWithGasBuffer > 0 ? maxWithGasBuffer.toFixed(4).replace(/\.?0+$/, "") : "0");
    } else if (selectedToken === "cirBTC") {
      setDepositAmount(num.toFixed(8).replace(/\.?0+$/, ""));
    } else {
      setDepositAmount(num.toString());
    }
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
      setErrorMessage(`Insufficient ${token} balance in your wallet. You have ${balanceVal.toFixed(token === 'cirBTC' ? 6 : 2)} ${token}, but tried to deposit ${amount.toFixed(token === 'cirBTC' ? 6 : 2)} ${token}.`);
      setTxStep("error");
      return;
    }

    if (token === "USDC" && !isCircle && balanceVal - amount < 0.01) {
      setErrorMessage(`Please leave at least 0.02 USDC in your wallet to cover network gas fees.`);
      setTxStep("error");
      return;
    }

    setDepositStatus('Preparing...');
    setErrorMessage("");

    try {
      // Get authenticated client and wallet
      const { walletClient, publicClient, address } = await getAuthenticatedClient(wallets, targetChainId, walletAddress);

      const tokenAddress = token === 'USDC' 
        ? (contracts.usdc || USDC_ADDRESS) 
        : token === 'EURC'
          ? (contracts.eurc || (isArcTestnet ? '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' : '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1'))
          : (contracts.cirBTC || (isArcTestnet ? '0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF' : '0x171A4217b86A807A64eB94757Db6849fb4bDbAA0'));
      
      const decimals = token === 'cirBTC' ? 8 : 6;
      // Cleanly parse amount to required decimals, preventing float inaccuracies or overflow
      const sanitizedAmountStr = depositAmount.includes('.')
        ? depositAmount.split('.')[0] + '.' + depositAmount.split('.')[1].slice(0, decimals)
        : depositAmount;
      const amountRaw = parseUnits(sanitizedAmountStr, decimals);

      // ERC20 ABI for checking on-chain balance & allowance & transfer
      const ERC20_TOKEN_ABI = [
        {
          name: 'allowance',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }]
        },
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }]
        },
        {
          name: 'approve',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
          outputs: [{ name: '', type: 'bool' }]
        },
        {
          name: 'transfer',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [{ name: 'recipient', type: 'address' }, { name: 'amount', type: 'uint256' }],
          outputs: [{ name: '', type: 'bool' }]
        }
      ] as const;

      // Dynamically estimate fees using low-latency and aggressive parameters
      const gasParams = await getAggressiveGasParams(publicClient);

      // 1. Verify on-chain balance BEFORE doing anything
      setDepositStatus('Checking balance...');
      let onchainBalance = 0n;
      try {
        onchainBalance = await publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_TOKEN_ABI,
          functionName: 'balanceOf',
          args: [address],
        }) as bigint;
      } catch (e) {
        console.warn('Failed to read onchain balance:', e);
      }

      if (onchainBalance > 0n && onchainBalance < amountRaw) {
        const balFormatted = (Number(onchainBalance) / (10 ** decimals)).toFixed(decimals === 8 ? 6 : 4);
        throw new Error(`Insufficient ${token} balance. Your current on-chain balance is ${balFormatted} ${token}, which is less than ${depositAmount} ${token}.`);
      }

      // Check native gas balance for external wallets
      if (token === 'USDC' && !isCircle) {
        try {
          const nativeGasWei = await publicClient.getBalance({ address });
          if (nativeGasWei < 5000000000000000n) { // 0.005 USDC
            throw new Error(`Low native USDC balance. You need at least 0.01 USDC in your wallet to cover Arc network transaction gas fees.`);
          }
        } catch (e: any) {
          if (e?.message?.includes('Low native USDC')) throw e;
        }
      }

      let depositTx: `0x${string}`;

      if (token === 'cirBTC') {
        // Direct ERC-20 transfer to Treasury contract
        setDepositStatus('Depositing cirBTC to Treasury...');
        let estimatedTransferGas = 200000n;
        try {
          const est = await publicClient.estimateContractGas({
            address: tokenAddress,
            abi: ERC20_TOKEN_ABI,
            functionName: 'transfer',
            args: [contracts.treasury, amountRaw],
            account: address,
          });
          estimatedTransferGas = (est * 150n) / 100n;
          if (estimatedTransferGas < 200000n) estimatedTransferGas = 200000n;
        } catch (e) {
          console.warn('cirBTC transfer gas estimation failed:', e);
        }

        depositTx = await walletClient.writeContract({
          address: tokenAddress,
          abi: ERC20_TOKEN_ABI,
          functionName: 'transfer',
          args: [contracts.treasury, amountRaw],
          account: address,
          gas: estimatedTransferGas,
          ...gasParams,
        });
      } else {
        // 2. Check existing allowance to skip unnecessary approve tx (for USDC / EURC)
        setDepositStatus('Checking allowance...');
        let existingAllowance = 0n;
        try {
          existingAllowance = await publicClient.readContract({
            address: tokenAddress,
            abi: ERC20_TOKEN_ABI,
            functionName: 'allowance',
            args: [address, contracts.treasury],
          }) as bigint;
        } catch (e) {
          console.warn('Allowance check failed, proceeding with approve:', e);
        }

        if (existingAllowance < amountRaw) {
          let estimatedApproveGas = 250000n;
          try {
            const est = await publicClient.estimateContractGas({
              address: tokenAddress,
              abi: ERC20_TOKEN_ABI,
              functionName: 'approve',
              args: [contracts.treasury, amountRaw],
              account: address,
            });
            estimatedApproveGas = (est * 150n) / 100n;
            if (estimatedApproveGas < 250000n) estimatedApproveGas = 250000n;
          } catch (e) {
            console.warn('Approve gas estimation failed:', e);
          }

          setDepositStatus('Approving ' + token + '...');
          const approveTx = await walletClient.writeContract({
            address: tokenAddress,
            abi: ERC20_TOKEN_ABI,
            functionName: 'approve',
            args: [contracts.treasury, amountRaw],
            account: address,
            gas: estimatedApproveGas,
            ...gasParams,
          });

          setDepositStatus('Confirming approval...');
          await waitForTransaction(publicClient, approveTx);

          // Allow block state to propagate across RPC nodes and verify allowance
          setDepositStatus('Verifying approval on-chain...');
          for (let i = 0; i < 6; i++) {
            await new Promise((resolve) => setTimeout(resolve, 600));
            try {
              const updatedAllowance = await publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_TOKEN_ABI,
                functionName: 'allowance',
                args: [address, contracts.treasury],
              }) as bigint;
              if (updatedAllowance >= amountRaw) break;
            } catch {}
          }
        } else {
          console.log(`[Treasury Deposit] Allowance ${existingAllowance} >= ${amountRaw}. Skipping approve.`);
        }

        // 3. Re-verify on-chain balance after approval (in case approval gas deducted native USDC)
        if (token === 'USDC' && !isCircle) {
          try {
            const postApproveBal = await publicClient.readContract({
              address: tokenAddress,
              abi: ERC20_TOKEN_ABI,
              functionName: 'balanceOf',
              args: [address],
            }) as bigint;

            if (postApproveBal < amountRaw) {
              const remBal = (Number(postApproveBal) / 1_000_000).toFixed(4);
              throw new Error(`Insufficient ${token} balance after approval gas. Remaining balance: ${remBal} ${token}. Please deposit a slightly smaller amount to leave room for gas.`);
            }
          } catch (e: any) {
            if (e?.message?.includes('Insufficient')) throw e;
          }
        }

        // 4. Deposit
        let estimatedDepositGas = 300000n;
        try {
          const est = await publicClient.estimateContractGas({
            address: contracts.treasury,
            abi: TREASURY_ABI,
            functionName: token === 'USDC' ? 'depositUSDC' : 'depositEURC',
            args: [amountRaw],
            account: address,
          });
          estimatedDepositGas = (est * 150n) / 100n;
          if (estimatedDepositGas < 300000n) estimatedDepositGas = 300000n;
        } catch (e: any) {
          console.warn('Deposit gas estimation simulation failed:', e);
          if (e?.message?.includes('transfer amount exceeds balance')) {
            throw new Error(`Deposit failed: transfer amount exceeds your available ${token} balance.`);
          }
          if (e?.message?.includes('transfer amount exceeds allowance')) {
            throw new Error(`Deposit failed: approval is still confirming on the network. Please retry in a few seconds.`);
          }
        }

        setDepositStatus('Sending deposit transaction...');
        depositTx = await walletClient.writeContract({
          address: contracts.treasury,
          abi: TREASURY_ABI,
          functionName: token === 'USDC' ? 'depositUSDC' : 'depositEURC',
          args: [amountRaw],
          account: address,
          gas: estimatedDepositGas,
          ...gasParams,
        });
      }

      setTxHash(depositTx);
      setDepositStatus('Confirming deposit...');
      await waitForTransaction(publicClient, depositTx);

      setDepositStatus('Deposit successful!');
      toast.success(`${amount} ${token} deposited to treasury`);
      
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
      refetchWalletCirBTC?.();
      invalidateUSDCBalance();
      invalidateEURCBalance();
      invalidateCirBTCBalance();
      invalidateTreasuryBalances();

    } catch (error: any) {
      setDepositStatus('');
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-space">
              DAO Treasury
            </h1>
            <p className="text-muted text-xs sm:text-sm mt-1">
              Multi-asset capital reserves and smart treasury contracts on {isArcMainnet ? "Arc Mainnet" : "Arc Testnet"}.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            {!isAuthenticated ? (
              <button 
                onClick={login}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#2F6FFF] to-[#4F8BFF] text-white font-space font-semibold text-xs tracking-wide shadow-md shadow-[#2F6FFF]/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet to Deposit
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setShowBridge(true)}
                  className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-surface border border-border hover:border-primary/40 hover:bg-surface-elevated text-foreground font-space font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  Bridge USDC to Arc
                </button>

                <Link
                  href="/earn"
                  className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-space font-semibold text-xs transition-all border border-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Earn Yield
                </Link>

                <button 
                  onClick={() => setModalOpen(true)}
                  className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#2F6FFF] to-[#4F8BFF] text-white font-space font-semibold text-xs tracking-wide shadow-md shadow-[#2F6FFF]/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Deposit Assets
                </button>
              </>
            )}
          </div>
        </div>

        {/* Balance Overview Cards */}
        <SectionErrorBoundary sectionName="Treasury Balance Overview">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {/* Combined Total Reserves */}
            <GlassCard className="p-6 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-primary/10 border border-primary/25 rounded-xl flex items-center justify-center text-primary">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-surface border border-border-thin text-primary font-mono">Total Reserves</span>
              </div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider font-space">Combined Valuation</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-foreground mt-2 font-mono flex items-center h-[32px]">
                {treasuryLoading ? (
                  <span className="inline-block w-28 h-7 bg-surface-elevated animate-pulse rounded" />
                ) : (
                  `$${combinedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </h3>
              <p className="text-xs text-muted mt-1 font-mono">USD Net Asset Value</p>
            </GlassCard>

            {/* USDC Balance */}
            <GlassCard className="p-6 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#2775CA]/10 rounded-full blur-2xl group-hover:bg-[#2775CA]/20 transition-colors" />
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-[#2775CA]/10 border border-[#2775CA]/20 rounded-xl flex items-center justify-center">
                  <TokenIcon symbol="USDC" size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-surface border border-border-thin text-muted font-mono">Stable</span>
              </div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider font-space">USDC Balance</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-foreground mt-2 font-mono flex items-center h-[32px]">
                {treasuryLoading ? (
                  <span className="inline-block w-28 h-7 bg-surface-elevated animate-pulse rounded" />
                ) : (
                  `${usdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
                )}
              </h3>
              <p className="text-xs text-muted mt-1 font-mono">${usdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</p>
            </GlassCard>

            {/* EURC Balance */}
            <GlassCard className="p-6 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20 transition-colors" />
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center justify-center">
                  <TokenIcon symbol="EURC" size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-surface border border-border-thin text-muted font-mono">Stable</span>
              </div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider font-space">EURC Balance</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-foreground mt-2 font-mono flex items-center h-[32px]">
                {treasuryLoading ? (
                  <span className="inline-block w-28 h-7 bg-surface-elevated animate-pulse rounded" />
                ) : (
                  `${eurcBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EURC`
                )}
              </h3>
              <p className="text-xs text-muted mt-1 font-mono">≈ ${(eurcBalance * 1.08).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</p>
            </GlassCard>

            {/* cirBTC Balance */}
            <GlassCard className="p-6 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#F7931A]/10 rounded-full blur-2xl group-hover:bg-[#F7931A]/20 transition-colors" />
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-[#F7931A]/10 border border-[#F7931A]/20 rounded-xl flex items-center justify-center">
                  <TokenIcon symbol="cirBTC" size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-surface border border-border-thin text-muted font-mono">Wrapped BTC</span>
              </div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider font-space">cirBTC Balance</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-foreground mt-2 font-mono flex items-center h-[32px]">
                {treasuryLoading ? (
                  <span className="inline-block w-28 h-7 bg-surface-elevated animate-pulse rounded" />
                ) : (
                  `${(cirBtcBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} cirBTC`
                )}
              </h3>
              <p className="text-xs text-muted mt-1 font-mono">≈ ${((cirBtcBalance || 0) * 95000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</p>
            </GlassCard>
          </div>
        </SectionErrorBoundary>

        {/* Charts Row */}
        <SectionErrorBoundary sectionName="Treasury Valuation & Composition Charts">
          <TreasuryChartsSection chartData={chartData} compositionData={compositionData} />
        </SectionErrorBoundary>

        {/* Pending Withdrawals (Timelocks) */}
        <SectionErrorBoundary sectionName="Treasury Timelocked Withdrawals & Activity">
          {pendingWithdrawals.length > 0 && (
          <GlassCard className="p-6 border border-warning/20 bg-warning/[0.01]">
            <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Pending Withdrawals (Timelocked)
            </h3>
            <div className="table-wrapper overflow-x-auto">
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
                        <td className="py-4 text-text-secondary">
                          <div>{q.description}</div>
                          {q.deliverableURI && (
                            <div className="mt-1">
                              <a
                                href={resolveAttestationLink(q.deliverableURI)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-mono"
                              >
                                Attestation Doc ↗
                              </a>
                            </div>
                          )}
                        </td>
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
          <div className="table-wrapper overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-thin text-text-tertiary text-xs uppercase tracking-wider">
                  <th className="pb-4 font-bold pl-2">Type</th>
                  <th className="pb-4 font-bold">Description</th>
                  <th className="pb-4 font-bold">Amount</th>
                  <th className="pb-4 font-bold">Document Proof</th>
                  <th className="pb-4 font-bold">Date</th>
                  <th className="pb-4 font-bold text-right pr-2">Tx / Party</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {(treasuryLoading && recentTransactions.length === 0) ? (
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
                      <td className="py-4">
                        {tx.deliverableURI ? (
                          <a
                            href={resolveAttestationLink(tx.deliverableURI)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary/10 border border-primary/25 text-primary text-xs font-mono hover:bg-primary/20 transition-colors"
                          >
                            <span>Verified Doc ↗</span>
                          </a>
                        ) : (
                          <span className="text-text-tertiary text-xs font-mono">—</span>
                        )}
                      </td>
                      <td className="py-4 text-text-tertiary">
                        {new Date(tx.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-4 text-right pr-2">
                        {tx.txHash && tx.txHash.startsWith('0x') && tx.txHash.length > 20 ? (
                          <a 
                            href={`${explorerUrl}/tx/${tx.txHash}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-primary hover:underline font-mono text-xs"
                          >
                            {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                          </a>
                        ) : tx.party && tx.party.startsWith('0x') && tx.party.length > 20 ? (
                          <a 
                            href={`${explorerUrl}/address/${tx.party}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-primary hover:underline font-mono text-xs"
                            title={`Party: ${tx.party}`}
                          >
                            {tx.party.slice(0, 6)}...{tx.party.slice(-4)}
                          </a>
                        ) : (
                          <span className="text-text-tertiary font-mono text-xs">On-Chain</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-tertiary">No recent activities found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </SectionErrorBoundary>

      {/* Deposit Modal */}
      {modalOpen && (
        <div className="modal fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={handleModalClose} />
          
          <GlassCard className="modal-content w-full max-w-md p-6 relative z-10 animate-fade-in-up border border-border-thin">
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
                <div className="grid grid-cols-3 gap-3">
                  {(["USDC", "EURC", "cirBTC"] as const).map((token) => (
                    <button
                      key={token}
                      onClick={() => {
                        setSelectedToken(token);
                        setDepositAmount("");
                        setTxStep("idle");
                      }}
                      className={`p-3 rounded-xl border font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                        selectedToken === token
                          ? "bg-accent-purple border-accent-purple text-white-keep shadow-[0_0_15px_rgba(124,58,237,0.12)]"
                          : "bg-surface border-border-thin text-muted hover:text-foreground hover:bg-surface-elevated"
                      }`}
                    >
                      <TokenIcon symbol={token} size={18} />
                      {token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Balance display */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Wallet Balance</span>
                <span className="font-semibold text-text-primary font-mono">
                  {parseFloat(currentWalletBalance || "0").toLocaleString(undefined, {
                    minimumFractionDigits: selectedToken === 'cirBTC' ? 4 : 2,
                    maximumFractionDigits: selectedToken === 'cirBTC' ? 8 : 2
                  })} {selectedToken}
                </span>
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
                <span className="text-success font-semibold">
                  {isCircle ? "Gasless via Paymaster" : "~0.01 USDC (Native Gas)"}
                </span>
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
                    Retry Deposit
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
                  <p className="text-xs text-muted mt-1">Your assets have been deposited into the Syn DAO Treasury on-chain.</p>
                </div>
                {txHash && (
                  <a
                    href={`${explorerUrl}/tx/${txHash}`}
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
      {showBridge && (
        <BridgeModal 
          isOpen={showBridge} 
          onClose={() => setShowBridge(false)} 
          onSuccess={() => {
            refetchWalletUSDC?.();
            refetchTreasury?.();
          }}
        />
      )}
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
