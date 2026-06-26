import { createPublicClient, http, parseAbi } from 'viem'
import { arcTestnet } from '../lib/arc-config'

async function main() {
  const client = createPublicClient({ chain: arcTestnet, transport: http() })
  const tokenMinterAddress = '0xb43db544E2c27092c107639Ad201b3dEfAbcF192'
  const usdc = '0x3600000000000000000000000000000000000000'
  
  const abi = parseAbi([
    'function burnLimitsPerMessage(address token) view returns (uint256)'
  ])

  try {
    const limit = await client.readContract({
      address: tokenMinterAddress,
      abi,
      functionName: 'burnLimitsPerMessage',
      args: [usdc]
    })
    console.log('USDC Burn Limit per message on Minter:', limit.toString())
  } catch (err: any) {
    console.error('Failed to query burnLimitsPerMessage:', err)
  }
}

main().catch(console.error)
