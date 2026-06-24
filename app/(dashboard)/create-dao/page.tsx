"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCreatorStore } from "@/hooks/useCreatorStore";
import { useCampaignStore } from "@/hooks/useCampaignStore";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Rocket, HelpCircle, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import { useWallets as usePrivyWallets } from "@privy-io/react-auth";
import { getAuthenticatedClient, waitForTransaction, getAggressiveGasParams } from "@/lib/tx-helper";
import { SynArcCrowdfundABI, SynArcCrowdfundBytecode } from "@/lib/governance/SynArcCrowdfund";
import { ARC_CHAIN } from "@/lib/arc-config";


const TEMPLATES = [
  { icon: "🎵", name: "Music Creator", desc: "Fund your album, tour, or music video", category: "music" },
  { icon: "🎨", name: "Artist", desc: "Fund commissions, exhibitions, or collections", category: "art" },
  { icon: "✍️", name: "Writer", desc: "Fund your book, newsletter, or research", category: "writing" },
  { icon: "🎮", name: "Game Developer", desc: "Fund your indie game or mod", category: "gaming" },
  { icon: "🤖", name: "AI Agent", desc: "Deploy an autonomous agent with treasury", category: "ai-agent" },
  { icon: "🏗️", name: "Arc Builder", desc: "Fund your Arc ecosystem project", category: "builder" },
];

