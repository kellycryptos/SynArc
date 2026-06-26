import { createPublicClient, http, parseAbi } from 'viem'
import { arcTestnet } from '../lib/arc-config'

async function main() {
  const client = createPublicClient({ chain: arcTestnet, transport: http() })
  const usdcAbi = parseAbi([
    'function balanceOf(address) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)'
  ])
  const usdcAddress = '0x3600000000000000000000000000000000000000'
  const agentAddress = '0x88BdF819466C1802ce6C780a9fbdF3A314cab07D'
  const tokenMinterAddress = '0xb43db544E2c27092c107639Ad201b3dEfAbcF192'
  const tokenMessengerAddress = '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA'

  const [agentBal, minterAllowance, messengerAllowance] = await Promise.all([
    client.readContract({ address: usdcAddress, abi: usdcAbi, functionName: 'balanceOf', args: [agentAddress] }),
    client.readContract({ address: usdcAddress, abi: usdcAbi, functionName: 'allowance', args: [agentAddress, tokenMinterAddress] }),
    client.readContract({ address: usdcAddress, abi: usdcAbi, functionName: 'allowance', args: [agentAddress, tokenMessengerAddress] }),
  ])

  console.log('Smart Account USDC Balance     :', Number(agentBal) / 1_000_000, 'USDC')
  console.log('TokenMinter Allowance          :', Number(minterAllowance) / 1_000_000, 'USDC')
  console.log('TokenMessenger Allowance       :', Number(messengerAllowance) / 1_000_000, 'USDC')
}

main().catch(console.error)
