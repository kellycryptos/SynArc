import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { createPublicClient, http, fallback, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet, ARC_RPC_URLS } from '../lib/arc-config'

const TREASURY_ABI = parseAbi([
  'function syncBalance() external',
])

async function main() {
  const key = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`
  if (!key) {
    throw new Error('DEPLOYER_PRIVATE_KEY is missing')
  }
  const account = privateKeyToAccount(key)
  const transport = fallback(ARC_RPC_URLS.map(url => http(url)))
  const publicClient = createPublicClient({ chain: arcTestnet, transport })

  const agentTreasury = '0x302D7cba3553e22E24C7A5C9aFee3942EBC6ea63'

  console.log('Simulating syncBalance() from:', account.address)
  try {
    const gas = await publicClient.estimateContractGas({
      address: agentTreasury,
      abi: TREASURY_ABI,
      functionName: 'syncBalance',
      account
    })
    console.log('Estimated Gas:', gas.toString())
  } catch (err: any) {
    console.log('Simulation or gas estimation failed!')
    console.log('Error message:', err?.message || err)
    if (err?.cause) {
      console.log('Error cause:', err.cause)
    }
  }
}

main().catch(console.error)
