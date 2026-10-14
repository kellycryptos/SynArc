"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  HelpCircle,
  Briefcase,
  Bug,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
export interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
}

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
  { id: "Feedback", label: "Feedback & Ideas", icon: Sparkles },
  { id: "Support", label: "Help & Support", icon: HelpCircle },
  { id: "Partnership", label: "DAO Partnership", icon: Briefcase },
  { id: "Bug Report", label: "Bug Report", icon: Bug },
  { id: "Other", label: "General Inquiry", icon: MessageSquare },
];

export function ContactModal({ isOpen, onClose, defaultCategory = "Feedback" }: ContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync default category if changed
  useEffect(() => {
    if (defaultCategory) setCategory(defaultCategory);
  }, [defaultCategory]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

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
        throw new Error(data.error || "Failed to send message. Please try again.");
      }

      setSubmitSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to deliver message. You can email us directly at devsynarc@gmail.com.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitSuccess(false);
    setErrorMsg(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
            onClick={() => {
              if (!isSubmitting) onClose();
            }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="modal-content relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface-elevated/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-foreground flex flex-col overflow-hidden max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Accent Glow */}
            <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-primary/10 blur-[70px] pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-60 h-60 rounded-full bg-accent-purple/10 blur-[70px] pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-start justify-between pb-4 border-b border-border">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-[11px] font-mono text-primary font-medium">
                  <Mail className="w-3 h-3" />
                  <span>Direct Communication</span>
                </div>
                <h3 className="font-mono text-xl font-bold tracking-tight text-foreground">
                  Contact & Feedback
                </h3>
                <p className="text-xs text-muted">
                  Send updates, feature requests, or queries to{" "}
                  <code className="text-primary font-mono font-semibold">devsynarc@gmail.com</code>
                </p>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="p-1.5 rounded-lg border border-border bg-surface text-muted hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
                aria-label="Close contact modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="relative z-10 flex-1 overflow-y-auto py-5 space-y-5 pr-0.5">
              {submitSuccess ? (
                /* Success View */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-6 space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_24px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-mono text-lg font-bold text-foreground">
                      Message Dispatched!
                    </h4>
                    <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                      Your message has been sent to{" "}
                      <strong className="text-foreground">devsynarc@gmail.com</strong>. Our core contributors will review your feedback and get back to you shortly.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(47,111,255,0.3)]"
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border bg-surface hover:border-primary/40 text-muted hover:text-foreground font-mono text-xs transition-colors cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Contact Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p>{errorMsg}</p>
                        <a
                          href="mailto:devsynarc@gmail.com"
                          className="inline-flex items-center gap-1 text-primary hover:underline mt-1"
                        >
                          Email directly at devsynarc@gmail.com
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Category Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
                      Topic / Category
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => setCategory(cat.id)}
                            className={`px-3 py-2 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? "border-primary bg-primary/15 text-primary font-bold shadow-[0_0_12px_rgba(47,111,255,0.2)]"
                                : "border-border bg-surface text-muted hover:text-foreground hover:border-border-hover"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Name (Optional) & Email (Required) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
                        Name <span className="text-muted/60 text-[10px]">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex, DAO Builder..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono text-foreground placeholder:text-muted/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
                        Your Email <span className="text-primary">*</span>
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

                  {/* Message Field */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
                      Your Message or Feedback <span className="text-primary">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      disabled={isSubmitting}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share your thoughts, feature requests, partnership details, or feedback with us..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono text-foreground placeholder:text-muted/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-mono font-semibold text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(47,111,255,0.25)] hover:shadow-[0_0_26px_rgba(47,111,255,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Sending to devsynarc@gmail.com...</span>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Quick Actions Footer Bar */}
            <div className="relative z-10 pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs font-mono text-muted">
              <div className="flex items-center gap-2">
                <span>Or email directly:</span>
                <a
                  href="mailto:devsynarc@gmail.com"
                  className="text-foreground hover:text-primary transition-colors font-medium underline underline-offset-2"
                >
                  devsynarc@gmail.com
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  title="Copy email address"
                  className="p-1 rounded hover:bg-surface text-muted hover:text-primary transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="text-[11px] text-muted flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Monitored by core contributors</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
