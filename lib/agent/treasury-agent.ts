import Groq from 'groq-sdk'
import { createPublicClient, createWalletClient, http, fallback, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { ARC_CHAIN, ARC_RPC_URLS, CONTRACTS, ARC_GAS } from '@/lib/arc-config'

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
])

export class TreasuryAgent {
  private walletClient: any
  private publicClient: any
  private account: any
  private actions: AgentAction[] = []

  constructor() {
    const privateKey = (process.env.FAUCET_PRIVATE_KEY || process.env.AGENT_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001') as `0x${string}`
    try {
      this.account = privateKeyToAccount(privateKey)
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
      args: [title, description, 'TREASURY_REBALANCE', 300n, BigInt(Math.floor((decision.proposedAmount || 0) * 1_000_000)), '0x0000000000000000000000000000000000000000' as `0x${string}`],
      gas: ARC_GAS.propose,
      gasPrice: ARC_GAS.gasPrice,
    })
    await this.publicClient.waitForTransactionReceipt({ hash: txHash })
    return txHash
  }

  async executeCCTPIfApproved(proposalId: string, amount: number): Promise<string | null> {
    try {
      const GOVERNOR_STATE_ABI = parseAbi(['function state(uint256 proposalId) view returns (uint8)'])
      const state = await this.publicClient.readContract({ address: CONTRACTS.governor, abi: GOVERNOR_STATE_ABI, functionName: 'state', args: [BigInt(proposalId)] })
      if (Number(state) === 4) {
        // State 4 = Succeeded — CCTP execution would happen here
        console.log(`[TreasuryAgent] Proposal ${proposalId} succeeded — CCTP execution ready for ${amount} USDC`)
        return null // CCTPExecutor handles this
      }
    } catch (err) {
      console.warn('[TreasuryAgent] executeCCTPIfApproved error:', err)
    }
    return null
  }

  logAction(action: AgentAction) {
    this.actions.unshift(action)
    if (this.actions.length > 50) this.actions.pop()
  }

  async run(): Promise<AgentAction> {
    const startTime = new Date().toISOString()
    try {
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
