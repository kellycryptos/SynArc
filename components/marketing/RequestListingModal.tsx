"use client";

import { useState } from "react";
import { X, Send, CheckCircle2, Award } from "lucide-react";

interface RequestListingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestListingModal({ isOpen, onClose }: RequestListingModalProps) {
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

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.daoName || !formData.wallet) {
      setErrorMsg("Please fill out DAO Name and Contact Wallet Address.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "dao_listing_application",
          daoName: formData.daoName,
          description: formData.description,
          website: formData.website,
          twitter: formData.twitter,
          walletAddress: formData.wallet,
          message: formData.message,
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitSuccess(true);
      } else {
        setErrorMsg(data.error || "Failed to submit application. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl border border-primary/20 bg-background/95 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-surface hover:bg-surface-elevated text-muted hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-heading text-text-primary">Request DAO Listing</h3>
            <p className="text-xs text-muted">Join the SynArc Creator DAO Directory & Nanopayment Protocol</p>
          </div>
        </div>

        {submitSuccess ? (
          <div className="p-6 text-center space-y-4 rounded-xl bg-success/10 border border-success/20">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-white">Application Received!</h4>
            <p className="text-xs text-muted leading-relaxed">
              Our ecosystem team will review your project details and verify your wallet address. Expect updates via Twitter or Telegram.
            </p>
            <button
              onClick={() => {
                setSubmitSuccess(null);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-success text-white font-bold text-xs hover:bg-success/90 transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase">DAO / Project Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  name="daoName"
                  required
                  disabled={submitting}
                  placeholder="e.g. Arc Protocol DAO"
                  value={formData.daoName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase">Website URL</label>
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
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted uppercase">Short Description</label>
              <input
                type="text"
                name="description"
                disabled={submitting}
                placeholder="What is your DAO's mission or product?"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase">Twitter / X</label>
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
            </div>

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
    </div>
  );
}
