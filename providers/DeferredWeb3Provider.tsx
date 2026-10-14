"use client";

import { ReactNode, createContext, useContext, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const Web3Provider = dynamic(
  () => import("./Web3Provider").then((m) => m.Web3Provider),
  { ssr: false }
);

interface DeferredWeb3ContextType {
  isMounted: boolean;
  mountWeb3: () => void;
  mountWeb3AndLogin: () => void;
}

export const DeferredWeb3Context = createContext<DeferredWeb3ContextType>({
  isMounted: false,
  mountWeb3: () => {},
  mountWeb3AndLogin: () => {},
});

export function useDeferredWeb3() {
  return useContext(DeferredWeb3Context);
}

export function DeferredWeb3Provider({
  children,
  initialHasSession,
}: {
  children: ReactNode;
  initialHasSession?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mountWeb3 = useCallback(() => {
    setMounted(true);
  }, []);

  const mountWeb3AndLogin = useCallback(() => {
    setMounted(true);
  }, []);

  return (
    <DeferredWeb3Context.Provider
      value={{
        isMounted: mounted,
        mountWeb3,
        mountWeb3AndLogin,
      }}
    >
      {mounted ? (
        <Web3Provider>{children}</Web3Provider>
      ) : (
        <>{children}</>
      )}
    </DeferredWeb3Context.Provider>
  );
}
