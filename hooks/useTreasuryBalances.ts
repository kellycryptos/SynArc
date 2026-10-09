import { useEffect, useState, useCallback, useMemo } from 'react';
import { createPublicClient, http, fallback } from 'viem';
import { 
  ARC_CHAIN, 
  ARC_RPC_URLS, 
  ARC_MAINNET_RPC_URLS, 
  ARC_TESTNET_RPC_URLS, 
  getActiveNetwork, 
  CONTRACTS,
  arcTestnet,
  arcMainnet
} from '@/lib/arc-config';
import { useArcNetwork } from '@/hooks/auth/useArcNetwork';
import { getCachedPublicClient } from '@/lib/rpc/provider-cache';
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

// 6-field struct matches deployed testnet & mainnet treasury contracts
const TREASURY_ABI_6 = [
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
    name: 'usdcBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'eurcBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
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
          { name: 'deliverableURI', type: 'string' },
        ],
      },
    ],
  },
] as const;

// 7-field struct fallback
const TREASURY_ABI_7 = [
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
          { name: 'deliverableURI', type: 'string' },
        ],
      },
    ],
  },
] as const;

const USDC_DEFAULT_ADDRESS = '0x3600000000000000000000000000000000000000' as `0x${string}`;

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
  deliverableURI?: string;
}

interface CachedData {
  activities: TreasuryActivity[];
  usdcBalance?: number;
  eurcBalance?: number;
  combinedBalance?: number;
  queuedWithdrawals?: QueuedWithdrawal[];
  lastFetchedBlock: string;
}

const getCache = (treasuryAddress: string): CachedData => {
  if (typeof window === 'undefined') {
    return { activities: [], lastFetchedBlock: '0' };
  }
  try {
    const data = localStorage.getItem(`synarc_treasury_cache_${treasuryAddress.toLowerCase()}`);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && (Array.isArray(parsed.activities) || typeof parsed.usdcBalance === 'number')) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read treasury cache from localStorage', err);
  }
  return { activities: [], lastFetchedBlock: '0' };
};

const setCache = (treasuryAddress: string, data: CachedData) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`synarc_treasury_cache_${treasuryAddress.toLowerCase()}`, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to write treasury cache to localStorage', err);
  }
};

const mergeAndSortActivities = (
  simulated: TreasuryActivity[],
  fetched: TreasuryActivity[],
  cached: TreasuryActivity[]
): TreasuryActivity[] => {
  const map = new Map<string, TreasuryActivity>();
  
  cached.forEach(act => map.set(act.id, act));
  fetched.forEach(act => map.set(act.id, act));
  simulated.forEach(act => map.set(act.id, act));
  
  return Array.from(map.values())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

/**
 * Dispatch this event after a transaction modifies the treasury (e.g. deposit / withdrawal).
 * Active useTreasuryBalances instances will immediately refetch.
 */
export function invalidateTreasuryBalances() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('synarc_treasury_changed'));
  }
}

