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
              href="#"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-surface border border-border-thin text-foreground font-semibold hover:bg-surface-elevated transition-colors flex items-center justify-center text-lg"
            >
              View Docs
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
                Manage your organization&apos;s wealth with stablecoin-native tools designed for the Arc ecosystem.
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
      
      {/* Footer is added in the layout */}
    </div>
  );
}
