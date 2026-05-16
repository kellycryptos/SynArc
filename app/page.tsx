"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  Lock,
  ArrowRight,
  Database,
  Layers
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";

const features = [
  {
    icon: Database,
    title: "Stablecoin-Native Coordination",
    description: "Manage multi-million dollar stablecoin treasuries with programmable execution and built-in yield strategies for the USDC economy.",
  },
  {
    icon: Lock,
    title: "Confidential Execution",
    description: "Zero-knowledge proofs ensure that governance votes and treasury movements remain private while guaranteeing cryptographic accuracy.",
  },
  {
    icon: Zap,
    title: "Programmable Governance",
    description: "Implement custom coordination rules, automated timelocks, and smart-contract driven decision matrices for your organization.",
  },
  {
    icon: Layers,
    title: "Agentic Economies",
    description: "Built for high-throughput, autonomous operations, enabling AI agents and delegates to coordinate value at scale.",
  },
];

export default function HomePage() {
  return (
    <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Gradients & Grids */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary opacity-20 blur-[100px]"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-24 relative z-10">
        {/* Hero */}
        <section className="text-center space-y-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 relative"
          >
            {/* Glow behind text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              SynArc Protocol
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto">
              Confidential Governance Infrastructure on <span className="text-primary">Arc</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
              Secure coordination, governance, and treasury management for decentralized organizations. Built for the next generation of DAOs.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
            >
              <Zap className="w-5 h-5" />
              Launch Dashboard
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-surface border border-border-thin text-foreground font-semibold hover:bg-surface-elevated transition-colors"
            >
              View Docs
            </Link>
          </motion.div>
        </section>

        {/* Floating UI Cards Demonstration */}
        <section className="relative h-[400px] w-full max-w-5xl mx-auto hidden md:block">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 left-10 z-10 w-64"
          >
            <GlassCard hover={false} className="p-4 bg-surface/60 backdrop-blur-md border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Treasury Protected</div>
                  <div className="text-xs text-muted">Multisig secured</div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-32 right-10 z-20 w-72"
          >
            <GlassCard hover={false} className="p-4 bg-surface/80 backdrop-blur-xl border border-white/10 shadow-2xl">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Proposal #1042</span>
                  <span className="text-xs px-2 py-1 bg-success/20 text-success rounded-full">Passed</span>
                </div>
                <div className="w-full bg-surface-elevated h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[80%]" />
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <span>80% For</span>
                  <span>20% Against</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 w-80"
          >
            <GlassCard hover={false} className="p-4 bg-surface/70 backdrop-blur-lg border border-primary/30 shadow-[0_0_30px_rgba(124,58,237,0.15)]">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                     <Lock className="w-5 h-5 text-accent" />
                   </div>
                   <div>
                     <div className="text-sm font-semibold">Zero-Knowledge Vote</div>
                     <div className="text-xs text-muted">Verified on Arc</div>
                   </div>
                 </div>
                 <ArrowRight className="w-4 h-4 text-muted" />
               </div>
            </GlassCard>
          </motion.div>
        </section>

        {/* Features */}
        <section className="space-y-12 pb-24 relative z-10">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Built for Agentic Coordination</h2>
            <p className="text-muted max-w-2xl mx-auto text-lg">SynArc provides the essential infrastructure to build, manage, and scale programmable agentic economies with uncompromising security.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <GlassCard key={feature.title} delay={i * 0.1} className="p-8">
                  <div className="p-4 rounded-xl bg-surface-elevated border border-white/5 w-fit mb-6">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted leading-relaxed">
                    {feature.description}
                  </p>
                </GlassCard>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
