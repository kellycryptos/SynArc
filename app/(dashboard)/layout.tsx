import { Web3Provider } from "@/providers/Web3Provider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function DashboardGroupLayer({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </Web3Provider>
  );
}
