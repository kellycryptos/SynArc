import { createWalletClient, createPublicClient, http, fallback, parseUnits, parseAbi, decodeEventLog, keccak256, decodeAbiParameters } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { ARC_CHAIN, ARC_GAS, ARC_RPC_URLS } from '@/lib/arc-config'
import { sepolia } from 'viem/chains'

// Circle CCTP contract addresses
export const CCTP_CONTRACTS = {
  arcTestnet: {
    tokenMessenger: (process.env.NEXT_PUBLIC_CCTP_TOKEN_MESSENGER_ARC || '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA') as `0x${string}`,
    usdc: (process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS || '0x3600000000000000000000000000000000000000') as `0x${string}`,
  },
  ethSepolia: {
    messageTransmitter: '0xe737e5cebeeba77efe34d4aa090756590b1ce275' as `0x${string}`,
    tokenMessenger: '0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa' as `0x${string}`,
    usdc: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238' as `0x${string}`,
    domain: 0,
  },
}

const TOKEN_MESSENGER_ABI = parseAbi([
  'function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken) returns (uint64 nonce)',
])

const MESSAGE_TRANSMITTER_ABI = parseAbi([
  'event MessageSent(bytes message)',
  'function receiveMessage(bytes message, bytes attestation) returns (bool)',
])

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
])

export class CCTPExecutor {
  private arcWalletClient: any
  private arcPublicClient: any
  private sepoliaWalletClient: any
  private sepoliaPublicClient: any
  private account: any

  constructor(privateKey: `0x${string}`) {
    this.account = privateKeyToAccount(privateKey)
    const arcTransport = fallback(
      ARC_RPC_URLS.map(url => http(url, { timeout: 10000 }))
    )
    this.arcPublicClient = createPublicClient({
      chain: ARC_CHAIN,
      transport: arcTransport,
    })
    this.arcWalletClient = createWalletClient({
      account: this.account,
      chain: ARC_CHAIN,
      transport: arcTransport,
    })

    // Sepolia clients with robust fallback RPCs (avoiding unauthorized Ankr)
    const sepoliaRpcUrls = [
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://sepolia.gateway.tenderly.co'
    ]
    const sepoliaTransport = fallback(sepoliaRpcUrls.map(url => http(url, { timeout: 10000 })))
    this.sepoliaPublicClient = createPublicClient({
      chain: sepolia,
      transport: sepoliaTransport
    })
    this.sepoliaWalletClient = createWalletClient({
      account: this.account,
      chain: sepolia,
      transport: sepoliaTransport
    })
  }

  /**
   * Execute CCTP bridge — Arc Testnet → Ethereum Sepolia
   * Burns USDC on Arc, polls attestation, and mints USDC on Sepolia
   */
  async bridgeToEthereum(amountUSDC: number, recipientAddress: `0x${string}`): Promise<{
    burnTxHash: string
    mintTxHash: string
    status: string
    amount: number
    destinationChain: string
  }> {
    const amountRaw = parseUnits(amountUSDC.toString(), 6)

    console.log(`[CCTPExecutor] Step 1: Approving TokenMessenger to spend ${amountUSDC} USDC on Arc...`)
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
    console.log(`[CCTPExecutor] Approval tx confirmed: ${approveTx}`)

    // Step 2 — Burn USDC on Arc (initiates CCTP cross-chain transfer)
    console.log(`[CCTPExecutor] Step 2: Depositing for burn on Arc...`)
    const mintRecipient = `0x000000000000000000000000${recipientAddress.slice(2)}` as `0x${string}`

    const burnTx = await this.arcWalletClient.writeContract({
      address: CCTP_CONTRACTS.arcTestnet.tokenMessenger,
      abi: TOKEN_MESSENGER_ABI,
      functionName: 'depositForBurn',
      args: [amountRaw, CCTP_CONTRACTS.ethSepolia.domain, mintRecipient, CCTP_CONTRACTS.arcTestnet.usdc],
      gas: 300000n,
      gasPrice: ARC_GAS.gasPrice,
    })
    
    console.log(`[CCTPExecutor] Burn tx submitted: ${burnTx}. Waiting for confirmation...`)
    const burnReceipt = await this.arcPublicClient.waitForTransactionReceipt({ hash: burnTx })
    console.log(`[CCTPExecutor] Burn tx confirmed! Parsing logs for CCTP message...`)

    // Extract messageBytes from logs
    let messageBytes: `0x${string}` | null = null
    const MESSAGE_SENT_TOPIC = "0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036"

    for (const log of burnReceipt.logs) {
      if (log.topics && log.topics[0] && log.topics[0].toLowerCase() === MESSAGE_SENT_TOPIC.toLowerCase()) {
        try {
          const decoded = decodeEventLog({
            abi: MESSAGE_TRANSMITTER_ABI,
            data: log.data,
            topics: log.topics
          })
          if (decoded.eventName === 'MessageSent') {
            messageBytes = decoded.args.message
            break
          }
        } catch (decodeErr) {
          console.warn('[CCTPExecutor] decodeEventLog failed, trying manual decode fallback:', decodeErr)
          try {
            const decodedParams = decodeAbiParameters([{ type: 'bytes' }], log.data)
            if (decodedParams && decodedParams[0]) {
              messageBytes = decodedParams[0] as `0x${string}`
              break
            }
          } catch (manualErr) {
            console.error('[CCTPExecutor] Manual decoding fallback failed:', manualErr)
          }
        }
      }
    }

    if (!messageBytes) {
      throw new Error('MessageSent event was not found in burn transaction logs.')
    }

    const messageHash = keccak256(messageBytes)
    console.log(`[CCTPExecutor] CCTP message hash: ${messageHash}`)

    // Step 3 — Poll Circle Attestation API
    console.log(`[CCTPExecutor] Step 3: Polling Circle Sandbox Iris API for attestation...`)
    const attestationUrl = `https://iris-api-sandbox.circle.com/v1/attestations/${messageHash}`
    let attestation: string | null = null

    // Poll up to 30 times (2.5 minutes)
    for (let i = 0; i < 30; i++) {
      try {
        const response = await fetch(attestationUrl)
        if (response.ok) {
          const data = await response.json()
          if (data.status === 'complete') {
            attestation = data.attestation
            break
          }
        }
      } catch (pollErr) {
        console.error('[CCTPExecutor] Error polling Circle Iris API:', pollErr)
      }
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }

    if (!attestation) {
      throw new Error('Circle attestation polling timed out or failed.')
    }
    console.log(`[CCTPExecutor] Circle attestation acquired!`)

    // Step 4 — Mint USDC on Ethereum Sepolia
    console.log(`[CCTPExecutor] Step 4: Minting USDC on Ethereum Sepolia...`)
    const mintTx = await this.sepoliaWalletClient.writeContract({
      address: CCTP_CONTRACTS.ethSepolia.messageTransmitter,
      abi: MESSAGE_TRANSMITTER_ABI,
      functionName: 'receiveMessage',
      args: [messageBytes, attestation as `0x${string}`]
    })

    console.log(`[CCTPExecutor] Mint tx submitted: ${mintTx}. Waiting for confirmation...`)
    await this.sepoliaPublicClient.waitForTransactionReceipt({ hash: mintTx })
    console.log(`[CCTPExecutor] Mint tx confirmed! CCTP bridge completed successfully.`)

    return {
      burnTxHash: burnTx,
      mintTxHash: mintTx,
      status: 'success',
      amount: amountUSDC,
      destinationChain: 'Ethereum Sepolia',
    }
  }
}
