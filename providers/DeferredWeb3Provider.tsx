"use client";

import { ReactNode, useState, useEffect, createContext, useContext, useCallback } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

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

const PROTECTED_ROUTES = ["/settings"];

export function DeferredWeb3Provider({
  children,
  initialHasSession,
}: {
  children: ReactNode;
  initialHasSession: boolean;
}) {
  const pathname = usePathname();
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  // Mount immediately if:
  // 1. Server cookie indicated an active session (initialHasSession = true)
  // 2. Current route is protected (/settings)
  const [shouldMount, setShouldMount] = useState<boolean>(() => initialHasSession || isProtected);
  const [pendingLogin, setPendingLogin] = useState<boolean>(false);

  // Force mount if user navigates to a protected route client-side
  useEffect(() => {
    if (isProtected && !shouldMount) {
      setShouldMount(true);
    }
  }, [isProtected, shouldMount]);

  // Pre-warm Web3Provider after main thread becomes idle (4-second delay for unauthenticated guests)
  useEffect(() => {
    if (shouldMount) return;

    let timer: ReturnType<typeof setTimeout>;

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const handle = (window as any).requestIdleCallback(
        () => setShouldMount(true),
        { timeout: 4000 }
      );
      return () => (window as any).cancelIdleCallback(handle);
    } else {
      timer = setTimeout(() => setShouldMount(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [shouldMount]);

  const mountWeb3 = useCallback(() => {
    setShouldMount(true);
  }, []);

  const mountWeb3AndLogin = useCallback(() => {
    setPendingLogin(true);
    setShouldMount(true);
  }, []);

  return (
    <DeferredWeb3Context.Provider
      value={{
        isMounted: shouldMount,
        mountWeb3,
        mountWeb3AndLogin,
      }}
    >
      {shouldMount ? (
        <Web3Provider>{children}</Web3Provider>
      ) : (
        <>{children}</>
      )}
    </DeferredWeb3Context.Provider>
  );
}
