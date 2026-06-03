import { useEffect, useState, useCallback } from 'react';
import { createPublicClient, http, fallback } from 'viem';
import { arcTestnet, ARC_RPC_URLS } from '@/lib/arc-config';
import { useAuth } from '@/hooks/auth/useAuth';

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// USDC and EURC contract addresses on Arc Testnet
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as `0x${string}`;
const EURC_ADDRESS = (process.env.NEXT_PUBLIC_EURC_CONTRACT_ADDRESS ||
  '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a') as `0x${string}`;

export const useTreasuryBalances = () => {
  // Use unified auth hook so Circle wallet users are also supported
  const { walletAddress } = useAuth();
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [eurcBalance, setEurcBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    const address = walletAddress;
    if (!address) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: fallback(ARC_RPC_URLS.map((url) => http(url))),
    });

    try {
      const [usdc, eurc] = await Promise.all([
        publicClient.readContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        }),
        publicClient.readContract({
          address: EURC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        }),
      ]);

      // Both USDC and EURC have 6 decimals
      setUsdcBalance(Number(usdc) / 1_000_000);
      setEurcBalance(Number(eurc) / 1_000_000);
    } catch (err) {
      console.error('useTreasuryBalances: Balance fetch failed', err);
      setError('Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchBalances();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchBalances, 30_000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  return {
    usdcBalance,
    eurcBalance,
    loading,
    error,
    refetch: fetchBalances,
  };
};
