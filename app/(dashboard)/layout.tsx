import { cookies } from "next/headers";
import { DeferredWeb3Provider } from "@/providers/DeferredWeb3Provider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

/**
 * Server Component layout wrapper for the Dashboard route group.
 *
 * Reads the HttpOnly `synarc_has_session` cookie on incoming HTTP requests.
 * Passes initialHasSession to DeferredWeb3Provider so returning users hydrate with
 * Web3Provider mounted immediately (zero flash, zero SSR mismatch), while guests
 * render the lightweight dashboard shell with 0ms Web3 SDK execution penalty.
 */
export default async function DashboardGroupLayer({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const hasSession = cookieStore.get("synarc_has_session")?.value === "true";

  return (
    <DeferredWeb3Provider initialHasSession={hasSession}>
      <ErrorBoundary sectionName="Dashboard Area">
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </ErrorBoundary>
    </DeferredWeb3Provider>
  );
}
