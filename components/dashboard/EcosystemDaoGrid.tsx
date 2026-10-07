import Link from "next/link";
import { ArrowRight, Shield, Zap, Coins, Bot } from "lucide-react";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";

interface SurfaceItem {
  id: string;
  name: string;
  category: string;
  status: string;
  iconBg: string;
  iconColor: string;
  icon: React.ElementType;
  href: string;
}

const surfaces: SurfaceItem[] = [
  {
    id: "synarc-core",
    name: "SynDAO Core Treasury",
    category: "On-chain treasury",
    status: "0 proposals · 0 USDC",
    iconBg: "bg-gradient-to-br from-[#2F6FFF] to-[#4F8BFF]",
    iconColor: "text-white",
    icon: Shield,
    href: "/treasury",
  },
  {
    id: "escrow-valve",
    name: "Escrow Release Valve",
    category: "Agent cap 50 USDC",
    status: "Live contract · no payout yet",
    iconBg: "bg-[#05080F] border border-[#1B2536]",
    iconColor: "text-[#4F8BFF]",
    icon: Zap,
    href: "/treasury",
  },
  {
    id: "circle-cctp",
    name: "Circle CCTP Bridge",
    category: "Cross-chain USDC",
    status: "Product surface · not a funded treasury",
    iconBg: "bg-[#05080F] border border-[#1B2536]",
    iconColor: "text-[#4F8BFF]",
    icon: Coins,
    href: "/bridge",
  },
  {
    id: "treasury-agent",
    name: "Treasury Agent",
    category: "Release under cap",
    status: "Rules live · awaiting first release",
    iconBg: "bg-[#05080F] border border-[#1B2536]",
    iconColor: "text-[#4F8BFF]",
    icon: Bot,
    href: "/agent",
  },
];

export function EcosystemDaoGrid() {
  const { isArcMainnet } = useArcNetwork();

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-space text-[#F5F7FA]">
            Registered treasuries
          </h2>
          <p className="text-[11px] font-mono text-[#6B7385] mt-1">
            {isArcMainnet
              ? "Arc Mainnet governor has one treasury. Other cards are product surfaces, not funded DAOs."
              : "Arc Testnet. Balances below are not claimed production volume."}
          </p>
        </div>
        <Link
          href="/treasury"
          className="text-xs font-mono text-[#8A948E] hover:text-[#4F8BFF] transition-colors flex items-center gap-1 shrink-0"
        >
          Treasury <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {surfaces.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="group flex items-center gap-3.5 p-3.5 rounded-2xl border border-[#1B2536] bg-[#0B111C]/90 hover:border-[#2F6FFF]/40 hover:bg-[#0F1620] transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${item.iconBg}`}>
                <Icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold font-space text-[#F5F7FA] group-hover:text-[#4F8BFF] transition-colors truncate">
                  {item.name}
                </h4>
                <p className="text-[11px] font-mono text-[#8A948E] mt-0.5 truncate">
                  {item.category}
                </p>
                <p className="text-[11px] font-mono text-[#4F8BFF] mt-0.5 truncate">
                  {item.status}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
