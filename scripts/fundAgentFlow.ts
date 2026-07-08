import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { createPublicClient, createWalletClient, http, fallback, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet, ARC_RPC_URLS, CONTRACTS } from '../lib/arc-config'

const GOVERNOR_ABI = parseAbi([
  'function propose(string title, string description, string category, uint256 votingDuration, uint256 treasuryImpactValue, address executionTarget) returns (uint256)',
  'function castVote(uint256 proposalId, uint8 support) external returns (uint256)',
  'function execute(uint256 proposalId) external payable',
  'function state(uint256 proposalId) view returns (uint8)',
  'function proposalCount() view returns (uint256)',
  'function executionDelay() view returns (uint256)',
  'function getProposal(uint256 proposalId) view returns (uint256 id, address proposer, string title, string description, string category, uint256 votingDuration, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed, uint256 treasuryImpactValue, address executionTarget)'
])

const TREASURY_ABI = parseAbi([
  'function usdcBalance() view returns (uint256)',
  'function syncBalance() external',
])

const STATE_NAMES = ["Pending", "Active", "Canceled", "Defeated", "Succeeded", "Queued", "Expired", "Executed"]

async function main() {
  const key = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`
  if (!key) {
    throw new Error('DEPLOYER_PRIVATE_KEY is missing')
  }
  const account = privateKeyToAccount(key)
  const transport = fallback(ARC_RPC_URLS.map(url => http(url)))
  const publicClient = createPublicClient({ chain: arcTestnet, transport })
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport })

  // Read dynamically from CONFIG so it is pointing to the correct, newly deployed agent treasury
  const agentTreasury = CONTRACTS.treasuryAgent
  const transferAmount = 5000000n // 5 USDC (6 decimals)

  console.log(`=== Step 1: Submitting Governance Proposal to Fund New Agent (${agentTreasury}) with 5 USDC ===`)
  const title = '[AGENT] Fund New Agent Treasury with 5 USDC'
  const description = `Transfer 5 USDC from Governance Treasury to the newly deployed Agent Operating Treasury (${agentTreasury}) for rebalance activities.`
  
  const proposeTx = await walletClient.writeContract({
    address: CONTRACTS.governor,
    abi: GOVERNOR_ABI,
    functionName: 'propose',
    args: [
      title,
      description,
      'TREASURY_REBALANCE',
      300n, // 5 minutes voting duration
      transferAmount,
      agentTreasury
    ]
  })
  console.log('Proposal Tx Hash:', proposeTx)
  console.log('Waiting for block confirmation...')
  await publicClient.waitForTransactionReceipt({ hash: proposeTx, timeout: 60_000 })

  const proposalCount = await publicClient.readContract({
    address: CONTRACTS.governor,
    abi: GOVERNOR_ABI,
    functionName: 'proposalCount'
  })
  const proposalId = proposalCount
  console.log(`Created Proposal ID: ${proposalId}`)

  // Wait a couple of seconds for the block state to update
  await new Promise(resolve => setTimeout(resolve, 3000))

  console.log('\n=== Step 2: Casting Vote in Favor ===')
  const voteTx = await walletClient.writeContract({
    address: CONTRACTS.governor,
    abi: GOVERNOR_ABI,
    functionName: 'castVote',
    args: [proposalId, 1] // 1 = For
  })
  console.log('Vote Tx Hash:', voteTx)
  await publicClient.waitForTransactionReceipt({ hash: voteTx, timeout: 60_000 })
  console.log('Vote registered successfully!')

  // Check state
  const stateVal = await publicClient.readContract({
    address: CONTRACTS.governor,
    abi: GOVERNOR_ABI,
    functionName: 'state',
    args: [proposalId]
  })
  console.log(`Current Proposal State: ${STATE_NAMES[stateVal]}`)

  const proposalInfo = await publicClient.readContract({
    address: CONTRACTS.governor,
    abi: GOVERNOR_ABI,
    functionName: 'getProposal',
    args: [proposalId]
  }) as any

  const executionDelayVal = await publicClient.readContract({
    address: CONTRACTS.governor,
    abi: GOVERNOR_ABI,
    functionName: 'executionDelay'
  })

  const endTime = Number(proposalInfo[7])
  console.log(`\n=== Step 3: Timelock & Execution Eligibility ===`)
  console.log(`Voting ends at: ${new Date(endTime * 1000).toISOString()}`)
  console.log(`Governor execution delay (timelock): ${Number(executionDelayVal)} seconds`)
  
  // Wait for proposal voting to end + timelock delay to elapse
  const now = Math.floor(Date.now() / 1000)
  const waitSecs = (endTime + Number(executionDelayVal)) - now
  if (waitSecs > 0) {
    console.log(`Waiting for ${waitSecs} seconds until voting concludes and the ${Number(executionDelayVal)}s timelock expires...`)
    await new Promise(resolve => setTimeout(resolve, (waitSecs + 5) * 1000))
  }

  // Check state again
  const finalStateVal = await publicClient.readContract({
    address: CONTRACTS.governor,
    abi: GOVERNOR_ABI,
    functionName: 'state',
    args: [proposalId]
  })
  console.log(`Updated Proposal State: ${STATE_NAMES[finalStateVal]}`)

  if (finalStateVal !== 4) {
    throw new Error(`Proposal is not in Succeeded state. Current state: ${STATE_NAMES[finalStateVal]}`)
  }

  console.log('\n=== Step 4: Executing the Proposal ===')
  const executeTx = await walletClient.writeContract({
    address: CONTRACTS.governor,
    abi: GOVERNOR_ABI,
    functionName: 'execute',
    args: [proposalId]
  })
  console.log('Execution Tx Hash:', executeTx)
  await publicClient.waitForTransactionReceipt({ hash: executeTx, timeout: 60_000 })
  console.log('Proposal Executed successfully!')

  console.log('\n=== Step 5: Syncing Balance on Agent Operating Treasury ===')
  const beforeAgentUsdc = await publicClient.readContract({
    address: agentTreasury,
    abi: TREASURY_ABI,
    functionName: 'usdcBalance'
  })
  console.log('Agent Treasury tracked USDC balance BEFORE sync:', Number(beforeAgentUsdc) / 1_000_000, 'USDC')

  const syncTx = await walletClient.writeContract({
    address: agentTreasury,
    abi: TREASURY_ABI,
    functionName: 'syncBalance',
    args: [],
    gas: 500000n // explicit gas limit
  })
  console.log('Sync Tx Hash:', syncTx)
  await publicClient.waitForTransactionReceipt({ hash: syncTx, timeout: 60_000 })
  
  const afterAgentUsdc = await publicClient.readContract({
    address: agentTreasury,
    abi: TREASURY_ABI,
    functionName: 'usdcBalance'
  })
  console.log('Agent Treasury tracked USDC balance AFTER sync:', Number(afterAgentUsdc) / 1_000_000, 'USDC')

  console.log('\n=== Step 6: Verification Complete! ===')
}

main().catch(console.error)
