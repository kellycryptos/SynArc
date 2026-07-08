import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { createPublicClient, createWalletClient, http, fallback, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet, ARC_RPC_URLS } from '../lib/arc-config'

const TREASURY_ABI = parseAbi([
  'function syncBalance() external',
  'function usdcBalance() view returns (uint256)',
  'function eurcBalance() view returns (uint256)'
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

  console.log('Sending syncBalance() transaction for Governance Treasury from:', account.address)
  
  const hash = await walletClient.writeContract({
    address: govTreasury,
    abi: TREASURY_ABI,
    functionName: 'syncBalance',
    args: []
  })

  console.log('Transaction hash:', hash)
  console.log('Waiting for receipt...')
  await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 })
  console.log('Transaction confirmed!')

  const [usdc, eurc] = await Promise.all([
    publicClient.readContract({ address: govTreasury, abi: TREASURY_ABI, functionName: 'usdcBalance' }),
    publicClient.readContract({ address: govTreasury, abi: TREASURY_ABI, functionName: 'eurcBalance' })
  ])

  console.log('Updated Governance Treasury USDC balance:', Number(usdc) / 1_000_000, 'USDC')
  console.log('Updated Governance Treasury EURC balance:', Number(eurc) / 1_000_000, 'EURC')
}

main().catch(console.error)
