import { createWalletClient, createPublicClient, http, parseUnits, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { ARC_CHAIN, ARC_GAS } from '@/lib/arc-config'

// Circle CCTP contract addresses
export const CCTP_CONTRACTS = {
  arcTestnet: {
    tokenMessenger: (process.env.NEXT_PUBLIC_CCTP_TOKEN_MESSENGER_ARC || '0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa') as `0x${string}`,
    usdc: (process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238') as `0x${string}`,
  },
  ethSepolia: {
    messageTransmitter: '0xe737e5cebeeba77efe34d4aa090756590b1ce275' as `0x${string}`,
    domain: 0,
  },
}

const TOKEN_MESSENGER_ABI = parseAbi([
  'function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken) returns (uint64 nonce)',
])

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
])

export class CCTPExecutor {
  private arcWalletClient: any
  private arcPublicClient: any
  private account: any

  constructor(privateKey: `0x${string}`) {
    this.account = privateKeyToAccount(privateKey)
    this.arcPublicClient = createPublicClient({
      chain: ARC_CHAIN,
      transport: http(process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network'),
    })
    this.arcWalletClient = createWalletClient({
      account: this.account,
      chain: ARC_CHAIN,
      transport: http(process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network'),
    })
  }

  /**
   * Execute CCTP bridge — Arc Testnet → Ethereum Sepolia
   * Burns USDC on Arc and initiates cross-chain mint on Ethereum
   */
  async bridgeToEthereum(amountUSDC: number, recipientAddress: `0x${string}`): Promise<{
    burnTxHash: string
    status: string
    amount: number
    destinationChain: string
  }> {
    const amountRaw = parseUnits(amountUSDC.toString(), 6)

    // Step 1 — Approve USDC spend on TokenMessenger
    const approveTx = await this.arcWalletClient.writeContract({
      address: CCTP_CONTRACTS.arcTestnet.usdc,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CCTP_CONTRACTS.arcTestnet.tokenMessenger, amountRaw],
      gas: ARC_GAS.approve,
      gasPrice: ARC_GAS.gasPrice,
    })
    await this.arcPublicClient.waitForTransactionReceipt({ hash: approveTx })

    // Step 2 — Burn USDC on Arc (initiates CCTP cross-chain transfer)
    const mintRecipient = `0x000000000000000000000000${recipientAddress.slice(2)}` as `0x${string}`

    const burnTx = await this.arcWalletClient.writeContract({
      address: CCTP_CONTRACTS.arcTestnet.tokenMessenger,
      abi: TOKEN_MESSENGER_ABI,
      functionName: 'depositForBurn',
      args: [amountRaw, CCTP_CONTRACTS.ethSepolia.domain, mintRecipient, CCTP_CONTRACTS.arcTestnet.usdc],
      gas: 300000n,
      gasPrice: ARC_GAS.gasPrice,
    })
    await this.arcPublicClient.waitForTransactionReceipt({ hash: burnTx })

    return {
      burnTxHash: burnTx,
      status: 'burn_complete_awaiting_attestation',
      amount: amountUSDC,
      destinationChain: 'Ethereum Sepolia',
    }
  }
}
