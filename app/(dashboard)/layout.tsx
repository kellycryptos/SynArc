import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function DashboardGroupLayer({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
