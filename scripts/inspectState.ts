import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { createPublicClient, http, fallback, parseAbi } from 'viem'
import { arcTestnet, ARC_RPC_URLS } from '../lib/arc-config'

const TREASURY_ABI = parseAbi([
  'function usdcToken() view returns (address)',
  'function eurcToken() view returns (address)',
  'function usdcBalance() view returns (uint256)',
  'function eurcBalance() view returns (uint256)',
  'function paused() view returns (bool)',
  'function owner() view returns (address)',
])

async function main() {
  const transport = fallback(ARC_RPC_URLS.map(url => http(url)))
  const publicClient = createPublicClient({ chain: arcTestnet, transport })

  const agentTreasury = '0x302D7cba3553e22E24C7A5C9aFee3942EBC6ea63'

  const [usdcToken, eurcToken, usdcBalance, eurcBalance, paused, owner] = await Promise.all([
    publicClient.readContract({ address: agentTreasury, abi: TREASURY_ABI, functionName: 'usdcToken' }),
    publicClient.readContract({ address: agentTreasury, abi: TREASURY_ABI, functionName: 'eurcToken' }),
    publicClient.readContract({ address: agentTreasury, abi: TREASURY_ABI, functionName: 'usdcBalance' }),
    publicClient.readContract({ address: agentTreasury, abi: TREASURY_ABI, functionName: 'eurcBalance' }),
    publicClient.readContract({ address: agentTreasury, abi: TREASURY_ABI, functionName: 'paused' }),
    publicClient.readContract({ address: agentTreasury, abi: TREASURY_ABI, functionName: 'owner' }),
  ])

  console.log('usdcToken:', usdcToken)
  console.log('eurcToken:', eurcToken)
  console.log('usdcBalance (state):', Number(usdcBalance) / 1e6, 'USDC')
  console.log('eurcBalance (state):', Number(eurcBalance) / 1e6, 'EURC')
  console.log('paused:', paused)
  console.log('owner:', owner)
}

main().catch(console.error)
