import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet } from '../lib/arc-config'

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)'
])

const TOKEN_MESSENGER_ABI = parseAbi([
  'function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold)'
])

async function main() {
  const key = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`
  const account = privateKeyToAccount(key)
  const client = createPublicClient({ chain: arcTestnet, transport: http() })
  const wallet = createWalletClient({ account, chain: arcTestnet, transport: http() })

  const tokenMessenger = '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA'
  const tokenMinter = '0xb43db544E2c27092c107639Ad201b3dEfAbcF192'
  const usdc = '0x3600000000000000000000000000000000000000'
  
  const amount = 5000000n // 5 USDC
  const recipient = account.address
  const mintRecipient = `0x000000000000000000000000${recipient.slice(2)}` as `0x${string}`
  const zeroBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`

  console.log('Deployer USDC Balance:', Number(await client.readContract({ address: usdc, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] })) / 1_000_000)

  console.log('Step 1: Approving TokenMessenger from EOA...')
  const tx1 = await wallet.writeContract({
    address: usdc,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [tokenMessenger, amount]
  })
  console.log('Approve Tx Sent:', tx1)
  await client.waitForTransactionReceipt({ hash: tx1, timeout: 120_000 })
  console.log('Approve Confirmed!')

  console.log('Step 2: Calling depositForBurn from EOA...')
  try {
    const tx2 = await wallet.writeContract({
      address: tokenMessenger,
      abi: TOKEN_MESSENGER_ABI,
      functionName: 'depositForBurn',
      args: [amount, 0, mintRecipient, usdc, zeroBytes32, 0n, 0]
    })
    console.log('DepositForBurn Tx Sent:', tx2)
    const receipt = await client.waitForTransactionReceipt({ hash: tx2, timeout: 120_000 })
    console.log('DepositForBurn Confirmed! Status:', receipt.status)
  } catch (err: any) {
    console.error('DepositForBurn Failed:')
    console.error(err)
  }
}

main().catch(console.error)

