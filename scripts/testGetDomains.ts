import { createPublicClient, http, parseAbi } from 'viem'
import { arcTestnet } from '../lib/arc-config'

async function main() {
  const client = createPublicClient({ chain: arcTestnet, transport: http() })
  const tokenMessengerAddress = '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA'
  
  const abi = parseAbi([
    'function remoteTokenMessengers(uint32 domain) view returns (bytes32)'
  ])

  // Try checking domain 0 (Ethereum Sepolia/Mainnet)
  try {
    const remoteMessenger = await client.readContract({
      address: tokenMessengerAddress,
      abi,
      functionName: 'remoteTokenMessengers',
      args: [0]
    })
    console.log('Remote TokenMessenger for Domain 0 (Ethereum):', remoteMessenger)
  } catch (err: any) {
    console.error('Failed to query Domain 0:', err.message)
  }

  // Let's check other common domains (1 = Avalanche, 2 = Optimism, 3 = Arbitrum, 6 = Base, 7 = Polygon)
  const domains = [1, 2, 3, 6, 7]
  for (const d of domains) {
    try {
      const res = await client.readContract({
        address: tokenMessengerAddress,
        abi,
        functionName: 'remoteTokenMessengers',
        args: [d]
      })
      console.log(`Remote TokenMessenger for Domain ${d}:`, res)
    } catch (err: any) {
      console.error(`Failed to query Domain ${d}:`, err.message)
    }
  }
}

main().catch(console.error)
