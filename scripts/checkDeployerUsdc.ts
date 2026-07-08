import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { createPublicClient, http, fallback, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet, ARC_RPC_URLS } from '../lib/arc-config'

const ERC20_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)'
])

async function main() {
  const key = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`
  if (!key) {
    throw new Error('DEPLOYER_PRIVATE_KEY is missing')
  }
  const account = privateKeyToAccount(key)

  const transport = fallback(ARC_RPC_URLS.map(url => http(url)))
  const publicClient = createPublicClient({ chain: arcTestnet, transport })

  const usdcAddress = '0x3600000000000000000000000000000000000000'
  const deployerUsdc = await publicClient.readContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address]
  })

  console.log('Deployer Address:', account.address)
  console.log('Deployer USDC Balance:', Number(deployerUsdc) / 1_000_000, 'USDC')
}

main().catch(console.error)
