"use client";

import { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
  BookOpen, 
  Search, 
  Wallet, 
  Shield, 
  ChevronRight, 
  HelpCircle, 
  Compass, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronDown,
  Globe,
  Milestone,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { MarketingNavbar } from "@/components/navbar/MarketingNavbar";
import { Footer } from "@/components/layout/Footer";

interface DocSection {
  id: string;
  title: string;
  icon: any;
  subsections: {
    id: string;
    title: string;
    content: React.ReactNode;
  }[];
}

export default function DocsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState("getting-started");
  const [copiedContract, setCopiedContract] = useState<string | null>(null);
  const [expandedFaqs, setExpandedFaqs] = useState<Record<string, boolean>>({});

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleFaq = (faqId: string) => {
    setExpandedFaqs(prev => ({ ...prev, [faqId]: !prev[faqId] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContract(id);
    setTimeout(() => setCopiedContract(null), 2000);
  };

  const handleScrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = sectionRefs.current[sectionId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // ScrollSpy logic to detect active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      
      for (const sectionId of ["getting-started", "governance", "treasury", "roadmap", "contracts", "faq"]) {
        const ref = sectionRefs.current[sectionId];
        if (ref) {
          const offsetTop = ref.offsetTop;
          const offsetHeight = ref.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const docSections: DocSection[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Compass,
      subsections: [
        {
          id: "what-is-synarc",
          title: "What is SynArc?",
          content: (
            <div className="space-y-4">
              <p className="text-muted leading-relaxed">
                SynArc is a decentralized governance and treasury management platform built directly on the Arc Testnet (Chain ID: <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded font-mono text-white">5042002</code>). It allows decentralized organizations, capital managers, and autonomous AI agents to vote, delegate, and manage multi-token stablecoin treasuries securely and trustlessly.
              </p>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Ecosystem Purpose</h4>
                  <p className="text-xs text-muted mt-1">
                    By combining secure OpenZeppelin Governor frameworks, timelocked vaults, and multi-asset reserves, SynArc provides robust administrative security for digital assets.
                  </p>
                </div>
              </div>
            </div>
          )
        },
        {
          id: "how-to-connect-wallet",
          title: "How to Connect Your Wallet",
          content: (
            <div className="space-y-4">
              <p className="text-muted leading-relaxed">
                SynArc leverages Privy authentication to enable frictionless onboarding. You do not need a pre-configured Web3 wallet like MetaMask to participate.
              </p>
              <ul className="list-disc pl-5 text-muted space-y-2">
                <li>Click the <strong>Connect Wallet</strong> button in the page header or sidebar.</li>
                <li>Sign in using your <strong>Google account</strong>, <strong>Twitter / X</strong>, <strong>Discord</strong>, or standard <strong>Email</strong>.</li>
                <li>Alternatively, click <strong>Detect Wallets</strong> to connect external hardware or browser extension accounts like MetaMask or Coinbase Wallet.</li>
                <li>Once connected, Privy automatically provisions a secure, non-custodial embedded wallet key secured directly via your device hardware.</li>
              </ul>
            </div>
          )
        },
        {
          id: "how-to-switch-to-arc",
          title: "How to Switch to Arc Testnet",
          content: (
            <div className="space-y-4">
              <p className="text-muted leading-relaxed">
                SynArc requires your connected wallet to be configured for Arc Testnet to query balances and execute contract operations.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-elevated border border-border-thin space-y-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Method 1: Automatic</span>
                  <p className="text-xs text-muted">
                    If you are on another network, SynArc will display a <strong>Switch to Arc</strong> banner on your settings page. Simply click this banner to automatically authorize a network switch in your wallet.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-surface-elevated border border-border-thin space-y-2">
                  <span className="text-xs font-semibold text-accent uppercase tracking-wider">Method 2: Manual Parameters</span>
                  <p className="text-xs text-muted">
                    Add the custom network configuration manually in your wallet:
                  </p>
                  <ul className="text-[10px] text-muted space-y-1 font-mono">
                    <li>• Chain ID: 5042002</li>
                    <li>• RPC URL: https://rpc.testnet.arc.network</li>
                    <li>• Currency: USDC</li>
                  </ul>
                </div>
              </div>
            </div>
          )
        },
        {
          id: "how-to-get-usdc",
          title: "How to Get USDC on Arc Testnet",
          content: (
            <div className="space-y-4">
              <p className="text-muted leading-relaxed">
                Arc is a stablecoin-native network where transaction gas fees are denominated directly in stablecoins like USDC. To interact with contracts, you require testnet USDC:
              </p>
              <ul className="list-decimal pl-5 text-muted space-y-2">
                <li>Make sure you have the <strong>Canteen ARC CLI</strong> installed by running <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded font-mono text-white">uv tool install git+https://github.com/the-canteen-dev/ARC-cli</code>.</li>
                <li>Retrieve a developer faucet allotment in your terminal using <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded font-mono text-white">arc-canteen rpc-url</code> or the official Canteen platform developer portal.</li>
                <li>Use the faucet link inside the developer dashboard to mint mock testnet USDC directly to your connected wallet address.</li>
              </ul>
            </div>
          )
        }
      ]
    },
    {
      id: "governance",
      title: "Governance",
      icon: BookOpen,
      subsections: [
        {
          id: "how-proposals-work",
          title: "How Proposals Work",
          content: (
            <div className="space-y-4">
              <p className="text-muted leading-relaxed">
                SynArc utilizes an on-chain, decentralized lifecycle modeled after the standard OpenZeppelin Governor contract.
              </p>
              <div className="relative border-l border-primary/20 pl-6 ml-3 space-y-6 text-sm">
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_6px_rgba(124,58,237,0.8)]" />
                  <h4 className="font-semibold text-white">1. Submission & Pending State</h4>
                  <p className="text-xs text-muted mt-1">
                    A proposal is submitted with executable transactions. It enters a <strong>Pending</strong> delay allowing delegates to adjust voting weight snapshots.
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_6px_rgba(236,72,153,0.8)]" />
                  <h4 className="font-semibold text-white">2. Active Voting Phase</h4>
                  <p className="text-xs text-muted mt-1">
                    The proposal enters the <strong>Active</strong> voting window. Members cast votes (For, Against, Abstain) signed cryptographically via their wallets.
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                  <h4 className="font-semibold text-white">3. Resolution & Timelock Controller</h4>
                  <p className="text-xs text-muted mt-1">
                    If voting requirements and the 4% Quorum are met, the proposal enters the <strong>Timelock Controller</strong> buffer to prevent immediate execution surprises.
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-white/50" />
                  <h4 className="font-semibold text-white">4. On-Chain Execution</h4>
                  <p className="text-xs text-muted mt-1">
                    Once the timelock expires, anyone can execute the proposal transactions, triggering on-chain transfers or changing system properties.
                  </p>
                </div>
              </div>
            </div>
          )
        },
        {
          id: "how-to-create-proposal",
          title: "How to Create a Proposal",
          content: (
            <div className="space-y-4">
              <p className="text-muted leading-relaxed">
                If your voting power meets or exceeds the proposal threshold, you can author a proposal:
              </p>
              <ul className="list-disc pl-5 text-muted space-y-2">
                <li>Navigate to the <strong>Proposals</strong> tab and click <strong>New Proposal</strong>.</li>
                <li>Fill in the <strong>Title</strong>, <strong>Description</strong>, <strong>Category</strong>, and <strong>Execution Duration</strong> parameters.</li>
                <li>Under <strong>Treasury Impact</strong>, define the disbursement value in USDC, and assign the destination <strong>Target EVM address</strong>.</li>
                <li>Confirm the transaction inside your Privy embedded wallet. Once mined, your proposal enters the <strong>Pending</strong> phase.</li>
              </ul>
            </div>
          )
        },
        {
          id: "how-to-vote",
          title: "How to Vote",
          content: (
            <div className="space-y-4">
              <p className="text-muted leading-relaxed">
                Active proposals can be voted on by any member with a balance greater than 0 sARC at the snapshot block:
              </p>
              <ul className="list-disc pl-5 text-muted space-y-2">
                <li>Select any proposal currently marked as <strong>Active</strong> from the Proposals grid.</li>
                <li>Select <strong>For</strong>, <strong>Against</strong>, or <strong>Abstain</strong> on the voting module card.</li>
                <li>Optional: Add a text reason detailing your voting rationale.</li>
                <li>Author the signature inside your wallet to submit your vote on-chain.</li>
              </ul>
            </div>
          )
        },
        {
          id: "proposal-states",
          title: "Proposal States Explained",
          content: (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: "Pending", desc: "Proposal has been submitted but voting snapshot has not been finalized yet. Users can delegate weight.", color: "border-primary/20 text-primary-glow bg-primary/5" },
                { name: "Active", desc: "Voting is actively open. Users can record cryptographic signatures on-chain to support or oppose.", color: "border-accent/20 text-accent bg-accent/5" },
                { name: "Executed", desc: "The proposal has passed quorum, satisfied timelock delays, and has been successfully executed on-chain.", color: "border-success/20 text-success bg-success/5" },
                { name: "Defeated", desc: "The voting window has closed but the proposal failed to meet quorum or received majority Against votes.", color: "border-danger/20 text-danger bg-danger/5" },
              ].map((state) => (
                <div key={state.name} className={`p-4 rounded-xl border ${state.color} space-y-2`}>
                  <h4 className="font-bold text-sm">{state.name}</h4>
                  <p className="text-xs text-muted leading-relaxed">{state.desc}</p>
                </div>
              ))}
            </div>
          )
        },
        {
          id: "voting-power",
          title: "Voting Power: USDC + SynArcToken",
          content: (
            <div className="space-y-4">
              <p className="text-muted leading-relaxed">
                Voting weight in the SynArc DAO ecosystem is governed by two complementary tokens:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-elevated border border-border-thin space-y-2">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    SynArcToken (sARC)
                  </h4>
                  <p className="text-xs text-muted leading-relaxed">
                    The core governance asset. 1 sARC corresponds to 1 raw vote. sARC tokens are fully delegatable and record check-pointed balance history on-chain to prevent double-voting.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-surface-elevated border border-border-thin space-y-2">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-arc-blue" />
                    USDC Balance Weight
                  </h4>
                  <p className="text-xs text-muted leading-relaxed">
                    To align capital with operations, SynArc utilizes USDC balances to calculate dynamic delegation multipliers, reinforcing stable, institutional-grade decision metrics.
                  </p>
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "treasury",
      title: "Treasury",
      icon: Shield,
      subsections: [
        {
          id: "how-treasury-works",
          title: "How the Treasury Works",
          content: (
            <div className="space-y-4">
              <p className="text-muted leading-relaxed">
                The SynArc Treasury is a fully on-chain multi-asset vault managed strictly by smart contracts. The treasury can hold multiple stablecoin assets (USDC and EURC), allowing the DAO to operate across major regional reserve currencies.
              </p>
              <p className="text-muted leading-relaxed">
                All capital inflows, allocations, and outflows are tracked inside the immutable ledger, precluding single-point-of-failure vulnerabilities like manual multi-sig overrides.
              </p>
            </div>
          )
        },
        {
          id: "how-to-deposit-usdc",
          title: "How to Deposit USDC",
          content: (
            <div className="space-y-4">
              <p className="text-muted leading-relaxed">
                To fund the DAO operating runway, members can deposit USDC directly using the frontend:
              </p>
              <ul className="list-disc pl-5 text-muted space-y-2">
                <li>Navigate to the <strong>Treasury</strong> page in the sidebar.</li>
                <li>Locate the <strong>Deposit Portal</strong> on the right side of the dashboard.</li>
                <li>Ensure the <strong>USDC</strong> tab is selected.</li>
                <li>Enter the deposit amount or click <strong>MAX</strong> to fetch your current wallet balance.</li>
                <li>Click <strong>Deposit USDC</strong> and authorize the ERC20 approval and deposit transactions inside your Privy wallet.</li>
              </ul>
            </div>
          )
        },
        {
          id: "how-to-deposit-eurc",
          title: "How to Deposit EURC",
          content: (
            <div className="space-y-4">
              <p className="text-muted leading-relaxed">
                In addition to USDC, SynArc natively supports EURC stablecoin deposits:
              </p>
              <ul className="list-disc pl-5 text-muted space-y-2">
                <li>Toggle the token selector inside the <strong>Deposit Portal</strong> to <strong>EURC</strong>.</li>
                <li>Input your desired deposit amount in EURC.</li>
                <li>Authorize the approval transaction followed by the deposit transaction.</li>
                <li>Once validated, your EURC will populate the treasury reserves separately, with the frontend converting its value dynamically to USD (converting EURC at a 1.08 exchange rate) for portfolio mapping.</li>
              </ul>
            </div>
          )
        },
        {
          id: "how-treasury-funds-released",
          title: "How Funds are Released via Governance",
          content: (
            <div className="space-y-4">
              <p className="text-muted leading-relaxed">
                SynArc has no admin keys. No founder, member, or developer can withdraw assets manually. Release of funds is automated:
              </p>
              <div className="p-4 rounded-xl bg-danger/5 border border-danger/10 space-y-2">
                <span className="text-xs font-semibold text-danger uppercase tracking-wider">Automated Smart Contract Flow</span>
                <p className="text-xs text-muted leading-relaxed">
                  When a proposal requesting treasury capital successfully passes, the executable target inside the proposal represents a call to the treasury. Once the execution transaction is submitted on-chain, the Governor contract calls the <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded font-mono text-white">execute</code> wrapper, releasing the approved tokens directly to the proposal target address.
                </p>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "roadmap",
      title: "Mainnet Roadmap",
      icon: Milestone,
      subsections: [
        {
          id: "full-mainnet-roadmap",
          title: "SynArc Mainnet Roadmap",
          content: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Circle Programmable Wallets", desc: "Onboard with email, zero gas fees. Complete gas abstraction and secure client-side key storage.", icon: Wallet },
                { title: "Multi-sig treasury execution", desc: "Establish multi-key timelocked buffers for high-value dispersals, removing single point of failure vectors.", icon: Shield },
                { title: "On-chain vote delegation", desc: "Delegate voting power trustlessly and instantly to subject matter experts in the DAO without moving tokens.", icon: BookOpen },
                { title: "Proposal timelock", desc: "Enforce safety delays before governance execution, allowing members to inspect outcome actions.", icon: Compass },
                { title: "Cross-chain governance", desc: "Vote from any chain, govern on Arc. Bridge governance parameters smoothly across EVM layers.", icon: Globe },
                { title: "EURC + USDC treasury", desc: "Dual stablecoin support. Maintain diversified reserves across major global stable currencies.", icon: Wallet },
                { title: "Mobile app", desc: "iOS and Android apps with secure social logins, push notifications for active voting sessions, and alerts.", icon: Milestone },
                { title: "One-click DAO creation", desc: "Deploy your customized DAO governance infrastructure and token sets on Arc in minutes with our Factory contract.", icon: CheckCircle2 },
                { title: "KYC-gated tiers", desc: "Introduce zero-knowledge compliance verification layers for institutional capital pools and gated DAOs.", icon: Shield }
              ].map((milestone, idx) => {
                const Icon = milestone.icon;
                return (
                  <div key={idx} className="p-5 rounded-2xl bg-surface-elevated border border-border-thin hover:border-primary/30 transition-all duration-300 flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Phase 0{idx + 1}</span>
                        <span className="px-1.5 py-0.5 rounded bg-primary/15 text-[8px] font-extrabold uppercase text-purple-300 tracking-wider">Planned</span>
                      </div>
                      <h4 className="font-bold text-white text-sm">{milestone.title}</h4>
                      <p className="text-xs text-muted leading-relaxed">{milestone.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      ]
    },
    {
      id: "contracts",
      title: "Smart Contracts",
      icon: Shield,
      subsections: [
        {
          id: "deployed-contracts",
          title: "Deployed Contract Addresses",
          content: (
            <div className="space-y-4">
              <p className="text-muted leading-relaxed">
                SynArc contracts are deployed on the Arc Testnet and can be inspected on the explorer. Use the copy helper to get verified addresses:
              </p>
              
              <div className="space-y-3 font-mono">
                {[
                  { name: "SynArc Governor", address: "0x17D9d585CBB1AF6aa4a3C787116f7ba59651B702", id: "governor" },
                  { name: "SynArc Treasury", address: "0x8Ab21363cB0319548B051f129e477393908be7c1", id: "treasury" },
                  { name: "SynArcToken (Voting Power)", address: "0x637cA7788aBC956832F389A7BB895D5249FE757B", id: "token" },
                  { name: "EURC Token", address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a", id: "eurc" },
                ].map((contract) => (
                  <div key={contract.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-elevated rounded-xl border border-border-thin hover:border-primary/15 transition-all">
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-wider font-sans">{contract.name}</p>
                      <span className="text-xs text-white break-all">{contract.address}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => copyToClipboard(contract.address, contract.id)}
                        className="p-2 rounded-lg bg-surface border border-border-thin text-muted hover:text-white transition-colors cursor-pointer"
                        title="Copy Address"
                      >
                        {copiedContract === contract.id ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <a
                        href={`https://testnet.arcscan.app/address/${contract.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-surface border border-border-thin text-muted hover:text-white transition-colors"
                        title="Inspect on Explorer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-surface-elevated border border-border-thin space-y-3 mt-6">
                <h4 className="font-bold text-white text-sm">Network Configuration</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-muted block font-sans">Network</span>
                    <span className="text-white font-semibold">Arc Testnet</span>
                  </div>
                  <div>
                    <span className="text-muted block font-sans">Chain ID</span>
                    <span className="text-white font-semibold">5042002</span>
                  </div>
                  <div>
                    <span className="text-muted block font-sans">Currency</span>
                    <span className="text-white font-semibold">USDC / EURC</span>
                  </div>
                  <div>
                    <span className="text-muted block font-sans">Block Explorer</span>
                    <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      arcscan.app <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "faq",
      title: "FAQ",
      icon: HelpCircle,
      subsections: [
        {
          id: "faqs",
          title: "Frequently Asked Questions",
          content: (
            <div className="space-y-4">
              {[
                { 
                  q: "What is Arc Testnet?", 
                  a: "Arc is a high-performance EVM-equivalent blockchain tailored for the decentralized stablecoin economy and AI autonomous agent coordination. Transaction fees are denominated natively in USDC." 
                },
                { 
                  q: "What is USDC?", 
                  a: "USDC is a fully reserve-backed digital dollar stablecoin minted by Circle. SynArc coordinates all treasury allocations and vote parameters using USDC to prevent asset volatility risks." 
                },
                { 
                  q: "Is SynArc audited?", 
                  a: "The core smart contracts inherit from battle-tested OpenZeppelin Governor and ERC20 sets. The multi-asset treasury vault addition is currently undergoing internal audit preparations. Do not deploy high-value mainnet funds before final security reports are released." 
                },
                { 
                  q: "How do I report a bug?", 
                  a: "If you detect any issues, file a bug report directly inside our GitHub repository issue tracker, or drop a message to the engineering team in the Discord channel." 
                },
                { 
                  q: "Where can I get help?", 
                  a: "Visit our Discord server for technical support, or browse our internal documentation sections to learn more about the platform's core features." 
                }
              ].map((faq, idx) => {
                const faqId = `faq-${idx}`;
                const isOpen = expandedFaqs[faqId];
                return (
                  <div key={faqId} className="border border-border-thin rounded-xl overflow-hidden bg-surface-elevated transition-all">
                    <button
                      onClick={() => toggleFaq(faqId)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-white hover:bg-surface/50 transition-colors cursor-pointer text-sm"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="px-5 py-4 border-t border-border-thin text-xs text-muted leading-relaxed bg-surface/30">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        }
      ]
    }
  ];

  // Filter sections and subsections based on search term
  const filteredDocSections = docSections.map(section => {
    const matchingSubsections = section.subsections.filter(sub => 
      sub.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      // Basic text search over react node (fallback text comparison where needed)
      sub.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
      ...section,
      subsections: matchingSubsections
    };
  }).filter(section => 
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    section.subsections.length > 0
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f] to-[#07070c]" />
      <div className="absolute inset-0 grid-overlay opacity-25" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Global Navbar */}
      <MarketingNavbar />

      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 pb-20 flex-1 flex flex-col">
        {/* Header Block */}
        <div className="space-y-4 text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary shadow-[0_0_15px_rgba(124,58,237,0.1)]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Developer Reference Docs</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            SynArc Documentation
          </h1>
          <p className="text-base text-muted max-w-lg mx-auto">
            Everything you need to configure your environment, participate in on-chain governance, and deposit stablecoins.
          </p>

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search documentation (e.g. faucet, voting power, contracts)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface-elevated border border-border-thin focus:border-primary rounded-2xl text-sm text-white placeholder:text-muted outline-none transition-all focus:shadow-[0_0_20px_rgba(124,58,237,0.15)]"
            />
          </div>
        </div>

        {/* Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 items-start">
          {/* Left Navigation Sidebar (Sticky) */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-1 self-start">
            <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.15em] font-semibold text-muted/50 select-none">
              Documentation Sections
            </p>
            {docSections.map((sec) => {
              const Icon = sec.icon;
              const active = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => handleScrollToSection(sec.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    active 
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(124,58,237,0.1)]" 
                      : "text-muted hover:text-foreground hover:bg-surface-elevated border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? "text-primary" : "text-muted"}`} />
                  <span>{sec.title}</span>
                  {active && <ChevronRight className="w-4 h-4 ml-auto text-primary" />}
                </button>
              );
            })}
            
            <div className="pt-6 border-t border-border-thin mt-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-glow transition-all"
              >
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3 space-y-12">
            {filteredDocSections.length > 0 ? (
              filteredDocSections.map((section) => (
                <div
                  key={section.id}
                  ref={(el) => {
                    sectionRefs.current[section.id] = el;
                  }}
                  className="scroll-mt-24 space-y-6"
                >
                  <div className="flex items-center gap-3 border-b border-border-thin pb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <section.icon className="w-4.5 h-4.5" />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">{section.title}</h2>
                  </div>

                  <div className="space-y-8">
                    {section.subsections.map((sub) => (
                      <GlassCard key={sub.id} className="p-6 space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {sub.title}
                        </h3>
                        <div>{sub.content}</div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-surface-elevated rounded-2xl border border-border-thin space-y-3">
                <HelpCircle className="w-10 h-10 text-muted mx-auto" />
                <h3 className="font-bold text-white">No documentation matches your search</h3>
                <p className="text-sm text-muted max-w-sm mx-auto">
                  Try searching for terms like &quot;Privy&quot;, &quot;faucet&quot;, &quot;governor&quot;, or &quot;USDC&quot; to find guides.
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
