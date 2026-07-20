"use client";

import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Web3Provider = dynamic(
  () => import("@/providers/Web3Provider").then((m) => m.Web3Provider),
  { ssr: false }
);

export default function DashboardGroupLayer({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <ErrorBoundary sectionName="Dashboard Area">
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </ErrorBoundary>
    </Web3Provider>
  );
}
