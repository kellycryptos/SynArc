"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Shield, Lock, Globe, Grid, X, Send, CheckCircle2, Award, Plus, MessageSquare } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatePresence, motion } from "framer-motion";

export default function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    daoName: "",
    description: "",
    website: "",
    twitter: "",
    wallet: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.daoName || !formData.description || !formData.wallet) {
      setErrorMsg("Please fill out the DAO Name, Description, and Wallet address.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      setSubmitSuccess(null);

      const response = await fetch("/api/dao-application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          daoName: formData.daoName,
          description: formData.description,
          website: formData.website,
          twitter: formData.twitter,
          wallet: formData.wallet,
          message: formData.message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit DAO application");
      }

      setSubmitSuccess(true);
      setFormData({
        daoName: "",
        description: "",
        website: "",
        twitter: "",
        wallet: "",
        message: "",
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
      setSubmitSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-30 bg-gradient-to-r from-primary via-arc-blue to-accent blur-[100px] rounded-full" />
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
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-border hover:border-primary/20 hover:bg-surface-elevated text-text-primary font-semibold transition-all flex items-center justify-center gap-2 text-lg"
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

      {/* Multi-DAO Infrastructure Section (New Feature!) */}
      <section id="infrastructure" className="py-24 relative overflow-hidden px-4 border-b border-border-thin bg-gradient-to-b from-transparent to-primary/[0.02]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] opacity-15 bg-primary rounded-full blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold font-heading tracking-tight text-text-primary leading-tight">
            Governance Infrastructure <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-arc-blue to-accent">for the Arc Ecosystem</span>
          </h2>
          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
            Deploy your DAO on SynArc. Manage proposals, treasury, and members — all on Arc Testnet.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] inline-flex items-center justify-center gap-2 text-lg cursor-pointer"
            >
              Apply for Your DAO <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              href="/daos"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-border hover:border-primary/20 hover:bg-surface-elevated text-text-primary font-semibold transition-all flex items-center justify-center gap-2 text-lg"
            >
              Explore DAOs &rarr;
            </Link>
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
                    Confidential Ballots
                  </h3>
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-purple-glow/10 border border-purple-glow/20 text-purple-300">
                    Planned
                  </span>
                </div>
                <p className="text-muted leading-relaxed mb-4 text-[15px]">
                  Introduce zero-knowledge cryptographic encryption mechanics into token voting rounds, enabling delegates to sign ballots with robust structural privacy.
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

      {/* Application Form Modal (Landing Page Portal!) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-background/80 backdrop-blur-md" 
              onClick={() => { if(!submitting) setIsModalOpen(false); }}
            />

            {/* Modal Box */}
            <div className="relative z-10 w-full max-w-lg bg-surface-elevated border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col overflow-hidden max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border-thin shrink-0">
                <div className="flex items-center gap-2">
                  <Grid className="w-5 h-5 text-primary animate-pulse" />
                  <h3 className="text-lg font-extrabold text-white font-heading">Apply to Join SynArc</h3>
                </div>
                <button
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/5 text-muted hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form */}
              <div className="flex-1 overflow-y-auto py-6 pr-1 space-y-5">
                {submitSuccess === true ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success mx-auto shadow-[0_0_20px_rgba(34,197,94,0.15)] animate-bounce">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-white text-lg">Application Submitted!</h4>
                      <p className="text-sm text-muted max-w-sm mx-auto">
                        Your application has been received and emailed to devsynarc@gmail.com. We will review your project details and get in touch with you shortly.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        setSubmitSuccess(null);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-surface border border-border-thin text-white font-semibold hover:border-white/10 text-xs transition-colors cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {errorMsg && (
                      <div className="p-4 rounded-xl border border-danger/20 bg-danger/5 text-danger text-xs font-semibold">
                        {errorMsg}
                      </div>
                    )}

                    {/* DAO Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted uppercase">DAO Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        name="daoName"
                        required
                        disabled={submitting}
                        placeholder="e.g. Canteen DAO"
                        value={formData.daoName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white transition-colors"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted uppercase">Description <span className="text-danger">*</span></label>
                      <textarea
                        name="description"
                        required
                        disabled={submitting}
                        rows={3}
                        placeholder="Detail your DAO's purpose, token plans, and ecosystem footprint..."
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white resize-none transition-colors"
                      />
                    </div>

                    {/* Website & Twitter */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted uppercase flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-muted/50" />
                          Website
                        </label>
                        <input
                          type="url"
                          name="website"
                          disabled={submitting}
                          placeholder="https://..."
                          value={formData.website}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted uppercase flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-muted/50" />
                          Twitter/X
                        </label>
                        <input
                          type="text"
                          name="twitter"
                          disabled={submitting}
                          placeholder="@handle"
                          value={formData.twitter}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white transition-colors"
                        />
                      </div>
                    </div>

                    {/* Wallet Address */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted uppercase">Contact Wallet Address <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        name="wallet"
                        required
                        disabled={submitting}
                        placeholder="0x..."
                        value={formData.wallet}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white font-mono transition-colors"
                      />
                    </div>

                    {/* Message / Why */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted uppercase">Why do you want to join SynArc?</label>
                      <textarea
                        name="message"
                        disabled={submitting}
                        rows={2}
                        placeholder="Tell us what excites you about building on SynArc infrastructure..."
                        value={formData.message}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white resize-none transition-colors"
                      />
                    </div>

                    {/* CTA */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.2)] disabled:opacity-50 cursor-pointer text-sm"
                    >
                      <Send className="w-4 h-4" />
                      {submitting ? "Sending Application..." : "Submit Application"}
                    </button>
                  </form>
                )}
              </div>

              {/* Footer details */}
              <div className="pt-4 border-t border-border-thin flex flex-col items-center justify-center gap-2 shrink-0">
                <p className="text-[11px] text-muted text-center leading-relaxed">
                  You can also reach us directly on Telegram: <span className="text-primary font-bold">@Kellycryptos</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
