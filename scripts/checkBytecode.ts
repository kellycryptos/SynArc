import { createPublicClient, http, fallback } from 'viem'
import { arcTestnet, ARC_RPC_URLS } from '../lib/arc-config'

async function main() {
  const transport = fallback(ARC_RPC_URLS.map(url => http(url)))
  const publicClient = createPublicClient({ chain: arcTestnet, transport })

  const agentTreasury = '0xE6bAC65d7f060B805B8dd6f1c4DBfa6571905f28'
  const code = await publicClient.getBytecode({ address: agentTreasury })
  
  if (!code) {
    console.log('No code found!')
    return
  }

  // syncBalance selector is fd9c652b
  const hasSyncBalance = code.includes('fd9c652b')
  console.log('Bytecode includes syncBalance selector (fd9c652b):', hasSyncBalance)
  console.log('Bytecode length:', code.length)
}

main().catch(console.error)
