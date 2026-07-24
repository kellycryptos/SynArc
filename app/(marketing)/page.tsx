import Link from "next/link";
import { ArrowRight, Shield, Lock, Globe, Award, Bot, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FloatingAIChatLazy } from "@/components/marketing/FloatingAIChatLazy";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-36 md:pb-28 overflow-hidden px-4 bg-[#05080F] hero-dark">
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
            Keep project funds secure in milestone-based escrows, vote transparently on releases, and automatically prevent funds from sitting idle on Arc.
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
        </div>
      </section>

      {/* Quick Navigation / Documentation Banner Section */}
      <section id="docs-preview" className="py-16 relative z-10 bg-surface/50 border-y border-border-thin">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">Ecosystem Infrastructure & Documentation</h2>
          <p className="text-text-secondary max-w-xl mx-auto text-sm">
            Read comprehensive guides on our governance model, milestone escrows, treasury agent guards, and developer SDKs.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/docs/overview" className="px-4 py-2.5 rounded-xl bg-surface-elevated/60 border border-border-thin hover:border-primary/40 text-xs font-semibold text-text-primary transition-all">
              Overview
            </Link>
            <Link href="/docs/governance" className="px-4 py-2.5 rounded-xl bg-surface-elevated/60 border border-border-thin hover:border-primary/40 text-xs font-semibold text-text-primary transition-all">
              Governance & Voting
            </Link>
            <Link href="/docs/treasury" className="px-4 py-2.5 rounded-xl bg-surface-elevated/60 border border-border-thin hover:border-primary/40 text-xs font-semibold text-text-primary transition-all">
              Treasury Escrow
            </Link>
            <Link href="/docs/ai-agents" className="px-4 py-2.5 rounded-xl bg-surface-elevated/60 border border-border-thin hover:border-primary/40 text-xs font-semibold text-text-primary transition-all">
              AI Agents
            </Link>
            <Link href="/docs/sdk" className="px-4 py-2.5 rounded-xl bg-surface-elevated/60 border border-border-thin hover:border-primary/40 text-xs font-semibold text-text-primary transition-all">
              Agent SDK
            </Link>
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

      {/* Floating AI Assistant */}
      <FloatingAIChatLazy />
    </div>
  );
}
