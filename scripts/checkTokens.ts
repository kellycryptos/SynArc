import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { createPublicClient, http, fallback, parseAbi } from 'viem'
import { arcTestnet, ARC_RPC_URLS } from '../lib/arc-config'

const ERC20_ABI = parseAbi([
  'function symbol() view returns (string)',
  'function balanceOf(address account) view returns (uint256)',
])

async function main() {
  const transport = fallback(ARC_RPC_URLS.map(url => http(url)))
  const publicClient = createPublicClient({ chain: arcTestnet, transport })

  const usdc = '0x3600000000000000000000000000000000000000'
  const eurc = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a'
  const treasury = '0x302D7cba3553e22E24C7A5C9aFee3942EBC6ea63'

  try {
    const symbol = await publicClient.readContract({ address: usdc, abi: ERC20_ABI, functionName: 'symbol' })
    const bal = await publicClient.readContract({ address: usdc, abi: ERC20_ABI, functionName: 'balanceOf', args: [treasury] })
    console.log('USDC Symbol:', symbol)
    console.log('USDC Balance of Agent Treasury:', Number(bal) / 1_000_000)
  } catch (err) {
    console.error('USDC query failed:', err)
  }

  try {
    const symbol = await publicClient.readContract({ address: eurc, abi: ERC20_ABI, functionName: 'symbol' })
    const bal = await publicClient.readContract({ address: eurc, abi: ERC20_ABI, functionName: 'balanceOf', args: [treasury] })
    console.log('EURC Symbol:', symbol)
    console.log('EURC Balance of Agent Treasury:', Number(bal) / 1_000_000)
  } catch (err) {
    console.error('EURC query failed:', err)
  }
}

main().catch(console.error)
