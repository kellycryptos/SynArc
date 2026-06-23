/**
 * Agent Smart Account — Circle Modular Wallets
 * Defines the on-chain identity for the SynArc Treasury Agent
 */

export const AGENT_CONFIG = {
  name: 'SynArc Treasury Agent',
  version: '1.0.0',
  network: 'arc-testnet',
  chainId: 5042002,
  // Agent smart account address (Circle Modular Wallet / ERC-4337)
  address: (process.env.NEXT_PUBLIC_AGENT_SMART_ACCOUNT || process.env.NEXT_PUBLIC_AGENT_ADDRESS) as `0x${string}` | undefined,
  // ERC-8004 identity registry
  registryAddress: '0x8004A818BFB912233c491871b3d84c89A494BD9e' as `0x${string}`,
}

export const AGENT_CAPABILITIES = [
  'Monitor DAO treasury balances in real-time',
  'Create governance proposals autonomously',
  'Execute CCTP cross-chain transfers when approved',
  'Pay for AI inference via Circle Gateway (x402)',
  'Analyze treasury health with Groq Llama 3.3 70B',
  'Register identity on ERC-8004 Trustless Agent Registry',
]

export const AGENT_INTEGRATIONS = [
  { name: 'CCTP', description: 'Cross-chain USDC transfers (Arc ↔ Ethereum)', status: 'active' },
  { name: 'Circle Gateway', description: 'Nanopayments for AI inference (x402)', status: 'active' },
  { name: 'Modular Wallets', description: 'ERC-4337 Smart Account with passkey auth', status: 'active' },
  { name: 'Groq AI', description: 'Llama 3.3 70B for treasury analysis', status: 'active' },
  { name: 'ERC-8004', description: 'Trustless Agent Identity Registry', status: 'active' },
]
