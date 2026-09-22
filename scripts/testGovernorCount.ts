import { createPublicClient, http, parseAbi } from 'viem'
import { arcTestnet, ARC_TESTNET_RPC_URLS } from '../lib/arc-config'

const ARC_RPC_URLS = ARC_TESTNET_RPC_URLS;

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
