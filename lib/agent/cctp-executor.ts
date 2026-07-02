import { createWalletClient, createPublicClient, http, fallback, parseUnits, parseAbi, decodeEventLog, keccak256, decodeAbiParameters, encodeFunctionData } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { ARC_CHAIN, ARC_GAS, ARC_RPC_URLS } from '@/lib/arc-config'
import { sepolia } from 'viem/chains'

// Circle CCTP contract addresses
export const CCTP_CONTRACTS = {
  arcTestnet: {
    tokenMessenger: (process.env.NEXT_PUBLIC_CCTP_TOKEN_MESSENGER_ARC || '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA') as `0x${string}`,
    messageTransmitter: (process.env.NEXT_PUBLIC_CCTP_MESSAGE_TRANSMITTER_ARC || '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275') as `0x${string}`,
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
  'function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold)',
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
  async bridgeToEthereum(
    amountUSDC: number,
    recipientAddress: `0x${string}`,
    onProgress?: (msg: string) => void
  ): Promise<{
    burnTxHash: string
    mintTxHash: string
    status: string
    amount: number
    destinationChain: string
  }> {
    const amountRaw = parseUnits(amountUSDC.toString(), 6)
    const agentAddress = process.env.NEXT_PUBLIC_AGENT_ADDRESS as `0x${string}` | undefined
    const mintRecipient = `0x000000000000000000000000${recipientAddress.slice(2)}` as `0x${string}`

    let burnTx: string

    const zeroBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`

    if (agentAddress) {
      const msgText = `[CCTP Step 1/3] Using Smart Account: ${agentAddress}. Encoding depositForBurn and executing...`
      console.log(`[CCTPExecutor] ${msgText}`)
      if (onProgress) onProgress(msgText)

      const calldata = encodeFunctionData({
        abi: TOKEN_MESSENGER_ABI,
        functionName: 'depositForBurn',
        args: [amountRaw, CCTP_CONTRACTS.ethSepolia.domain, mintRecipient, CCTP_CONTRACTS.arcTestnet.usdc, zeroBytes32, 0n, 0]
      })

      burnTx = await this.arcWalletClient.writeContract({
        address: agentAddress,
        abi: parseAbi([
          'function executeYieldStrategy(address targetContract, address token, uint256 amount, bytes calldata data) external'
        ]),
        functionName: 'executeYieldStrategy',
        args: [
          CCTP_CONTRACTS.arcTestnet.tokenMessenger,
          CCTP_CONTRACTS.arcTestnet.usdc,
          amountRaw,
          calldata
        ],
      })
    } else {
      const msgText = `[CCTP Step 1/3] Approving TokenMessenger to spend ${amountUSDC} USDC on Arc (EOA)...`
      console.log(`[CCTPExecutor] ${msgText}`)
      if (onProgress) onProgress(msgText)

      const approveTx = await this.arcWalletClient.writeContract({
        address: CCTP_CONTRACTS.arcTestnet.usdc,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CCTP_CONTRACTS.arcTestnet.tokenMessenger, amountRaw],
      })
      await this.arcPublicClient.waitForTransactionReceipt({ hash: approveTx, timeout: 120_000 })
      
      const msgText2 = `[CCTP Step 1/3] Approval tx confirmed. Depositing for burn on Arc (EOA)...`
      console.log(`[CCTPExecutor] ${msgText2}`)
      if (onProgress) onProgress(msgText2)

      burnTx = await this.arcWalletClient.writeContract({
        address: CCTP_CONTRACTS.arcTestnet.tokenMessenger,
        abi: TOKEN_MESSENGER_ABI,
        functionName: 'depositForBurn',
        args: [amountRaw, CCTP_CONTRACTS.ethSepolia.domain, mintRecipient, CCTP_CONTRACTS.arcTestnet.usdc, zeroBytes32, 0n, 0],
      })
    }
    
    console.log(`[CCTPExecutor] Burn tx submitted: ${burnTx}. Waiting for confirmation...`)
    const burnReceipt = await this.arcPublicClient.waitForTransactionReceipt({ hash: burnTx, timeout: 120_000 })
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
    const msgText3 = `[CCTP Step 2/3] Burn transaction confirmed: ${burnTx}. Polling Circle Sandbox Iris API for attestation...`
    console.log(`[CCTPExecutor] ${msgText3}`)
    if (onProgress) onProgress(msgText3)

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
    
    const msgText4 = `[CCTP Step 3/3] Circle attestation acquired! Minting USDC on Ethereum Sepolia...`
    console.log(`[CCTPExecutor] ${msgText4}`)
    if (onProgress) onProgress(msgText4)

    // Step 4 — Mint USDC on Ethereum Sepolia
    const mintTx = await this.sepoliaWalletClient.writeContract({
      address: CCTP_CONTRACTS.ethSepolia.messageTransmitter,
      abi: MESSAGE_TRANSMITTER_ABI,
      functionName: 'receiveMessage',
      args: [messageBytes, attestation as `0x${string}`]
    })

    console.log(`[CCTPExecutor] Mint tx submitted: ${mintTx}. Waiting for confirmation...`)
    await this.sepoliaPublicClient.waitForTransactionReceipt({ hash: mintTx, timeout: 120_000 })
    
    const msgText5 = `[CCTP Success] Rebalance complete! Bridged ${amountUSDC} USDC to Ethereum Sepolia. Burn Tx: ${burnTx}, Mint Tx: ${mintTx}`
    console.log(`[CCTPExecutor] ${msgText5}`)
    if (onProgress) onProgress(msgText5)

    return {
      burnTxHash: burnTx,
      mintTxHash: mintTx,
      status: 'success',
      amount: amountUSDC,
      destinationChain: 'Ethereum Sepolia',
    }
  }

  /**
   * Get the executor account's USDC balance on Ethereum Sepolia
   */
  async getSepoliaUSDCBalance(): Promise<number> {
    try {
      const balance = await this.sepoliaPublicClient.readContract({
        address: CCTP_CONTRACTS.ethSepolia.usdc,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [this.account.address],
      })
      return Number(balance) / 1_000_000
    } catch (err) {
      console.error('[CCTPExecutor] Failed to check Sepolia USDC balance:', err)
      return 0
    }
  }

  /**
   * Execute CCTP bridge — Ethereum Sepolia → Arc Testnet
   * Burns USDC on Sepolia, polls attestation, and mints USDC on Arc Testnet
   */
  async bridgeToArc(
    amountUSDC: number,
    recipientAddress: `0x${string}`,
    onProgress?: (msg: string) => void
  ): Promise<{
    burnTxHash: string
    mintTxHash: string
    status: string
    amount: number
    destinationChain: string
  }> {
    const amountRaw = parseUnits(amountUSDC.toString(), 6)
    const zeroBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
    const mintRecipient = `0x000000000000000000000000${recipientAddress.slice(2)}` as `0x${string}`

    const msgText = `[CCTP Step 1/3] Approving TokenMessenger to spend ${amountUSDC} USDC on Ethereum Sepolia...`
    console.log(`[CCTPExecutor] ${msgText}`)
    if (onProgress) onProgress(msgText)

    // 1. Approve TokenMessenger to spend Sepolia USDC
    const approveTx = await this.sepoliaWalletClient.writeContract({
      address: CCTP_CONTRACTS.ethSepolia.usdc,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CCTP_CONTRACTS.ethSepolia.tokenMessenger, amountRaw],
    })
    await this.sepoliaPublicClient.waitForTransactionReceipt({ hash: approveTx, timeout: 120_000 })

    const msgText2 = `[CCTP Step 1/3] Approval tx confirmed: ${approveTx}. Depositing for burn on Ethereum Sepolia...`
    console.log(`[CCTPExecutor] ${msgText2}`)
    if (onProgress) onProgress(msgText2)

    // 2. Deposit for Burn on Sepolia (destinationDomain = 26 for Arc Testnet)
    const burnTx = await this.sepoliaWalletClient.writeContract({
      address: CCTP_CONTRACTS.ethSepolia.tokenMessenger,
      abi: TOKEN_MESSENGER_ABI,
      functionName: 'depositForBurn',
      args: [
        amountRaw,
        26, // Arc Testnet domain ID
        mintRecipient,
        CCTP_CONTRACTS.ethSepolia.usdc,
        zeroBytes32,
        0n,
        2000 // Standard finality threshold
      ],
    })

    console.log(`[CCTPExecutor] Burn tx submitted: ${burnTx}. Waiting for confirmation...`)
    const burnReceipt = await this.sepoliaPublicClient.waitForTransactionReceipt({ hash: burnTx, timeout: 120_000 })
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

    // 3. Poll Circle Attestation API
    const msgText3 = `[CCTP Step 2/3] Burn transaction confirmed: ${burnTx}. Polling Circle Sandbox Iris API for attestation...`
    console.log(`[CCTPExecutor] ${msgText3}`)
    if (onProgress) onProgress(msgText3)

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
    
    const msgText4 = `[CCTP Step 3/3] Circle attestation acquired! Minting USDC on Arc Testnet...`
    console.log(`[CCTPExecutor] ${msgText4}`)
    if (onProgress) onProgress(msgText4)

    // 4. Mint USDC on Arc Testnet
    const mintTx = await this.arcWalletClient.writeContract({
      address: CCTP_CONTRACTS.arcTestnet.messageTransmitter,
      abi: MESSAGE_TRANSMITTER_ABI,
      functionName: 'receiveMessage',
      args: [messageBytes, attestation as `0x${string}`],
      gas: 400000n,
      gasPrice: 10000000n,
    })

    console.log(`[CCTPExecutor] Mint tx submitted: ${mintTx}. Waiting for confirmation...`)
    await this.arcPublicClient.waitForTransactionReceipt({ hash: mintTx, timeout: 120_000 })
    
    const msgText5 = `[CCTP Success] Return complete! Bridged ${amountUSDC} USDC to Arc Testnet. Burn Tx: ${burnTx}, Mint Tx: ${mintTx}`
    console.log(`[CCTPExecutor] ${msgText5}`)
    if (onProgress) onProgress(msgText5)

    return {
      burnTxHash: burnTx,
      mintTxHash: mintTx,
      status: 'success',
      amount: amountUSDC,
      destinationChain: 'Arc Testnet',
    }
  }
}
