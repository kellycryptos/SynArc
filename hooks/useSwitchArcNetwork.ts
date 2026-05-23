import { useWallets } from "@privy-io/react-auth";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { useState, useCallback } from "react";

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
      const chainIdHex = "0x4ce9fa"; // 5042002 in hex

      try {
        // Attempt switching to Chain ID 5042002
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainIdHex }],
        });
      } catch (switchError: any) {
        // Error code 4902 indicates that the chain has not been added to the wallet
        const errorMsg = switchError.message || "";
        const isChainMissing = 
          switchError.code === 4902 || 
          switchError.data?.originalError?.code === 4902 ||
          errorMsg.toLowerCase().includes("unrecognized chain") ||
          errorMsg.toLowerCase().includes("4902");

        if (isChainMissing) {
          try {
            await provider.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: chainIdHex,
                  chainName: "Arc Testnet",
                  rpcUrls: [
                    "https://rpc.testnet.arc.network",
                    "https://arc-testnet.drpc.org",
                    "https://5042002.rpc.thirdweb.com",
                  ],
                  nativeCurrency: {
                    name: "USDC",
                    symbol: "USDC",
                    decimals: 18, // Native currency decimals on Arc
                  },
                  blockExplorerUrls: ["https://testnet.arcscan.app"],
                },
              ],
            });
          } catch (addError) {
            console.error("Failed to add Arc Testnet chain:", addError);
          }
        } else {
          console.error("Failed to switch to Arc Testnet chain:", switchError);
        }
      }

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
