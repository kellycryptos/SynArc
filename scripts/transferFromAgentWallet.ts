import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { createPublicClient, createWalletClient, http, fallback, parseAbi, parseUnits, encodeFunctionData } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet, ARC_RPC_URLS, CONTRACTS } from '../lib/arc-config'

const ERC20_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address recipient, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)'
])

const AGENT_ABI = parseAbi([
  'function owner() view returns (address)',
  'function executor() view returns (address)',
  'function maxRebalanceAmount() view returns (uint256)',
  'function setMaxRebalanceAmount(uint256 _newLimit) external',
  'function executeYieldStrategy(address targetContract, address token, uint256 amount, bytes calldata data) external'
])

const TREASURY_ABI = parseAbi([
  'function usdcBalance() view returns (uint256)',
  'function syncBalance() external'
])

async function main() {
  const key = (process.env.FAUCET_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY) as `0x${string}`
  if (!key) {
    throw new Error('Private key missing in environment')
  }
  const account = privateKeyToAccount(key.startsWith('0x') ? key : `0x${key}`)
  const transport = fallback(ARC_RPC_URLS.map(url => http(url)))
  const publicClient = createPublicClient({ chain: arcTestnet, transport })
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport })

  const usdcAddress = '0x3600000000000000000000000000000000000000' as const
  const govTreasury = CONTRACTS.treasuryGovernance
  const agentContract = (process.env.NEXT_PUBLIC_AGENT_ADDRESS || '0x88BdF819466C1802ce6C780a9fbdF3A314cab07D') as `0x${string}`

  const targetUsdc = 400
  const amountUnits = parseUnits(targetUsdc.toString(), 6)

  console.log('====================================================')
  console.log(`[AGENT WALLET TRANSFER] Transferring ${targetUsdc} USDC from Agent Wallet to Treasury`)
  console.log('====================================================')
  console.log('Signer Account:', account.address)
  console.log('Agent Contract (Wallet):', agentContract)
  console.log('Governance Treasury Target:', govTreasury)
  console.log('----------------------------------------------------')

  // Read agent config
  const owner = await publicClient.readContract({ address: agentContract, abi: AGENT_ABI, functionName: 'owner' })
  const executor = await publicClient.readContract({ address: agentContract, abi: AGENT_ABI, functionName: 'executor' })
  const currentMax = await publicClient.readContract({ address: agentContract, abi: AGENT_ABI, functionName: 'maxRebalanceAmount' })

  console.log(`Agent Contract Owner: ${owner}`)
  console.log(`Agent Contract Executor: ${executor}`)
  console.log(`Current maxRebalanceAmount: ${Number(currentMax) / 1_000_000} USDC`)

  const isOwner = owner.toLowerCase() === account.address.toLowerCase()
  const isExecutor = executor.toLowerCase() === account.address.toLowerCase()

  console.log(`Signer is Owner: ${isOwner} | Signer is Executor: ${isExecutor}`)

  // 1. Update maxRebalanceAmount if necessary
  if (currentMax < amountUnits) {
    if (!isOwner) {
      throw new Error(`Signer ${account.address} is not owner of Agent Contract ${agentContract}. Cannot increase maxRebalanceAmount.`)
    }
    console.log(`Increasing maxRebalanceAmount to 500 USDC...`)
    const setLimitTx = await walletClient.writeContract({
      address: agentContract,
      abi: AGENT_ABI,
      functionName: 'setMaxRebalanceAmount',
      args: [parseUnits('500', 6)],
      gas: 200000n
    })
    console.log(`setMaxRebalanceAmount Tx: ${setLimitTx}`)
    await publicClient.waitForTransactionReceipt({ hash: setLimitTx, timeout: 60_000 })
    console.log('Limit increased successfully!')
  }

  // 2. Prepare call data for ERC20 transfer(govTreasury, amountUnits)
  // Encode `transfer(address recipient, uint256 amount)`
  const transferCalldata = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [govTreasury, amountUnits]
  })

  console.log(`Executing strategy call to transfer ${targetUsdc} USDC from Agent Wallet (${agentContract}) to Governance Treasury (${govTreasury})...`)
  const execTx = await walletClient.writeContract({
    address: agentContract,
    abi: AGENT_ABI,
    functionName: 'executeYieldStrategy',
    args: [
      usdcAddress,      // targetContract to call
      usdcAddress,      // token to approve
      amountUnits,      // amount
      transferCalldata  // data payload
    ],
    gas: 500000n
  })

  console.log(`executeYieldStrategy Tx Hash: ${execTx}`)
  console.log('Waiting for block confirmation...')
  await publicClient.waitForTransactionReceipt({ hash: execTx, timeout: 60_000 })
  console.log('Transfer executed successfully!')

  // 3. Sync balance on Governance Treasury contract
  console.log('\nSyncing USDC balance on Governance Treasury...')
  const syncTx = await walletClient.writeContract({
    address: govTreasury,
    abi: TREASURY_ABI,
    functionName: 'syncBalance',
    args: [],
    gas: 300000n
  })
  console.log(`syncBalance Tx Hash: ${syncTx}`)
  await publicClient.waitForTransactionReceipt({ hash: syncTx, timeout: 60_000 })
  console.log('Governance Treasury synced!')

  // 4. Verify Final Balances
  const finalAgentBal = await publicClient.readContract({ address: usdcAddress, abi: ERC20_ABI, functionName: 'balanceOf', args: [agentContract] })
  const finalGovDirect = await publicClient.readContract({ address: usdcAddress, abi: ERC20_ABI, functionName: 'balanceOf', args: [govTreasury] })
  const finalGovTracked = await publicClient.readContract({ address: govTreasury, abi: TREASURY_ABI, functionName: 'usdcBalance' })

  console.log('\n====================================================')
  console.log('=== VERIFICATION SUMMARY ===')
  console.log('====================================================')
  console.log(`Transfer Tx Hash: ${execTx}`)
  console.log(`Sync Tx Hash: ${syncTx}`)
  console.log(`Agent Wallet Remaining Balance: ${Number(finalAgentBal) / 1_000_000} USDC`)
  console.log(`Governance Treasury Direct USDC Balance: ${Number(finalGovDirect) / 1_000_000} USDC`)
  console.log(`Governance Treasury Tracked usdcBalance: ${Number(finalGovTracked) / 1_000_000} USDC`)
  console.log('====================================================')
}

main().catch(console.error)
