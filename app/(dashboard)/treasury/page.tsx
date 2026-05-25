"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useTreasury } from "@/hooks/useTreasury";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { useEURCBalance } from "@/hooks/useEURCBalance";
import { useWallets } from "@privy-io/react-auth";
import { ethers, Contract, parseUnits } from "ethers";
import { GOVERNANCE_CONTRACTS, ERC20ABI } from "@/lib/governance/contracts";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend
} from "recharts";
import { 
  ArrowUpRight, ArrowDownRight, Activity, Wallet, Shield, PieChart, Coins, Info, PlusCircle, X, Check
} from "lucide-react";

export default function TreasuryPage() {
  const { 
    balance: combinedTotal, 
    usdcBalance, 
    eurcBalance, 
    activities, 
    loading: treasuryLoading, 
    refetch: refetchTreasury 
  } = useTreasury();

  const { balance: walletUSDC, refetch: refetchWalletUSDC } = useUSDCBalance();
  const { balance: walletEURC, refetch: refetchWalletEURC } = useEURCBalance();
  const { wallets } = useWallets();

  const activeWallet = wallets && wallets.length > 0 ? wallets[0] : null;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<"USDC" | "EURC">("USDC");
  const [depositAmount, setDepositAmount] = useState("");
  const [txStep, setTxStep] = useState<"idle" | "approving" | "depositing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  const currentWalletBalance = useMemo(() => {
    return selectedToken === "USDC" ? walletUSDC || "0.00" : walletEURC || "0.00";
  }, [selectedToken, walletUSDC, walletEURC]);

  // Combined USD Total simulations
  const chartData = useMemo(() => {
    if (!activities.length) {
      return [{ date: "Now", balance: combinedTotal }];
    }
    
    // Sort chronologically
    const sorted = [...activities].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let runningBalance = combinedTotal;
    
    const points = sorted.map(act => {
      const point = {
        date: new Date(act.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        balance: runningBalance,
      };
      
      const factor = act.token === "EURC" ? 1.08 : 1.0;
      if (act.type === 'Inflow') {
        runningBalance -= (act.amount * factor);
      } else if (act.type === 'Outflow') {
        runningBalance += (act.amount * factor);
      }
      
      return point;
    }).reverse();
    
    return [...points, { date: "Current", balance: combinedTotal }];
  }, [activities, combinedTotal]);

  const recentTransactions = activities.slice(0, 10);

  // Asset Composition details
  const usdcValueInUSD = usdcBalance;
  const eurcValueInUSD = eurcBalance * 1.08;
  const totalValueInUSD = usdcValueInUSD + eurcValueInUSD;

  const compositionData = useMemo(() => {
    if (totalValueInUSD === 0) {
      return [
        { name: "USDC", value: 100, color: "#2775CA" },
        { name: "EURC", value: 0, color: "#EC4899" }
      ];
    }
    return [
      { name: "USDC", value: parseFloat(((usdcValueInUSD / totalValueInUSD) * 100).toFixed(1)), color: "#2775CA" },
      { name: "EURC", value: parseFloat(((eurcValueInUSD / totalValueInUSD) * 100).toFixed(1)), color: "#EC4899" }
    ];
  }, [usdcValueInUSD, eurcValueInUSD, totalValueInUSD]);

  const handleMaxClick = () => {
    setDepositAmount(currentWalletBalance);
  };

  const handleDepositSubmit = async () => {
    if (!activeWallet) {
      setErrorMessage("Wallet not connected.");
      setTxStep("error");
      return;
    }
    
    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage("Please enter a valid amount greater than 0.");
      setTxStep("error");
      return;
    }

    try {
      setTxStep("approving");
      setErrorMessage("");

      const privyProvider = await activeWallet.getEthereumProvider();
      const provider = new ethers.BrowserProvider(privyProvider);
      const signer = await provider.getSigner();

      const treasuryAddress = GOVERNANCE_CONTRACTS.treasury;
      const tokenAddress = selectedToken === "USDC" ? GOVERNANCE_CONTRACTS.token : GOVERNANCE_CONTRACTS.eurc;
      const amountWei = parseUnits(depositAmount, 6); // Both USDC and EURC use 6 decimals on testnet

      // 1. Approve contract
      const tokenContract = new Contract(tokenAddress, ERC20ABI, signer);
      console.log(`Approving ${selectedToken}...`);
      const approveTx = await tokenContract.approve(treasuryAddress, amountWei);
      await approveTx.wait();
      console.log(`${selectedToken} Approved!`);

      // 2. Deposit
      setTxStep("depositing");
      const treasuryContract = new Contract(treasuryAddress, [
        "function depositUSDC(uint256 amount) external",
        "function depositEURC(uint256 amount) external"
      ], signer);

      let tx;
      if (selectedToken === "USDC") {
        tx = await treasuryContract.depositUSDC(amountWei);
      } else {
        tx = await treasuryContract.depositEURC(amountWei);
      }

      console.log(`Depositing ${selectedToken} on-chain...`);
      setTxHash(tx.hash);
      await tx.wait();
      console.log("Deposit Success!");
      
      setTxStep("success");
      setDepositAmount("");
      
      // Refresh balances
      refetchTreasury();
      refetchWalletUSDC();
      refetchWalletEURC();
    } catch (err: any) {
      console.error("Deposit transaction failed:", err);
      setErrorMessage(err?.reason || err?.message || "Transaction failed. Please try again.");
      setTxStep("error");
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setTxStep("idle");
    setDepositAmount("");
    setErrorMessage("");
    setTxHash("");
  };

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">DAO Treasury</h1>
            <p className="text-muted mt-1">Multi-asset capital reserves and smart treasury contracts on Arc Testnet.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-semibold text-sm transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4.5 h-4.5" />
              Deposit Assets
            </button>
            
            <div className="bg-surface-elevated border border-border-thin px-4 py-2 rounded-xl flex items-center gap-3 shadow-md shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Combined Total</div>
                <div className="text-lg font-bold font-mono text-white">
                  ${combinedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-[#2775CA]/10 border border-[#2775CA]/20 rounded-xl">
                <Coins className="w-5 h-5 text-[#2775CA]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-surface border border-border-thin text-muted">Stable</span>
            </div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">USDC Balance</p>
            <h3 className="text-2xl font-extrabold text-white mt-2 font-mono">
              {treasuryLoading ? "..." : usdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC
            </h3>
            <p className="text-[11px] text-text-tertiary mt-1 font-mono">${usdcBalance.toLocaleString()} USD</p>
          </GlassCard>

          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-pink-500/10 border border-pink-500/20 rounded-xl">
                <Coins className="w-5 h-5 text-pink-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-surface border border-border-thin text-muted">Stable</span>
            </div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">EURC Balance</p>
            <h3 className="text-2xl font-extrabold text-white mt-2 font-mono">
              {treasuryLoading ? "..." : eurcBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} EURC
            </h3>
            <p className="text-[11px] text-pink-400 mt-1 font-mono">≈ ${(eurcBalance * 1.08).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</p>
          </GlassCard>

          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-success/10 border border-success/20 rounded-xl">
                <Shield className="w-5 h-5 text-success" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-success/10 border border-success/20 text-success">Active</span>
            </div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Emergency Guardian</p>
            <h3 className="text-base font-bold text-white mt-3">
              Deposits Pausable
            </h3>
            <p className="text-[11px] text-text-tertiary mt-1">Multi-signature emergency pause enabled</p>
          </GlassCard>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Growth Chart */}
          <GlassCard className="lg:col-span-2 p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-white mb-6">Treasury Valuation Trend (USD Value)</h3>
            <div className="flex-1 w-full h-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D1B4E" opacity={0.3} vertical={false} />
                  <XAxis dataKey="date" stroke="#9E8CA9" tick={{fill: '#9E8CA9', fontSize: 11}} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9E8CA9" tick={{fill: '#9E8CA9', fontSize: 11}} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} width={45} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#150A2E', borderColor: '#3D2E68', borderRadius: '12px', color: '#FFF' }}
                    formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, "US Valuation"]}
                  />
                  <Area type="monotone" dataKey="balance" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Allocation Composition */}
          <GlassCard className="p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-white mb-6">Asset Composition (USD)</h3>
            <div className="flex-1 w-full min-h-0 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={compositionData}
                    cx="50%"
                    cy="40%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {compositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#150A2E', borderColor: '#3D2E68', borderRadius: '12px', color: '#FFF' }}
                    formatter={(v) => [`${v}%`, "Allocation"]}
                  />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs font-medium text-muted">{value}</span>} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Transactions Table */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-6">Recent Activities</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-thin text-text-tertiary text-xs uppercase tracking-wider">
                  <th className="pb-4 font-bold pl-2">Type</th>
                  <th className="pb-4 font-bold">Description</th>
                  <th className="pb-4 font-bold">Amount</th>
                  <th className="pb-4 font-bold">Date</th>
                  <th className="pb-4 font-bold text-right pr-2">Tx</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((tx, i) => (
                    <tr key={tx.id || i} className="border-b border-border-thin/50 hover:bg-surface-elevated/30 transition-colors">
                      <td className="py-4 pl-2">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold
                          ${tx.type === 'Inflow' ? 'bg-success/10 text-success border border-success/10' : 
                            'bg-danger/10 text-danger border border-danger/10'}
                        `}>
                          {tx.type === 'Inflow' ? <ArrowDownRight className="w-3.5 h-3.5" /> : 
                           <ArrowUpRight className="w-3.5 h-3.5" />}
                          {tx.type}
                        </div>
                      </td>
                      <td className="py-4 text-text-secondary">{tx.description}</td>
                      <td className="py-4 font-mono font-bold text-white">
                        {tx.type === 'Outflow' ? '-' : '+'}
                        {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx.token}
                      </td>
                      <td className="py-4 text-text-tertiary">
                        {new Date(tx.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-4 text-right pr-2">
                        <a 
                          href={`https://explorer.testnet.arc.network/tx/${tx.txHash}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-primary hover:underline font-mono text-xs"
                        >
                          {tx.txHash ? tx.txHash.slice(0,6) + '...' + tx.txHash.slice(-4) : 'Pending...'}
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-tertiary">No recent activities found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

      </div>

      {/* Deposit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={handleModalClose} />
          
          <GlassCard className="w-full max-w-md p-6 relative z-10 animate-fade-in-up border border-border-thin">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border-thin pb-4 mb-6">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg text-white">Deposit to Treasury</h3>
              </div>
              <button 
                onClick={handleModalClose}
                className="p-1.5 text-muted hover:text-white hover:bg-surface-elevated rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Token Selector */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">Select Token</label>
                <div className="grid grid-cols-2 gap-4">
                  {(["USDC", "EURC"] as const).map((token) => (
                    <button
                      key={token}
                      onClick={() => {
                        setSelectedToken(token);
                        setDepositAmount("");
                        setTxStep("idle");
                      }}
                      className={`p-3 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        selectedToken === token
                          ? "bg-primary/10 border-primary text-white shadow-[0_0_15px_rgba(124,58,237,0.12)]"
                          : "bg-surface border-border-thin text-muted hover:text-foreground hover:bg-surface-elevated"
                      }`}
                    >
                      <Coins className={`w-4 h-4 ${token === "USDC" ? "text-[#2775CA]" : "text-pink-400"}`} />
                      {token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Balance display */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Wallet Balance</span>
                <span className="font-semibold text-white font-mono">{parseFloat(currentWalletBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedToken}</span>
              </div>

              {/* Amount input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block">Deposit Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={txStep === "approving" || txStep === "depositing"}
                    className="w-full pl-4 pr-16 py-3 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none transition-colors text-white font-mono text-sm disabled:opacity-50"
                  />
                  <button
                    onClick={handleMaxClick}
                    disabled={txStep === "approving" || txStep === "depositing"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[10px] font-bold uppercase bg-primary/10 border border-primary/20 hover:bg-primary/20 rounded text-primary transition-colors cursor-pointer disabled:opacity-50"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Gas info */}
              <div className="bg-surface-elevated p-3 rounded-xl border border-border-thin flex justify-between items-center text-xs">
                <span className="text-muted flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-muted" />
                  Gas Fee
                </span>
                <span className="text-success font-semibold">Gasless via Paymaster</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger flex items-start gap-2 mb-6 animate-fade-in-up">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="break-words w-full">{errorMessage}</span>
              </div>
            )}

            {/* Success message */}
            {txStep === "success" && (
              <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-center space-y-3 mb-6 animate-fade-in-up">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center mx-auto text-success">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Deposit Confirmed!</h4>
                  <p className="text-xs text-muted mt-1">Your assets have been deposited into the SynArc Treasury on-chain.</p>
                </div>
                {txHash && (
                  <a
                    href={`https://explorer.testnet.arc.network/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-xs font-semibold text-primary hover:underline font-mono"
                  >
                    Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </a>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleModalClose}
                disabled={txStep === "approving" || txStep === "depositing"}
                className="flex-1 py-3 border border-border-thin text-muted font-bold text-sm rounded-xl hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer disabled:opacity-50"
              >
                {txStep === "success" ? "Close" : "Cancel"}
              </button>
              
              {txStep !== "success" && (
                <button
                  onClick={handleDepositSubmit}
                  disabled={txStep === "approving" || txStep === "depositing" || !depositAmount}
                  className="flex-1 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/95 transition-all shadow-[0_0_15px_rgba(124,58,237,0.15)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {txStep === "approving" ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Approving...
                    </>
                  ) : txStep === "depositing" ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Depositing...
                    </>
                  ) : (
                    "Confirm Deposit"
                  )}
                </button>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

// Simple dynamic loader helper icon
function RefreshCw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
