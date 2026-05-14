"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  rabbyWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { arcTestnetChain } from "@/lib/chains/arc";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "a1b2c3d4e5f6789012345678abcdef01";

export const wagmiConfig = getDefaultConfig({
  appName: "SynArc",
  appDescription: "Private Governance Infrastructure for the Arc Ecosystem",
  appUrl: "https://synarc.io",
  projectId,
  wallets: [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet, rabbyWallet, coinbaseWallet],
    },
    {
      groupName: "More",
      wallets: [walletConnectWallet, injectedWallet],
    },
  ],
  chains: [arcTestnetChain],
  ssr: false,
});
