import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function DashboardGroupLayer({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary sectionName="Dashboard Area">
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ErrorBoundary>
  );
}
