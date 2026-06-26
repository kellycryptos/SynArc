import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { createPublicClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet } from '../lib/arc-config'

const TOKEN_MESSENGER_ABI = parseAbi([
  'function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken) returns (uint64 nonce)'
])

async function main() {
  const key = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`
  const account = privateKeyToAccount(key)
  const client = createPublicClient({ chain: arcTestnet, transport: http() })

  const tokenMessenger = '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA'
  const usdc = '0x3600000000000000000000000000000000000000'
  const amount = 5000000n // 5 USDC
  const recipient = account.address
  const mintRecipient = `0x000000000000000000000000${recipient.slice(2)}` as `0x${string}`

  console.log('Simulating depositForBurn from:', account.address)

  try {
    await client.simulateContract({
      account,
      address: tokenMessenger,
      abi: TOKEN_MESSENGER_ABI,
      functionName: 'depositForBurn',
      args: [amount, 0, mintRecipient, usdc]
    })
    console.log('Simulation SUCCEEDED!')
  } catch (err: any) {
    console.error('Simulation FAILED!')
    console.error(err)
  }
}

main().catch(console.error)
