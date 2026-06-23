import { createPublicClient, createWalletClient, http, fallback, parseAbi, parseUnits, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet, ARC_RPC_URLS, CONTRACTS } from "@/lib/arc-config";

export interface SDKConfig {
  network: "arc-testnet" | "arc-mainnet";
  privateKey?: string;
  rpcUrl?: string;
  signer?: any;
}

export class SynArcClient {
  public publicClient: any;
  public walletClient: any;
  public account: any;

  constructor(config: SDKConfig) {
    const rpcUrls = config.rpcUrl ? [config.rpcUrl] : ARC_RPC_URLS;
    const transport = fallback(rpcUrls.map((url) => http(url)));

    this.publicClient = createPublicClient({
      chain: arcTestnet,
      transport,
    });

    if (config.privateKey) {
      const formattedKey = config.privateKey.startsWith("0x")
        ? (config.privateKey as `0x${string}`)
        : (`0x${config.privateKey}` as `0x${string}`);
      this.account = privateKeyToAccount(formattedKey);
      this.walletClient = createWalletClient({
        account: this.account,
        chain: arcTestnet,
        transport,
      });
    } else if (config.signer) {
      // EIP-1193 / Privy provider fallback
      this.walletClient = config.signer;
    }
  }

  // Campaigns module
  get campaigns() {
    return {
      create: async (params: {
        title: string;
        description: string;
        goal: number;
        category: string;
        milestones: Array<{ title: string; budget: number; description?: string }>;
      }) => {
        // Launches a Campaign Escrow
        const CROWDFUND_HUB_ABI = parseAbi([
          "function deployCampaign(string title, string description, string category, uint256 goalAmount, string[] milestoneTitles, uint256[] milestoneBudgets) returns (address)"
        ]);
        const hubAddress = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a"; // Crowdfund Hub address
        const goalRaw = parseUnits(params.goal.toString(), 6);
        const titles = params.milestones.map(m => m.title);
        const budgets = params.milestones.map(m => parseUnits(m.budget.toString(), 6));

        if (!this.walletClient) throw new Error("Signer/Private key required to write to contract");

        const tx = await this.walletClient.writeContract({
          address: hubAddress,
          abi: CROWDFUND_HUB_ABI,
          functionName: "deployCampaign",
          args: [params.title, params.description, params.category, goalRaw, titles, budgets],
        });

        return {
          hash: tx,
          escrowAddress: "0x" + "PendingEscrowAddressDeploysOnChain",
          slug: params.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        };
      },

      list: async () => {
        // Read active campaigns
        return [];
      },

      getBySlug: async (slug: string) => {
        return {
          title: slug.replace(/-/g, " "),
          escrowAddress: "0x0000000000000000000000000000000000000000",
          goal: 1000,
        };
      },

      support: async (params: { escrowAddress: string; amountUsdc: number }) => {
        const CAMPAIGN_ABI = parseAbi(["function contribute(uint256 amount) external"]);
        const amountRaw = parseUnits(params.amountUsdc.toString(), 6);

        if (!this.walletClient) throw new Error("Signer/Private key required to write to contract");

        const tx = await this.walletClient.writeContract({
          address: params.escrowAddress as `0x${string}`,
          abi: CAMPAIGN_ABI,
          functionName: "contribute",
          args: [amountRaw],
        });
        return { hash: tx, wait: async () => {} };
      },
    };
  }

  // Agent registry module (ERC-8004)
  get agent() {
    return {
      register: async (params: {
        name: string;
        capabilities: string[];
        metadataUri: string;
      }) => {
        const REGISTRY_ABI = parseAbi([
          "function registerAgent(address agentAddress, string name, string description, string capabilities, string metadataURI)"
        ]);
        const registryAddress = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
        const capString = params.capabilities.join(", ");
        const agentAddress = this.account?.address || this.walletClient?.account?.address;

        if (!this.walletClient) throw new Error("Signer/Private key required to write to contract");

        const tx = await this.walletClient.writeContract({
          address: registryAddress,
          abi: REGISTRY_ABI,
          functionName: "registerAgent",
          args: [agentAddress, params.name, params.name + " AI Agent", capString, params.metadataUri],
        });
        return { hash: tx };
      },

      getAgentInfo: async (address: string) => {
        const REGISTRY_ABI = parseAbi([
          "function getAgent(address agentAddress) view returns (address owner, string name, string description, string capabilities, string metadataURI, uint256 reputation, bool active)"
        ]);
        const registryAddress = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
        const res = await this.publicClient.readContract({
          address: registryAddress,
          abi: REGISTRY_ABI,
          functionName: "getAgent",
          args: [address as `0x${string}`],
        }) as any;

        return {
          owner: res[0],
          name: res[1],
          capabilities: res[3].split(", "),
          metadataURI: res[4],
          reputation: Number(res[5]),
          active: res[6],
        };
      },
    };
  }

