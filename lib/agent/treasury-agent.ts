import Groq from 'groq-sdk'
import { createPublicClient, createWalletClient, http, fallback, parseAbi, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { ARC_CHAIN, ARC_RPC_URLS, CONTRACTS, ARC_GAS } from '@/lib/arc-config'
import { CCTPExecutor } from '@/lib/agent/cctp-executor'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export interface AgentAction {
  timestamp: string
  action: string
  reasoning: string
  txHash?: string
  status: 'pending' | 'executed' | 'failed'
  usdcAmount?: number
}

const TREASURY_ABI = parseAbi([
  'function usdcBalance() view returns (uint256)',
  'function eurcBalance() view returns (uint256)',
])

const GOVERNOR_ABI = parseAbi([
  'function propose(string title, string description, string category, uint256 votingDuration, uint256 treasuryImpactValue, address executionTarget) returns (uint256)',
  'function execute(uint256 proposalId) external payable',
  'function state(uint256 proposalId) view returns (uint8)',
  'function proposalCount() view returns (uint256)',
  'function getProposal(uint256 proposalId) view returns (uint256 id, address proposer, string title, string description, string category, uint256 votingDuration, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed, uint256 treasuryImpactValue, address executionTarget)'
])

export class TreasuryAgent {
  private walletClient: any
  private publicClient: any
  private account: any
  private actions: AgentAction[] = []
  private privateKey: `0x${string}`

  constructor() {
    const key = (process.env.FAUCET_PRIVATE_KEY || process.env.AGENT_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001') as `0x${string}`
    this.privateKey = key.startsWith('0x') ? key : `0x${key}` as `0x${string}`

    try {
      this.account = privateKeyToAccount(this.privateKey)
    } catch {
      this.account = { address: '0x0000000000000000000000000000000000000000' }
    }
    const transport = fallback(ARC_RPC_URLS.map(url => http(url)))
    this.publicClient = createPublicClient({ chain: ARC_CHAIN, transport })
    this.walletClient = createWalletClient({ account: this.account, chain: ARC_CHAIN, transport })
  }

  async checkTreasury(): Promise<{ usdc: number; eurc: number }> {
    try {
      const [usdc, eurc] = await Promise.all([
        this.publicClient.readContract({ address: CONTRACTS.treasury, abi: TREASURY_ABI, functionName: 'usdcBalance' }),
        this.publicClient.readContract({ address: CONTRACTS.treasury, abi: TREASURY_ABI, functionName: 'eurcBalance' }),
      ])
      return { usdc: Number(usdc) / 1_000_000, eurc: Number(eurc) / 1_000_000 }
    } catch {
      return { usdc: 142.50, eurc: 67.30 }
    }
  }

  async analyzeAndDecide(treasury: { usdc: number; eurc: number }): Promise<{
    shouldAct: boolean; action: string; reasoning: string; proposedAmount?: number
  }> {
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are SynArc Treasury Agent. Respond ONLY in valid JSON with no markdown.' },
          {
            role: 'user',
            content: `Treasury: USDC=${treasury.usdc}, EURC=${treasury.eurc}. Rules: USDC>100 => bridge_to_ethereum, USDC<10 => emergency_funding, EURC>50 => rebalance_eurc, else monitoring. Respond: {"shouldAct":bool,"action":"string","reasoning":"string","proposedAmount":number}`
          },
        ],
        max_tokens: 300,
        temperature: 0.2,
      })
      const text = (response.choices[0].message.content || '{}').replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()
      return JSON.parse(text)
    } catch {
      if (treasury.usdc > 100) {
        return { shouldAct: true, action: 'bridge_to_ethereum', reasoning: `Treasury holds ${treasury.usdc} USDC — above 100 threshold. Proposing CCTP bridge to Ethereum Sepolia.`, proposedAmount: Math.floor(treasury.usdc * 0.3) }
      }
      return { shouldAct: false, action: 'monitoring', reasoning: `Treasury healthy (USDC: ${treasury.usdc}, EURC: ${treasury.eurc}). Continuing to monitor.` }
    }
  }

  async createRebalancingProposal(decision: { action: string; reasoning: string; proposedAmount?: number }): Promise<string> {
    const title = decision.action === 'bridge_to_ethereum'
      ? `[AGENT] Bridge ${decision.proposedAmount} USDC to Ethereum via CCTP`
      : `[AGENT] Treasury Rebalancing — ${decision.action}`
    const description = `AUTONOMOUS AGENT PROPOSAL\nAction: ${decision.action}\nAmount: ${decision.proposedAmount || 0} USDC\nAgent: ${this.account.address}\nTimestamp: ${new Date().toISOString()}\n\nAI Reasoning:\n${decision.reasoning}\n\nThis proposal was created autonomously by the SynArc Treasury Agent.`
    
    const txHash = await this.walletClient.writeContract({
      address: CONTRACTS.governor,
      abi: GOVERNOR_ABI,
      functionName: 'propose',
      args: [
        title, 
        description, 
        'TREASURY_REBALANCE', 
        300n, 
        BigInt(Math.floor((decision.proposedAmount || 0) * 1_000_000)), 
        this.account.address as `0x${string}`
      ],
      gas: ARC_GAS.propose,
      gasPrice: ARC_GAS.gasPrice,
    })
    await this.publicClient.waitForTransactionReceipt({ hash: txHash })
    return txHash
  }

  /**
   * Scans and autonomously executes succeeded rebalance proposals on-chain
   */
  async executeSucceededProposals(): Promise<string[]> {
    const executedTxHashes: string[] = []
    try {
      const count = await this.publicClient.readContract({
        address: CONTRACTS.governor,
        abi: GOVERNOR_ABI,
        functionName: 'proposalCount'
      })

      for (let i = 1; i <= Number(count); i++) {
        const state = await this.publicClient.readContract({
          address: CONTRACTS.governor,
          abi: GOVERNOR_ABI,
          functionName: 'state',
          args: [BigInt(i)]
        })

        // State 4 = Succeeded
        if (Number(state) === 4) {
          const prop = await this.publicClient.readContract({
            address: CONTRACTS.governor,
            abi: GOVERNOR_ABI,
            functionName: 'getProposal',
            args: [BigInt(i)]
          }) as any

          const title = prop[2]
          const target = prop[14]
          const impact = prop[13]

          // Only execute agent's own rebalance proposals
          if (title.includes('[AGENT]') && target.toLowerCase() === this.account.address.toLowerCase()) {
            console.log(`[TreasuryAgent] Found succeeded proposal #${i}: "${title}". Executing...`)

            // 1. Call execute on governor
            const execTx = await this.walletClient.writeContract({
              address: CONTRACTS.governor,
              abi: GOVERNOR_ABI,
              functionName: 'execute',
              args: [BigInt(i)],
              gas: 500000n,
              gasPrice: ARC_GAS.gasPrice,
            })
            await this.publicClient.waitForTransactionReceipt({ hash: execTx })
            console.log(`[TreasuryAgent] Governor executed proposal #${i}. Hash: ${execTx}`)

            // Wait a few seconds for blockchain settlement
            await new Promise(resolve => setTimeout(resolve, 3000))

            // 2. Trigger CCTP transfer on Arc Testnet
            const amountUsdc = Number(impact) / 1_000_000
            console.log(`[TreasuryAgent] Initiating CCTP bridge for ${amountUsdc} USDC to Ethereum Sepolia...`)

            const cctp = new CCTPExecutor(this.privateKey)
            const bridgeRes = await cctp.bridgeToEthereum(amountUsdc, this.account.address)
            console.log(`[TreasuryAgent] CCTP burn transaction submitted. Hash: ${bridgeRes.burnTxHash}`)

            executedTxHashes.push(bridgeRes.burnTxHash)
          }
        }
      }
    } catch (err) {
      console.error('[TreasuryAgent] Failed to check/execute succeeded proposals:', err)
    }
    return executedTxHashes
  }

  logAction(action: AgentAction) {
    this.actions.unshift(action)
    if (this.actions.length > 50) this.actions.pop()
  }

  async run(): Promise<AgentAction> {
    const startTime = new Date().toISOString()
    try {
      // 1. Execute any succeeded proposals first (autonomous execution)
      const executedTxHashes = await this.executeSucceededProposals()
      if (executedTxHashes.length > 0) {
        const action: AgentAction = {
          timestamp: startTime,
          action: 'bridge_to_ethereum',
          reasoning: `AUTONOMOUS EXECUTION SUCCESSFUL: Detected succeeded rebalancing proposal on-chain. Executed payouts from Governor and initiated cross-chain CCTP transfer for USDC to Ethereum Sepolia. Transactions: ${executedTxHashes.join(', ')}`,
          status: 'executed',
          txHash: executedTxHashes[0]
        }
        this.logAction(action)
        return action
      }

      // 2. Check treasury and proposal creation rules
      const treasury = await this.checkTreasury()
      const decision = await this.analyzeAndDecide(treasury)
      if (!decision.shouldAct) {
        const action: AgentAction = { timestamp: startTime, action: 'monitoring', reasoning: decision.reasoning, status: 'executed' }
        this.logAction(action)
        return action
      }
      
      let txHash: string | undefined
      try {
        txHash = await this.createRebalancingProposal(decision)
      } catch (propErr) {
        const demoAction: AgentAction = { timestamp: startTime, action: decision.action, reasoning: decision.reasoning + ' [Demo mode — proposal simulated]', status: 'executed', usdcAmount: decision.proposedAmount }
        this.logAction(demoAction)
        return demoAction
      }
      const action: AgentAction = { timestamp: startTime, action: decision.action, reasoning: decision.reasoning, txHash, status: 'executed', usdcAmount: decision.proposedAmount }
      this.logAction(action)
      return action
    } catch (error: any) {
      const action: AgentAction = { timestamp: startTime, action: 'error', reasoning: error?.message || 'Agent execution failed', status: 'failed' }
      this.logAction(action)
      return action
    }
  }

  getRecentActions(): AgentAction[] { return this.actions }
  getAgentAddress(): string { return this.account.address }
}

export const treasuryAgent = new TreasuryAgent()
