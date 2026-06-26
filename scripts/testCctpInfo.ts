import { createPublicClient, http, parseAbi } from 'viem'
import { arcTestnet } from '../lib/arc-config'

async function main() {
  const client = createPublicClient({ chain: arcTestnet, transport: http() })
  const tokenAddress = '0x3600000000000000000000000000000000000000'
  const tokenMessengerAddress = '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA'
  
  const tokenAbi = parseAbi([
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function balanceOf(address) view returns (uint256)'
  ])

  try {
    const [name, symbol, decimals] = await Promise.all([
      client.readContract({ address: tokenAddress, abi: tokenAbi, functionName: 'name' }),
      client.readContract({ address: tokenAddress, abi: tokenAbi, functionName: 'symbol' }),
      client.readContract({ address: tokenAddress, abi: tokenAbi, functionName: 'decimals' })
    ])
    console.log('Token Metadata:')
    console.log('  Name    :', name)
    console.log('  Symbol  :', symbol)
    console.log('  Decimals:', decimals)
  } catch (err: any) {
    console.error('Failed to query token metadata:', err.message)
  }

  // Let's check TokenMessenger settings
  const messengerAbi = parseAbi([
    'function owner() view returns (address)',
    'function localMinter() view returns (address)',
    'function minFee() view returns (uint256)',
    'function getMinFeeAmount(uint256 amount) view returns (uint256)'
  ])
  try {
    const [owner, minter, minFeeVal, minFeeForAmount] = await Promise.all([
      client.readContract({ address: tokenMessengerAddress, abi: messengerAbi, functionName: 'owner' }),
      client.readContract({ address: tokenMessengerAddress, abi: messengerAbi, functionName: 'localMinter' }),
      client.readContract({ address: tokenMessengerAddress, abi: messengerAbi, functionName: 'minFee' }),
      client.readContract({ address: tokenMessengerAddress, abi: messengerAbi, functionName: 'getMinFeeAmount', args: [88000000n] })
    ])
    console.log('TokenMessenger Settings:')
    console.log('  Owner              :', owner)
    console.log('  Minter             :', minter)
    console.log('  Min Fee (Raw)      :', minFeeVal.toString())
    console.log('  Min Fee for 88 USDC:', minFeeForAmount.toString())
  } catch (err: any) {
    console.error('Failed to query TokenMessenger info:', err.message)
  }

  // Let's check if USDC is paused
  try {
    const usdcPaused = await client.readContract({
      address: tokenAddress,
      abi: parseAbi(['function paused() view returns (bool)']),
      functionName: 'paused'
    })
    console.log('USDC Paused:', usdcPaused)
  } catch (err: any) {
    console.log('Failed to query USDC paused status:', err.message)
  }


}

main().catch(console.error)
