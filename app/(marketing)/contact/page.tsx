"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Send,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  HelpCircle,
  Briefcase,
  Bug,
  MessageSquare,
  Twitter,
  Github,
  ArrowRight,
  ShieldCheck,
  Clock,
  ExternalLink,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowOrb } from "@/components/ui/GlowOrb";
function getConnectedWalletAddress(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return (
      localStorage.getItem("synarc_circle_address") ||
      (window as any).ethereum?.selectedAddress ||
      undefined
    );
  } catch {
    return undefined;
  }
}

const CATEGORIES = [
  { id: "Feedback", label: "Feedback & Suggestions", icon: Sparkles },
  { id: "Support", label: "Technical Support", icon: HelpCircle },
  { id: "Partnership", label: "DAO Partnership & Integration", icon: Briefcase },
  { id: "Bug Report", label: "Bug Report & Security", icon: Bug },
  { id: "Other", label: "General Inquiries", icon: MessageSquare },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("Feedback");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText("devsynarc@gmail.com");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !email.includes("@")) {
      setErrorMsg("Please provide a valid email address.");
      return;
    }
    if (!message || message.trim().length < 5) {
      setErrorMsg("Please provide a message with at least 5 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const walletAddress = getConnectedWalletAddress();
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          category,
          message: message.trim(),
          walletAddress: walletAddress || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit message. Please try again.");
      }

      setSubmitSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          "Failed to send message. You can reach out directly to devsynarc@gmail.com."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Lighting */}
      <GlowOrb
        className="-top-20 left-1/4 opacity-25 dark:opacity-75"
        color="purple"
        size={400}
        blur={140}
        animate
      />
      <GlowOrb
        className="bottom-1/3 right-10 opacity-25 dark:opacity-70"
        color="cyan"
        size={350}
        blur={130}
        animate
      />

      <div className="relative z-10 max-w-5xl mx-auto space-y-12">
        {/* Page Hero Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs font-mono text-primary font-medium">
            <Mail className="w-3.5 h-3.5" />
            <span>Official Communications</span>
          </div>
          <h1 className="font-mono text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Contact & Feedback
          </h1>
          <p className="text-sm sm:text-base text-muted leading-relaxed">
            Have feedback on our governance platform, need developer support, or want to partner with Syn DAO? Drop us a line and our core team will reply directly.
          </p>
        </div>

        {/* Main Content Grid: Left Form, Right Contact Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Card (7 Cols) */}
          <div className="lg:col-span-7">
            <GlassCard className="p-6 sm:p-8 border border-border bg-surface/90 rounded-2xl backdrop-blur-xl shadow-xl">
              <div className="mb-6 pb-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="font-mono text-lg font-bold text-foreground">
                    Send Us a Message
                  </h2>
                  <p className="text-xs text-muted">
                    Delivered directly to <strong className="text-primary font-mono">devsynarc@gmail.com</strong>
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-background text-[11px] font-mono text-muted">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>&lt; 24h Response</span>
                </div>
              </div>

              {submitSuccess ? (
                <div className="py-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_24px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-mono text-xl font-bold text-foreground">
                      Message Sent Successfully!
                    </h3>
                    <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
                      Thank you for contacting us. Your message has been delivered to{" "}
                      <span className="text-foreground font-semibold">devsynarc@gmail.com</span>. We will follow up via your email shortly.
                    </p>
                  </div>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => setSubmitSuccess(false)}
                      className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(47,111,255,0.3)]"
                    >
                      Send Another Message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono">
                      {errorMsg}
                    </div>
                  )}

                  {/* Category Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                      Topic / Category
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => setCategory(cat.id)}
                            className={`px-3 py-2.5 rounded-lg border text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? "border-primary bg-primary/15 text-primary font-bold shadow-[0_0_12px_rgba(47,111,255,0.2)]"
                                : "border-border bg-background text-muted hover:text-foreground hover:border-border-hover"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                        Your Name <span className="text-muted/60 text-[10px]">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Developer, DAO Lead..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono text-foreground placeholder:text-muted/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                        Email Address <span className="text-primary">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        disabled={isSubmitting}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono text-foreground placeholder:text-muted/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                      Your Message or Feedback <span className="text-primary">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      disabled={isSubmitting}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your feedback, feature request, partnership details, or issue here..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono text-foreground placeholder:text-muted/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-mono font-semibold text-xs tracking-wider uppercase transition-all shadow-[0_0_24px_rgba(47,111,255,0.3)] hover:shadow-[0_0_30px_rgba(47,111,255,0.5)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Sending to devsynarc@gmail.com...</span>
                    ) : (
                      <>
                        <span>Submit Message</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </GlassCard>
          </div>

          {/* Right Information & Direct Channels (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Direct Email Card */}
            <div className="p-6 rounded-2xl border border-border bg-surface/90 backdrop-blur-xl shadow-lg space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono text-sm font-bold text-foreground">
                    Direct Email Contact
                  </h3>
                  <p className="text-xs text-muted">
                    Official inbox for developers & community
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-background flex items-center justify-between gap-3">
                <a
                  href="mailto:devsynarc@gmail.com"
                  className="font-mono text-xs sm:text-sm font-semibold text-primary hover:underline truncate"
                >
                  devsynarc@gmail.com
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-muted hover:text-foreground transition-colors cursor-pointer shrink-0"
                  title="Copy email address"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <p className="text-xs text-muted leading-relaxed">
                You can write to us directly from your preferred email client anytime. We read every email sent to this inbox.
              </p>
            </div>

            {/* SLA & Security Trust Card */}
            <div className="p-6 rounded-2xl border border-border bg-surface/90 backdrop-blur-xl shadow-lg space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono text-sm font-bold text-foreground">
                    Developer & Security SLA
                  </h3>
                  <p className="text-xs text-muted">Arc Ecosystem Protocol Response</p>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs font-mono text-muted">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>General feedback reviewed in 24 hours</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Integration inquiries prioritized</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Security disclosures handled confidentially</span>
                </li>
              </ul>
            </div>

            {/* Social & Community Card */}
            <div className="p-6 rounded-2xl border border-border bg-surface/90 backdrop-blur-xl shadow-lg space-y-4">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                Community Channels
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href="https://x.com/syndaopro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-border bg-background hover:border-primary/40 text-muted hover:text-foreground text-xs font-mono flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-primary" />
                    <span>Twitter / X</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-muted" />
                </a>

                <a
                  href="https://github.com/kellycryptos/SynArc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-border bg-background hover:border-primary/40 text-muted hover:text-foreground text-xs font-mono flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-primary" />
                    <span>GitHub</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-muted" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
