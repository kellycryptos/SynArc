import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { createPublicClient, createWalletClient, http, fallback, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet, ARC_RPC_URLS } from '../lib/arc-config'

const TREASURY_ABI = parseAbi([
  'function depositUSDC(uint256 amount) external',
  'function usdcBalance() view returns (uint256)'
])

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)'
])

async function main() {
  const key = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`
  if (!key) {
    throw new Error('DEPLOYER_PRIVATE_KEY is missing')
  }
  const account = privateKeyToAccount(key)
  const transport = fallback(ARC_RPC_URLS.map(url => http(url)))
  const publicClient = createPublicClient({ chain: arcTestnet, transport })
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport })

  const govTreasury = '0xFE0F6bF45D363d34CD5fC1781594a7471736dC18'
  const usdcToken = '0x3600000000000000000000000000000000000000'
  const depositAmount = 5000000n // 5 USDC

  console.log('1. Approving Governance Treasury to spend 5 USDC...')
  const approveTx = await walletClient.writeContract({
    address: usdcToken,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [govTreasury, depositAmount]
  })
  console.log('Approve Tx:', approveTx)
  await publicClient.waitForTransactionReceipt({ hash: approveTx, timeout: 60_000 })

  console.log('2. Depositing 5 USDC to Governance Treasury...')
  const depositTx = await walletClient.writeContract({
    address: govTreasury,
    abi: TREASURY_ABI,
    functionName: 'depositUSDC',
    args: [depositAmount]
  })
  console.log('Deposit Tx:', depositTx)
  await publicClient.waitForTransactionReceipt({ hash: depositTx, timeout: 60_000 })
  console.log('Deposit confirmed!')

  const usdcBal = await publicClient.readContract({
    address: govTreasury,
    abi: TREASURY_ABI,
    functionName: 'usdcBalance'
  })
  console.log('New Governance Treasury tracked USDC balance:', Number(usdcBal) / 1e6, 'USDC')
}

main().catch(console.error)
