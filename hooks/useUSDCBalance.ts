import { useEffect, useState, useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";
import { createPublicClient, http, parseAbi, formatUnits } from "viem";
import { arcTestnet, ARC_RPC_URL } from "@/lib/arc/config";

const USDC_CONTRACT_ADDRESS = "0x3600000000000000000000000000000000000000";

const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);

// Simple non-batched client — avoids JSON-RPC batch issues with public RPC
function getReadClient() {
  return createPublicClient({
    chain: arcTestnet,
    transport: http(ARC_RPC_URL, {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 15000,
    }),
  });
}

export function useUSDCBalance() {
  const { wallets, ready: walletsReady } = useWallets();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const activeWallet = wallets && wallets.length > 0 ? wallets[0] : null;

  const fetchBalance = useCallback(async () => {
    if (!activeWallet?.address) {
      setBalance(null);
      setIsError(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    try {
      const client = getReadClient();

      const [bal] = await Promise.all([
        client.readContract({
          address: USDC_CONTRACT_ADDRESS,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [activeWallet.address as `0x${string}`],
        }),
      ]);

      // Arc USDC always uses 6 decimals
      const formatted = formatUnits(bal, 6);
      setBalance(formatted);
      setIsError(false);
    } catch (error) {
      console.error("Error fetching USDC balance from Arc Testnet:", error);
      setIsError(true);
      // Don't wipe a previously loaded balance
    } finally {
      setIsLoading(false);
    }
  }, [activeWallet?.address]);

  useEffect(() => {
    if (walletsReady && activeWallet?.address) {
      fetchBalance();

      // Poll every 15 seconds to keep the balance fresh
      const interval = setInterval(fetchBalance, 15000);
      return () => clearInterval(interval);
    } else if (walletsReady && !activeWallet) {
      setBalance(null);
      setIsLoading(false);
      setIsError(false);
    }
  }, [activeWallet?.address, walletsReady, fetchBalance]);

  return {
    balance,
    isLoading: isLoading && balance === null,
    isFetching: isLoading,
    isError,
    refetch: fetchBalance,
  };
}
