"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Shield, Lock, Globe, Grid, X, Send, CheckCircle2, Award, Plus, MessageSquare, Bot, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProofOfAutonomyTimeline } from "@/components/dashboard/ProofOfAutonomyTimeline";
import { AnimatePresence, motion } from "framer-motion";


interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ 
        y: -4,
        boxShadow: '0 20px 40px rgba(124, 58, 237, 0.15)',
        borderColor: 'rgba(124, 58, 237, 0.4)',
      }}
      transition={{ duration: 0.2 }}
      className="h-full rounded-2xl overflow-hidden"
    >
      <GlassCard className="p-6 md:p-8 flex flex-col gap-4 h-full">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 text-2xl select-none">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-text-primary">{title}</h3>
        <p className="text-text-secondary leading-relaxed">{description}</p>
      </GlassCard>
    </motion.div>
  );
}

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

  // Floating AI bot states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hi there! 👋 I am your SynArc AI Companion. Ask me anything about Creator DAOs, USDC nanopayments, milestone escrows, or our SDK!' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat) return;

    const userMessage = { role: 'user' as const, content: chatInput.trim() };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setSendingChat(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage]
        })
      });

      const data = await response.json();
      if (response.ok && data.success && data.reply) {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I had trouble formulating a response. Please try again." }]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: "Network error. Please make sure you are connected and try again." }]);
    } finally {
      setSendingChat(false);
    }
  };

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

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitSuccess(true);
        setFormData({
          daoName: "",
          description: "",
          website: "",
          twitter: "",
          wallet: "",
          message: "",
        });
      } else {
        setErrorMsg(data.error || "Failed to submit application. Please try again.");
        setSubmitSuccess(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Something went wrong. Please email us directly at devsynarc@gmail.com");
      setSubmitSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-36 md:pb-24 overflow-hidden px-4 bg-[#05080F]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-20 bg-gradient-to-r from-[#2F6FFF] to-[#22D3EE] blur-[120px] rounded-full" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-6xl mx-auto relative z-10 text-center"
        >
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full bg-[#0B111C] border border-[#1B2536] text-xs md:text-sm text-[#9CA6B8] mb-8 font-space">
            <span className="w-1.75 h-1.75 rounded-full bg-[#22D3EE] animate-pulse" />
            <span>Proven on Arc Testnet with 900+ proposals · Powered by X Layer</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-[58px] font-bold font-space tracking-tight mb-6 leading-[1.12] text-[#F5F7FA] max-w-4xl mx-auto">
            Coordinate and protect{" "}
            <span className="bg-gradient-to-r from-[#2F6FFF] to-[#22D3EE] bg-clip-text text-transparent">
              your community's funds
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-[17px] text-[#8B93A5] max-w-2xl mx-auto mb-10 leading-relaxed font-space">
            Keep project funds secure in milestone-based escrows, vote transparently on releases, and automatically prevent funds from sitting idle.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Primary CTA — Agent */}
            <motion.div
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto"
            >
              <Link 
                href="/agent"
                className="w-full sm:w-auto px-6 py-3.5 sm:px-7 sm:py-3.5 rounded-lg bg-gradient-to-r from-[#2F6FFF] to-[#22D3EE] text-[#04101C] font-bold hover:opacity-95 transition-all shadow-[0_0_30px_rgba(34,211,238,0.2)] flex items-center justify-center gap-2 text-base font-space"
              >
                <span>View automated treasury &rarr;</span>
              </Link>
            </motion.div>
            {/* Secondary CTA — Dashboard */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto"
            >
              <Link 
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3.5 sm:px-7 sm:py-3.5 rounded-lg bg-[#0B111C] border border-[#232E42] hover:border-[#22D3EE]/40 text-[#F5F7FA] font-medium transition-all flex items-center justify-center gap-2 text-base font-space"
              >
                Launch dashboard
              </Link>
            </motion.div>
            {/* Docs CTA */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto"
            >
              <Link 
                href="/docs"
                className="w-full sm:w-auto px-6 py-3.5 sm:px-7 sm:py-3.5 rounded-lg bg-[#0B111C] border border-[#232E42] hover:border-[#22D3EE]/40 text-[#F5F7FA] font-medium transition-all flex items-center justify-center gap-2 text-base font-space"
              >
                View docs &rarr;
              </Link>
            </motion.div>
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
        </motion.div>
      </section>

      {/* Proof of Autonomy Timeline Section */}
      <section className="py-20 relative overflow-hidden px-4 border-b border-border-thin bg-[#160B2E]/10">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-12"
          >
            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 uppercase tracking-widest">
              Live Network Operations
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-heading mt-3 mb-4 text-text-primary">
              Proof of Autonomy Timeline
            </h2>
            <p className="text-xs md:text-sm text-text-secondary max-w-xl mx-auto leading-relaxed">
              Verify real-time on-chain actions triggered and executed autonomously by the SynArc Treasury Agent when threshold rules are violated.
            </p>
          </motion.div>

          <GlassCard className="p-6 md:p-8 bg-surface-elevated/20 border-border-thin" hover={false}>
            <ProofOfAutonomyTimeline limit={3} />
            
            <div className="mt-8 pt-6 border-t border-border-thin/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left text-xs text-text-secondary">
                <span className="font-bold text-text-primary block mb-0.5">Want to verify the Smart Agent account?</span>
                Explore the complete agent operations log, treasury rules console, and CCTP monitoring.
              </div>
              <Link 
                href="/agent" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-hover shadow-lg shadow-primary/10 transition-all active:scale-[0.99] cursor-pointer"
              >
                <span>Open Agent Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative z-10 bg-surface/50 border-y border-border-thin">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4 text-text-primary">Complete Coordination Framework</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">Built to support the scale, transparency, and security requirements of modern digital organizations.</p>
          </motion.div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div variants={itemVariants}>
              <motion.div
                whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(124, 58, 237, 0.15)', borderColor: 'rgba(124, 58, 237, 0.4)' }}
                transition={{ duration: 0.2 }}
                className="h-full rounded-2xl overflow-hidden"
              >
                <GlassCard className="p-8 h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6 border border-primary/30">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-text-primary">Frictionless Audits</h3>
                  <p className="text-text-secondary leading-relaxed">
                    Analyze participation and workspace health metrics transparently without violating individual contributor privacy.
                  </p>
                </GlassCard>
              </motion.div>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <motion.div
                whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(124, 58, 237, 0.15)', borderColor: 'rgba(124, 58, 237, 0.4)' }}
                transition={{ duration: 0.2 }}
                className="h-full rounded-2xl overflow-hidden"
              >
                <GlassCard className="p-8 h-full">
                  <div className="w-12 h-12 rounded-xl bg-arc-blue/20 flex items-center justify-center mb-6 border border-arc-blue/30">
                    <Globe className="w-6 h-6 text-arc-blue" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-text-primary">Transparent Treasury</h3>
                  <p className="text-text-secondary leading-relaxed">
                    Manage your organization's wealth with simple, stable digital assets and transparent ledger logs.
                  </p>
                </GlassCard>
              </motion.div>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <motion.div
                whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(124, 58, 237, 0.15)', borderColor: 'rgba(124, 58, 237, 0.4)' }}
                transition={{ duration: 0.2 }}
                className="h-full rounded-2xl overflow-hidden"
              >
                <GlassCard className="p-8 h-full">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6 border border-accent/30">
                    <Lock className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-text-primary">Secure Coordination</h3>
                  <p className="text-text-secondary leading-relaxed">
                    Delegate voting weight seamlessly using identity confirmations that protect participant voice.
                  </p>
                </GlassCard>
              </motion.div>
            </motion.div>
 
            <motion.div variants={itemVariants}>
              <motion.div
                whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(124, 58, 237, 0.15)', borderColor: 'rgba(124, 58, 237, 0.4)' }}
                transition={{ duration: 0.2 }}
                className="h-full rounded-2xl overflow-hidden"
              >
                <GlassCard className="p-8 h-full">
                  <div className="w-12 h-12 rounded-xl bg-purple-glow/20 flex items-center justify-center mb-6 border border-purple-glow/30">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-text-primary">Treasury Agent Guards</h3>
                  <p className="text-text-secondary leading-relaxed">
                    Protect and optimize reserves automatically. Enable autonomous CCTP rebalancing, scheduled payouts, yield farming, risk monitoring, and multi-chain sweeps.
                  </p>
                </GlassCard>
              </motion.div>
            </motion.div>
          </motion.div>
 
          {/* Creator Economy Highlights Row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-16 pt-10 border-t border-border-thin flex flex-wrap justify-center items-center gap-4 md:gap-8 text-center"
          >
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
          </motion.div>
        </div>
      </section>
 
      {/* Multi-DAO Infrastructure Section (New Feature!) */}
      <section id="infrastructure" className="py-24 relative overflow-hidden px-4 border-b border-border-thin bg-gradient-to-b from-transparent to-primary/[0.02]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] opacity-15 bg-primary rounded-full blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-8">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-heading tracking-tight text-text-primary leading-tight">
            Governance Infrastructure <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-arc-blue to-accent">for Digital Teams</span>
          </h2>
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Launch your workspace on SynArc. Manage proposals, treasury allocations, and coordinator voting.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-xl bg-accent-purple text-white-keep font-semibold hover:bg-accent-purple/90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] inline-flex items-center justify-center gap-2 text-base sm:text-lg cursor-pointer"
            >
              Apply for Your Workspace <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              href="/daos"
              className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-xl border border-border hover:border-primary/20 hover:bg-surface-elevated text-text-primary font-semibold transition-all flex items-center justify-center gap-2 text-base sm:text-lg"
            >
              Explore Workspaces &rarr;
            </Link>
          </div>
        </div>
      </section>
 
      {/* Creator DAO Section */}
      <section className="crowdfund-section py-24 relative overflow-hidden px-4 border-b border-border-thin bg-gradient-to-b from-transparent to-primary/[0.01]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] opacity-10 bg-primary rounded-full blur-[120px]" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-12">
          <div className="section-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold uppercase tracking-wider text-purple-300">
            ⚡ Project Funding
          </div>
          
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-heading tracking-tight text-text-primary leading-tight">
            Community Funding Platform<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-arc-blue to-accent">for Projects & Creators</span>
          </h2>
          
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Milestone-locked funding, coordination templates, and simple voting for active projects.
          </p>
 
          <div className="feature-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <FeatureCard
              icon="🤖"
              title="Treasury Agent Guards"
              description="Automate asset protection with CCTP rebalancing, scheduled payouts, yield farming, multi-chain sweeps, and live risk alerts."
            />
            <FeatureCard
              icon="👤"
              title="Project Workspaces"
              description="Creators and teams launch shared project workspaces with milestone-locked vaults."
            />
            <FeatureCard
              icon="🏦"
              title="Milestone Trust"
              description="Backer contributions are held in secure escrows, released as project milestones are completed."
            />
            <FeatureCard
              icon="💸"
              title="Frictionless Payouts"
              description="Approved milestones trigger direct on-chain payouts to project members."
            />
          </div>
 
          <div className="cta-buttons flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/creator-daos" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 text-white font-semibold transition-all border border-border-thin flex items-center justify-center gap-2 text-lg">
              Explore Workspaces
            </Link>
            <Link href="/create-dao" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-accent-purple text-white-keep font-semibold hover:bg-accent-purple/90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] flex items-center justify-center gap-2 text-lg">
              Launch Project Workspace &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Developer SDK Section */}
      <section id="sdk" className="py-24 relative overflow-hidden px-4 border-b border-border-thin bg-gradient-to-b from-transparent to-primary/[0.03]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] opacity-15 bg-gradient-to-r from-primary to-arc-blue rounded-full blur-[130px]" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold uppercase tracking-wider text-purple-300">
                🛠️ FOR DEVELOPERS
              </div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-heading tracking-tight text-text-primary leading-tight">
                Build Custom Treasury Rules <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-arc-blue to-accent">With Programmatic Workspaces</span>
              </h2>
              <p className="text-lg text-text-secondary leading-relaxed">
                Connect custom automation and rules to your workspace. Programmatically monitor balances, execute sweeps, or trigger alerts using our developer SDK.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] text-primary">✔</div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">Easy Integration</h4>
                    <p className="text-xs text-text-secondary">Fully typed SDK built for Javascript, TypeScript, and Python agent runners.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] text-primary">✔</div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">Universal Wallet Support</h4>
                    <p className="text-xs text-text-secondary">Works seamlessly with Circle Programmable Wallets, Privy, MetaMask, and WalletConnect.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] text-primary">✔</div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">Full Treasury & Governance</h4>
                    <p className="text-xs text-text-secondary">Trigger programmatic sweeps, registry updates, and execute timelocked execution transactions.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link href="/docs/sdk" className="px-6 py-3 rounded-xl bg-accent-purple text-white-keep font-semibold hover:bg-accent-purple/90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] flex items-center gap-2">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
                <a 
                  href="https://github.com/kellycryptos/synarc-agent-sdk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl border border-border hover:border-primary/20 hover:bg-surface-elevated text-text-primary font-semibold transition-all flex items-center gap-2"
                >
                  View GitHub
                </a>
              </div>
            </div>

            {/* Right Interactive Mockup */}
            <div className="lg:col-span-7">
              <GlassCard className="p-0 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-arc-blue/5 to-transparent pointer-events-none" />
                
                {/* Mac window header */}
                <div className="bg-surface-elevated/40 px-4 py-3 border-b border-white/[0.05] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  </div>
                  <span className="text-[11px] font-mono text-muted/70 tracking-wider">agent-setup.ts</span>
                  <div className="w-12" /> {/* spacer */}
                </div>

                {/* Code Body */}
                <div className="p-6 md:p-8 font-mono text-xs md:text-sm leading-relaxed overflow-x-auto text-left text-text-secondary">
                  <div>
                    <span className="text-[#f47067]">npm install</span> <span className="text-[#8dd3c7]">@synarc/agent-sdk</span>
                  </div>
                  <div className="h-4" />
                  <div>
                    <span className="text-[#ff7b72]">import</span> {"{"} <span className="text-[#c9d1d9]">SynArcAgentClient</span> {"}"} <span className="text-[#ff7b72]">from</span> <span className="text-[#a5d6ff]">'@synarc/agent-sdk'</span><span className="text-[#c9d1d9]">;</span>
                  </div>
                  <div>
                    <span className="text-[#ff7b72]">import</span> {"{"} <span className="text-[#c9d1d9]">ethers</span> {"}"} <span className="text-[#ff7b72]">from</span> <span className="text-[#a5d6ff]">'ethers'</span><span className="text-[#c9d1d9]">;</span>
                  </div>
                  <div className="h-3" />
                  <div className="text-muted/60">// Initialize connection for the Arc Network</div>
                  <div>
                    <span className="text-[#ff7b72]">const</span> <span className="text-[#79c0ff]">provider</span> <span className="text-[#ff7b72]">=</span> <span className="text-[#ff7b72]">new</span> <span className="text-[#79c0ff]">ethers</span><span className="text-[#c9d1d9]">.</span><span className="text-[#d2a8ff]">JsonRpcProvider</span><span className="text-[#c9d1d9]">(</span><span className="text-[#a5d6ff]">'https://rpc.testnet.arc.network'</span><span className="text-[#c9d1d9]">);</span>
                  </div>
                  <div>
                    <span className="text-[#ff7b72]">const</span> <span className="text-[#79c0ff]">agentWallet</span> <span className="text-[#ff7b72]">=</span> <span className="text-[#ff7b72]">new</span> <span className="text-[#79c0ff]">ethers</span><span className="text-[#c9d1d9]">.</span><span className="text-[#d2a8ff]">Wallet</span><span className="text-[#c9d1d9]">(</span><span className="text-[#79c0ff]">process</span><span className="text-[#c9d1d9]">.</span><span className="text-[#79c0ff]">env</span><span className="text-[#c9d1d9]">.</span><span className="text-[#79c0ff]">AGENT_PRIVATE_KEY</span><span className="text-[#c9d1d9]">,</span> <span className="text-[#79c0ff]">provider</span><span className="text-[#c9d1d9]">);</span>
                  </div>
                  <div className="h-3" />
                  <div>
                    <span className="text-[#ff7b72]">const</span> <span className="text-[#79c0ff]">client</span> <span className="text-[#ff7b72]">=</span> <span className="text-[#ff7b72]">new</span> <span className="text-[#d2a8ff]">SynArcAgentClient</span><span className="text-[#c9d1d9]">({"{"}</span>
                  </div>
                  <div>
                    &nbsp;&nbsp;<span className="text-[#79c0ff]">signer</span><span className="text-[#c9d1d9]">:</span> <span className="text-[#79c0ff]">agentWallet</span><span className="text-[#c9d1d9]">,</span>
                  </div>
                  <div>
                    &nbsp;&nbsp;<span className="text-[#79c0ff]">network</span><span className="text-[#c9d1d9]">:</span> <span className="text-[#a5d6ff]">'arc-testnet'</span>
                  </div>
                  <div>
                    <span className="text-[#c9d1d9]">{"}"});</span>
                  </div>
                  <div className="h-3" />
                  <div className="text-muted/60">// Programmatically register and cast cryptographic votes</div>
                  <div>
                    <span className="text-[#ff7b72]">await</span> <span className="text-[#79c0ff]">client</span><span className="text-[#c9d1d9]">.</span><span className="text-[#79c0ff]">agent</span><span className="text-[#c9d1d9]">.</span><span className="text-[#d2a8ff]">registerIdentity</span><span className="text-[#c9d1d9]">({"{"}</span> <span className="text-[#79c0ff]">name</span><span className="text-[#c9d1d9]">:</span> <span className="text-[#a5d6ff]">'Agent-007'</span> <span className="text-[#c9d1d9]">{"}"});</span>
                  </div>
                  <div>
                    <span className="text-[#ff7b72]">await</span> <span className="text-[#79c0ff]">client</span><span className="text-[#c9d1d9]">.</span><span className="text-[#79c0ff]">governance</span><span className="text-[#c9d1d9]">.</span><span className="text-[#d2a8ff]">castVote</span><span className="text-[#c9d1d9]">({"{"}</span>
                  </div>
                  <div>
                    &nbsp;&nbsp;<span className="text-[#79c0ff]">proposalId</span><span className="text-[#c9d1d9]">:</span> <span className="text-[#79c0ff]">42</span><span className="text-[#c9d1d9]">,</span>
                  </div>
                  <div>
                    &nbsp;&nbsp;<span className="text-[#79c0ff]">support</span><span className="text-[#c9d1d9]">:</span> <span className="text-[#79c0ff]">1</span><span className="text-[#c9d1d9]">,</span> <span className="text-muted/60">// For</span>
                  </div>
                  <div>
                    &nbsp;&nbsp;<span className="text-[#79c0ff]">reason</span><span className="text-[#c9d1d9]">:</span> <span className="text-[#a5d6ff]">'Automated AI alignment verified.'</span>
                  </div>
                  <div>
                    <span className="text-[#c9d1d9]">{"}"});</span>
                  </div>
                </div>
              </GlassCard>
            </div>
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
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-heading mb-4">Ecosystem Roadmap</h2>
            <p className="text-muted max-w-2xl mx-auto text-lg">
              Our roadmap towards establishing secure, user-friendly funding escrows and automated treasury tools for creators and teams.
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
              <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-emerald-500 border-4 border-background shadow-[0_0_12px_rgba(16,185,129,0.5)] flex items-center justify-center z-20 group-hover:scale-125 transition-transform duration-300" />
              
              <div className="absolute -left-[144px] top-1.5 hidden md:block text-right w-24">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Phase 3</span>
                <p className="text-[10px] text-muted uppercase">Q3 2026</p>
              </div>
 
              <GlassCard className="p-8 transition-all duration-300 group-hover:border-emerald-500/30 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.05)]">
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
                    Enterprise Scaling
                  </h3>
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-white/[0.04] border border-white/[0.08] text-muted/60">
                    Planned
                  </span>
                </div>
                <p className="text-muted leading-relaxed mb-4 text-[15px]">
                  Support production-ready project workspaces with real-world asset management and institutional compliance integrations.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Mainnet</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Production</span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-muted">Scaling</span>
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
                        We'll review your application and contact you via Telegram <span className="font-semibold">@Kellycryptos</span> or email within 48 hours.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        setSubmitSuccess(null);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-surface border border-border-thin text-white font-semibold hover:border-white/10 text-xs transition-colors cursor-pointer"
                    >
                      Close
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
                      className="w-full py-3.5 rounded-xl bg-accent-purple text-white-keep font-bold hover:bg-accent-purple/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.2)] disabled:opacity-50 cursor-pointer text-sm"
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

      {/* Floating AI Chat Assistant */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-80 sm:w-96 h-[450px] rounded-2xl border border-primary/20 bg-background/90 backdrop-blur-lg shadow-2xl flex flex-col overflow-hidden mb-4 glass-card"
            >
              {/* Chat Header */}
              <div className="p-4 bg-gradient-to-r from-primary/30 to-accent/30 border-b border-border-thin flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-wide">SynArc AI Companion</h4>
                    <span className="text-[9px] text-muted block">Online · Powered by Groq</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-none text-xs">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-accent-purple text-white-keep rounded-tr-none'
                          : 'bg-surface border border-border-thin text-text-secondary rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {sendingChat && (
                  <div className="flex justify-start">
                    <div className="bg-surface border border-border-thin text-text-secondary p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="p-3 border-t border-border-thin flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question about SynArc..."
                  disabled={sendingChat}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-surface border border-border-thin text-xs text-white placeholder-muted focus:border-primary outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={sendingChat || !chatInput.trim()}
                  className="p-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white-keep disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white shadow-lg flex items-center justify-center cursor-pointer border border-white/10 hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all"
        >
          {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </motion.button>
      </div>
    </div>
  );
}
