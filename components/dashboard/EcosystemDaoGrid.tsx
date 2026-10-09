import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Shield, Zap, Sparkles, Building2, Coins, Bot, Rocket } from "lucide-react";
import { useCampaignStore } from "@/hooks/useCampaignStore";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";

import { useTreasuryBalances } from "@/hooks/useTreasuryBalances";
import { useGovernanceStore } from "@/hooks/useGovernanceStore";

interface DaoItem {
  id: string;
  name: string;
  category: string;
  proposalsCount: number;
  treasuryUSDC: string;
  iconBg: string;
  iconColor: string;
  icon: any;
  href: string;
}

function formatUsdcAmount(amount: number): string {
  if (!amount || amount <= 0) return "0.00";
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2).replace(/\.00$/, "")}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const defaultDaos: DaoItem[] = [
  {
    id: "synarc-core",
    name: "SynDAO Core Treasury",
    category: "System Governance",
    proposalsCount: 0,
    treasuryUSDC: "0.00",
    iconBg: "bg-gradient-to-br from-[#2F6FFF] to-[#4F8BFF]",
    iconColor: "text-white",
    icon: Shield,
    href: "/treasury",
  },
  {
    id: "circle-cctp",
    name: "Circle CCTP Liquidity Vault",
    category: "Cross-Chain Treasury",
    proposalsCount: 0,
    treasuryUSDC: "0.00",
    iconBg: "bg-[#05080F] border border-[#1B2536]",
    iconColor: "text-[#4F8BFF]",
    icon: Coins,
    href: "/bridge",
  },
  {
    id: "alpha-agent",
    name: "Autonomous Alpha Agent",
    category: "AI Execution",
    proposalsCount: 0,
    treasuryUSDC: "0.00",
    iconBg: "bg-[#05080F] border border-[#1B2536]",
    iconColor: "text-[#4F8BFF]",
    icon: Bot,
    href: "/agent",
  },
  {
    id: "creator-guild",
    name: "Creator Guild Arc",
    category: "Community Labs",
    proposalsCount: 0,
    treasuryUSDC: "0.00",
    iconBg: "bg-[#05080F] border border-[#1B2536]",
    iconColor: "text-[#4F8BFF]",
    icon: Rocket,
    href: "/creator-daos",
  },
  {
    id: "developer-grants",
    name: "Developer Grants Program",
    category: "Ecosystem Growth",
    proposalsCount: 0,
    treasuryUSDC: "0.00",
    iconBg: "bg-[#05080F] border border-[#1B2536]",
    iconColor: "text-[#4F8BFF]",
    icon: Sparkles,
    href: "/daos",
  },
  {
    id: "escrow-valve",
    name: "Escrow Release Valve",
    category: "Attestation & Security",
    proposalsCount: 0,
    treasuryUSDC: "0.00",
    iconBg: "bg-[#05080F] border border-[#1B2536]",
    iconColor: "text-[#4F8BFF]",
    icon: Zap,
    href: "/treasury",
  },
  {
    id: "arc-attestation",
    name: "Arc Attestation Collective",
    category: "Protocol Verification",
    proposalsCount: 0,
    treasuryUSDC: "0.00",
    iconBg: "bg-[#05080F] border border-[#1B2536]",
    iconColor: "text-[#4F8BFF]",
    icon: Building2,
    href: "/daos",
  },
  {
    id: "defi-syndicate",
    name: "DeFi Yield Syndicate",
    category: "Automated Strategy",
    proposalsCount: 0,
    treasuryUSDC: "0.00",
    iconBg: "bg-[#05080F] border border-[#1B2536]",
    iconColor: "text-[#4F8BFF]",
    icon: Coins,
    href: "/daos",
  },
];

export function EcosystemDaoGrid() {
  const { campaigns } = useCampaignStore();
  const { proposals, metrics } = useGovernanceStore();
  const { isArcMainnet } = useArcNetwork();
  const { usdcBalance: coreUsdc, queuedWithdrawals } = useTreasuryBalances();

  const agentUsdc = isArcMainnet ? 0 : 25;
  const creatorRaised = campaigns.reduce((acc, curr) => acc + (curr.raised || 0), 0);
  const escrowQueuedUsdc = (queuedWithdrawals || []).reduce((acc, q) => acc + (q.amount || 0), 0);

  const daos = useMemo(() => {
    return defaultDaos.map((dao) => {
      if (dao.id === "synarc-core") {
        return {
          ...dao,
          proposalsCount: isArcMainnet ? (proposals.length || 0) : (metrics.totalProposals || proposals.length || 0),
          treasuryUSDC: formatUsdcAmount(coreUsdc),
        };
      }
      if (dao.id === "alpha-agent") {
        return {
          ...dao,
          proposalsCount: 0,
          treasuryUSDC: formatUsdcAmount(agentUsdc),
        };
      }
      if (dao.id === "creator-guild") {
        return {
          ...dao,
          proposalsCount: campaigns.length,
          treasuryUSDC: formatUsdcAmount(creatorRaised),
        };
      }
      if (dao.id === "escrow-valve") {
        return {
          ...dao,
          proposalsCount: queuedWithdrawals?.length || 0,
          treasuryUSDC: formatUsdcAmount(escrowQueuedUsdc),
        };
      }
      return dao;
    });
  }, [isArcMainnet, proposals.length, metrics.totalProposals, coreUsdc, agentUsdc, campaigns.length, creatorRaised, queuedWithdrawals, escrowQueuedUsdc]);

  return (
    <div className="space-y-3.5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold font-space text-[#F5F7FA]">
          Ecosystem DAOs & Treasuries
        </h2>
        <Link
          href="/daos"
          className="text-xs font-mono text-[#8A948E] hover:text-[#4F8BFF] transition-colors flex items-center gap-1"
        >
          All DAOs <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Grid of horizontal DAO cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {daos.map((dao) => {
          const Icon = dao.icon;
          return (
            <Link
              key={dao.id}
              href={dao.href}
              className="group flex items-center gap-3.5 p-3.5 rounded-2xl border border-[#1B2536] bg-[#0B111C]/90 hover:border-[#2F6FFF]/40 hover:bg-[#0F1620] transition-all duration-200"
            >
              {/* Logo Emblem */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${dao.iconBg}`}>
                <Icon className={`w-5 h-5 ${dao.iconColor}`} />
              </div>

              {/* Text metadata */}
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold font-space text-[#F5F7FA] group-hover:text-[#4F8BFF] transition-colors truncate">
                  {dao.name}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8A948E] mt-0.5 truncate">
                  <span>{dao.proposalsCount} proposals</span>
                  <span>·</span>
                  <span className="text-[#4F8BFF]">{dao.treasuryUSDC} USDC</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
