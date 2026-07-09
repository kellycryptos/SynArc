import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import Groq from 'groq-sdk'
import { createPublicClient, createWalletClient, http, fallback, parseAbi, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { ARC_CHAIN, ARC_RPC_URLS, CONTRACTS, ARC_GAS } from '@/lib/arc-config'
import { CCTPExecutor } from '@/lib/agent/cctp-executor'
import fs from 'fs'


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'mock_groq_api_key_123456' })

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
  'function getProposal(uint256 proposalId) view returns (uint256 id, address proposer, string title, string description, string category, uint256 votingDuration, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed, uint256 treasuryImpactValue, address executionTarget)',
  'function hasVoted(uint256 proposalId, address voter) view returns (bool)'
])

function tolerantParse(str: string): any {
  let cleaned = str.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {}

  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {}

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {}

  let fixed = cleaned;
  fixed = fixed.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/g, '"$1":');
  fixed = fixed.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ': "$1"');
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
  fixed = fixed.replace(/,\s*([}\]])/g, '$1');
  fixed = fixed.replace(/:\s*True\b/gi, ': true');
  fixed = fixed.replace(/:\s*False\b/gi, ': false');
  fixed = fixed.replace(/:\s*Null\b/gi, ': null');

  try {
    return JSON.parse(fixed);
  } catch (e) {
    console.error("[tolerantParse] Failed parsing even after fixes. Original:", str);
    throw e;
  }
}

