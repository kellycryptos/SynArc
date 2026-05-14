"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { useTheme } from "next-themes";
import { wagmiConfig } from "@/lib/wagmi/config";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={resolvedTheme === "light" ? lightTheme({
            accentColor: "#3b82f6",
            accentColorForeground: "white",
            borderRadius: "medium",
            fontStack: "system",
            overlayBlur: "small",
          }) : darkTheme({
            accentColor: "#a855f7",
            accentColorForeground: "white",
            borderRadius: "medium",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
