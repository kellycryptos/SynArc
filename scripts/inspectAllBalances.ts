import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { createPublicClient, http, fallback, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet, ARC_RPC_URLS, CONTRACTS } from '../lib/arc-config'

const ERC20_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function symbol() view returns (string)'
])

const TREASURY_ABI = parseAbi([
  'function usdcBalance() view returns (uint256)',
  'function owner() view returns (address)',
  'function governor() view returns (address)',
  'function agentAddress() view returns (address)'
])

async function main() {
  const key = (process.env.FAUCET_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY) as `0x${string}`
  const account = privateKeyToAccount(key)
  const transport = fallback(ARC_RPC_URLS.map(url => http(url)))
  const publicClient = createPublicClient({ chain: arcTestnet, transport })

  const usdcAddress = '0x3600000000000000000000000000000000000000' as const

  console.log('=== Checking Environment & Addresses ===')
  console.log('Deployer/Executor EOA:', account.address)
  console.log('Governance Treasury:', CONTRACTS.treasuryGovernance)
  console.log('Agent Treasury:', CONTRACTS.treasuryAgent)
  console.log('Agent Address (env):', process.env.NEXT_PUBLIC_AGENT_ADDRESS)

  const addrs = [
    { name: 'Deployer/Executor EOA', address: account.address },
    { name: 'Governance Treasury', address: CONTRACTS.treasuryGovernance },
    { name: 'Agent Operating Treasury', address: CONTRACTS.treasuryAgent },
    { name: 'Agent Address (env)', address: process.env.NEXT_PUBLIC_AGENT_ADDRESS as `0x${string}` }
  ]

  console.log('\n=== USDC Balances (Direct ERC20 standard token: 0x3600...) ===')
  for (const item of addrs) {
    if (!item.address) continue
    try {
      const bal = await publicClient.readContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [item.address]
      })
      console.log(`${item.name} (${item.address}): ${Number(bal) / 1_000_000} USDC (${bal.toString()} units)`)
    } catch (e: any) {
      console.log(`${item.name} (${item.address}): Error reading USDC balance - ${e?.message || e}`)
    }
  }

  console.log('\n=== Treasury Contract On-Chain Tracked State (`usdcBalance()`) ===')
  try {
    const govUsdc = await publicClient.readContract({
      address: CONTRACTS.treasuryGovernance,
      abi: TREASURY_ABI,
      functionName: 'usdcBalance'
    })
    console.log(`Governance Treasury tracked usdcBalance: ${Number(govUsdc) / 1_000_000} USDC`)
  } catch (e: any) {
    console.log('Gov treasury error:', e?.message)
  }

  try {
    const agentUsdc = await publicClient.readContract({
      address: CONTRACTS.treasuryAgent,
      abi: TREASURY_ABI,
      functionName: 'usdcBalance'
    })
    console.log(`Agent Treasury tracked usdcBalance: ${Number(agentUsdc) / 1_000_000} USDC`)
  } catch (e: any) {
    console.log('Agent treasury error:', e?.message)
  }
}

main().catch(console.error)
