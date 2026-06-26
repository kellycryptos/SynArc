import { createPublicClient, http, parseAbi } from 'viem'
import { arcTestnet } from '../lib/arc-config'

async function main() {
  const client = createPublicClient({ chain: arcTestnet, transport: http() })
  const tokenMessengerAddress = '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA'
  
  const abi = parseAbi([
    'function localMinter() view returns (address)'
  ])

  try {
    const minter = await client.readContract({
      address: tokenMessengerAddress,
      abi,
      functionName: 'localMinter'
    })
    console.log('TokenMinter address on Arc Testnet:', minter)
  } catch (err: any) {
    console.error('Failed to query localMinter:', err)
  }
}

main().catch(console.error)
