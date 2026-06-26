import { createPublicClient, http, parseAbi } from 'viem'
import { arcTestnet } from '../lib/arc-config'

async function main() {
  const client = createPublicClient({ chain: arcTestnet, transport: http() })
  const tokenMinterAddress = '0xb43db544E2c27092c107639Ad201b3dEfAbcF192'
  
  // Sepolia USDC: 0x1c7d4b196cb0c7b01d743fbc6116a902379c7238
  const sepoliaUsdcBytes32 = '0x0000000000000000000000001c7d4b196cb0c7b01d743fbc6116a902379c7238'
  
  const abi = parseAbi([
    'function getLocalToken(uint32 remoteDomain, bytes32 remoteToken) view returns (address)'
  ])

  try {
    const localToken = await client.readContract({
      address: tokenMinterAddress,
      abi,
      functionName: 'getLocalToken',
      args: [0, sepoliaUsdcBytes32] // 0 = Ethereum Sepolia/Mainnet
    })
    console.log('Local Token mapped to Sepolia USDC on Domain 0:', localToken)
  } catch (err: any) {
    console.error('Failed to query getLocalToken:', err.message)
  }
}

main().catch(console.error)

