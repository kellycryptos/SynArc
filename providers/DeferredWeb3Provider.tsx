"use client";

import { ReactNode, createContext, useContext } from "react";
import { Web3Provider } from "./Web3Provider";

interface DeferredWeb3ContextType {
  isMounted: boolean;
  mountWeb3: () => void;
  mountWeb3AndLogin: () => void;
}

export const DeferredWeb3Context = createContext<DeferredWeb3ContextType>({
  isMounted: true,
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
  return (
    <DeferredWeb3Context.Provider
      value={{
        isMounted: true,
        mountWeb3: () => {},
        mountWeb3AndLogin: () => {},
      }}
    >
      <Web3Provider>{children}</Web3Provider>
    </DeferredWeb3Context.Provider>
  );
}
