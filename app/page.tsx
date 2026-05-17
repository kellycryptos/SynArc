import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { GovernanceAnalytics } from "@/components/analytics/GovernanceAnalytics";
import { ProposalFeed } from "@/components/proposals/ProposalFeed";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardOverview() {
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-heading tracking-tight">Overview</h1>
          <p className="text-muted">Monitor governance activity and treasury health across the SynArc ecosystem.</p>
        </div>
        <Link 
          href="/proposals/create" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(124,58,237,0.2)]"
        >
          Create Proposal
        </Link>
      </div>

      {/* Metrics */}
      <OverviewCards />

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
