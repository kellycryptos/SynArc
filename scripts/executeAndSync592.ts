import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { createPublicClient, createWalletClient, http, fallback, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet, ARC_RPC_URLS, CONTRACTS } from '../lib/arc-config'

const GOVERNOR_ABI = parseAbi([
  'function execute(uint256 proposalId) external payable',
  'function state(uint256 proposalId) view returns (uint8)'
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

  const agentTreasury = CONTRACTS.treasuryAgent
  const proposalId = 592n

  console.log(`Checking state of Proposal #${proposalId}...`)
  const stateVal = await publicClient.readContract({
    address: CONTRACTS.governor,
    abi: GOVERNOR_ABI,
    functionName: 'state',
    args: [proposalId]
  })
  console.log(`Proposal State: ${STATE_NAMES[stateVal]}`)

  if (stateVal === 4) { // Succeeded
    console.log('\n=== Executing the Proposal ===')
    const executeTx = await walletClient.writeContract({
      address: CONTRACTS.governor,
      abi: GOVERNOR_ABI,
      functionName: 'execute',
      args: [proposalId]
    })
    console.log('Execution Tx Hash:', executeTx)
    await publicClient.waitForTransactionReceipt({ hash: executeTx, timeout: 60_000 })
    console.log('Proposal Executed successfully!')

    console.log('\n=== Syncing Balance on Agent Operating Treasury ===')
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
  } else {
    console.log(`Proposal is in ${STATE_NAMES[stateVal]} state. Cannot execute yet.`)
  }
}

main().catch(console.error)
