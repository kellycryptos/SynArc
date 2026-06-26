import { createPublicClient, http } from 'viem'
import { arcTestnet, CONTRACTS } from '../lib/arc-config'

async function main() {
  const client = createPublicClient({ chain: arcTestnet, transport: http() })
  
  const contracts = {
    Governor: CONTRACTS.governor,
    Treasury: CONTRACTS.treasury,
    Token: CONTRACTS.token,
    Eurc: CONTRACTS.eurc,
    AgentSmartAccount: '0x88BdF819466C1802ce6C780a9fbdF3A314cab07D'
  }

  for (const [name, addr] of Object.entries(contracts)) {
    try {
      const bytecode = await client.getBytecode({ address: addr as `0x${string}` })
      console.log(`${name} at ${addr}: Bytecode length =`, bytecode ? (bytecode.length - 2) / 2 : 0)
    } catch (err: any) {
      console.log(`Failed to query bytecode for ${name}:`, err.message)
    }
  }
}

main().catch(console.error)
