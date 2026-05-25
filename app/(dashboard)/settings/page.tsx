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
import { useTheme } from "next-themes";
import { ethers, JsonRpcProvider, Contract, formatUnits } from "ethers";

export default function SettingsPage() {
  const { walletAddress, isAuthenticated } = useAuth();
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
      const rpcUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network";
      let provider;
      try {
        provider = new JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
        await provider.getNetwork();
      } catch {
        provider = new JsonRpcProvider("https://arc-testnet.drpc.org", undefined, { staticNetwork: true });
      }

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
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
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
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">SynArcToken Voting Power</p>
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
          <GlassCard className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 border-b border-border-thin pb-4 mb-4">
                {theme === "light" ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-primary" />}
                <h3 className="font-bold text-lg text-white">Theme Mode</h3>
              </div>
              <p className="text-sm text-muted mb-6">
                Toggle between premium Dark/Light visual presentation preferences.
              </p>
            </div>
            <div className="flex items-center justify-between bg-surface-elevated p-2.5 rounded-xl border border-border-thin">
              <span className="text-sm font-semibold text-white capitalize">{theme || "dark"} Mode</span>
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-primary hover:bg-primary/90 text-white shadow-lg transition-all cursor-pointer"
              >
                Switch to {theme === "light" ? "Dark" : "Light"}
              </button>
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
              
              {emailAlerts && (
                <input 
                  type="email"
                  placeholder="Enter email address..."
                  value={emailInput}
                  onChange={handleEmailChange}
                  className="w-full px-3 py-2 mb-4 bg-surface border border-border-thin rounded-lg text-sm text-white placeholder:text-muted focus:border-primary outline-none"
                />
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Email Notifications</span>
              <button
                onClick={handleToggleNotifications}
                className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${emailAlerts ? "bg-primary" : "bg-surface-elevated"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 ${emailAlerts ? "translate-x-6" : "translate-x-0"}`} />
              </button>
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
            
            <div className="space-y-3">
              {[
                { name: "SynArc Governor", address: GOVERNANCE_CONTRACTS.governor, id: "gov" },
                { name: "SynArc Treasury", address: GOVERNANCE_CONTRACTS.treasury, id: "treasury" },
                { name: "SynArcToken (Voting Power)", address: GOVERNANCE_CONTRACTS.token, id: "token" },
              ].map((contract) => (
                <div key={contract.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-surface-elevated rounded-xl border border-border-thin">
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">{contract.name}</p>
                    <span className="font-mono text-sm text-white">{contract.address}</span>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => copyToClipboard(contract.address, contract.id)}
                      className="p-2 bg-surface hover:bg-surface-elevated rounded-lg border border-border-thin text-muted hover:text-white transition-colors cursor-pointer"
                      title="Copy Address"
                    >
                      {copiedContract === contract.id ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a
                      href={`https://explorer.testnet.arc.network/address/${contract.address}`}
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
          </div>
        </GlassCard>

      </div>
    </div>
  );
}
