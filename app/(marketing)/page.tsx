import Link from "next/link";
import { ArrowRight, Shield, Lock, Globe, Grid, Award, CheckCircle2, Bot } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FloatingAIChat } from "@/components/marketing/FloatingAIChat";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="h-full rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-200">
      <GlassCard className="p-6 md:p-8 flex flex-col gap-4 h-full">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 text-2xl select-none">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-text-primary">{title}</h3>
        <p className="text-text-secondary leading-relaxed">{description}</p>
      </GlassCard>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-36 md:pb-24 overflow-hidden px-4 bg-[#05080F] hero-dark">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-20 bg-gradient-to-r from-[#2F6FFF] to-[#22D3EE] blur-[120px] rounded-full" />
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl sm:text-6xl md:text-[58px] font-bold font-space tracking-tight mb-6 leading-[1.12] text-[#F5F7FA] max-w-4xl mx-auto">
            Coordinate and protect{" "}
            <span className="bg-gradient-to-r from-[#2F6FFF] to-[#22D3EE] bg-clip-text text-transparent">
              your community's funds
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-[17px] text-[#9CA6B8] max-w-2xl mx-auto mb-10 leading-relaxed font-space">
            Keep project funds secure in milestone-based escrows, vote transparently on releases, and automatically prevent funds from sitting idle.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Primary CTA — Agent */}
            <div className="w-full sm:w-auto">
              <Link 
                href="/agent"
                className="w-full sm:w-auto px-6 py-3.5 sm:px-7 sm:py-3.5 rounded-lg bg-gradient-to-r from-[#2F6FFF] to-[#22D3EE] text-[#04101C] font-bold hover:opacity-95 transition-all shadow-[0_0_30px_rgba(34,211,238,0.2)] flex items-center justify-center gap-2 text-base font-space"
              >
                <span>View automated treasury &rarr;</span>
              </Link>
            </div>
            {/* Secondary CTA — Dashboard */}
            <div className="w-full sm:w-auto">
              <Link 
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3.5 sm:px-7 sm:py-3.5 rounded-lg bg-[#0B111C] border border-[#232E42] hover:border-[#22D3EE]/40 text-[#F5F7FA] font-medium transition-all flex items-center justify-center gap-2 text-base font-space"
              >
                Launch dashboard
              </Link>
            </div>
            {/* Docs CTA */}
            <div className="w-full sm:w-auto">
              <Link 
                href="/docs"
                className="w-full sm:w-auto px-6 py-3.5 sm:px-7 sm:py-3.5 rounded-lg bg-[#0B111C] border border-[#232E42] hover:border-[#22D3EE]/40 text-[#F5F7FA] font-medium transition-all flex items-center justify-center gap-2 text-base font-space"
              >
                View docs &rarr;
              </Link>
            </div>
          </div>
          
          {/* Bordered 4-Stat Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 max-w-5xl mx-auto mt-16 pt-8 border-t border-[#151C29] gap-y-6">
            <div className="stat px-4 text-center md:border-r border-[#151C29]">
              <div className="font-mono text-2xl sm:text-[27px] font-medium bg-gradient-to-r from-[#2F6FFF] to-[#22D3EE] bg-clip-text text-transparent">
                $2.4M
              </div>
              <div className="text-xs sm:text-[13px] text-[#6B7385] mt-2 font-space">Under escrow</div>
            </div>
            <div className="stat px-4 text-center md:border-r border-[#151C29]">
              <div className="font-mono text-2xl sm:text-[27px] font-medium bg-gradient-to-r from-[#2F6FFF] to-[#22D3EE] bg-clip-text text-transparent">
                900+
              </div>
              <div className="text-xs sm:text-[13px] text-[#6B7385] mt-2 font-space">Proposals recorded</div>
            </div>
            <div className="stat px-4 text-center md:border-r border-[#151C29]">
              <div className="font-mono text-2xl sm:text-[27px] font-medium bg-gradient-to-r from-[#2F6FFF] to-[#22D3EE] bg-clip-text text-transparent">
                100%
              </div>
              <div className="text-xs sm:text-[13px] text-[#6B7385] mt-2 font-space">Vote transparency</div>
            </div>
            <div className="stat px-4 text-center">
              <div className="font-mono text-2xl sm:text-[27px] font-medium bg-gradient-to-r from-[#2F6FFF] to-[#22D3EE] bg-clip-text text-transparent">
                0
              </div>
              <div className="text-xs sm:text-[13px] text-[#6B7385] mt-2 font-space">Idle fund incidents</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative z-10 bg-surface/50 border-y border-border-thin">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4 text-text-primary">Complete Coordination Framework</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">Built to support the scale, transparency, and security requirements of modern digital organizations.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassCard className="p-8 h-full">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6 border border-primary/30">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-text-primary">Frictionless Audits</h3>
              <p className="text-text-secondary leading-relaxed">
                Analyze participation and workspace health metrics transparently without violating individual contributor privacy.
              </p>
            </GlassCard>
            
            <GlassCard className="p-8 h-full">
              <div className="w-12 h-12 rounded-xl bg-arc-blue/20 flex items-center justify-center mb-6 border border-arc-blue/30">
                <Globe className="w-6 h-6 text-arc-blue" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-text-primary">Transparent Treasury</h3>
              <p className="text-text-secondary leading-relaxed">
                Manage your organization's wealth with simple, stable digital assets and transparent ledger logs.
              </p>
            </GlassCard>
            
            <GlassCard className="p-8 h-full">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6 border border-accent/30">
                <Lock className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-text-primary">Secure Coordination</h3>
              <p className="text-text-secondary leading-relaxed">
                Delegate voting weight seamlessly using identity confirmations that protect participant voice.
              </p>
            </GlassCard>
 
            <GlassCard className="p-8 h-full">
              <div className="w-12 h-12 rounded-xl bg-purple-glow/20 flex items-center justify-center mb-6 border border-purple-glow/30">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-text-primary">Treasury Agent Guards</h3>
              <p className="text-text-secondary leading-relaxed">
                Protect and optimize reserves automatically. Enable autonomous CCTP rebalancing, scheduled payouts, yield farming, risk monitoring, and multi-chain sweeps.
              </p>
            </GlassCard>
          </div>
 
          {/* Creator Economy Highlights Row */}
          <div className="mt-16 pt-10 border-t border-border-thin flex flex-wrap justify-center items-center gap-4 md:gap-8 text-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-elevated/40 border border-border-thin hover:border-primary/25 transition-all duration-300">
              <span className="text-base select-none">⚡</span>
              <span className="text-xs md:text-sm font-semibold text-text-primary">Workspace Funding</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-elevated/40 border border-border-thin hover:border-primary/25 transition-all duration-300">
              <span className="text-base select-none">🏛</span>
              <span className="text-xs md:text-sm font-semibold text-text-primary">One-Click Setup</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-elevated/40 border border-border-thin hover:border-primary/25 transition-all duration-300">
              <span className="text-base select-none">💸</span>
              <span className="text-xs md:text-sm font-semibold text-text-primary">Micro-Funding Support</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-elevated/40 border border-border-thin hover:border-primary/25 transition-all duration-300">
              <span className="text-base select-none">🤖</span>
              <span className="text-xs md:text-sm font-semibold text-text-primary">Automated Treasury Rules</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-elevated/40 border border-border-thin hover:border-primary/25 transition-all duration-300">
              <span className="text-base select-none">🏆</span>
              <span className="text-xs md:text-sm font-semibold text-text-primary">Leaderboard Recognition</span>
            </div>
          </div>
        </div>
      </section>
 
      {/* Roadmap Section */}
      <section id="roadmap" className="py-24 relative overflow-hidden px-4">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-elevated border border-border-thin text-xs font-semibold uppercase tracking-wider text-primary mb-4">
              Protocol Path
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-heading mb-4">Ecosystem Roadmap</h2>
            <p className="text-muted max-w-2xl mx-auto text-lg">
              Our roadmap towards establishing secure, user-friendly funding escrows and automated treasury tools for creators and teams.
            </p>
          </div>
 
          {/* Timeline Wrapper */}
          <div className="relative border-l-2 border-dashed border-white/[0.08] ml-4 md:ml-32 md:pl-16 space-y-12">
            
            {/* Phase 1 */}
            <div className="relative pl-8 group">
              <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-emerald-500 border-4 border-background shadow-[0_0_12px_rgba(16,185,129,0.5)] flex items-center justify-center z-20" />
              
              <div className="absolute -left-[144px] top-1.5 hidden md:block text-right w-24">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Phase 1</span>
                <p className="text-[10px] text-muted uppercase">Q1 2026</p>
              </div>
 
              <GlassCard className="p-8 transition-all duration-300">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    Governance Frontend
                  </h3>
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    Live
                  </span>
                </div>
                <p className="text-muted leading-relaxed mb-4 text-[15px]">
                  Establish responsive, intuitive interface views encompassing dashboard statistics, proposal feeds, dynamic treasury logs, and customizable visual models.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Next.js 16</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Tailwind CSS</span>
                </div>
              </GlassCard>
            </div>
 
            {/* Phase 2 */}
            <div className="relative pl-8 group">
              <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-emerald-500 border-4 border-background shadow-[0_0_12px_rgba(16,185,129,0.5)] flex items-center justify-center z-20" />
              
              <div className="absolute -left-[144px] top-1.5 hidden md:block text-right w-24">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Phase 2</span>
                <p className="text-[10px] text-muted uppercase">Q2 2026</p>
              </div>
 
              <GlassCard className="p-8 transition-all duration-300">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    Frictionless Onboarding
                  </h3>
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    Live
                  </span>
                </div>
                <p className="text-muted leading-relaxed mb-4 text-[15px]">
                  Allow coordinators and backers to connect securely using email or social login, removing technical onboarding friction and enabling simple voting.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Social Auth</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Wagmi / Viem</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Arc Testnet</span>
                </div>
              </GlassCard>
            </div>
 
            {/* Phase 3 */}
            <div className="relative pl-8 group">
              <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-emerald-500 border-4 border-background shadow-[0_0_12px_rgba(16,185,129,0.5)] flex items-center justify-center z-20" />
              
              <div className="absolute -left-[144px] top-1.5 hidden md:block text-right w-24">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Phase 3</span>
                <p className="text-[10px] text-muted uppercase">Q3 2026</p>
              </div>
 
              <GlassCard className="p-8 transition-all duration-300">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    Milestone Escrows
                  </h3>
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    Live
                  </span>
                </div>
                <p className="text-muted leading-relaxed mb-4 text-[15px]">
                  Deploy secure project vaults that lock community-contributed funds, releasing them in tranches only after milestones pass backer voting rounds.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Smart Vaults</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Solidity</span>
                </div>
              </GlassCard>
            </div>
 
            {/* Phase 4 */}
            <div className="relative pl-8 group">
              <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-purple-glow border-4 border-background shadow-[0_0_12px_rgba(124,58,237,0.5)] flex items-center justify-center z-20" />
              
              <div className="absolute -left-[144px] top-1.5 hidden md:block text-right w-24">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-glow">Phase 4</span>
                <p className="text-[10px] text-muted uppercase">Q4 2026</p>
              </div>
 
              <GlassCard className="p-8 transition-all duration-300">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    Private Coordination
                  </h3>
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-purple-glow/10 border border-purple-glow/20 text-purple-300">
                    Planned
                  </span>
                </div>
                <p className="text-muted leading-relaxed mb-4 text-[15px]">
                  Introduce voting safeguards that allow coordinators to vote privately, protecting participant voice and preventing strategic front-running.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Private Voting</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Secret Ballots</span>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      {/* Floating AI Assistant (Client Island) */}
      <FloatingAIChat />
    </div>
  );
}
