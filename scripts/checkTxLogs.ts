import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { createPublicClient, http, fallback } from 'viem'
import { arcTestnet, ARC_RPC_URLS } from '../lib/arc-config'

async function main() {
  const transport = fallback(ARC_RPC_URLS.map(url => http(url)))
  const publicClient = createPublicClient({ chain: arcTestnet, transport })

  const hash = '0x60190c269cf04acad38e04fe4db2a8370df7539a9b9b896e0e64e1b140a924c1'
  const receipt = await publicClient.getTransactionReceipt({ hash })
  console.log('Receipt Status:', receipt.status)
  console.log('Logs emitted:', receipt.logs.length)
  for (const log of receipt.logs) {
    console.log('Log Address:', log.address)
    console.log('Log Topics:', log.topics)
    console.log('Log Data:', log.data)
  }
}

main().catch(console.error)