export const useTreasuryBalances = (customTreasuryAddress?: string) => {
  const { isArcTestnet, contracts, arcChain } = useArcNetwork();

  const treasuryAddress = (customTreasuryAddress ||
    contracts.treasury) as `0x${string}`;

  const rpcUrls = isArcTestnet ? ARC_TESTNET_RPC_URLS : ARC_MAINNET_RPC_URLS;
  const usdcAddress = (contracts.usdc || USDC_DEFAULT_ADDRESS) as `0x${string}`;
  const eurcAddress = (contracts.eurc || (isArcTestnet ? '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' : '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1')) as `0x${string}`;

  const [balance, setBalance] = useState(0); // Combined total in USD
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [eurcBalance, setEurcBalance] = useState(0);
  const [activities, setActivities] = useState<TreasuryActivity[]>([]);
  const [queuedWithdrawals, setQueuedWithdrawals] = useState<QueuedWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load balances and activities from cache immediately on mount/address change
  useEffect(() => {
    if (treasuryAddress) {
      const cached = getCache(treasuryAddress);
      if (cached.activities && cached.activities.length > 0) {
        setActivities(cached.activities);
      }
      if (cached.usdcBalance !== undefined && cached.eurcBalance !== undefined) {
        setUsdcBalance(cached.usdcBalance);
        setEurcBalance(cached.eurcBalance);
        setBalance(cached.combinedBalance ?? (cached.usdcBalance + cached.eurcBalance * 1.08));
        if (cached.queuedWithdrawals) {
          setQueuedWithdrawals(cached.queuedWithdrawals);
        }
        setLoading(false);
      }
    }
  }, [treasuryAddress]);

  const publicClient = useMemo(() => {
    return getCachedPublicClient(arcChain?.id);
  }, [arcChain?.id, isArcTestnet]);

  const fetchBalances = useCallback(async () => {
    if (!treasuryAddress) return;
    setError(null);

    // Only set full page loading if we don't have any balance data yet
    setLoading((prev) => (balance === 0 && usdcBalance === 0 ? true : prev));

    try {
      // Step 1: Rapid fetch of token balances and queued withdrawals (lightweight calls)
      const [usdcBalRes, eurcBalRes, rawQueuedRes] = await Promise.allSettled([
        publicClient.readContract({
          address: usdcAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [treasuryAddress],
        }),
        publicClient.readContract({
          address: eurcAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [treasuryAddress],
        }),
        publicClient.readContract({
          address: treasuryAddress,
          abi: TREASURY_ABI_6,
          functionName: 'getQueuedWithdrawals',
        }),
      ]);

      // Process USDC Balance with fallback to internal contract balance
      let usdcRaw = usdcBalRes.status === 'fulfilled' ? usdcBalRes.value : null;
      if (usdcRaw === null || usdcRaw === undefined) {
        try {
          usdcRaw = await publicClient.readContract({
            address: treasuryAddress,
            abi: TREASURY_ABI_6,
            functionName: 'usdcBalance',
          });
        } catch {
          usdcRaw = 0n;
        }
      }

      // Process EURC Balance with fallback to internal contract balance
      let eurcRaw = eurcBalRes.status === 'fulfilled' ? eurcBalRes.value : null;
      if (eurcRaw === null || eurcRaw === undefined) {
        try {
          eurcRaw = await publicClient.readContract({
            address: treasuryAddress,
            abi: TREASURY_ABI_6,
            functionName: 'eurcBalance',
          });
        } catch {
          eurcRaw = 0n;
        }
      }

      const usdcVal = Number(usdcRaw || 0n) / 1_000_000;
      const eurcVal = Number(eurcRaw || 0n) / 1_000_000;

      // Process Queued Withdrawals
      const rawQueued = rawQueuedRes.status === 'fulfilled' && Array.isArray(rawQueuedRes.value) ? rawQueuedRes.value : [];
      const formattedQueued: QueuedWithdrawal[] = rawQueued.map((q: any) => ({
        id: q.id?.toString() || '',
        recipient: q.recipient || '',
        amount: Number(q.amount || 0n) / 1_000_000,
        token: q.token || '',
        tokenSymbol: q.tokenSymbol || 'USDC',
        description: q.description || '',
        executionTime: Number(q.executionTime || 0n),
        executed: Boolean(q.executed),
        canceled: Boolean(q.canceled),
        deliverableURI: q.deliverableURI || '',
      }));
      setQueuedWithdrawals(formattedQueued);

      // Merge simulated activities from localStorage
      let simulatedActivities: TreasuryActivity[] = [];
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(`synarc_simulated_activities_${treasuryAddress.toLowerCase()}`);
          if (stored) {
            simulatedActivities = JSON.parse(stored);
          }
        } catch (err) {
          console.error('Failed to parse simulated activities from localStorage', err);
        }
      }

      let simulatedUSDC = 0;
      let simulatedEURC = 0;
      simulatedActivities.forEach((act) => {
        const val = act.amount;
        if (act.type === 'Inflow') {
          if (act.token === 'USDC') simulatedUSDC += val;
          else if (act.token === 'EURC') simulatedEURC += val;
        } else {
          if (act.token === 'USDC') simulatedUSDC -= val;
          else if (act.token === 'EURC') simulatedEURC -= val;
        }
      });

      const finalUSDC = usdcVal + simulatedUSDC;
      const finalEURC = eurcVal + simulatedEURC;
      const combinedVal = finalUSDC + (finalEURC * 1.08);

      setUsdcBalance(finalUSDC);
      setEurcBalance(finalEURC);
      setBalance(combinedVal);
      setLoading(false); // Balances are ready immediately without waiting for tx history!

      // Step 2: Fetch transaction history asynchronously in background (non-blocking)
      setHistoryLoading(true);
      (async () => {
        try {
          const rawTxs = await publicClient.readContract({
            address: treasuryAddress,
            abi: TREASURY_ABI_6,
            functionName: 'getTransactions',
          }).catch(() =>
            publicClient.readContract({
              address: treasuryAddress,
              abi: TREASURY_ABI_7,
              functionName: 'getTransactions',
            })
          ).catch(() => []);

          const formattedTxs: TreasuryActivity[] = (Array.isArray(rawTxs) ? rawTxs : []).map((tx: any, idx: number) => {
            const isOutflow = tx.txType === 'Outflow';
            const timestampSec = Number(tx.timestamp || 0n);
            const isoDate = timestampSec > 0 ? new Date(timestampSec * 1000).toISOString() : new Date().toISOString();
            return {
              id: `tx-${treasuryAddress.toLowerCase()}-${idx}-${timestampSec}`,
              type: (isOutflow ? 'Outflow' : 'Inflow') as 'Inflow' | 'Outflow',
              amount: Number(tx.amount || 0n) / 1_000_000,
              token: tx.tokenSymbol || 'USDC',
              timestamp: isoDate,
              description: tx.description || (isOutflow ? 'Treasury Outflow' : 'Treasury Inflow'),
              party: tx.party || '',
              deliverableURI: (tx as any).deliverableURI || '',
              txHash: '',
            };
          });

          const cached = getCache(treasuryAddress);
          const allActivities = mergeAndSortActivities(simulatedActivities, formattedTxs, cached.activities);
          setActivities(allActivities);

          // Save merged activities & balances to localStorage
          setCache(treasuryAddress, {
            activities: allActivities,
            usdcBalance: finalUSDC,
            eurcBalance: finalEURC,
            combinedBalance: combinedVal,
            queuedWithdrawals: formattedQueued,
            lastFetchedBlock: '0',
          });
        } catch (txErr) {
          console.warn('useTreasuryBalances: background tx fetch failed', txErr);
        } finally {
          setHistoryLoading(false);
        }
      })();
    } catch (err) {
      console.error('useTreasuryBalances: fetch failed', err);
      setError('Failed to fetch treasury balances');
    } finally {
      setLoading(false);
    }
  }, [publicClient, treasuryAddress, usdcAddress, eurcAddress, balance, usdcBalance]);

  useEffect(() => {
    fetchBalances();

    const handleNetworkChange = () => {
      fetchBalances();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('synarc_network_changed', handleNetworkChange);
      window.addEventListener('synarc_treasury_changed', handleNetworkChange);
    }

    // Auto-refresh every 30 seconds if page is visible
    const interval = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        fetchBalances();
      }
    }, 30_000);

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('synarc_network_changed', handleNetworkChange);
        window.removeEventListener('synarc_treasury_changed', handleNetworkChange);
      }
    };
  }, [fetchBalances]);

  return {
    balance,
    usdcBalance,
    eurcBalance,
    activities,
    queuedWithdrawals,
    loading,
    isLoading: loading,
    isHistoryLoading: historyLoading,
    error,
    refetch: fetchBalances,
  };
};
