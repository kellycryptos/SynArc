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

  const agentTreasury = '0x302D7cba3553e22E24C7A5C9aFee3942EBC6ea63'

  console.log('Sending syncBalance() transaction with explicit gas limit...')
  try {
    const hash = await walletClient.writeContract({
      address: agentTreasury,
      abi: TREASURY_ABI,
      functionName: 'syncBalance',
      args: [],
      gas: 500000n, // explicit high gas limit
    })
    console.log('Sync Tx Hash:', hash)
    console.log('Waiting for confirmation...')
    await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 })
    console.log('Sync Tx confirmed successfully!')

    const [usdc, eurc] = await Promise.all([
      publicClient.readContract({ address: agentTreasury, abi: TREASURY_ABI, functionName: 'usdcBalance' }),
      publicClient.readContract({ address: agentTreasury, abi: TREASURY_ABI, functionName: 'eurcBalance' })
    ])
    console.log('Synced Agent Treasury USDC Balance:', Number(usdc) / 1e6, 'USDC')
    console.log('Synced Agent Treasury EURC Balance:', Number(eurc) / 1e6, 'EURC')
  } catch (err: any) {
    console.error('syncBalance transaction failed!')
    console.error(err?.message || err)
  }
}

main().catch(console.error)
