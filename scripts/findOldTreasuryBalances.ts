import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
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

function findEthAddressesInDir(dir: string, addresses = new Set<string>()): Set<string> {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'dist' || file === 'cache') continue
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      findEthAddressesInDir(fullPath, addresses)
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.json') || file.endsWith('.env') || file.endsWith('.local') || file.endsWith('.md'))) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8')
        const matches = content.match(/0x[a-fA-F0-9]{40}/g)
        if (matches) {
          matches.forEach(addr => addresses.add(addr.toLowerCase()))
        }
      } catch (e) {}
    }
  }
  return addresses
}

async function main() {
  const key = (process.env.FAUCET_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY) as `0x${string}`
  const account = privateKeyToAccount(key.startsWith('0x') ? key : `0x${key}`)
  const transport = fallback(ARC_RPC_URLS.map(url => http(url)))
  const publicClient = createPublicClient({ chain: arcTestnet, transport })

  const usdcAddress = '0x3600000000000000000000000000000000000000' as const

  console.log('=== Scanning Workspace for ETH Addresses ===')
  const workspaceRoot = path.join(__dirname, '..')
  const rawAddresses = Array.from(findEthAddressesInDir(workspaceRoot))
  console.log(`Found ${rawAddresses.length} candidate addresses in codebase.`)

  // Exclude known zero or system addresses
  const filtered = rawAddresses.filter(addr => 
    addr !== '0x0000000000000000000000000000000000000000' &&
    addr !== '0x0000000000000000000000000000000000000001' &&
    addr !== usdcAddress.toLowerCase()
  )

  console.log(`Checking USDC balance for ${filtered.length} unique addresses on Arc Testnet...\n`)

  const resultsWithBalance: { address: string; balUSDC: number; trackedUsdc?: number; isContract?: boolean; role?: string }[] = []

  for (const addr of filtered) {
    try {
      const bal = await publicClient.readContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [addr as `0x${string}`]
      })
      const usdcVal = Number(bal) / 1_000_000
      
      let trackedVal: number | undefined = undefined
      let role: string | undefined = undefined

      try {
        const tracked = await publicClient.readContract({
          address: addr as `0x${string}`,
          abi: TREASURY_ABI,
          functionName: 'usdcBalance'
        })
        trackedVal = Number(tracked) / 1_000_000
      } catch (e) {}

      if (addr === CONTRACTS.treasuryGovernance.toLowerCase()) role = 'Current Governance Treasury'
      if (addr === CONTRACTS.treasuryAgent.toLowerCase()) role = 'Current Agent Operating Treasury'
      if (addr === (process.env.NEXT_PUBLIC_AGENT_ADDRESS || '').toLowerCase()) role = 'Current Agent Smart Account'
      if (addr === account.address.toLowerCase()) role = 'Deployer/Executor EOA'

      if (usdcVal > 0 || (trackedVal !== undefined && trackedVal > 0)) {
        resultsWithBalance.push({
          address: addr,
          balUSDC: usdcVal,
          trackedUsdc: trackedVal,
          role
        })
      }
    } catch (err) {}
  }

  console.log('====================================================')
  console.log('=== ADDRESSES WITH USDC BALANCE FOUND ===')
  console.log('====================================================')
  for (const item of resultsWithBalance) {
    console.log(`Address: ${item.address} ${item.role ? `(${item.role})` : ''}`)
    console.log(`  - Direct ERC20 USDC Balance: ${item.balUSDC} USDC`)
    if (item.trackedUsdc !== undefined) {
      console.log(`  - Tracked Contract usdcBalance(): ${item.trackedUsdc} USDC`)
    }
    console.log('----------------------------------------------------')
  }
}

main().catch(console.error)
