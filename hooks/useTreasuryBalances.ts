import { useEffect, useState, useCallback } from 'react';
import { createPublicClient, http, fallback, parseAbi } from 'viem';
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

const TREASURY_EVENTS_ABI = parseAbi([
  'event Inflow(address indexed sender, uint256 amount, string tokenSymbol, string description, uint256 timestamp)',
  'event Outflow(address indexed recipient, uint256 amount, string tokenSymbol, string description, uint256 timestamp)'
]);

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

const DEPLOYMENT_BLOCK = 45973599n;

interface CachedData {
  activities: TreasuryActivity[];
  lastFetchedBlock: string;
}

const getCache = (treasuryAddress: string): CachedData => {
  if (typeof window === 'undefined') {
    return { activities: [], lastFetchedBlock: (DEPLOYMENT_BLOCK - 1n).toString() };
  }
  try {
    const data = localStorage.getItem(`synarc_treasury_cache_${treasuryAddress}`);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.activities) && typeof parsed.lastFetchedBlock === 'string') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read treasury cache from localStorage', err);
  }
  return { activities: [], lastFetchedBlock: (DEPLOYMENT_BLOCK - 1n).toString() };
};

const setCache = (treasuryAddress: string, data: CachedData) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`synarc_treasury_cache_${treasuryAddress}`, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to write treasury cache to localStorage', err);
  }
};

const fetchLogsInChunkWithRetry = async (
  publicClient: any,
  queryOptions: {
    address: `0x${string}`;
    events: any;
    fromBlock: bigint;
    toBlock: bigint;
  },
  retries = 3,
  delayMs = 1000
): Promise<any[]> => {
  try {
    return await publicClient.getLogs(queryOptions);
  } catch (err) {
    if (retries > 0) {
      console.warn(`getLogs failed for range ${queryOptions.fromBlock}-${queryOptions.toBlock}, retrying in ${delayMs}ms...`, err);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return fetchLogsInChunkWithRetry(publicClient, queryOptions, retries - 1, delayMs * 2);
    }
    throw err;
  }
};

const formatLogsToActivities = (logs: any[]): TreasuryActivity[] => {
  return logs.map((log: any, idx: number) => {
    const args = log.args || {};
    const isOutflow = log.eventName === 'Outflow';
    const party = isOutflow ? args.recipient : args.sender;
    return {
      id: `${log.transactionHash || idx}-${log.logIndex ?? idx}`,
      type: (isOutflow ? "Outflow" : "Inflow") as "Inflow" | "Outflow",
      amount: Number(args.amount || 0n) / 1_000_000,
      token: args.tokenSymbol || "USDC",
      timestamp: new Date(Number(args.timestamp || 0n) * 1000).toISOString(),
      description: args.description || "",
      party: party || "",
      txHash: log.transactionHash
    };
  });
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
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load activities from cache on mount/address change
  useEffect(() => {
    const cached = getCache(treasuryAddress);
    setActivities(cached.activities);
  }, [treasuryAddress]);

  const fetchBalances = useCallback(async () => {
    setLoading(true);
    setError(null);

    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: fallback(ARC_RPC_URLS.map((url) => http(url, { timeout: 5000 }))),
    });

    try {
      // Fetch USDC, EURC, current block, and queued withdrawals in parallel
      const [usdcBal, eurcBal, currentBlock, rawQueued] = await Promise.all([
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
        publicClient.getBlockNumber().catch(() => 0n),
        publicClient.readContract({
          address: treasuryAddress,
          abi: TREASURY_ABI,
          functionName: 'getQueuedWithdrawals',
        }).catch(() => [] as any),
      ]);

      const usdcVal = Number(usdcBal) / 1_000_000;
      const eurcVal = Number(eurcBal) / 1_000_000;

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

      // Initial merge of cached and simulated activities
      const cached = getCache(treasuryAddress);
      const initialActivities = mergeAndSortActivities(simulatedActivities, [], cached.activities);

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
      setActivities(initialActivities);

      // We set loading to false here so the balances and cached activities display immediately
      setLoading(false);

      // Query logs in the background if there are new blocks
      let cachedLastBlock = BigInt(cached.lastFetchedBlock);
      if (cachedLastBlock < DEPLOYMENT_BLOCK - 1n) {
        cachedLastBlock = DEPLOYMENT_BLOCK - 1n;
      }

      const startBlock = cachedLastBlock + 1n;
      const endBlock = currentBlock;

      if (endBlock > 0n && startBlock <= endBlock) {
        // Kick off non-blocking async log fetching
        (async () => {
          setHistoryLoading(true);
          const fetchedLogs: any[] = [];
          
          try {
            const chunkSize = 5000n;
            const batchCount = 10;
            let currentEnd = endBlock;
            
            while (currentEnd >= startBlock) {
              const chunkRanges: { from: bigint; to: bigint }[] = [];
              for (let i = 0; i < batchCount; i++) {
                const to = currentEnd;
                if (to < startBlock) break;
                const from = to - chunkSize + 1n > startBlock ? to - chunkSize + 1n : startBlock;
                chunkRanges.push({ from, to });
                currentEnd = from - 1n;
              }
              
              if (chunkRanges.length === 0) break;
              
              // Query this batch of chunks in parallel
              const batchLogs = await Promise.all(
                chunkRanges.map((range) =>
                  fetchLogsInChunkWithRetry(publicClient, {
                    address: treasuryAddress,
                    events: TREASURY_EVENTS_ABI,
                    fromBlock: range.from,
                    toBlock: range.to,
                  })
                )
              );
              
              const flatLogs = batchLogs.flat();
              fetchedLogs.push(...flatLogs);
              
              if (flatLogs.length > 0) {
                const newActivities = formatLogsToActivities(flatLogs);
                setActivities((prevActivities) => {
                  // Re-fetch simulated activities in case they changed
                  let freshSimulated: TreasuryActivity[] = [];
                  if (typeof window !== "undefined") {
                    try {
                      const stored = localStorage.getItem(`synarc_simulated_activities_${treasuryAddress}`);
                      if (stored) freshSimulated = JSON.parse(stored);
                    } catch (e) {}
                  }
                  return mergeAndSortActivities(freshSimulated, newActivities, prevActivities);
                });
              }
            }
            
            // Once all chunks are successfully loaded, write to localStorage cache
            const formattedFetched = formatLogsToActivities(fetchedLogs);
            
            // Read fresh cache from localStorage to merge
            const freshCached = getCache(treasuryAddress);
            const finalMerged = mergeAndSortActivities([], formattedFetched, freshCached.activities);
            
            setCache(treasuryAddress, {
              activities: finalMerged,
              lastFetchedBlock: endBlock.toString(),
            });
            
          } catch (err) {
            console.error("useTreasuryBalances: Background fetch failed", err);
          } finally {
            setHistoryLoading(false);
          }
        })();
      }

    } catch (err) {
      console.error('useTreasuryBalances: fetch failed', err);
      setError('Failed to fetch treasury balances');
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
    isHistoryLoading: historyLoading,
    error,
    refetch: fetchBalances,
  };
};
