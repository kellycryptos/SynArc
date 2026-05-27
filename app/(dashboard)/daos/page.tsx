"use client";

import { useState, useEffect } from "react";
import { DAO_REGISTRY, DAOInfo } from "@/data/daos";
import { GlassCard } from "@/components/ui/GlassCard";
import { Grid, Users, Shield, ArrowRight, Award, Plus, X, Globe, MessageSquare, Send, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/auth/useAuth";
import { AnimatePresence } from "framer-motion";
import { ethers, Contract, formatUnits } from "ethers";
import { getResilientProvider } from "@/lib/rpc/config";

export default function DAOsPage() {
  const { isAuthenticated } = useAuth();
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

  // Live contract read states for SynArc DAO
  const [synarcMembers, setSynarcMembers] = useState<number | null>(null);
  const [synarcTreasury, setSynarcTreasury] = useState<number | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Sort registry: SynArc featured first
  const sortedDAOs = [...DAO_REGISTRY].sort((a, b) => {
    if (a.id === "synarc") return -1;
    if (b.id === "synarc") return 1;
    return 0;
  });

  // Fetch live metrics for SynArc DAO from smart contracts
  useEffect(() => {
    async function fetchSynArcLiveMetrics() {
      try {
        setMetricsLoading(true);
        const provider = await getResilientProvider();
        
        // 1. Fetch live treasury balance
        const treasuryAddress = "0x8Ab21363cB0319548B051f129e477393908be7c1";
        const TREASURY_ABI = [
          "function usdcBalance() external view returns (uint256)",
          "function eurcBalance() external view returns (uint256)"
        ];
        const treasuryContract = new Contract(treasuryAddress, TREASURY_ABI, provider);
        const [usdcBal, eurcBal] = await Promise.all([
          treasuryContract.usdcBalance().catch(() => 0n),
          treasuryContract.eurcBalance().catch(() => 0n)
        ]);
        const usdcVal = Number(formatUnits(usdcBal, 6));
        const eurcVal = Number(formatUnits(eurcBal, 6));
        const combinedTreasury = usdcVal + (eurcVal * 1.08); // combined USD value
        setSynarcTreasury(combinedTreasury);

        // 2. Fetch live members count by scraping token Transfer logs
        const tokenAddress = "0x637cA7788aBC956832F389A7BB895D5249FE757B";
        const ERC20_ABI = [
          "function balanceOf(address account) external view returns (uint256)"
        ];
        const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
        
        const latestBlock = await provider.getBlockNumber();
        const chunkSize = 5000;
        const events = [];
        
        for (let i = 0; i <= latestBlock; i += chunkSize) {
          const toBlock = Math.min(i + chunkSize - 1, latestBlock);
          const chunk = await provider.getLogs({
            address: tokenAddress,
            topics: [ethers.id("Transfer(address,address,uint256)")],
            fromBlock: i,
            toBlock: toBlock
          }).catch(() => []);
          events.push(...chunk);
        }

        const holders = new Set<string>();
        events.forEach(log => {
          if (log.topics && log.topics.length >= 3) {
            const from = ethers.getAddress("0x" + log.topics[1].substring(26));
            const to = ethers.getAddress("0x" + log.topics[2].substring(26));
            if (to && to !== ethers.ZeroAddress) holders.add(to);
            if (from && from !== ethers.ZeroAddress) holders.add(from);
          }
        });

        // Filter active holders
        let activeHoldersCount = 0;
        await Promise.all(
          Array.from(holders).map(async (holder) => {
            try {
              const bal = await tokenContract.balanceOf(holder);
              if (bal > 0n) {
                activeHoldersCount++;
              }
            } catch (err) {}
          })
        );
        
        setSynarcMembers(activeHoldersCount > 0 ? activeHoldersCount : holders.size);
      } catch (err) {
        console.error("Failed to fetch live contract reads for SynArc DAO registry", err);
      } finally {
        setMetricsLoading(false);
      }
    }

    fetchSynArcLiveMetrics();
  }, []);

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
    <div className="space-y-10 relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary shadow-[0_0_15px_rgba(124,58,237,0.1)]">
            <Award className="w-3.5 h-3.5" />
            <span>Featured Ecosystem</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">DAO Registry</h1>
          <p className="text-muted leading-relaxed">
            SynArc hosts governance infrastructure for approved DAOs on Arc Testnet. Each DAO manages its own proposals and treasury.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="md:self-start shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" />
          Apply for Your DAO
        </button>
      </div>

      {/* Discovery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sortedDAOs.map((dao) => {
          const isFeatured = dao.id === "synarc";
          const logoInitials = dao.name.slice(0, 2).toUpperCase();

          // Use live contract read value for SynArc, otherwise mock registry data
          const displayMembers = (isFeatured && synarcMembers !== null) ? synarcMembers : dao.members;
          const displayTreasury = (isFeatured && synarcTreasury !== null) ? synarcTreasury : dao.treasury;

          return (
            <GlassCard
              key={dao.id}
              className={`p-6 flex flex-col relative overflow-hidden h-full transition-all duration-300 border ${
                isFeatured 
                  ? "border-primary/30 shadow-[0_0_30px_rgba(124,58,237,0.06)] bg-gradient-to-br from-primary/[0.03] to-transparent" 
                  : "border-border-thin hover:border-white/10"
              }`}
            >
              {isFeatured && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-primary/20 border border-primary/30 text-[9px] font-extrabold uppercase text-purple-300 tracking-wider">
                  Featured
                </div>
              )}

              {/* Logo / Details */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md relative overflow-hidden bg-gradient-to-br shrink-0 ${
                  isFeatured 
                    ? "from-purple-deep to-primary/40" 
                    : "from-white/10 to-white/5"
                }`}>
                  {dao.logo ? (
                    <img src={dao.logo} alt={dao.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-extrabold text-white">{logoInitials}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-white text-lg">{dao.name}</h3>
                    {dao.verified ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-success/15 border border-success/30 text-[9px] font-bold text-success">
                        ✅ Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[9px] font-bold text-amber-400">
                        ⏳ Pending
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-1.5 py-0.2 rounded bg-white/5 text-[9px] font-bold text-muted uppercase">
                      {dao.category}
                    </span>
                    <span className="text-[10px] text-primary/70 font-mono tracking-wider break-all">
                      {dao.governorAddress.slice(0, 6)}...{dao.governorAddress.slice(-4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted leading-relaxed flex-1 mb-6">
                {dao.description}
              </p>

              {/* Analytics metrics */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-thin mb-6 text-xs font-semibold">
                <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl flex flex-col gap-1.5">
                  <span className="text-muted/60 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-primary/70" />
                    Members
                  </span>
                  <span className="text-white font-mono font-extrabold text-base">
                    {metricsLoading && isFeatured ? (
                      <span className="block w-12 h-5 bg-white/5 animate-pulse rounded" />
                    ) : (
                      displayMembers?.toLocaleString() || "0"
                    )}
                  </span>
                </div>
                <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl flex flex-col gap-1.5">
                  <span className="text-muted/60 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-arc-blue/70" />
                    Treasury
                  </span>
                  <span className="text-white font-mono font-extrabold text-base">
                    {metricsLoading && isFeatured ? (
                      <span className="block w-16 h-5 bg-white/5 animate-pulse rounded" />
                    ) : (
                      `$${displayTreasury?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "0"}`
                    )}
                  </span>
                </div>
              </div>

              {/* Enter DAO */}
              <Link
                href={`/daos/${dao.id}`}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm group ${
                  isFeatured
                    ? "bg-primary/10 border border-primary/20 hover:bg-primary/20 text-white"
                    : "bg-surface-elevated border border-border-thin hover:border-white/10 text-white"
                }`}
              >
                Enter DAO 
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
              </Link>
            </GlassCard>
          );
        })}
      </div>

      {/* Application Form Modal */}
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
                  <h3 className="text-lg font-extrabold text-white">Apply to Join SynArc</h3>
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
