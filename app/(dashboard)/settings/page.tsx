"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
  Shield, 
  Bell, 
  AlertCircle, 
  RefreshCw, 
  Wallet, 
  Moon, 
  Sun, 
  CheckCircle, 
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { GOVERNANCE_CONTRACTS, ERC20ABI } from "@/lib/governance/contracts";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { useArcNetwork } from "@/hooks/auth/useArcNetwork";
import { useSwitchArcNetwork } from "@/hooks/useSwitchArcNetwork";
import { useTheme } from "@/providers/ThemeProvider";
import { Contract, formatUnits } from "ethers";
import { getResilientProvider } from "@/lib/rpc/config";

export default function SettingsPage() {
  const { walletAddress, isAuthenticated, isCircle } = useAuth();
  const { balance: usdcBalance, isLoading: usdcLoading } = useUSDCBalance();
  const { isArcTestnet, isUnsupported } = useArcNetwork();
  const { switchToArc, isSwitching } = useSwitchArcNetwork();
  const { theme, setTheme } = useTheme();
  
  const [tokenBalance, setTokenBalance] = useState<string>("0.00");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [copiedContract, setCopiedContract] = useState<string | null>(null);

  // Local storage for Notification preference
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const savedEmailPref = localStorage.getItem("synarc_email_alerts");
    if (savedEmailPref !== null) {
      setEmailAlerts(savedEmailPref === "true");
    }
    const savedEmail = localStorage.getItem("synarc_email_address");
    if (savedEmail) {
      setEmailInput(savedEmail);
    }
  }, []);

  // Fetch token balance (voting power) on-chain
  const fetchTokenBalance = async () => {
    if (!walletAddress) return;
    try {
      setTokenLoading(true);
      const provider = await getResilientProvider();

      const tokenAddress = GOVERNANCE_CONTRACTS.token;
      const tokenContract = new Contract(tokenAddress, ERC20ABI, provider);
      const bal = await tokenContract.balanceOf(walletAddress);
      setTokenBalance(parseFloat(formatUnits(bal, 18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    } catch (err) {
      console.error("Failed to load sARC balance for settings", err);
    } finally {
      setTokenLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchTokenBalance();
    }
  }, [walletAddress]);

  const handleToggleNotifications = () => {
    const newVal = !emailAlerts;
    setEmailAlerts(newVal);
    localStorage.setItem("synarc_email_alerts", String(newVal));
  };

  const handleSubscribe = async () => {
    if (!emailInput) return;
    setSubscribeLoading(true);
    setSubscribeError(null);
    try {
      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: emailInput, 
          walletAddress: walletAddress 
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubscribed(true);
      } else {
        setSubscribeError(data.error || "Failed to subscribe. Try again.");
      }
    } catch (err) {
      console.error(err);
      setSubscribeError("Failed to subscribe. Try again.");
    } finally {
      setSubscribeLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailInput(e.target.value);
    localStorage.setItem("synarc_email_address", e.target.value);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContract(id);
    setTimeout(() => setCopiedContract(null), 2000);
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">Settings</h1>
          <p className="text-muted mt-1">Manage connected wallet, network status, theme preferences, and configurations.</p>
        </div>

        {/* Wallet & Connection Status */}
        <GlassCard className="p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-border-thin pb-4">
            <Wallet className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg text-white">Connected Wallet Info</h3>
          </div>

          {!isAuthenticated ? (
            <div className="text-center py-6 text-muted">
              Please connect your wallet to view connection status and balances.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">Connected Address</p>
                <div className="flex items-center gap-2 font-mono text-sm text-white bg-surface-elevated px-3 py-2.5 rounded-lg border border-border-thin">
                  <span className="truncate flex-1">{walletAddress}</span>
                  <button 
                    onClick={() => copyToClipboard(walletAddress || "", "wallet")}
                    className="p-1 text-muted hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedContract === "wallet" ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">Network Status</p>
                <div className="flex items-center justify-between bg-surface-elevated px-3 py-2 rounded-lg border border-border-thin min-h-[46px]">
                  {isArcTestnet && !isUnsupported ? (
                    <div className="flex items-center gap-2 text-success font-semibold text-sm">
                      <CheckCircle className="w-4 h-4 text-success animate-pulse" />
                      <span>Arc Testnet ✅</span>
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-danger font-semibold text-sm">
                        <AlertCircle className="w-4 h-4 text-danger" />
                        <span>Wrong Network</span>
                      </div>
                      <button
                        onClick={switchToArc}
                        disabled={isSwitching}
                        className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-background font-bold text-xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                      >
                        {isSwitching ? "Switching..." : "Switch to Arc"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">USDC Balance</p>
                <div className="font-semibold font-mono text-base text-white bg-surface-elevated px-3 py-2.5 rounded-lg border border-border-thin">
                  {usdcLoading ? "Loading..." : `${parseFloat(usdcBalance || "0.0").toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC`}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">sARC TOKEN (VOTING POWER)</p>
                <div className="font-semibold font-mono text-base text-white bg-surface-elevated px-3 py-2.5 rounded-lg border border-border-thin flex justify-between items-center">
                  <span>{tokenLoading ? "Loading..." : `${tokenBalance} sARC`}</span>
                  <button 
                    onClick={fetchTokenBalance}
                    className="p-1 text-muted hover:text-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Preferences Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Theme Preference Toggle */}
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h3 className="font-extrabold text-lg text-white">Appearance</h3>
                <p className="text-sm text-muted">Choose your preferred theme</p>
              </div>
              <div className="flex gap-2 bg-surface-elevated p-1.5 rounded-xl border border-border-thin">
                <button 
                  onClick={() => setTheme('dark')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    theme === 'dark' 
                      ? 'bg-accent-purple text-white-keep shadow-md' 
                      : 'text-muted hover:text-white hover:bg-white/5'
                  }`}
                >
                  🌙 Dark
                </button>
                <button 
                  onClick={() => setTheme('light')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    theme === 'light' 
                      ? 'bg-accent-purple text-white-keep shadow-md' 
                      : 'text-muted hover:text-white hover:bg-white/5'
                  }`}
                >
                  ☀️ Light
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Email Notification Toggle */}
          <GlassCard className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 border-b border-border-thin pb-4 mb-4">
                <Bell className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-lg text-white">Notification Alerts</h3>
              </div>
              <p className="text-sm text-muted mb-4">
                Receive instant email alerts whenever new governance proposals are submitted.
              </p>
              
              {subscribeError && (
                <div className="p-3 mb-4 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger">
                  {subscribeError}
                </div>
              )}

              {subscribed ? (
                <p className="text-sm text-success font-semibold flex items-center gap-1.5 py-2">
                  ✅ Subscribed! Check your email for confirmation.
                </p>
              ) : (
                <div className="space-y-4">
                  <input 
                    type="email"
                    placeholder="Enter your email"
                    value={emailInput}
                    onChange={handleEmailChange}
                    disabled={subscribeLoading}
                    className="w-full px-4 py-2.5 bg-surface border border-border-thin rounded-xl text-sm text-white placeholder:text-text-tertiary focus:border-primary outline-none transition-colors"
                  />
                  <button 
                    onClick={handleSubscribe}
                    disabled={subscribeLoading || !emailInput}
                    className="w-full py-2.5 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white-keep font-bold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(124,58,237,0.15)] flex items-center justify-center gap-2"
                  >
                    {subscribeLoading ? 'Subscribing...' : 'Enable Notifications'}
                  </button>
                </div>
              )}
            </div>
          </GlassCard>
        </div>



        {/* Smart Contracts Transparency Block */}
        <GlassCard className="p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-border-thin pb-4">
            <Shield className="w-5 h-5 text-accent" />
            <h3 className="font-bold text-lg text-white">Transparency Contract Addresses</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-muted">
              For security auditing and audit tracking, correct deployments can be inspected on the explorer.
            </p>
            
            <div className="grid grid-cols-1 gap-3">
              {[
                { name: "SynArc Governor", address: process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS || "0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e", id: "gov" },
                { name: "SynArc Treasury", address: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || "0xFE0F6bF45D363d34CD5fC1781594a7471736dC18", id: "treasury" },
                { name: "sARC Token (Voting Power)", address: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e", id: "token" },
                { name: "EURC Token", address: process.env.NEXT_PUBLIC_EURC_CONTRACT_ADDRESS || "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a", id: "eurc" },
                { name: "SynArc Treasury Agent", address: process.env.NEXT_PUBLIC_AGENT_ADDRESS || "0x88BdF819466C1802ce6C780a9fbdF3A314cab07D", id: "agent" },
                { name: "ERC-8004 Identity Registry", address: "0x8004A818BFB912233c491871b3d84c89A494BD9e", id: "registry" },
              ].map((contract) => (
                <div key={contract.id} className="flex items-center justify-between gap-3 p-4 bg-surface-elevated rounded-xl border border-border-thin w-full">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">{contract.name}</p>
                    <span className="font-mono text-xs sm:text-sm text-white block truncate" title={contract.address}>
                      {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => copyToClipboard(contract.address, contract.id)}
                      className="p-2 bg-surface hover:bg-surface-elevated rounded-lg border border-border-thin text-muted hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                      title="Copy Address"
                    >
                      {copiedContract === contract.id ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a
                      href={`https://testnet.arcscan.app/address/${contract.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-surface hover:bg-surface-elevated rounded-lg border border-border-thin text-muted hover:text-white transition-colors flex items-center justify-center"
                      title="Inspect on Explorer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Network Info Footer */}
            <div className="mt-6 pt-4 border-t border-border-thin grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-text-tertiary block font-semibold uppercase tracking-wider text-[10px]">Network</span>
                <span className="text-white font-medium">Arc Testnet</span>
              </div>
              <div className="space-y-1">
                <span className="text-text-tertiary block font-semibold uppercase tracking-wider text-[10px]">Chain ID</span>
                <span className="text-white font-medium">5042002</span>
              </div>

              <div className="space-y-1 col-span-2">
                <span className="text-text-tertiary block font-semibold uppercase tracking-wider text-[10px]">Block Explorer</span>
                <a 
                  href="https://testnet.arcscan.app" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline font-medium flex items-center gap-1"
                >
                  testnet.arcscan.app
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </GlassCard>


    </div>
  );
}