  // Governance module
  get governance() {
    return {
      getActiveProposals: async () => {
        const GOVERNOR_ABI = parseAbi([
          "function proposalCount() view returns (uint256)",
          "function state(uint256 proposalId) view returns (uint8)"
        ]);
        const count = await this.publicClient.readContract({
          address: CONTRACTS.governor,
          abi: GOVERNOR_ABI,
          functionName: "proposalCount"
        });

        const activeList = [];
        for (let i = 1; i <= Number(count); i++) {
          const state = await this.publicClient.readContract({
            address: CONTRACTS.governor,
            abi: GOVERNOR_ABI,
            functionName: "state",
            args: [BigInt(i)]
          });
          // State 1 = Active
          if (state === 1) {
            activeList.push({ id: i.toString() });
          }
        }
        return activeList;
      },

      castVote: async (params: { proposalId: string; support: number; reason?: string }) => {
        const GOVERNOR_ABI = parseAbi([
          "function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256)"
        ]);

        if (!this.walletClient) throw new Error("Signer/Private key required to write to contract");

        const tx = await this.walletClient.writeContract({
          address: CONTRACTS.governor,
          abi: GOVERNOR_ABI,
          functionName: "castVoteWithReason",
          args: [BigInt(params.proposalId), params.support, params.reason || ""],
        });
        return { hash: tx };
      },

      getProposalDetails: async (proposalId: string) => {
        const GOVERNOR_ABI = parseAbi([
          "function getProposal(uint256 proposalId) view returns (uint256 id, address proposer, string title, string description, string category, uint256 votingDuration, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed, uint256 treasuryImpactValue, address executionTarget)"
        ]);
        const p = await this.publicClient.readContract({
          address: CONTRACTS.governor,
          abi: GOVERNOR_ABI,
          functionName: "getProposal",
          args: [BigInt(proposalId)],
        }) as any;

        return {
          id: p[0].toString(),
          proposer: p[1],
          title: p[2],
          description: p[3],
          category: p[4],
          forVotes: formatUnits(p[8], 18),
          againstVotes: formatUnits(p[9], 18),
          executed: p[12],
          treasuryImpactValue: formatUnits(p[13], 6),
        };
      },
    };
  }

  // Treasury module
  get treasury() {
    return {
      isExecutor: async (address: string) => {
        const TREASURY_ABI = parseAbi(["function governor() view returns (address)"]);
        const gov = await this.publicClient.readContract({
          address: CONTRACTS.treasury,
          abi: TREASURY_ABI,
          functionName: "governor",
        });
        return gov.toLowerCase() === address.toLowerCase();
      },

      executeSweep: async (params: { tokenAddress: string; targetVault: string; amount: bigint }) => {
        const TREASURY_ABI = parseAbi(["function withdraw(address recipient, uint256 amount)"]);

        if (!this.walletClient) throw new Error("Signer/Private key required to write to contract");

        const tx = await this.walletClient.writeContract({
          address: CONTRACTS.treasury,
          abi: TREASURY_ABI,
          functionName: "withdraw",
          args: [params.targetVault as `0x${string}`, params.amount],
        });
        return { hash: tx, wait: async () => {} };
      },

      getBalances: async () => {
        const TREASURY_ABI = parseAbi([
          "function usdcBalance() view returns (uint256)",
          "function eurcBalance() view returns (uint256)"
        ]);
        const [usdc, eurc] = await Promise.all([
          this.publicClient.readContract({ address: CONTRACTS.treasury, abi: TREASURY_ABI, functionName: "usdcBalance" }),
          this.publicClient.readContract({ address: CONTRACTS.treasury, abi: TREASURY_ABI, functionName: "eurcBalance" }),
        ]);
        return {
          usdc: formatUnits(usdc, 6),
          eurc: formatUnits(eurc, 6),
        };
      },
    };
  }

  // Token module
  get token() {
    return {
      getBalance: async (address: string) => {
        const TOKEN_ABI = parseAbi(["function balanceOf(address owner) view returns (uint256)"]);
        const bal = await this.publicClient.readContract({
          address: CONTRACTS.token,
          abi: TOKEN_ABI,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        });
        return formatUnits(bal, 18);
      },

      getDelegate: async (address: string) => {
        const TOKEN_ABI = parseAbi(["function delegates(address account) view returns (address)"]);
        return await this.publicClient.readContract({
          address: CONTRACTS.token,
          abi: TOKEN_ABI,
          functionName: "delegates",
          args: [address as `0x${string}`],
        });
      },

      delegate: async (delegatee: string) => {
        const TOKEN_ABI = parseAbi(["function delegate(address delegatee)"]);

        if (!this.walletClient) throw new Error("Signer/Private key required to write to contract");

        const tx = await this.walletClient.writeContract({
          address: CONTRACTS.token,
          abi: TOKEN_ABI,
          functionName: "delegate",
          args: [delegatee as `0x${string}`],
        });
        return { hash: tx, wait: async () => {} };
      },
    };
  }

  // Crowdfund Escrow module
  get crowdfund() {
    return {
      getMilestones: async (campaignId: string) => {
        return [];
      },

      releaseMilestone: async (params: { campaignId: string; milestoneId: number }) => {
        const ESCROW_ABI = parseAbi(["function releaseMilestone(uint256 milestoneId)"]);
        // Dummy escrow address resolver
        const escrowAddress = "0x0000000000000000000000000000000000000000";

        if (!this.walletClient) throw new Error("Signer/Private key required to write to contract");

        const tx = await this.walletClient.writeContract({
          address: escrowAddress,
          abi: ESCROW_ABI,
          functionName: "releaseMilestone",
          args: [BigInt(params.milestoneId)],
        });
        return { hash: tx };
      },
    };
  }
}

// Compatibility export
export const SynArcAgentClient = SynArcClient;
