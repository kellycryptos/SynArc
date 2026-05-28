import { useWallets } from "@privy-io/react-auth";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { useState, useCallback } from "react";
import { ensureArcNetwork } from "@/lib/arc/config";

export function useSwitchArcNetwork() {
  const { wallets } = useWallets();
  const { isUnsupported } = useArcNetwork();
  const { refetch: refetchBalance } = useUSDCBalance();
  const [isSwitching, setIsSwitching] = useState(false);

  const activeWallet = wallets && wallets.length > 0 ? wallets[0] : null;

  const switchToArc = useCallback(async () => {
    if (!activeWallet) {
      console.warn("No active wallet connection detected.");
      return;
    }

    setIsSwitching(true);
    try {
      const provider = await activeWallet.getEthereumProvider();
      await ensureArcNetwork(provider);

      // Automatically re-fetch USDC balance after a brief block verification delay
      setTimeout(() => {
        refetchBalance();
      }, 1000);
    } catch (err) {
      console.error("Error during chain switch operation:", err);
    } finally {
      setIsSwitching(false);
    }
  }, [activeWallet, refetchBalance]);

  return {
    switchToArc,
    isSwitching,
    shouldShowButton: isUnsupported,
  };
}
