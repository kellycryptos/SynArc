import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { createPublicClient, createWalletClient, http, fallback, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet, ARC_RPC_URLS, CONTRACTS } from '../lib/arc-config'

const ERC20_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address recipient, uint256 amount) returns (bool)'
])

const TREASURY_ABI = parseAbi([
  'function usdcBalance() view returns (uint256)',
  'function withdraw(address recipient, uint256 amount) external',
  'function syncBalance() external',
  'function owner() view returns (address)',
  'function governor() view returns (address)',
  'function agentAddress() view returns (address)'
])

async function main() {
  const key = (process.env.FAUCET_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY) as `0x${string}`
  const account = privateKeyToAccount(key.startsWith('0x') ? key : `0x${key}`)
  const transport = fallback(ARC_RPC_URLS.map(url => http(url)))
  const publicClient = createPublicClient({ chain: arcTestnet, transport })
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport })

  const usdcAddress = '0x3600000000000000000000000000000000000000' as const
  const govTreasury = CONTRACTS.treasuryGovernance
  const legacyTreasury = '0x302D7cba3553e22E24C7A5C9aFee3942EBC6ea63' as `0x${string}`

  console.log('====================================================')
  console.log('=== SWEEPING LEGACY TREASURY (0x302D7cba...) ===')
  console.log('====================================================')

  const legacyBal = await publicClient.readContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [legacyTreasury]
  })

  console.log(`Legacy Treasury USDC Balance: ${Number(legacyBal) / 1_000_000} USDC (${legacyBal} units)`)

  if (legacyBal > 0n) {
    const owner = await publicClient.readContract({ address: legacyTreasury, abi: TREASURY_ABI, functionName: 'owner' }).catch(() => null)
    const governor = await publicClient.readContract({ address: legacyTreasury, abi: TREASURY_ABI, functionName: 'governor' }).catch(() => null)
    const agentAddress = await publicClient.readContract({ address: legacyTreasury, abi: TREASURY_ABI, functionName: 'agentAddress' }).catch(() => null)

    console.log(`Legacy Config - Owner: ${owner}, Governor: ${governor}, AgentAddress: ${agentAddress}`)

    // Try withdraw call
    try {
      const txHash = await walletClient.writeContract({
        address: legacyTreasury,
        abi: TREASURY_ABI,
        functionName: 'withdraw',
        args: [govTreasury, legacyBal],
        gas: 500000n
      })
      console.log(`Withdraw Tx Hash: ${txHash}`)
      await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 })
      console.log('Legacy Treasury USDC successfully transferred to Main Governance Treasury!')
    } catch (err: any) {
      console.warn('Withdraw from legacy treasury failed:', err?.message || err)
    }
  }

  // Sync Governance Treasury balance
  console.log('\nSyncing Governance Treasury balance on-chain...')
  const syncTx = await walletClient.writeContract({
    address: govTreasury,
    abi: TREASURY_ABI,
    functionName: 'syncBalance',
    args: [],
    gas: 300000n
  })
  console.log(`Sync Tx Hash: ${syncTx}`)
  await publicClient.waitForTransactionReceipt({ hash: syncTx, timeout: 60_000 })

  const finalGovBal = await publicClient.readContract({ address: usdcAddress, abi: ERC20_ABI, functionName: 'balanceOf', args: [govTreasury] })
  const finalGovTracked = await publicClient.readContract({ address: govTreasury, abi: TREASURY_ABI, functionName: 'usdcBalance' })

  console.log('====================================================')
  console.log('=== FINAL GOVERNANCE TREASURY VERIFICATION ===')
  console.log('====================================================')
  console.log(`Governance Treasury Direct USDC Balance: ${Number(finalGovBal) / 1_000_000} USDC`)
  console.log(`Governance Treasury Tracked usdcBalance: ${Number(finalGovTracked) / 1_000_000} USDC`)
  console.log('====================================================')
}

main().catch(console.error)