export default function CreateDaoPage() {
  const router = useRouter();
  const { walletAddress, isAuthenticated, login } = useAuth();
  const { wallets: privyWallets } = usePrivyWallets();
  const wallets = privyWallets ?? [];
  
  const { addCreator, initializeStore } = useCreatorStore();
  const { addCampaign } = useCampaignStore();

  const [launching, setLaunching] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [newDeployedAddress, setNewDeployedAddress] = useState("");
  const [newCreatorId, setNewCreatorId] = useState("");

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    goal: "",
    duration: "30",
    twitter: "",
    wallet: "",
  });

  const [aiIdeaInput, setAiIdeaInput] = useState("");
  const [generatingWithAi, setGeneratingWithAi] = useState(false);

  const generateCampaignWithAI = async () => {
    if (!aiIdeaInput.trim()) {
      toast.error("Please enter a brief idea first.");
      return;
    }

    setGeneratingWithAi(true);
    try {
      const response = await fetch("/api/ai/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiIdeaInput,
          type: "campaign",
          context: `Creator DAO on Arc: ${selectedTemplate || "general creator"}`
        })
      });

      const data = await response.json();
      if (response.ok && data.success && data.campaign) {
        const c = data.campaign;
        setFormData((prev) => ({
          ...prev,
          name: c.title || prev.name,
          description: c.description || prev.description,
          goal: c.goal ? c.goal.toString() : prev.goal,
          duration: c.duration ? c.duration.toString() : prev.duration,
          wallet: c.recipient || prev.wallet,
        }));
        toast.success("🤖 Details auto-drafted successfully!");
      } else {
        toast.error(data.error || "Failed to generate campaign draft.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("An error occurred during AI drafting.");
    } finally {
      setGeneratingWithAi(false);
    }
  };

  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Uploading cover image...");

    try {
      const uformData = new FormData();
      uformData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uformData,
      });

      const data = await response.json();
      if (response.ok && data.success && data.url) {
        setImageUrl(data.url);
        toast.success("Cover image uploaded successfully!", { id: toastId });
      } else {
        toast.error(data.error || "Failed to upload cover image.", { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to upload image due to connection error.", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectTemplate = (category: string) => {
    setSelectedTemplate(category);
    setStep(2);
  };

  const handleNextStep = () => {
    if (step === 2) {
      if (!formData.name || !formData.description || !formData.goal) {
        toast.error("Please fill in all required fields.");
        return;
      }
      if (parseFloat(formData.goal) <= 0) {
        toast.error("Goal must be greater than 0 USDC.");
        return;
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleLaunch = async () => {
    try {
      if (!isAuthenticated) {
        login();
        return;
      }

      const recipient = (formData.wallet || walletAddress || "0x0000000000000000000000000000000000000000").trim();
      const creatorGoal = parseFloat(formData.goal);
      const creatorDuration = parseInt(formData.duration) || 30;
      const isAgent = selectedTemplate === "ai-agent";

      // Robust Validation
      if (isNaN(creatorGoal) || creatorGoal <= 0) {
        toast.error("Goal must be a valid number greater than 0 USDC.");
        return;
      }

      if (isNaN(creatorDuration) || creatorDuration < 7 || creatorDuration > 90) {
        toast.error("Duration must be between 7 and 90 days.");
        return;
      }

      if (recipient !== "0x0000000000000000000000000000000000000000" && (!recipient.startsWith("0x") || recipient.length !== 42)) {
        toast.error("Recipient wallet must be a valid EVM address starting with 0x (42 characters).");
        return;
      }

      setLaunching(true);
      setTxHash("");

      // Show an immediate loading toast so the user sees feedback right away
      const launchToastId = `launch-${Date.now()}`;
      toast.loading("Launching Creator DAO...", { id: launchToastId });

      try {
        let deployedContractAddress = "";
        let transactionHash = "";

        // 1. Fetch signer and wallet details
        const { walletClient, publicClient, address } = await getAuthenticatedClient(wallets, 5042002, walletAddress);

        // USDC precompiled contract address on Arc Testnet
        const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
        
        // 2. Format parameters for on-chain deployment
        const goalBigInt = BigInt(Math.round(creatorGoal * 1_000_000));
        const milestoneTitles = ["Initial Launch Phase"];
        const milestoneAmounts = [goalBigInt];
        const milestoneDescriptions = ["Release of initial backing capital to kickstart the project."];

        const gasParams = await getAggressiveGasParams(publicClient);

        toast.loading("Deploying Creator DAO smart contract to Arc...", { id: launchToastId });

        // 3. Deploy SynArcCrowdfund contract directly from user wallet
        // Explicitly set chain to ARC_CHAIN and use a safer 3.5M gas limit floor
        const deployHash = await walletClient.deployContract({
          abi: SynArcCrowdfundABI,
          bytecode: SynArcCrowdfundBytecode as `0x${string}`,
          chain: ARC_CHAIN,
          args: [
            address,
            recipient as `0x${string}`,
            USDC_ADDRESS,
            goalBigInt,
            BigInt(creatorDuration),
            isAgent,
            formData.name.trim(),
            formData.description.trim(),
            selectedTemplate === "ai-agent" ? "AI Agent Fund" : "Creator DAO",
            milestoneTitles,
            milestoneAmounts,
            milestoneDescriptions
          ],
          gas: 3500000n, 
          ...gasParams,
        });

        console.log("Deployment transaction submitted! Tx Hash:", deployHash);
        setTxHash(deployHash);
        toast.loading(`Confirming transaction ${deployHash.slice(0, 10)}...`, { id: launchToastId });

        // 4. Wait for transaction confirmation
        const receipt = await waitForTransaction(publicClient, deployHash);
        deployedContractAddress = receipt.contractAddress;
        transactionHash = deployHash;

        if (!deployedContractAddress) {
          throw new Error("Escrow contract deployment failed — no contract address returned in receipt.");
        }

        toast.loading("Registering your Creator DAO...", { id: launchToastId });

        // 5. Add creator to the local creator store
        const creatorId = addCreator({
          id: "", // Will be generated
          name: formData.name,
          category: selectedTemplate,
          description: formData.description,
          goal: creatorGoal,
          twitter: formData.twitter || null,
          wallet: recipient,
          isAgent,
          escrowAddress: deployedContractAddress,
          image: imageUrl || undefined,
        });

        // 6. Register as a Creator DAO campaign (Zustand + local campaigns DB)
        const campaignDeadline = new Date(Date.now() + creatorDuration * 24 * 60 * 60 * 1000).toISOString();
        await addCampaign({
          title: formData.name,
          description: formData.description,
          category: selectedTemplate === "ai-agent" ? "AI Agent Fund" : "Creator DAO",
          badge: isAgent ? "AUTONOMOUS_AGENT_FUND" : "HUMAN_CAMPAIGN",
          goal: creatorGoal,
          isAgent,
          creator: walletAddress || recipient,
          recipient,
          deadline: campaignDeadline,
          milestones: [
            {
              title: "Initial Launch Phase",
              amount: creatorGoal,
              description: "Release of initial backing capital to kickstart the project.",
              status: "active",
            }
          ],
          escrowAddress: deployedContractAddress,
          twitter: formData.twitter || null,
          image: imageUrl || undefined,
        });

        // Show real transaction hash and success message
        toast.success(`🚀 Creator DAO launched! Tx: ${transactionHash.slice(0, 10)}...`, { id: launchToastId, duration: 5000 });
        
        // Immediately redirect to creator profile page
        router.push(`/creator/${creatorId}`);
      } catch (err: any) {
        console.error("handleLaunch inner error:", err);
        // Dismiss loading toast and show a fresh error so it always appears
        toast.dismiss(launchToastId);
        
        const errMsg = (err?.message || "").toLowerCase();
        if (errMsg.includes("insufficient") || errMsg.includes("funds") || errMsg.includes("gas") || errMsg.includes("balance")) {
          toast.error(
            "Failed to deploy contract. Ensure you have native USDC gas in your wallet from faucet.circle.com.",
            { duration: 10000 }
          );
        } else {
          toast.error(err?.message || "Failed to launch Creator DAO. Please try again.", { duration: 8000 });
        }
        setLaunching(false);
      }
    } catch (outerErr: any) {
      console.error("handleLaunch outer error:", outerErr);
      toast.error(`Failed to initiate launch: ${outerErr?.message || outerErr || "Unknown error"}`);
      setLaunching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8 animate-fade-in-up">
      {/* Wizard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-white tracking-tight flex items-center gap-2">
            🚀 Launch Creator DAO
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Deploy your creator template and start receiving USDC nanopayments on Arc.
          </p>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-3">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border ${
                  step === s
                    ? "bg-accent-purple border-accent-purple text-white-keep shadow-[0_0_12px_rgba(124,58,237,0.4)]"
                    : step > s
                    ? "bg-success/20 border-success/30 text-success"
                    : "bg-surface-elevated/40 border-border-thin text-text-tertiary"
                }`}
              >
                {step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-10 h-0.5 ml-3 transition-colors duration-300 ${
                    step > s ? "bg-success/40" : "bg-border-thin"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Contents */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <h2 className="text-lg font-bold text-white font-heading">Step 1 — Choose your creator type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.category}
                  onClick={() => handleSelectTemplate(tpl.category)}
                  className="group relative text-left transition-all duration-300 cursor-pointer focus:outline-none"
                >
                  <GlassCard className="p-5 h-full flex flex-col gap-4 border border-border hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
                    <div className="w-12 h-12 rounded-xl bg-surface/50 border border-border-thin flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                      {tpl.icon}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-text-primary group-hover:text-primary transition-colors">
                        {tpl.name}
                      </h4>
                      <p className="text-xs text-text-tertiary leading-relaxed">
                        {tpl.desc}
                      </p>
                    </div>
                  </GlassCard>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white font-heading">Step 2 — Fill in details</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary uppercase font-bold tracking-wider">
                {TEMPLATES.find((t) => t.category === selectedTemplate)?.name}
              </span>
            </div>

            <GlassCard className="p-6 md:p-8 space-y-5" hover={false}>
              {/* AI Campaign Auto-Draft card */}
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.01] overflow-hidden relative space-y-3">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-lg pointer-events-none" />
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse shrink-0" />
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wide">🤖 Auto-Draft with AI</h4>
                </div>
                <p className="text-xs text-text-tertiary leading-relaxed">
                  Briefly describe your Creator DAO idea and our AI agent will auto-fill your name, description, funding goal, and duration.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Build a Web3 gaming community to fund weekly tournaments"
                    value={aiIdeaInput}
                    onChange={(e) => setAiIdeaInput(e.target.value)}
                    disabled={generatingWithAi}
                    className="flex-1 px-3 py-2 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={generateCampaignWithAI}
                    disabled={generatingWithAi}
                    className="px-4 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white-keep font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-all shrink-0"
                  >
                    {generatingWithAi ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Drafting...
                      </>
                    ) : (
                      "Draft"
                    )}
                  </button>
                </div>
              </div>

              {/* Creator Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase">Creator / Project Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Kelly Music"
                  value={formData.name}
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
                  rows={4}
                  placeholder="What are you building or creating?"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white resize-none transition-colors"
                />
              </div>

              {/* Goal & Duration Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Funding Goal (USDC) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    name="goal"
                    required
                    min="1"
                    placeholder="500"
                    value={formData.goal}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Duration (Days)</label>
                  <input
                    type="number"
                    name="duration"
                    min="7"
                    max="90"
                    placeholder="30"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white transition-colors"
                  />
                </div>
              </div>

              {/* Twitter & Wallet Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Twitter/X Handle</label>
                  <input
                    type="text"
                    name="twitter"
                    placeholder="@yourhandle"
                    value={formData.twitter}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted uppercase flex items-center gap-1">
                    Recipient Wallet
                    <span title="Where funds will go once campaigns hit milestones">
                      <HelpCircle className="w-3.5 h-3.5 text-text-tertiary" />
                    </span>
                  </label>
                  <input
                    type="text"
                    name="wallet"
                    placeholder={walletAddress ? `${walletAddress.slice(0, 10)}... (Your Connected Wallet)` : "0x..."}
                    value={formData.wallet}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-thin focus:border-primary outline-none text-sm text-white font-mono transition-colors"
                  />
                </div>
              </div>

              {/* Cover Image Upload */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-muted uppercase">Cover Image</label>
                <div className="border border-dashed border-border hover:border-primary/50 rounded-2xl p-6 bg-surface/30 transition-all flex flex-col items-center justify-center gap-3 relative min-h-[140px] overflow-hidden">
                  {imageUrl ? (
                    <>
                      <img 
                        src={imageUrl} 
                        alt="Cover Preview" 
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                      <div className="relative z-10 flex flex-col items-center gap-2 text-center p-2">
                        <span className="text-[10px] bg-success/20 border border-success/30 px-2 py-0.5 rounded-full text-success font-bold">
                          ✓ Image Uploaded
                        </span>
                        <p className="text-[10px] text-text-secondary truncate max-w-[200px]">Cover image active</p>
                        <button
                          type="button"
                          onClick={() => setImageUrl("")}
                          className="text-[10px] text-danger hover:underline font-bold mt-1"
                        >
                          Remove and replace
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border-thin flex items-center justify-center text-xl text-text-secondary shadow-inner">
                        🖼️
                      </div>
                      <div className="text-center space-y-1">
                        <span className="text-xs font-bold text-white hover:text-primary transition-colors cursor-pointer relative block">
                          Upload Cover Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </span>
                        <p className="text-[10px] text-text-tertiary">
                          Recommended: 1200x630px banner image (PNG, JPG, WEBP)
                        </p>
                      </div>
                    </>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-xs font-semibold text-white">Uploading to IPFS...</span>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Nav buttons */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handlePrevStep}
                className="px-5 py-2.5 rounded-xl border border-border hover:bg-surface-elevated text-xs font-bold text-text-secondary hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white-keep font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <h2 className="text-lg font-bold text-white font-heading">Step 3 — Launch confirmation</h2>

            <GlassCard className="p-6 md:p-8 space-y-6" hover={false}>
              <div className="flex items-center gap-2 border-b border-border-subtle pb-4">
                <Rocket className="w-5 h-5 text-primary animate-pulse" />
                <h3 className="text-base font-bold text-white font-heading">Ready to Launch!</h3>
              </div>

              {/* Summary table */}
              <div className="divide-y divide-border-subtle/40 bg-surface/20 rounded-2xl border border-border-thin overflow-hidden text-xs">
                <div className="grid grid-cols-3 p-4">
                  <span className="font-bold text-muted uppercase">Name</span>
                  <span className="col-span-2 font-bold text-white">{formData.name}</span>
                </div>
                <div className="grid grid-cols-3 p-4">
                  <span className="font-bold text-muted uppercase">Category</span>
                  <span className="col-span-2 font-bold text-primary uppercase tracking-wider">
                    {TEMPLATES.find((t) => t.category === selectedTemplate)?.name}
                  </span>
                </div>
                <div className="grid grid-cols-3 p-4">
                  <span className="font-bold text-muted uppercase">Goal</span>
                  <span className="col-span-2 font-bold text-success">{parseFloat(formData.goal).toLocaleString()} USDC</span>
                </div>
                <div className="grid grid-cols-3 p-4">
                  <span className="font-bold text-muted uppercase">Duration</span>
                  <span className="col-span-2 font-bold text-white">{formData.duration} days</span>
                </div>
                <div className="grid grid-cols-3 p-4">
                  <span className="font-bold text-muted uppercase">Creator URL</span>
                  <span className="col-span-2 font-mono font-bold text-purple-300">
                    synarcdao.xyz/creator/{formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                  </span>
                </div>
              </div>

              {/* Escrow Notice */}
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.01] flex items-start gap-2.5 text-xs text-text-secondary leading-relaxed">
                <span className="text-base select-none">🔒</span>
                <div>
                  <span className="font-bold text-white block mb-0.5">Escrow Security Policy:</span>
                  Funds raised are locked securely within decentralized milestone escrow smart contracts on Arc. Release triggers are bound cryptographically to community votes.
                </div>
              </div>



              {/* Launch Action */}
              <button
                onClick={handleLaunch}
                disabled={launching}
                className="w-full py-4 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white-keep font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.55)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {launching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>Deploying smart contract to Arc...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    <span>Launch Creator DAO</span>
                  </>
                )}
              </button>
            </GlassCard>

            {/* Back button */}
            <div className="flex pt-2">
              <button
                onClick={handlePrevStep}
                className="px-5 py-2.5 rounded-xl border border-border hover:bg-surface-elevated text-xs font-bold text-text-secondary hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 max-w-2xl mx-auto"
          >
            <GlassCard className="p-8 text-center space-y-6 border border-success/30 bg-success/[0.01]" hover={false}>
              <div className="w-16 h-16 bg-success/10 border border-success/20 rounded-full flex items-center justify-center text-3xl mx-auto shadow-lg animate-bounce">
                🎉
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-white font-heading">Your Creator DAO has been deployed!</h2>
                <p className="text-sm text-text-secondary">
                  Your smart contract is live and ready to receive USDC nanopayments on the Arc Testnet.
                </p>
              </div>

              {/* Deployed Contract Address Info */}
              <div className="p-4 rounded-xl border border-border-thin bg-surface/30 space-y-2 text-left">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Smart Contract Address (ArcScan)</span>
                <div className="flex items-center justify-between gap-3">
                  <a
                    href={`https://testnet.arcscan.app/address/${newDeployedAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-primary hover:underline truncate select-all"
                  >
                    {newDeployedAddress}
                  </a>
                  <a
                    href={`https://testnet.arcscan.app/address/${newDeployedAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated text-[10px] font-bold text-text-secondary hover:text-white border border-border-thin transition-colors"
                  >
                    View ↗
                  </a>
                </div>
              </div>

              {/* Creator Profile Link Info */}
              <div className="p-4 rounded-xl border border-border-thin bg-surface/30 space-y-2 text-left">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Shareable Creator Profile Link</span>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-purple-300 truncate select-all">
                    https://synarcdao.xyz/creator/{newCreatorId}
                  </span>
                  <button
                    onClick={async () => {
                      const shareUrl = `https://synarcdao.xyz/creator/${newCreatorId}`;
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                        toast.success("Link copied!");
                      } catch {
                        toast.error("Failed to copy link.");
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated text-[10px] font-bold text-text-secondary hover:text-white border border-border-thin transition-colors shrink-0"
                  >
                    Copy Link
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => router.push(`/creator/${newCreatorId}`)}
                  className="flex-1 py-3 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white-keep font-extrabold text-xs transition-colors cursor-pointer shadow-[0_0_15px_rgba(124,58,237,0.2)] font-bold"
                >
                  Go to DAO Profile
                </button>
                <button
                  onClick={() => router.push("/leaderboard")}
                  className="flex-1 py-3 rounded-xl border border-border hover:bg-surface-elevated text-xs font-bold text-text-secondary hover:text-white transition-colors cursor-pointer"
                >
                  Explore Leaderboard
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SDK Sponsorship Footer */}
      <div className="pt-6 border-t border-border-thin flex justify-center items-center">
        <p className="text-[10px] text-text-tertiary/60 font-mono tracking-wider">
          ⚙️ Framework Core Powered by <span className="text-primary font-bold">@synarc/agent-sdk</span>
        </p>
      </div>
    </div>
  );
}
