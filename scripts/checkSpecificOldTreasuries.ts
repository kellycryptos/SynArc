import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { createPublicClient, createWalletClient, http, fallback, parseAbi, parseUnits, encodeFunctionData } from 'viem'
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

const AGENT_ABI = parseAbi([
  'function owner() view returns (address)',
  'function executor() view returns (address)',
  'function maxRebalanceAmount() view returns (uint256)',
  'function executeYieldStrategy(address targetContract, address token, uint256 amount, bytes calldata data) external'
])

async function main() {
  const key = (process.env.FAUCET_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY) as `0x${string}`
  const account = privateKeyToAccount(key.startsWith('0x') ? key : `0x${key}`)
  const transport = fallback(ARC_RPC_URLS.map(url => http(url)))
  const publicClient = createPublicClient({ chain: arcTestnet, transport })
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport })

  const usdcAddress = '0x3600000000000000000000000000000000000000' as const
  const govTreasury = CONTRACTS.treasuryGovernance

  const targets = [
    { name: 'Agent Operating Treasury Contract', address: '0xE6bAC65d7f060B805B8dd6f1c4DBfa6571905f28' as `0x${string}` },
    { name: 'Agent Smart Account / Wallet', address: '0x88BdF819466C1802ce6C780a9fbdF3A314cab07D' as `0x${string}` },
    { name: 'Legacy Agent Treasury Address', address: '0x302D7cba3553e22E24C7A5C9aFee3942EBC6ea63' as `0x${string}` },
    { name: 'Deployer / Executor EOA', address: account.address },
  ]

  console.log('====================================================')
  console.log('=== CHECKING ALL AGENT & TREASURY WALLET BALANCES ===')
  console.log('====================================================')

  let totalAvailableUSDC = 0n

  for (const t of targets) {
    try {
      const bal = await publicClient.readContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [t.address]
      })
      const numBal = Number(bal) / 1_000_000
      console.log(`- ${t.name} (${t.address}): ${numBal} USDC (${bal.toString()} units)`)
      
      let tracked = 0n
      try {
        tracked = await publicClient.readContract({
          address: t.address,
          abi: TREASURY_ABI,
          functionName: 'usdcBalance'
        })
        console.log(`  -> Tracked usdcBalance(): ${Number(tracked) / 1_000_000} USDC`)
      } catch (e) {}

      if (t.address.toLowerCase() !== govTreasury.toLowerCase() && (bal > 0n || tracked > 0n)) {
        totalAvailableUSDC += bal
      }
    } catch (err: any) {
      console.log(`- ${t.name} (${t.address}): Error - ${err?.message || err}`)
    }
  }

  console.log('----------------------------------------------------')
  console.log(`Total non-governance treasury USDC available: ${Number(totalAvailableUSDC) / 1_000_000} USDC`)
  console.log('----------------------------------------------------')

  // Check Agent Operating Treasury (0xE6bAC65d7f060B805B8dd6f1c4DBfa6571905f28) which has 25 USDC
  const agentTreasury = '0xE6bAC65d7f060B805B8dd6f1c4DBfa6571905f28' as `0x${string}`
  const agentTreasuryBal = await publicClient.readContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [agentTreasury]
  })

  if (agentTreasuryBal > 0n) {
    console.log(`\nFound ${Number(agentTreasuryBal) / 1_000_000} USDC in Agent Operating Treasury (${agentTreasury}). Transferring to Main Governance Treasury...`)
    try {
      const tx = await walletClient.writeContract({
        address: agentTreasury,
        abi: TREASURY_ABI,
        functionName: 'withdraw',
        args: [govTreasury, agentTreasuryBal],
        gas: 500000n
      })
      console.log(`Withdraw Tx Hash: ${tx}`)
      await publicClient.waitForTransactionReceipt({ hash: tx, timeout: 60_000 })
      console.log('Successfully transferred funds from Agent Operating Treasury to Governance Treasury!')
    } catch (err: any) {
      console.warn('Withdraw from Agent Operating Treasury failed:', err?.message || err)
    }
  }

  // Check Agent Smart Account (0x88BdF819466C1802ce6C780a9fbdF3A314cab07D) which has 46 USDC
  const agentWallet = '0x88BdF819466C1802ce6C780a9fbdF3A314cab07D' as `0x${string}`
  const agentWalletBal = await publicClient.readContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [agentWallet]
  })

  if (agentWalletBal > 0n) {
    console.log(`\nFound ${Number(agentWalletBal) / 1_000_000} USDC in Agent Wallet (${agentWallet}). Transferring to Main Governance Treasury...`)
    try {
      const transferCalldata = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [govTreasury, agentWalletBal]
      })

      const execTx = await walletClient.writeContract({
        address: agentWallet,
        abi: AGENT_ABI,
        functionName: 'executeYieldStrategy',
        args: [usdcAddress, usdcAddress, agentWalletBal, transferCalldata],
        gas: 500000n
      })
      console.log(`Execute Yield Strategy Tx Hash: ${execTx}`)
      await publicClient.waitForTransactionReceipt({ hash: execTx, timeout: 60_000 })
      console.log('Successfully transferred remaining funds from Agent Wallet to Governance Treasury!')
    } catch (err: any) {
      console.warn('Transfer from Agent Wallet failed:', err?.message || err)
    }
  }

  // Sync Governance Treasury
  console.log('\nSyncing Governance Treasury balance...')
  const syncTx = await walletClient.writeContract({
    address: govTreasury,
    abi: TREASURY_ABI,
    functionName: 'syncBalance',
    args: [],
    gas: 300000n
  })
  console.log(`Sync Tx Hash: ${syncTx}`)
  await publicClient.waitForTransactionReceipt({ hash: syncTx, timeout: 60_000 })

  // Final verification
  const finalGovBal = await publicClient.readContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [govTreasury]
  })
  const finalGovTracked = await publicClient.readContract({
    address: govTreasury,
    abi: TREASURY_ABI,
    functionName: 'usdcBalance'
  })

  console.log('====================================================')
  console.log('=== FINAL GOVERNANCE TREASURY BALANCES ===')
  console.log('====================================================')
  console.log(`Governance Treasury Direct USDC: ${Number(finalGovBal) / 1_000_000} USDC`)
  console.log(`Governance Treasury Tracked usdcBalance: ${Number(finalGovTracked) / 1_000_000} USDC`)
  console.log('====================================================')
}

main().catch(console.error)
