import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { createPublicClient, http, fallback, parseAbi } from 'viem'
import { arcTestnet, ARC_RPC_URLS } from '../lib/arc-config'

const TREASURY_ABI = parseAbi([
  'function paused() view returns (bool)',
  'function owner() view returns (address)',
  'function governor() view returns (address)',
])

async function main() {
  const transport = fallback(ARC_RPC_URLS.map(url => http(url)))
  const publicClient = createPublicClient({ chain: arcTestnet, transport })

  const agentTreasury = '0x302D7cba3553e22E24C7A5C9aFee3942EBC6ea63'

  const [isPaused, ownerAddress, govAddress] = await Promise.all([
    publicClient.readContract({ address: agentTreasury, abi: TREASURY_ABI, functionName: 'paused' }),
    publicClient.readContract({ address: agentTreasury, abi: TREASURY_ABI, functionName: 'owner' }),
    publicClient.readContract({ address: agentTreasury, abi: TREASURY_ABI, functionName: 'governor' }),
  ])

  console.log('Paused Status:', isPaused)
  console.log('Owner Address:', ownerAddress)
  console.log('Governor Address:', govAddress)
}

main().catch(console.error)
