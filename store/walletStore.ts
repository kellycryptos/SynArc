import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ARC_TESTNET_CHAIN_ID } from "@/lib/chains/arc";

interface WalletState {
  /** Connected wallet address (lowercase) */
  address: string | null;
  /** Shortened display address e.g. 0x7a9F...a3B2 */
  shortAddress: string | null;
  /** Current chain ID */
  chainId: number | null;
  /** Whether the wallet is connected */
  isConnected: boolean;
  /** Whether the user is on Arc Testnet */
  isCorrectNetwork: boolean;
  /** Whether the network-switch modal is open */
  networkModalOpen: boolean;
  /** Whether the user dismissed the wrong network warning */
  networkWarningDismissed: boolean;
  /** Actions */
  setConnected: (address: string, chainId: number) => void;
  setDisconnected: () => void;
  setChainId: (chainId: number) => void;
  openNetworkModal: () => void;
  closeNetworkModal: () => void;
  dismissNetworkWarning: () => void;
}

function formatShortAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      shortAddress: null,
      chainId: null,
      isConnected: false,
      isCorrectNetwork: false,
      networkModalOpen: false,
      networkWarningDismissed: false,

      setConnected: (address, chainId) =>
        set({
          address: address.toLowerCase(),
          shortAddress: formatShortAddress(address),
          chainId,
          isConnected: true,
          isCorrectNetwork: chainId === ARC_TESTNET_CHAIN_ID,
          networkWarningDismissed: false,
        }),

      setDisconnected: () =>
        set({
          address: null,
          shortAddress: null,
          chainId: null,
          isConnected: false,
          isCorrectNetwork: false,
          networkModalOpen: false,
          networkWarningDismissed: false,
        }),

      setChainId: (chainId) =>
        set((state) => ({
          chainId,
          isCorrectNetwork: chainId === ARC_TESTNET_CHAIN_ID,
          networkWarningDismissed: state.networkWarningDismissed,
        })),

      openNetworkModal: () => set({ networkModalOpen: true }),
      closeNetworkModal: () => set({ networkModalOpen: false }),
      dismissNetworkWarning: () => set({ networkWarningDismissed: true }),
    }),
    {
      name: "synarc-wallet",
      partialize: (s) => ({
        // Only persist the warning dismissal preference
        networkWarningDismissed: s.networkWarningDismissed,
      }),
    }
  )
);