function fallbackTreasuryDecide(text: string): any {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "");

  let shouldAct = false;
  if (/shouldAct["'\s:]+true/i.test(cleaned)) {
    shouldAct = true;
  }

  let action = "monitoring";
  const actionMatch = cleaned.match(/action["'\s:]+([^"}\n,]+)/i);
  if (actionMatch) {
    action = actionMatch[1].trim().replace(/^["']/, "").replace(/["']$/, "");
  }

  let reasoning = "AI analysis completed with parser fallback.";
  const reasonMatch = cleaned.match(/reasoning["'\s:]+([^"}\n,]+)/i);
  if (reasonMatch) {
    reasoning = reasonMatch[1].trim().replace(/^["']/, "").replace(/["']$/, "");
  }

  let proposedAmount = 0;
  const amtMatch = cleaned.match(/proposedAmount["'\s:]+(\d+)/i);
  if (amtMatch) {
    proposedAmount = parseInt(amtMatch[1], 10);
  }

  return { shouldAct, action, reasoning, proposedAmount };
}

export class TreasuryAgent {
  public lastExecutionTime = 0
  private walletClient: any
  private publicClient: any
  private account: any
  private actions: AgentAction[] = []
  private privateKey: `0x${string}`

  private loadActions(): AgentAction[] {
    try {
      const dbPath = path.join(process.cwd(), 'data/agent-actions.json')
      if (fs.existsSync(dbPath)) {
        return JSON.parse(fs.readFileSync(dbPath, 'utf8'))
      }
    } catch (err) {
      console.error('[TreasuryAgent] Failed to read actions DB:', err)
    }
    return []
  }

  private saveActions(actions: AgentAction[]) {
    try {
      const dbPath = path.join(process.cwd(), 'data/agent-actions.json')
      const dir = path.dirname(dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(dbPath, JSON.stringify(actions, null, 2), 'utf8')
    } catch (err) {
      console.error('[TreasuryAgent] Failed to write actions DB:', err)
    }
  }

  constructor() {
    const rawKey = process.env.FAUCET_PRIVATE_KEY || process.env.AGENT_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY
    if (!rawKey) {
      // Prevent Next.js compilation/build errors when env vars are missing
      const isBuildOrTest = process.env.NEXT_PHASE === 'phase-production-build' || 
                            process.env.NODE_ENV === 'test' || 
                            process.env.NODE_ENV === 'production'
      if (isBuildOrTest) {
        this.privateKey = '0x0000000000000000000000000000000000000000000000000000000000000001'
      } else {
        throw new Error('AGENT_PRIVATE_KEY environment variable is not set')
      }
    } else {
      const key = rawKey as `0x${string}`
      this.privateKey = key.startsWith('0x') ? key : `0x${key}` as `0x${string}`
    }

    try {
      this.account = privateKeyToAccount(this.privateKey)
    } catch {
      this.account = { address: '0x0000000000000000000000000000000000000000' }
    }
    const transport = fallback(ARC_RPC_URLS.map(url => http(url)))
    this.publicClient = createPublicClient({ chain: ARC_CHAIN, transport })
    this.walletClient = createWalletClient({ account: this.account, chain: ARC_CHAIN, transport })
    this.actions = this.loadActions()
  }

  async checkTreasury(): Promise<{ usdc: number; eurc: number; usedFallback: boolean }> {
    try {
      const [usdc, eurc] = await Promise.all([
        this.publicClient.readContract({ address: CONTRACTS.treasuryAgent, abi: TREASURY_ABI, functionName: 'usdcBalance' }),
        this.publicClient.readContract({ address: CONTRACTS.treasuryAgent, abi: TREASURY_ABI, functionName: 'eurcBalance' }),
      ])
      return { usdc: Number(usdc) / 1_000_000, eurc: Number(eurc) / 1_000_000, usedFallback: false }
    } catch (err: any) {
      // Contract read failed — throw error to prevent dangerous fallback to 0 balance
      console.error('[TreasuryAgent] Critical: failed to read treasury balances on-chain:', err)
      throw new Error(`Failed to read treasury balances on-chain: ${err?.message || err}`)
    }
  }

  async analyzeAndDecide(treasury: { usdc: number; eurc: number }): Promise<{
    shouldAct: boolean; action: string; reasoning: string; proposedAmount?: number
  }> {
    const rawContentRef = { content: '{}' };
    try {
      const response = await groq.chat.completions.create({
        model: 'qwen/qwen3.6-27b',
        messages: [
          { role: 'system', content: 'You are SynArc Treasury Agent. You are a helpful treasury and governance analyst. Keep your reasoning and thinking process extremely concise. Your thinking process inside <think> tags MUST be under 100 words. Always respond with a single valid JSON object containing: shouldAct, action, reasoning, proposedAmount. Respond ONLY with valid JSON. Do not include markdown formatting or extra text.' },
          {
            role: 'user',
            content: `Treasury: USDC=${treasury.usdc}, EURC=${treasury.eurc}.
Rules:
- USDC > 100 => bridge_to_ethereum (proposedAmount = 30% of USDC balance)
- USDC < 10 => emergency_funding (proposedAmount = 75 USDC)
- EURC > 50 => rebalance_eurc (proposedAmount = 40% of EURC balance)
- else => monitoring (proposedAmount = 0)

Respond in JSON format:
{
  "shouldAct": true,
  "action": "emergency_funding",
  "reasoning": "USDC balance is 0, which is below the 10 USDC threshold. Requesting emergency funding.",
  "proposedAmount": 75
}`
          },
        ],
        max_tokens: 2048,
        temperature: 0.2,
      })
      rawContentRef.content = response.choices[0].message.content || '{}';
      return tolerantParse(rawContentRef.content);
    } catch (apiErr) {
      console.error('[TreasuryAgent] API call or parse failed. Trying regex fallback:', apiErr);
      try {
        if (rawContentRef.content && rawContentRef.content !== '{}') {
          return fallbackTreasuryDecide(rawContentRef.content);
        }
      } catch (fallbackErr) {
        console.error('[TreasuryAgent] Regex fallback failed:', fallbackErr);
      }
      
      // Local rules fallback if AI fully failed
      if (treasury.usdc > 100) {
        return { shouldAct: true, action: 'bridge_to_ethereum', reasoning: `[Rule-based: AI rate-limited/unavailable] Treasury holds ${treasury.usdc} USDC — above 100 threshold. Proposing CCTP bridge to Ethereum Sepolia.`, proposedAmount: Math.floor(treasury.usdc * 0.3) }
      }
      if (treasury.usdc < 10) {
        return { shouldAct: true, action: 'emergency_funding', reasoning: `[Rule-based: AI rate-limited/unavailable] Treasury holds ${treasury.usdc} USDC — below 10 threshold. Proposing emergency funding request.`, proposedAmount: 50 }
      }
      if (treasury.eurc > 50) {
        return { shouldAct: true, action: 'rebalance_eurc', reasoning: `[Rule-based: AI rate-limited/unavailable] Treasury holds ${treasury.eurc} EURC — above 50 threshold. Proposing EURC rebalancing.`, proposedAmount: Math.floor(treasury.eurc * 0.4) }
      }
      return { shouldAct: false, action: 'monitoring', reasoning: `[Rule-based: AI rate-limited/unavailable] Treasury healthy (USDC: ${treasury.usdc}, EURC: ${treasury.eurc}). Continuing to monitor.` }
    }
  }

  async createRebalancingProposal(decision: { action: string; reasoning: string; proposedAmount?: number }): Promise<string> {
    const title = decision.action === 'bridge_to_ethereum'
      ? `Proposed by Treasury Agent — Bridge ${decision.proposedAmount} USDC`
      : `Proposed by Treasury Agent — Rebalancing: ${decision.action}`
    const description = `Proposed by Treasury Agent\n\nAUTONOMOUS AGENT PROPOSAL\nAction: ${decision.action}\nAmount: ${decision.proposedAmount || 0} USDC\nAgent: ${this.getAgentAddress()}\nTimestamp: ${new Date().toISOString()}\n\nAI Reasoning:\n${decision.reasoning}\n\nThis proposal was created autonomously by the SynArc Treasury Agent.`
    
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
        this.getAgentAddress() as `0x${string}`
      ],
    })
    await this.publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 120_000 })
    return txHash
  }

  async proposeReturnFunds(): Promise<string> {
    const cctp = new CCTPExecutor(this.privateKey)
    const balance = await cctp.getSepoliaUSDCBalance()
    if (balance <= 0) {
      throw new Error('No USDC funds on Ethereum Sepolia to return.')
    }

    const title = `Proposed by Treasury Agent — Return ${balance.toFixed(2)} USDC from Sepolia`
    const description = `Proposed by Treasury Agent\n\nAUTONOMOUS RETURN PROPOSAL\nAction: return_funds\nAmount: ${balance.toFixed(2)} USDC\nDestination: Agent Operating Treasury (${CONTRACTS.treasuryAgent})\nAgent: ${this.getAgentAddress()}\nTimestamp: ${new Date().toISOString()}\n\nThis proposal was created to return bridged stablecoin reserves back to the agent operating treasury on Arc Testnet via CCTP.`

    const txHash = await this.walletClient.writeContract({
      address: CONTRACTS.governor,
      abi: GOVERNOR_ABI,
      functionName: 'propose',
      args: [
        title,
        description,
        'TREASURY_REBALANCE',
        300n,
        0n,
        this.getAgentAddress() as `0x${string}`
      ],
    })
    await this.publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 120_000 })

    this.logAction({
      timestamp: new Date().toISOString(),
      action: 'return_funds',
      reasoning: `ADMIN INITIATED: Proposed return of ${balance.toFixed(2)} USDC from Ethereum Sepolia back to main Treasury. Governance Proposal created. Tx: ${txHash}`,
      txHash,
      status: 'pending',
      usdcAmount: balance
    })

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

      const agentAddr = this.getAgentAddress().toLowerCase()

      const startIdx = Math.max(1, Number(count) - 15)
      for (let i = startIdx; i <= Number(count); i++) {
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

          // Only execute agent's own rebalance proposals targeting this agent
          if ((title.includes('[AGENT]') || title.includes('Proposed by Treasury Agent')) && target.toLowerCase() === agentAddr) {
            console.log(`[TreasuryAgent] Found succeeded proposal #${i}: "${title}". Executing...`)

            try {
              // 1. Call execute on governor
              const execTx = await this.walletClient.writeContract({
                address: CONTRACTS.governor,
                abi: GOVERNOR_ABI,
                functionName: 'execute',
                args: [BigInt(i)],
              })
              await this.publicClient.waitForTransactionReceipt({ hash: execTx, timeout: 120_000 })
              console.log(`[TreasuryAgent] Governor executed proposal #${i}. Hash: ${execTx}`)

              // Wait a few seconds for blockchain settlement
              await new Promise(resolve => setTimeout(resolve, 5000))

              // 2. Trigger CCTP transfer
              const description = prop[3] || ""
              const isReturn = title.toLowerCase().includes('return') || description.toLowerCase().includes('return_funds')

              if (isReturn) {
                console.log(`[TreasuryAgent] Initiating reverse CCTP bridge to return funds to main Treasury...`)

                const liveAction: AgentAction = {
                  timestamp: new Date().toISOString(),
                  action: 'return_funds',
                  reasoning: `[CCTP Step 1/3] Succeeded return proposal #${i} executed on governor. Initializing Sepolia -> Arc transfer...`,
                  status: 'pending'
                }
                this.logAction(liveAction)

                const cctp = new CCTPExecutor(this.privateKey)

                // Callback to update actions log in real-time
                const onProgress = (msg: string) => {
                  liveAction.reasoning = msg
                  this.logAction(liveAction)
                }

                try {
                  // Query Sepolia USDC balance to return
                  const balance = await cctp.getSepoliaUSDCBalance()
                  if (balance <= 0) {
                    throw new Error('No USDC funds available on Ethereum Sepolia to return.')
                  }

                  liveAction.usdcAmount = balance
                  this.logAction(liveAction)

                  const bridgeRes = await cctp.bridgeToArc(balance, CONTRACTS.treasuryAgent, onProgress)
                  console.log(`[TreasuryAgent] CCTP return completed successfully. Hash: ${bridgeRes.burnTxHash}`)

                  liveAction.status = 'executed'
                  liveAction.txHash = bridgeRes.burnTxHash
                  liveAction.reasoning = `RETURN SUCCESSFUL: Succeeded return proposal #${i} executed on-chain. CCTP returned ${balance} USDC to main Treasury. Burn Tx: ${bridgeRes.burnTxHash}, Mint Tx: ${bridgeRes.mintTxHash}`
                  this.logAction(liveAction)

                  executedTxHashes.push(bridgeRes.burnTxHash)
                } catch (bridgeErr: any) {
                  console.error('[TreasuryAgent] CCTP return failed:', bridgeErr)
                  liveAction.status = 'failed'
                  liveAction.reasoning = `CCTP return execution failed: ${bridgeErr?.message || bridgeErr}`
                  this.logAction(liveAction)
                }
              } else {
                const amountUsdc = Number(impact) / 1_000_000
                console.log(`[TreasuryAgent] Initiating CCTP bridge for ${amountUsdc} USDC to Ethereum Sepolia...`)

                // Log starting of CCTP
                const liveAction: AgentAction = {
                  timestamp: new Date().toISOString(),
                  action: 'bridge_to_ethereum',
                  reasoning: `[CCTP Step 1/3] Succeeded proposal #${i} executed on governor. Initializing CCTP transfer...`,
                  status: 'pending',
                  usdcAmount: amountUsdc
                }
                this.logAction(liveAction)

                const cctp = new CCTPExecutor(this.privateKey)

                // Callback to update actions log in real-time
                const onProgress = (msg: string) => {
                  liveAction.reasoning = msg
                  this.logAction(liveAction)
                }

                try {
                  const bridgeRes = await cctp.bridgeToEthereum(amountUsdc, this.account.address, onProgress)
                  console.log(`[TreasuryAgent] CCTP bridge completed successfully. Hash: ${bridgeRes.burnTxHash}`)

                  liveAction.status = 'executed'
                  liveAction.txHash = bridgeRes.burnTxHash
                  liveAction.reasoning = `AUTONOMOUS EXECUTION SUCCESSFUL: Succeeded rebalancing proposal #${i} executed on-chain. CCTP bridged ${amountUsdc} USDC to Ethereum Sepolia. Burn Tx: ${bridgeRes.burnTxHash}, Mint Tx: ${bridgeRes.mintTxHash}`
                  this.logAction(liveAction)

                  executedTxHashes.push(bridgeRes.burnTxHash)
                } catch (bridgeErr: any) {
                  console.error('[TreasuryAgent] CCTP bridge failed:', bridgeErr)
                  liveAction.status = 'failed'
                  liveAction.reasoning = `CCTP bridge execution failed: ${bridgeErr?.message || bridgeErr}`
                  this.logAction(liveAction)
                }
              }
            } catch (proposalExecErr: any) {
              console.error(`[TreasuryAgent] Failed to execute succeeded proposal #${i}:`, proposalExecErr?.message || proposalExecErr)
            }
          }
        }
      }
    } catch (err) {
      console.error('[TreasuryAgent] Failed to check/execute succeeded proposals:', err)
    }
    return executedTxHashes
  }

  /**
   * Scans and autonomously votes FOR active rebalance proposals on-chain
   */
  async voteOnActiveProposals(): Promise<void> {
    try {
      const count = await this.publicClient.readContract({
        address: CONTRACTS.governor,
        abi: GOVERNOR_ABI,
        functionName: 'proposalCount'
      })

      const agentAddr = this.getAgentAddress().toLowerCase()

      const startIdx = Math.max(1, Number(count) - 15)
      for (let i = startIdx; i <= Number(count); i++) {
        const state = await this.publicClient.readContract({
          address: CONTRACTS.governor,
          abi: GOVERNOR_ABI,
          functionName: 'state',
          args: [BigInt(i)]
        })

        // State 1 = Active
        if (Number(state) === 1) {
          const prop = await this.publicClient.readContract({
            address: CONTRACTS.governor,
            abi: GOVERNOR_ABI,
            functionName: 'getProposal',
            args: [BigInt(i)]
          }) as any

          const title = prop[2]
          const target = prop[14]

          // Only vote on agent's own rebalance proposals targeting this agent
          if ((title.includes('[AGENT]') || title.includes('Proposed by Treasury Agent')) && target.toLowerCase() === agentAddr) {
            const voted = await this.publicClient.readContract({
              address: CONTRACTS.governor,
              abi: GOVERNOR_ABI,
              functionName: 'hasVoted',
              args: [BigInt(i), this.account.address]
            })

            if (!voted) {
              console.log(`[TreasuryAgent] Proactively voting FOR active proposal #${i}...`)
              
              const voteTx = await this.walletClient.writeContract({
                address: CONTRACTS.governor,
                abi: parseAbi(['function castVote(uint256 proposalId, uint8 support) external returns (uint256)']),
                functionName: 'castVote',
                args: [BigInt(i), 1], // 1 = FOR
              })
              await this.publicClient.waitForTransactionReceipt({ hash: voteTx, timeout: 120_000 })
              console.log(`[TreasuryAgent] Vote casted successfully. Hash: ${voteTx}`)

              this.logAction({
                timestamp: new Date().toISOString(),
                action: 'vote_for_proposal',
                reasoning: `AUTONOMOUS VOTE: Casted FOR vote on active governance proposal #${i} ("${title}").`,
                txHash: voteTx,
                status: 'executed'
              })
            }
          }
        }
      }
    } catch (err) {
      console.error('[TreasuryAgent] Failed to check/vote active proposals:', err)
    }
  }

  logAction(action: AgentAction) {
    this.actions = this.loadActions()
    
    // De-duplicate actions to prevent duplicates if we are updating step status
    const existingIndex = this.actions.findIndex(
      a => a.action === action.action && a.status === 'pending'
    )
    if (existingIndex >= 0) {
      this.actions[existingIndex] = action
    } else {
      this.actions.unshift(action)
    }
    
    if (this.actions.length > 50) this.actions.pop()
    this.saveActions(this.actions)
  }

  async run(): Promise<AgentAction> {
    if (this.privateKey === '0x0000000000000000000000000000000000000000000000000000000000000001') {
      throw new Error('AGENT_PRIVATE_KEY environment variable is not set. Silent fallback disabled.')
    }

    const cooldown = 15000 // 15 seconds
    if (Date.now() - this.lastExecutionTime < cooldown) {
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil((cooldown - (Date.now() - this.lastExecutionTime)) / 1000)}s before triggering the agent again.`)
    }
    this.lastExecutionTime = Date.now()

    const startTime = new Date().toISOString()
    try {
      // Check if the agent is paused on-chain before running
      try {
        const isPaused = await this.publicClient.readContract({
          address: this.getAgentAddress(),
          abi: parseAbi(['function paused() view returns (bool)']),
          functionName: 'paused'
        })
        if (isPaused) {
          console.log('[TreasuryAgent] Agent is paused on-chain. Skipping execution.')
          const pauseAction: AgentAction = {
            timestamp: startTime,
            action: 'monitoring',
            reasoning: 'Agent execution skipped: The Treasury Agent is currently paused on-chain via the emergency stop toggle.',
            status: 'executed'
          }
          this.logAction(pauseAction)
          return pauseAction
        }
      } catch (pauseErr) {
        console.warn('[TreasuryAgent] Failed to check on-chain paused state:', pauseErr)
      }

      // 1. Execute any succeeded proposals first (autonomous execution)
      const executedTxHashes = await this.executeSucceededProposals()
      if (executedTxHashes.length > 0) {
        return this.loadActions()[0]
      }

      // 2. Vote on any active proposals autonomously
      await this.voteOnActiveProposals()

      // 2.5 Sync balance of the agent operating treasury first
      try {
        console.log('[TreasuryAgent] Syncing on-chain balances for the agent operating treasury...')
        const syncTx = await this.walletClient.writeContract({
          address: CONTRACTS.treasuryAgent,
          abi: parseAbi(['function syncBalance() external']),
          functionName: 'syncBalance',
          args: []
        })
        console.log(`[TreasuryAgent] Balance sync transaction submitted: ${syncTx}`)
        await this.publicClient.waitForTransactionReceipt({ hash: syncTx, timeout: 60_000 })
        console.log('[TreasuryAgent] Balance sync completed successfully.')
      } catch (syncErr) {
        console.warn('[TreasuryAgent] Failed to sync operating treasury balances:', syncErr)
      }

      // 3. Check treasury and proposal creation rules
      const treasury = await this.checkTreasury()
      
      // Local check: if treasury is healthy, skip calling AI to prevent free-tier rate limits
      let decision;
      if (treasury.usdc >= 10 && treasury.usdc <= 100 && treasury.eurc <= 50) {
        console.log('[TreasuryAgent] Local health check passed. Skipping AI call.')
        decision = {
          shouldAct: false,
          action: 'monitoring',
          reasoning: `Treasury healthy (USDC: ${treasury.usdc}, EURC: ${treasury.eurc}). Continuing to monitor.`
        }
      } else {
        decision = await this.analyzeAndDecide(treasury)
      }
      
      if (!decision.shouldAct) {
        const action: AgentAction = { timestamp: startTime, action: 'monitoring', reasoning: decision.reasoning, status: 'executed' }
        this.logAction(action)
        return action
      }
      
      let txHash: string | undefined
      try {
        txHash = await this.createRebalancingProposal(decision)
      } catch (propErr: any) {
        console.error('[TreasuryAgent] Failed to create rebalance proposal:', propErr)
        const failedAction: AgentAction = { timestamp: startTime, action: decision.action, reasoning: decision.reasoning + ` [Failed to create proposal on-chain: ${propErr?.message || propErr}]`, status: 'failed', usdcAmount: decision.proposedAmount }
        this.logAction(failedAction)
        return failedAction
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

  async getSepoliaBalance(): Promise<number> {
    try {
      const cctp = new CCTPExecutor(this.privateKey)
      return await cctp.getSepoliaUSDCBalance()
    } catch (err) {
      console.error('[TreasuryAgent] Failed to check Sepolia USDC balance:', err)
      return 0
    }
  }

  async triggerReturnFunds(): Promise<void> {
    const startTime = new Date().toISOString()
    const returnAction: AgentAction = {
      timestamp: startTime,
      action: 'return_funds',
      reasoning: '[CCTP Step 1/3] Return funds process triggered by administrator. Initializing Sepolia -> Arc transfer...',
      status: 'pending'
    }
    this.logAction(returnAction)

    try {
      const cctp = new CCTPExecutor(this.privateKey)
      
      // 1. Get Sepolia USDC Balance
      const balance = await cctp.getSepoliaUSDCBalance()
      if (balance <= 0) {
        throw new Error('No USDC funds available on Ethereum Sepolia for the Treasury Agent.')
      }

      returnAction.usdcAmount = balance
      this.logAction(returnAction)

      // Callback to update progress log in actions DB
      const onProgress = (msg: string) => {
        returnAction.reasoning = msg
        this.logAction(returnAction)
      }

      // Main Treasury contract is the recipient of the returned funds
      const treasuryAddress = CONTRACTS.treasury

      // 2. Run the bridge
      const bridgeRes = await cctp.bridgeToArc(balance, treasuryAddress, onProgress)
      
      returnAction.status = 'executed'
      returnAction.txHash = bridgeRes.burnTxHash
      returnAction.reasoning = `RETURN SUCCESSFUL: Successfully returned ${balance} USDC from Ethereum Sepolia back to the main Treasury contract on Arc Testnet via CCTP. Burn Tx: ${bridgeRes.burnTxHash}, Mint Tx: ${bridgeRes.mintTxHash}`
      this.logAction(returnAction)
    } catch (err: any) {
      console.error('[TreasuryAgent] returnFunds failed:', err)
      returnAction.status = 'failed'
      returnAction.reasoning = `Return funds failed: ${err?.message || err}`
      this.logAction(returnAction)
    }
  }

  getRecentActions(): AgentAction[] {
    return this.loadActions()
  }

  getAgentAddress(): string {
    return process.env.NEXT_PUBLIC_AGENT_ADDRESS || this.account.address
  }
}

export const treasuryAgent = new TreasuryAgent()

// Start autonomous background loop if running in Node.js server environment
if (typeof window === 'undefined' && process.env.TEST_TICK !== 'true') {
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    console.log('[TreasuryAgent] Background loop disabled in development mode to prevent rate limits.')
  } else {
    const interval = 300000 // 5 minutes in production
    console.log(`[TreasuryAgent] Initializing autonomous background loop (every ${interval / 1000}s)...`)
    setTimeout(() => {
      setInterval(async () => {
        try {
          console.log('[TreasuryAgent] Running autonomous background tick...')
          await treasuryAgent.run()
        } catch (err) {
          console.error('[TreasuryAgent] Error in autonomous background tick:', err)
        }
      }, interval)
    }, 10000)
  }
}
