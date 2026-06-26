import { createPublicClient, http, parseAbi } from 'viem'
import { arcTestnet } from '../lib/arc-config'

async function main() {
  const client = createPublicClient({ chain: arcTestnet, transport: http() })
  
  const proxyAbi = parseAbi([
    'function implementation() view returns (address)',
    'function admin() view returns (address)'
  ])

  const contracts = {
    TokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
    TokenMinter: '0xb43db544E2c27092c107639Ad201b3dEfAbcF192',
    USDC: '0x3600000000000000000000000000000000000000'
  }

  for (const [name, addr] of Object.entries(contracts)) {
    try {
      const impl = await client.readContract({
        address: addr as `0x${string}`,
        abi: proxyAbi,
        functionName: 'implementation'
      })
      console.log(`${name} Proxy Implementation:`, impl)
    } catch (err: any) {
      console.log(`${name} is not a standard proxy or failed to query:`, err.message)
    }
  }
}

main().catch(console.error)
