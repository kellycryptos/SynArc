import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { createPublicClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet, CONTRACTS } from '../lib/arc-config'

const GOVERNOR_ABI = parseAbi([
  'function propose(string title, string description, string category, uint256 votingDuration, uint256 treasuryImpactValue, address executionTarget) returns (uint256)'
])

async function main() {
  const key = (process.env.DEPLOYER_PRIVATE_KEY) as `0x${string}`
  if (!key) {
    throw new Error('DEPLOYER_PRIVATE_KEY not defined')
  }
  const account = privateKeyToAccount(key)
  const client = createPublicClient({ chain: arcTestnet, transport: http() })

  const title = '[AGENT] Bridge 88 USDC to Ethereum via CCTP'
  const description = 'AI Reasoning:\nTreasury holds 294 USDC — above 100 threshold.'
  const agentAddress = '0x88BdF819466C1802ce6C780a9fbdF3A314cab07D'
  
  console.log('Estimating gas for propose from:', account.address)
  
  try {
    const gasEst = await client.estimateContractGas({
      account,
      address: CONTRACTS.governor,
      abi: GOVERNOR_ABI,
      functionName: 'propose',
      args: [
        title,
        description,
        'TREASURY_REBALANCE',
        300n,
        88000000n,
        agentAddress as `0x${string}`
      ],
    })
    console.log('Estimated Gas:', gasEst.toString())
  } catch (err: any) {
    console.error('Gas estimation FAILED!')
    console.error(err)
  }
}

main().catch(console.error)
