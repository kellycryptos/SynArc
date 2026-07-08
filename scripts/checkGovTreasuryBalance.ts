import { createPublicClient, http, fallback, parseAbi } from 'viem'
import { arcTestnet, ARC_RPC_URLS, CONTRACTS } from '../lib/arc-config'

const ERC20_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)'
])

const TREASURY_ABI = parseAbi([
  'function usdcBalance() view returns (uint256)',
  'function eurcBalance() view returns (uint256)'
])

async function main() {
  const transport = fallback(ARC_RPC_URLS.map(url => http(url)))
  const publicClient = createPublicClient({ chain: arcTestnet, transport })

  const govUsdcDirect = await publicClient.readContract({
    address: '0x3600000000000000000000000000000000000000',
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: ['0xFE0F6bF45D363d34CD5fC1781594a7471736dC18']
  })

  const govUsdcContract = await publicClient.readContract({
    address: '0xFE0F6bF45D363d34CD5fC1781594a7471736dC18',
    abi: TREASURY_ABI,
    functionName: 'usdcBalance'
  }).catch(() => 0n)

  console.log('Governance Treasury Balance (Direct ERC20):', Number(govUsdcDirect) / 1_000_000, 'USDC')
  console.log('Governance Treasury Balance (Contract tracked):', Number(govUsdcContract) / 1_000_000, 'USDC')
}

main().catch(console.error)
