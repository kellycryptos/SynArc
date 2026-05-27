import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { WalletFaucetCard } from "@/components/dashboard/WalletFaucetCard";
import { GovernanceAnalytics } from "@/components/analytics/GovernanceAnalytics";
import { ProposalFeed } from "@/components/proposals/ProposalFeed";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardOverview() {
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Auth-aware header: banner + Create Proposal button */}
      <DashboardHeader />

      {/* Metrics */}
      <OverviewCards />

      {/* Wallet Balance & Arc Testnet Faucet */}
      <WalletFaucetCard />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold font-heading">Recent Proposals</h2>
            <Link href="/proposals" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <ProposalFeed />
        </div>
        <div className="space-y-4">
          <div className="mb-2">
            <h2 className="text-xl font-bold font-heading">Analytics</h2>
          </div>
          <GovernanceAnalytics />
        </div>
      </div>
    </div>
  );
}
