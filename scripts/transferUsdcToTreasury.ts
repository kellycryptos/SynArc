import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { createPublicClient, createWalletClient, http, fallback, parseAbi, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet, ARC_RPC_URLS, CONTRACTS } from '../lib/arc-config'

const ERC20_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address recipient, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)'
])

const TREASURY_ABI = parseAbi([
  'function usdcBalance() view returns (uint256)',
  'function depositUSDC(uint256 amount) external',
  'function withdraw(address recipient, uint256 amount) external',
  'function syncBalance() external',
  'function owner() view returns (address)',
  'function governor() view returns (address)',
  'function agentAddress() view returns (address)'
])

async function main() {
  const key = (process.env.FAUCET_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY) as `0x${string}`
  if (!key) {
    throw new Error('Private key is missing')
  }
  const account = privateKeyToAccount(key.startsWith('0x') ? key : `0x${key}`)
  const transport = fallback(ARC_RPC_URLS.map(url => http(url)))
  const publicClient = createPublicClient({ chain: arcTestnet, transport })
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport })

  const usdcAddress = '0x3600000000000000000000000000000000000000' as const
  const govTreasury = CONTRACTS.treasuryGovernance
  const agentTreasury = CONTRACTS.treasuryAgent
  const agentSmartAccount = (process.env.NEXT_PUBLIC_AGENT_ADDRESS || '0x88BdF819466C1802ce6C780a9fbdF3A314cab07D') as `0x${string}`

  const targetAmountUSDC = 400
  const amountUnits = parseUnits(targetAmountUSDC.toString(), 6)

  console.log('====================================================')
  console.log(`[TRANSFER] Initializing Transfer of ${targetAmountUSDC} USDC to Governance Treasury`)
  console.log('====================================================')
  console.log('Signer / EOA Account:', account.address)
  console.log('Governance Treasury Contract:', govTreasury)
  console.log('Agent Operating Treasury Contract:', agentTreasury)
  console.log('Agent Smart Account:', agentSmartAccount)
  console.log('----------------------------------------------------')

  // 1. Fetch current balances
  const eoaUsdc = await publicClient.readContract({ address: usdcAddress, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] })
  const agentTreasuryUsdc = await publicClient.readContract({ address: usdcAddress, abi: ERC20_ABI, functionName: 'balanceOf', args: [agentTreasury] })
  const agentSmartAccUsdc = await publicClient.readContract({ address: usdcAddress, abi: ERC20_ABI, functionName: 'balanceOf', args: [agentSmartAccount] })
  const govTreasuryUsdcBefore = await publicClient.readContract({ address: usdcAddress, abi: ERC20_ABI, functionName: 'balanceOf', args: [govTreasury] })
  const govTrackedBefore = await publicClient.readContract({ address: govTreasury, abi: TREASURY_ABI, functionName: 'usdcBalance' }).catch(() => 0n)

  console.log('--- Initial USDC Balances (Direct ERC20) ---')
  console.log(`EOA Account (${account.address}): ${Number(eoaUsdc) / 1_000_000} USDC`)
  console.log(`Agent Operating Treasury (${agentTreasury}): ${Number(agentTreasuryUsdc) / 1_000_000} USDC`)
  console.log(`Agent Smart Account (${agentSmartAccount}): ${Number(agentSmartAccUsdc) / 1_000_000} USDC`)
  console.log(`Gov Treasury (${govTreasury}): Direct=${Number(govTreasuryUsdcBefore) / 1_000_000} USDC | Tracked=${Number(govTrackedBefore) / 1_000_000} USDC`)
  console.log('----------------------------------------------------')

  let transferMethodExecuted = false
  let txHash: `0x${string}` | null = null

  // Check where the USDC is located and execute transfer accordingly
  if (agentTreasuryUsdc >= amountUnits) {
    console.log(`[Source Found] Agent Operating Treasury holds ${Number(agentTreasuryUsdc) / 1_000_000} USDC. Executing withdrawal to Gov Treasury...`)
    
    // Check owner or governor of Agent Operating Treasury
    const owner = await publicClient.readContract({ address: agentTreasury, abi: TREASURY_ABI, functionName: 'owner' }).catch(() => null)
    const governor = await publicClient.readContract({ address: agentTreasury, abi: TREASURY_ABI, functionName: 'governor' }).catch(() => null)
    const agentAddr = await publicClient.readContract({ address: agentTreasury, abi: TREASURY_ABI, functionName: 'agentAddress' }).catch(() => null)

    console.log(`Agent Treasury Config - Owner: ${owner}, Governor: ${governor}, AgentAddress: ${agentAddr}`)

    // If caller is owner or governor or agent, attempt withdraw
    try {
      txHash = await walletClient.writeContract({
        address: agentTreasury,
        abi: TREASURY_ABI,
        functionName: 'withdraw',
        args: [govTreasury, amountUnits],
        gas: 500000n
      })
      console.log(`Withdraw tx submitted from Agent Treasury: ${txHash}`)
      await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 })
      transferMethodExecuted = true
    } catch (err: any) {
      console.warn(`Direct withdraw from Agent Treasury failed: ${err?.message || err}. Trying ERC20 transfer if approved or direct EOA deposit...`)
    }
  }

  if (!transferMethodExecuted && eoaUsdc >= amountUnits) {
    console.log(`[Source Found] EOA Account holds ${Number(eoaUsdc) / 1_000_000} USDC. Transferring ${targetAmountUSDC} USDC directly to Governance Treasury...`)
    
    // Attempt depositUSDC or ERC20 transfer
    try {
      console.log('Approving Governance Treasury to spend USDC...')
      const appTx = await walletClient.writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [govTreasury, amountUnits],
        gas: 200000n
      })
      await publicClient.waitForTransactionReceipt({ hash: appTx, timeout: 60_000 })
      console.log('Approved successfully! Deposit USDC into Governance Treasury...')

      txHash = await walletClient.writeContract({
        address: govTreasury,
        abi: TREASURY_ABI,
        functionName: 'depositUSDC',
        args: [amountUnits],
        gas: 300000n
      })
      console.log(`Deposit tx submitted: ${txHash}`)
      await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 })
      transferMethodExecuted = true
    } catch (depErr: any) {
      console.warn(`depositUSDC failed: ${depErr?.message || depErr}. Falling back to direct ERC20 transfer...`)
      txHash = await walletClient.writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [govTreasury, amountUnits],
        gas: 200000n
      })
      console.log(`ERC20 transfer tx submitted: ${txHash}`)
      await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 })
      transferMethodExecuted = true
    }
  }

  if (!transferMethodExecuted && agentSmartAccUsdc >= amountUnits) {
    console.log(`[Source Found] Agent Smart Account holds ${Number(agentSmartAccUsdc) / 1_000_000} USDC. Executing yield strategy call to transfer to Gov Treasury...`)
    const transferCalldata = parseAbi(['function transfer(address recipient, uint256 amount) returns (bool)'])
    // We can call executeYieldStrategy on Agent Smart Account to send USDC to Gov Treasury
    try {
      const execCalldata = parseAbi([
        'function executeYieldStrategy(address targetContract, address token, uint256 amount, bytes calldata data) external'
      ])
      // encode transfer(govTreasury, amountUnits)
      const data = `0xa9059cbb000000000000000000000000${govTreasury.slice(2).toLowerCase()}${amountUnits.toString(16).padStart(64, '0')}` as `0x${string}`
      
      txHash = await walletClient.writeContract({
        address: agentSmartAccount,
        abi: execCalldata,
        functionName: 'executeYieldStrategy',
        args: [usdcAddress, usdcAddress, amountUnits, data],
        gas: 400000n
      })
      console.log(`Agent Smart Account execute yield strategy tx: ${txHash}`)
      await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 })
      transferMethodExecuted = true
    } catch (smartErr: any) {
      console.error('Agent smart account execution error:', smartErr)
    }
  }

  if (!transferMethodExecuted) {
    throw new Error(`Could not find a single account holding at least ${targetAmountUSDC} USDC. EOA=${Number(eoaUsdc)/1e6}, AgentTreasury=${Number(agentTreasuryUsdc)/1e6}, SmartAccount=${Number(agentSmartAccUsdc)/1e6}`)
  }

  console.log('\n=== Syncing Balance on Governance Treasury Contract ===')
  try {
    const syncTx = await walletClient.writeContract({
      address: govTreasury,
      abi: TREASURY_ABI,
      functionName: 'syncBalance',
      args: [],
      gas: 300000n
    })
    console.log(`Sync Tx Hash: ${syncTx}`)
    await publicClient.waitForTransactionReceipt({ hash: syncTx, timeout: 60_000 })
    console.log('Governance Treasury balance synced on-chain!')
  } catch (syncErr: any) {
    console.warn('Sync balance call failed or already updated:', syncErr?.message)
  }

  // Final Balances
  const govTreasuryUsdcAfter = await publicClient.readContract({ address: usdcAddress, abi: ERC20_ABI, functionName: 'balanceOf', args: [govTreasury] })
  const govTrackedAfter = await publicClient.readContract({ address: govTreasury, abi: TREASURY_ABI, functionName: 'usdcBalance' }).catch(() => 0n)

  console.log('\n====================================================')
  console.log('=== TRANSFER VERIFICATION COMPLETE ===')
  console.log('====================================================')
  console.log(`Transaction Hash: ${txHash}`)
  console.log(`Gov Treasury Direct USDC Balance: ${Number(govTreasuryUsdcAfter) / 1_000_000} USDC`)
  console.log(`Gov Treasury On-Chain Tracked Balance: ${Number(govTrackedAfter) / 1_000_000} USDC`)
  console.log('====================================================')
}

main().catch(console.error)
