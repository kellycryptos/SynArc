import { useEffect, useState, useCallback } from 'react';
import { createPublicClient, http, fallback } from 'viem';
import { arcTestnet, ARC_RPC_URLS } from '@/lib/arc-config';
import { TreasuryActivity } from '@/types';

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const TREASURY_ABI = [
  {
    name: 'getTransactions',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        type: 'tuple[]',
        name: '',
        components: [
          { name: 'txType', type: 'string' },
          { name: 'party', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'tokenSymbol', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'getQueuedWithdrawals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        type: 'tuple[]',
        name: '',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'recipient', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'token', type: 'address' },
          { name: 'tokenSymbol', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'executionTime', type: 'uint256' },
          { name: 'executed', type: 'bool' },
          { name: 'canceled', type: 'bool' },
        ],
      },
    ],
  },
] as const;

const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as `0x${string}`;
const EURC_ADDRESS = (process.env.NEXT_PUBLIC_EURC_CONTRACT_ADDRESS ||
  '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a') as `0x${string}`;

export interface QueuedWithdrawal {
  id: string;
  recipient: string;
  amount: number;
  token: string;
  tokenSymbol: string;
  description: string;
  executionTime: number;
  executed: boolean;
  canceled: boolean;
}

export const useTreasuryBalances = (customTreasuryAddress?: string) => {
  const treasuryAddress = (customTreasuryAddress ||
    process.env.NEXT_PUBLIC_TREASURY_ADDRESS ||
    '0xFE0F6bF45D363d34CD5fC1781594a7471736dC18') as `0x${string}`;

  const [balance, setBalance] = useState(0); // Combined total in USD
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [eurcBalance, setEurcBalance] = useState(0);
  const [activities, setActivities] = useState<TreasuryActivity[]>([]);
  const [queuedWithdrawals, setQueuedWithdrawals] = useState<QueuedWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    setLoading(true);
    setError(null);

    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: fallback(ARC_RPC_URLS.map((url) => http(url))),
    });

    try {
      // Fetch USDC, EURC, activities, and queued withdrawals in parallel
      const [usdcBal, eurcBal, rawActivities, rawQueued] = await Promise.all([
        publicClient.readContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [treasuryAddress],
        }).catch(() => 0n),
        publicClient.readContract({
          address: EURC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [treasuryAddress],
        }).catch(() => 0n),
        publicClient.readContract({
          address: treasuryAddress,
          abi: TREASURY_ABI,
          functionName: 'getTransactions',
        }).catch(() => [] as any),
        publicClient.readContract({
          address: treasuryAddress,
          abi: TREASURY_ABI,
          functionName: 'getQueuedWithdrawals',
        }).catch(() => [] as any),
      ]);

      const usdcVal = Number(usdcBal) / 1_000_000;
      const eurcVal = Number(eurcBal) / 1_000_000;

      // Format activities
      const formattedActivities: TreasuryActivity[] = rawActivities.map((act: any, idx: number) => ({
        id: idx.toString(),
        type: act.txType as "Inflow" | "Outflow",
        amount: Number(act.amount) / 1_000_000,
        token: act.tokenSymbol || "USDC",
        timestamp: new Date(Number(act.timestamp) * 1000).toISOString(),
        description: act.description,
        party: act.party,
        txHash: "0x" + Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")
      }));

      // Format queued withdrawals
      const formattedQueued: QueuedWithdrawal[] = rawQueued.map((q: any) => ({
        id: q.id.toString(),
        recipient: q.recipient,
        amount: Number(q.amount) / 1_000_000,
        token: q.token,
        tokenSymbol: q.tokenSymbol || "USDC",
        description: q.description,
        executionTime: Number(q.executionTime),
        executed: q.executed,
        canceled: q.canceled,
      }));

      setQueuedWithdrawals(formattedQueued);

      // Merge simulated activities from localStorage
      let simulatedActivities: TreasuryActivity[] = [];
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(`synarc_simulated_activities_${treasuryAddress}`);
          if (stored) {
            simulatedActivities = JSON.parse(stored);
          }
        } catch (err) {
          console.error("Failed to parse simulated activities from localStorage", err);
        }
      }
      const combinedActivities = [...simulatedActivities, ...formattedActivities];

      // Sum up simulated activities to adjust balances
      let simulatedUSDC = 0;
      let simulatedEURC = 0;
      simulatedActivities.forEach(act => {
        const val = act.amount;
        if (act.type === "Inflow") {
          if (act.token === "USDC") simulatedUSDC += val;
          else if (act.token === "EURC") simulatedEURC += val;
        } else {
          if (act.token === "USDC") simulatedUSDC -= val;
          else if (act.token === "EURC") simulatedEURC -= val;
        }
      });

      const finalUSDC = usdcVal + simulatedUSDC;
      const finalEURC = eurcVal + simulatedEURC;

      setUsdcBalance(finalUSDC);
      setEurcBalance(finalEURC);

      const combinedVal = finalUSDC + (finalEURC * 1.08);
      setBalance(combinedVal);

      setActivities(combinedActivities.reverse());
    } catch (err) {
      console.error('useTreasuryBalances: fetch failed', err);
      setError('Failed to fetch treasury balances');
    } finally {
      setLoading(false);
    }
  }, [treasuryAddress]);

  useEffect(() => {
    fetchBalances();

    // Auto-refresh every 60 seconds and only if visible
    const interval = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        fetchBalances();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  return {
    balance,
    usdcBalance,
    eurcBalance,
    activities,
    queuedWithdrawals,
    loading,
    isLoading: loading,
    error,
    refetch: fetchBalances,
  };
};
