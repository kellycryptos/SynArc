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
  'Monitor treasury balances',
  'Suggest rebalancing when needed',
  'Bridge USDC once community votes to approve',
  'Pay for AI processing dynamically',
  'Analyze treasury data',
  'Verify identity on-chain',
]

export const AGENT_INTEGRATIONS = [
  { name: 'CCTP', description: 'Secure USDC transfers between Arc and Ethereum', status: 'active' },
  { name: 'Circle Gateway', description: 'Automated payments for AI analysis', status: 'active' },
  { name: 'Modular Wallets', description: 'Smart account for secure community-governed funds', status: 'active' },
  { name: 'Groq AI', description: 'AI model for treasury analysis', status: 'active' },
  { name: 'ERC-8004', description: 'On-chain verification registry for agents', status: 'active' },
]
