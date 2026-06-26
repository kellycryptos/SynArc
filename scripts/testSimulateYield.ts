import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { createPublicClient, createWalletClient, http, parseAbi, encodeFunctionData } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet } from '../lib/arc-config'

const AGENT_ABI = parseAbi([
  'function executeYieldStrategy(address targetContract, address token, uint256 amount, bytes calldata data) external'
])

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)'
])

const TOKEN_MESSENGER_ABI = parseAbi([
  'function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold)'
])

async function main() {
  const key = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`
  const account = privateKeyToAccount(key)
  const client = createPublicClient({ chain: arcTestnet, transport: http() })
  const wallet = createWalletClient({ account, chain: arcTestnet, transport: http() })

  const agentAddress = '0x88BdF819466C1802ce6C780a9fbdF3A314cab07D'
  const tokenMessenger = '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA'
  const tokenMinter = '0xb43db544E2c27092c107639Ad201b3dEfAbcF192'
  const usdc = '0x3600000000000000000000000000000000000000'
  const recipient = '0x35630dFE2592AB19d979ec1B173697aEa554b66b'
  const mintRecipient = `0x000000000000000000000000${recipient.slice(2)}` as `0x${string}`
  const zeroBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
  
  const amount = 88000000n // 88 USDC

  console.log('Sending Step 1: Approving TokenMinter via Smart Account...')
  const approveCalldata = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [tokenMinter, amount]
  })

  const tx1 = await wallet.writeContract({
    address: agentAddress,
    abi: AGENT_ABI,
    functionName: 'executeYieldStrategy',
    args: [usdc, usdc, amount, approveCalldata]
  })
  console.log('Step 1 Tx Sent:', tx1)
  await client.waitForTransactionReceipt({ hash: tx1, timeout: 120_000 })
  console.log('Step 1 Confirmed!')

  console.log('Sending Step 2: Depositing for Burn via Smart Account...')
  const burnCalldata = encodeFunctionData({
    abi: TOKEN_MESSENGER_ABI,
    functionName: 'depositForBurn',
    args: [amount, 0, mintRecipient, usdc, zeroBytes32, 0n, 0]
  })

  const tx2 = await wallet.writeContract({
    address: agentAddress,
    abi: AGENT_ABI,
    functionName: 'executeYieldStrategy',
    args: [tokenMessenger, usdc, amount, burnCalldata]
  })
  console.log('Step 2 Tx Sent:', tx2)
  const receipt = await client.waitForTransactionReceipt({ hash: tx2, timeout: 120_000 })
  console.log('Step 2 Confirmed! Receipt Status:', receipt.status)
}

main().catch(console.error)

