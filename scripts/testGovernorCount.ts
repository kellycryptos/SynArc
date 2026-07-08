import { createPublicClient, http, parseAbi } from 'viem'
import { arcTestnet } from '../lib/arc-config'

const ARC_RPC_URLS = [
  'https://rpc.testnet.arc.network',
  'https://rpc.testnet.arc.network',
  'https://arc-testnet.g.alchemy.com/v2/okKqIdABiZt8WuR2aDvev',
  'https://arc-testnet.drpc.org'
]

async function main() {
  const governor = '0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e'
  const abi = parseAbi(['function proposalCount() view returns (uint256)'])

  for (const url of ARC_RPC_URLS) {
    console.log(`Querying RPC: ${url}...`)
    try {
      const client = createPublicClient({
        chain: arcTestnet,
        transport: http(url, { timeout: 5000 })
      })
      const count = await client.readContract({
        address: governor,
        abi,
        functionName: 'proposalCount'
      })
      console.log(`  SUCCESS! Proposal Count = ${count.toString()}`)
    } catch (err: any) {
      console.log(`  FAILED: ${err.message}`)
    }
  }
}

main().catch(console.error)
