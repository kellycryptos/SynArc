"use client";

import Link from "next/link";
import { ArrowRight, Shield, Lock, Globe } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30 bg-gradient-to-r from-primary via-arc-blue to-accent blur-[100px] rounded-full" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-elevated border border-border-thin text-sm font-medium mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Arc Testnet is Live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tight mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            Confidential Governance Infrastructure <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-arc-blue">for the Agentic Economy</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted max-w-3xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            Secure coordination, governance, and treasury management for decentralized organizations built on Arc.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] flex items-center justify-center gap-2 text-lg"
            >
              Launch Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/docs"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.02] text-white font-semibold transition-all flex items-center justify-center gap-2 text-lg"
            >
              View Docs &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative z-10 bg-surface/50 border-y border-border-thin">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">Enterprise-Grade Coordination</h2>
            <p className="text-muted max-w-2xl mx-auto">Built from the ground up to support the scale and privacy requirements of modern on-chain organizations.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-8">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6 border border-primary/30">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Encrypted Analytics</h3>
              <p className="text-muted leading-relaxed">
                Analyze DAO participation and delegate health metrics without compromising the privacy of individual voters.
              </p>
            </GlassCard>
            
            <GlassCard className="p-8">
              <div className="w-12 h-12 rounded-xl bg-arc-blue/20 flex items-center justify-center mb-6 border border-arc-blue/30">
                <Globe className="w-6 h-6 text-arc-blue" />
              </div>
              <h3 className="text-xl font-bold mb-3">USDC-Native Treasury</h3>
              <p className="text-muted leading-relaxed">
                Manage your organization's wealth with stablecoin-native tools designed for the Arc ecosystem.
              </p>
            </GlassCard>
            
            <GlassCard className="p-8">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6 border border-accent/30">
                <Lock className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure Delegation</h3>
              <p className="text-muted leading-relaxed">
                Delegate voting power seamlessly using confidential identity proofs that preserve member anonymity.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="py-24 relative overflow-hidden px-4">
        {/* Glow Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[300px] opacity-10 bg-gradient-to-r from-purple-glow to-transparent blur-[80px] rounded-full" />
          <div className="absolute bottom-10 right-1/4 w-[500px] h-[300px] opacity-10 bg-gradient-to-l from-cyan-glow to-transparent blur-[80px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-elevated border border-border-thin text-xs font-semibold uppercase tracking-wider text-primary mb-4">
              Protocol Path
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-4">Ecosystem Roadmap</h2>
            <p className="text-muted max-w-2xl mx-auto text-lg">
              Our structured path towards establishing institutional-grade, privacy-preserving governance for the emerging agentic economy.
            </p>
          </div>

          {/* Timeline Wrapper */}
          <div className="relative border-l-2 border-dashed border-white/[0.08] ml-4 md:ml-32 md:pl-16 space-y-12">
            
            {/* Phase 1 */}
            <div className="relative pl-8 group">
              {/* Timeline Indicator Badge */}
              <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-emerald-500 border-4 border-background shadow-[0_0_12px_rgba(16,185,129,0.5)] flex items-center justify-center z-20 group-hover:scale-125 transition-transform duration-300" />
              
              <div className="absolute -left-[144px] top-1.5 hidden md:block text-right w-24">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Phase 1</span>
                <p className="text-[10px] text-muted uppercase">Q1 2026</p>
              </div>

              <GlassCard className="p-8 transition-all duration-300 group-hover:border-emerald-500/30 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.05)]">
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
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Next.js 15</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Tailwind CSS</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Framer Motion</span>
                </div>
              </GlassCard>
            </div>

            {/* Phase 2 */}
            <div className="relative pl-8 group">
              <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-emerald-500 border-4 border-background shadow-[0_0_12px_rgba(16,185,129,0.5)] flex items-center justify-center z-20 group-hover:scale-125 transition-transform duration-300" />
              
              <div className="absolute -left-[144px] top-1.5 hidden md:block text-right w-24">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Phase 2</span>
                <p className="text-[10px] text-muted uppercase">Q2 2026</p>
              </div>

              <GlassCard className="p-8 transition-all duration-300 group-hover:border-emerald-500/30 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.05)]">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    Authentication Infrastructure
                  </h3>
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    Live
                  </span>
                </div>
                <p className="text-muted leading-relaxed mb-4 text-[15px]">
                  Deploy seamless embedded wallet frameworks and social logins powered by Privy, establishing secure, gasless cryptographic voting parameters on Arc Testnet.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Privy SDK</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Wagmi / Viem</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Arc Testnet</span>
                </div>
              </GlassCard>
            </div>

            {/* Phase 3 */}
            <div className="relative pl-8 group">
              <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-amber-500 border-4 border-background shadow-[0_0_12px_rgba(245,158,11,0.5)] flex items-center justify-center z-20 group-hover:scale-125 transition-transform duration-300 animate-pulse" />
              
              <div className="absolute -left-[144px] top-1.5 hidden md:block text-right w-24">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">Phase 3</span>
                <p className="text-[10px] text-muted uppercase">Q3 2026</p>
              </div>

              <GlassCard className="p-8 transition-all duration-300 group-hover:border-amber-500/30 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.05)]">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    Governance Contracts
                  </h3>
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    In Progress
                  </span>
                </div>
                <p className="text-muted leading-relaxed mb-4 text-[15px]">
                  Write and test custom OpenZeppelin-based governance contracts on the Arc blockchain network. Configure TimelockControllers to enforce secure, delay-buffered proposal executions.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">OpenZeppelin</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Solidity</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Timelock</span>
                </div>
              </GlassCard>
            </div>

            {/* Phase 4 */}
            <div className="relative pl-8 group">
              <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-purple-glow border-4 border-background shadow-[0_0_12px_rgba(124,58,237,0.5)] flex items-center justify-center z-20 group-hover:scale-125 transition-transform duration-300" />
              
              <div className="absolute -left-[144px] top-1.5 hidden md:block text-right w-24">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-glow">Phase 4</span>
                <p className="text-[10px] text-muted uppercase">Q4 2026</p>
              </div>

              <GlassCard className="p-8 transition-all duration-300 group-hover:border-purple-glow/30 group-hover:shadow-[0_0_25px_rgba(124,58,237,0.05)]">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    Arc Ecosystem Integration
                  </h3>
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-white/[0.04] border border-white/[0.08] text-muted/60">
                    Upcoming
                  </span>
                </div>
                <p className="text-muted leading-relaxed mb-4 text-[15px]">
                  Power full treasury disbursements with real USDC. Build interfaces and API pathways enabling autonomous AI agents to submit and participate in live proposals.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">USDC Native</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Agentic API</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Multisig</span>
                </div>
              </GlassCard>
            </div>

            {/* Phase 5 */}
            <div className="relative pl-8 group">
              <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-cyan-glow border-4 border-background shadow-[0_0_12px_rgba(6,182,212,0.5)] flex items-center justify-center z-20 group-hover:scale-125 transition-transform duration-300" />
              
              <div className="absolute -left-[144px] top-1.5 hidden md:block text-right w-24">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-glow">Phase 5</span>
                <p className="text-[10px] text-muted uppercase">Q1 2027</p>
              </div>

              <GlassCard className="p-8 transition-all duration-300 group-hover:border-cyan-glow/30 group-hover:shadow-[0_0_25px_rgba(6,182,212,0.05)]">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    Confidential Governance
                  </h3>
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-white/[0.04] border border-white/[0.08] text-muted/60">
                    Upcoming
                  </span>
                </div>
                <p className="text-muted leading-relaxed mb-4 text-[15px]">
                  Incorporate Zero-Knowledge cryptography to construct encrypted voting schemes. Build private coordinator set logic to hide voting positions during active elections.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">ZK-Snarks</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Secret Ballots</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">TS SDK</span>
                </div>
              </GlassCard>
            </div>

            {/* Mainnet Integration */}
            <div className="relative pl-8 group">
              <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-white/[0.2] border-4 border-background shadow-[0_0_12px_rgba(255,255,255,0.3)] flex items-center justify-center z-20 group-hover:scale-125 transition-transform duration-300" />
              
              <div className="absolute -left-[144px] top-1.5 hidden md:block text-right w-24">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/[0.5]">Future</span>
                <p className="text-[10px] text-muted uppercase">Planned</p>
              </div>

              <GlassCard className="p-8 transition-all duration-300 group-hover:border-white/[0.2] group-hover:shadow-[0_0_25px_rgba(255,255,255,0.05)]">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    Mainnet Integration
                  </h3>
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-white/[0.04] border border-white/[0.08] text-muted/60">
                    Planned
                  </span>
                </div>
                <p className="text-muted leading-relaxed mb-4 text-[15px]">
                  Deploy SynArc governance infrastructure to ARC mainnet. Enable production-ready DAOs with real asset management and institutional participation at scale.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Mainnet</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Production</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Institutional</span>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer is added in the layout */}
    </div>
  );
}
